import { onCLS, onFCP, onINP, onLCP, onTTFB, Metric } from 'web-vitals';

export interface BreadcrumbEntry {
  timestamp: string;
  category: 'ui' | 'api' | 'navigation' | 'security' | 'error';
  message: string;
  status?: string | number;
}

export interface ErrorReportEvent {
  referenceId: string;
  timestamp: string;
  release: string;
  route: string;
  userRole: string;
  online: boolean;
  message: string;
  componentScope?: string;
  breadcrumbs: BreadcrumbEntry[];
}

export interface WebVitalSnapshot {
  name: 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  updatedAt: string;
}

const MAX_BREADCRUMBS = 20;
const breadcrumbs: BreadcrumbEntry[] = [];
const recentReports: ErrorReportEvent[] = [];
const webVitalsMap = new Map<string, WebVitalSnapshot>();
let chunkUpdatePromptListeners: Array<(needsReload: boolean) => void> = [];

/**
 * Scrubs any potential PII (10-digit mobile numbers, email addresses, bearer tokens, exact lat/lng pairs)
 * before storing or transmitting logs (Section 8.7 & 9.6).
 */
export function scrubPii(text: string): string {
  if (!text) return '';
  return text
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[REDACTED_EMAIL]')
    .replace(/\b[6-9]\d{9}\b/g, '[REDACTED_PHONE]')
    .replace(/(-?\d{1,2}\.\d{4,})\s*,\s*(-?\d{1,3}\.\d{4,})/g, '[REDACTED_COORDS]');
}

export function recordBreadcrumb(
  category: BreadcrumbEntry['category'],
  message: string,
  status?: string | number
): void {
  const entry: BreadcrumbEntry = {
    timestamp: new Date().toISOString(),
    category,
    message: scrubPii(message).slice(0, 240),
    status,
  };
  breadcrumbs.push(entry);
  if (breadcrumbs.length > MAX_BREADCRUMBS) {
    breadcrumbs.shift();
  }
}

export function getBreadcrumbs(): BreadcrumbEntry[] {
  return [...breadcrumbs];
}

export function generateReferenceId(prefix = 'NIV-ERR'): string {
  const rand = Math.random().toString(36).substring(2, 7).toUpperCase();
  const timePart = Date.now().toString(36).slice(-4).toUpperCase();
  return `${prefix}-${timePart}-${rand}`;
}

export function reportError(
  error: unknown,
  context?: { componentScope?: string; userRole?: string }
): ErrorReportEvent {
  const rawMessage =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
      ? error
      : 'Unexpected runtime error';

  const referenceId = generateReferenceId();
  const event: ErrorReportEvent = {
    referenceId,
    timestamp: new Date().toISOString(),
    release: 'nivaran-2.0.0',
    route: typeof window !== 'undefined' ? window.location.pathname : '/',
    userRole: context?.userRole || 'anonymous',
    online: typeof navigator !== 'undefined' ? navigator.onLine : true,
    message: scrubPii(rawMessage).slice(0, 300),
    componentScope: context?.componentScope,
    breadcrumbs: getBreadcrumbs(),
  };

  recentReports.unshift(event);
  if (recentReports.length > 25) {
    recentReports.pop();
  }

  recordBreadcrumb('error', `${event.componentScope || 'global'}: ${event.message}`, referenceId);

  // Detect lazy-loaded chunk failure after deployment
  if (
    /Loading chunk [\d]+ failed/i.test(rawMessage) ||
    /Failed to fetch dynamically imported module/i.test(rawMessage) ||
    /Importing a module script failed/i.test(rawMessage)
  ) {
    notifyChunkReloadNeeded();
  }

  return event;
}

export function getRecentErrorReports(): ErrorReportEvent[] {
  return [...recentReports];
}

export function onChunkReloadPrompt(listener: (needsReload: boolean) => void): () => void {
  chunkUpdatePromptListeners.push(listener);
  return () => {
    chunkUpdatePromptListeners = chunkUpdatePromptListeners.filter((l) => l !== listener);
  };
}

function notifyChunkReloadNeeded(): void {
  chunkUpdatePromptListeners.forEach((listener) => listener(true));
}

export function getWebVitalsSnapshot(): WebVitalSnapshot[] {
  return Array.from(webVitalsMap.values());
}

let globalsInitialised = false;

export function initGlobalObservability(): void {
  if (globalsInitialised || typeof window === 'undefined') return;
  globalsInitialised = true;

  window.addEventListener('error', (event) => {
    reportError(event.error || event.message, { componentScope: 'window.onerror' });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportError(event.reason, { componentScope: 'window.unhandledrejection' });
  });

  const handleVital = (metric: Metric) => {
    webVitalsMap.set(metric.name, {
      name: metric.name as WebVitalSnapshot['name'],
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      rating: metric.rating,
      updatedAt: new Date().toISOString(),
    });
  };

  try {
    onCLS(handleVital);
    onFCP(handleVital);
    onINP(handleVital);
    onLCP(handleVital);
    onTTFB(handleVital);
  } catch {
    // Web vitals optional in unsupported environments
  }
}
