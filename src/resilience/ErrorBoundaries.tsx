import React from 'react';
import { AlertTriangle, Phone, RefreshCw, ShieldAlert } from 'lucide-react';
import { generateReferenceId, reportError } from './reporter';

interface BoundaryState {
  hasError: boolean;
  referenceId: string;
}

/**
 * 1. App-Level Error Boundary (Section 9.1):
 * Clean full-page neumorphic fallback ("Something went wrong. Your data is safe. Reload"),
 * reference ID, zero stack traces, and direct Call 112 / Call 1070 Control Room links.
 */
export class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, referenceId: '' };
  }

  static getDerivedStateFromError(): BoundaryState {
    return {
      hasError: true,
      referenceId: generateReferenceId('NIV-APP'),
    };
  }

  componentDidCatch(error: Error): void {
    const evt = reportError(error, { componentScope: 'AppErrorBoundary' });
    this.setState({ referenceId: evt.referenceId });
  }

  handleReload = (): void => {
    window.location.reload();
  };

  handleGoDashboard = (): void => {
    this.setState({ hasError: false, referenceId: '' });
    window.location.href = '/dashboard';
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="alert"
        className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)] flex items-center justify-center p-6"
      >
        <div className="neu-raised max-w-lg w-full p-6 space-y-5 border border-[var(--border)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-[10px] bg-[#B91C1C] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" strokeWidth={1.75} />
            </div>
            <div>
              <h1 className="text-lg font-bold">
                Something went wrong. Your data is safe. Reload
              </h1>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                An unexpected display error occurred. Queued reports and local settings remain intact.
              </p>
            </div>
          </div>

          <div className="neu-flat p-3 rounded-[10px] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Incident Reference ID</span>
            <span className="font-semibold text-[var(--text-primary)]">
              {this.state.referenceId || 'NIV-APP-SAFE'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={this.handleReload}
              className="neu-btn-primary px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" strokeWidth={1.75} />
              <span>Reload</span>
            </button>
            <button
              type="button"
              onClick={this.handleGoDashboard}
              className="neu-btn px-4 py-2.5 text-xs font-semibold"
            >
              Go to dashboard
            </button>
          </div>

          <div className="border-t border-[var(--border)] pt-4 space-y-2">
            <p className="text-xs font-semibold text-[var(--text-secondary)]">
              Emergency Control Room Direct Lines (Always Active)
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              <a
                href="tel:112"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-[10px] bg-[#B91C1C] text-white text-xs font-bold"
              >
                <Phone className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>Call 112 Emergency</span>
              </a>
              <a
                href="tel:1070"
                className="neu-btn flex items-center justify-center gap-2 py-2.5 px-3 text-xs font-semibold"
              >
                <Phone className="w-3.5 h-3.5 text-[#0B8F80]" strokeWidth={1.75} />
                <span>Call 1070 State Control</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * 2. Route-Level Error Boundary (Section 9.1):
 * Wraps each lazy-loaded route inside the AppLayout shell so navigation stays usable.
 */
export class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode; routeName?: string },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode; routeName?: string }) {
    super(props);
    this.state = { hasError: false, referenceId: '' };
  }

  static getDerivedStateFromError(): BoundaryState {
    return {
      hasError: true,
      referenceId: generateReferenceId('NIV-RTE'),
    };
  }

  componentDidCatch(error: Error): void {
    const evt = reportError(error, {
      componentScope: `Route:${this.props.routeName || 'unknown'}`,
    });
    this.setState({ referenceId: evt.referenceId });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, referenceId: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div role="alert" className="p-6 max-w-2xl mx-auto my-8">
        <div className="neu-raised p-6 space-y-4 border border-[var(--border)]">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[#EA580C] shrink-0 mt-0.5" strokeWidth={1.75} />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Module view temporarily unavailable
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mt-1">
                This workspace module encountered a rendering issue. All other navigation modules remain active.
              </p>
            </div>
          </div>

          <div className="neu-flat px-3 py-2 rounded-[10px] flex items-center justify-between text-xs font-mono">
            <span className="text-[var(--text-secondary)]">Reference ID</span>
            <span>{this.state.referenceId}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={this.handleRetry}
              className="neu-btn-primary px-4 py-2 text-xs font-semibold flex items-center gap-1.5"
            >
              <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span>Retry module</span>
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="neu-btn px-4 py-2 text-xs font-semibold"
            >
              Reload page
            </button>
          </div>
        </div>
      </div>
    );
  }
}

/**
 * 3. Widget-Level Error Boundary (Section 9.1):
 * Wraps individual charts, tables, map layers, and KPI cards so only the broken widget shows
 * "Unable to load · Retry".
 */
export class WidgetErrorBoundary extends React.Component<
  { children: React.ReactNode; label?: string },
  BoundaryState
> {
  constructor(props: { children: React.ReactNode; label?: string }) {
    super(props);
    this.state = { hasError: false, referenceId: '' };
  }

  static getDerivedStateFromError(): BoundaryState {
    return {
      hasError: true,
      referenceId: generateReferenceId('NIV-WDG'),
    };
  }

  componentDidCatch(error: Error): void {
    const evt = reportError(error, {
      componentScope: `Widget:${this.props.label || 'panel'}`,
    });
    this.setState({ referenceId: evt.referenceId });
  }

  handleRetry = (): void => {
    this.setState({ hasError: false, referenceId: '' });
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div
        role="status"
        className="neu-flat p-4 rounded-[10px] flex items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <AlertTriangle className="w-4 h-4 text-[#CA8A04] shrink-0" strokeWidth={1.75} />
          <span>
            Unable to load {this.props.label ? `(${this.props.label})` : 'panel'} · Ref{' '}
            <span className="font-mono">{this.state.referenceId}</span>
          </span>
        </div>
        <button
          type="button"
          onClick={this.handleRetry}
          className="neu-btn px-2.5 py-1 text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <RefreshCw className="w-3 h-3" strokeWidth={1.75} />
          <span>Retry</span>
        </button>
      </div>
    );
  }
}

/**
 * 4. Independent SOS Life-Safety Boundary (Section 9.5):
 * Guarantees that Emergency SOS and Call 112 remain operable even if surrounding components fail.
 */
export class SosSafetyBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true };
  }

  componentDidCatch(error: Error): void {
    reportError(error, { componentScope: 'SosSafetyBoundary' });
  }

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="neu-raised p-4 border-2 border-[#B91C1C] space-y-3">
        <p className="text-sm font-bold text-[#B91C1C]">
          Emergency Life-Safety Direct Dial
        </p>
        <p className="text-xs text-[var(--text-secondary)]">
          Interactive SOS widget encountered an error. Use direct emergency telephone dispatch immediately:
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href="tel:112"
            className="px-4 py-2.5 rounded-[10px] bg-[#B91C1C] text-white text-xs font-bold flex items-center gap-2"
          >
            <Phone className="w-4 h-4" strokeWidth={1.75} />
            <span>Call 112 Emergency Now</span>
          </a>
          <a
            href="tel:1070"
            className="neu-btn px-4 py-2.5 text-xs font-semibold flex items-center gap-2"
          >
            <Phone className="w-4 h-4 text-[#0B8F80]" strokeWidth={1.75} />
            <span>Call 1070 State Control Room</span>
          </a>
        </div>
      </div>
    );
  }
}
