import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import { AppErrorBoundary } from './resilience/ErrorBoundaries';
import 'maplibre-gl/dist/maplibre-gl.css';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  const isLocalDev =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1';

  if (isLocalDev) {
    // Ensure stale service workers or cached dev bundles never block live updates on localhost
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().catch(() => {});
        }
      })
      .catch(() => {});

    if ('caches' in window) {
      caches
        .keys()
        .then((keys) => {
          for (const key of keys) {
            if (key.startsWith('nivaran-command-cache')) {
              caches.delete(key).catch(() => {});
            }
          }
        })
        .catch(() => {});
    }
  } else {
    window.addEventListener('load', () => {
      const base = (import.meta as any).env?.BASE_URL || '/';
      const swUrl = base.endsWith('/') ? `${base}sw.js` : `${base}/sw.js`;
      navigator.serviceWorker.register(swUrl).catch(() => {});
    });
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </AppErrorBoundary>
  </React.StrictMode>
);
