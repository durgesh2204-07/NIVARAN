import React, { useEffect, useState } from 'react';
import { Clock, LogOut, ShieldCheck } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const IdleTimeoutModal: React.FC = () => {
  const open = useAppStore((s) => s.idleWarningOpen);
  const setOpen = useAppStore((s) => s.setIdleWarningOpen);
  const logout = useAppStore((s) => s.logout);
  const user = useAppStore((s) => s.user);
  const [countdown, setCountdown] = useState(60);

  // Automatic idle listener (triggers after 8 minutes of inactivity)
  useEffect(() => {
    if (!user) return;
    let idleTimer: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setOpen(true);
      }, 8 * 60 * 1000);
    };
    window.addEventListener('mousemove', resetIdle);
    window.addEventListener('keydown', resetIdle);
    resetIdle();
    return () => {
      clearTimeout(idleTimer);
      window.removeEventListener('mousemove', resetIdle);
      window.removeEventListener('keydown', resetIdle);
    };
  }, [user, setOpen]);

  useEffect(() => {
    if (!open) {
      setCountdown(60);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [open, logout]);

  if (!open || !user) return null;

  return (
    <div
      className="fixed inset-0 z-[1050] flex items-center justify-center bg-[#0B1F33]/70 backdrop-blur-xs p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="idle-modal-title"
    >
      <div className="bg-white dark:bg-[#11253A] w-full max-w-md rounded-card p-6 shadow-soft-lg border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-[#EAB308]/15 text-[#EAB308] flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3
              id="idle-modal-title"
              className="font-heading font-bold text-base text-[#0F172A] dark:text-white"
            >
              Government Session Idle Timeout Warning
            </h3>
            <p className="text-xs text-slate-500">
              SDMA Security Protocol • Auto-signout in{' '}
              <span className="font-bold text-[#DC2626] tabular-nums">
                {countdown}s
              </span>
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          For security of sensitive household Aadhaar & DBT relocation records, inactive
          sessions are automatically terminated. Would you like to extend your session?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            onClick={logout}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 min-h-[44px]"
          >
            <LogOut className="w-4 h-4" /> Sign Out Now
          </button>
          <button
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-[#0E9F8E] hover:bg-[#0B8375] text-white text-xs font-semibold min-h-[44px]"
          >
            <ShieldCheck className="w-4 h-4" /> Stay Signed In
          </button>
        </div>
      </div>
    </div>
  );
};
