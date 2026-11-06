import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface State {
  hasError: boolean;
  errorMsg: string;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMsg: error.message || 'Unexpected UI error' };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] dark:bg-[#0A1624] p-6">
          <div className="bg-white dark:bg-[#11253A] max-w-md w-full rounded-card p-6 shadow-soft-lg border border-slate-200 dark:border-slate-700 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#DC2626]/15 text-[#DC2626] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="font-heading text-lg font-bold text-[#0F172A] dark:text-white">
              Nivaran Module Recovery
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              {this.state.errorMsg}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#0E9F8E] text-white text-xs font-semibold min-h-[44px]"
            >
              <RefreshCw className="w-4 h-4" /> Reload Application
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
