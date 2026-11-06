import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Info,
  X,
} from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const ToastContainer: React.FC = () => {
  const toasts = useAppStore((s) => s.toasts);
  const dismissToast = useAppStore((s) => s.dismissToast);

  return (
    <div
      className="fixed bottom-5 right-5 z-[1100] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none"
      aria-live="polite"
    >
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => {
          const styles =
            t.type === 'critical'
              ? 'border-[#DC2626] bg-[#DC2626] text-white'
              : t.type === 'warning'
              ? 'border-[#EAB308] bg-white dark:bg-[#11253A] text-[#0F172A] dark:text-white'
              : t.type === 'success'
              ? 'border-[#16A34A] bg-white dark:bg-[#11253A] text-[#0F172A] dark:text-white'
              : 'border-[#0E9F8E] bg-white dark:bg-[#11253A] text-[#0F172A] dark:text-white';

          const icon =
            t.type === 'critical' ? (
              <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            ) : t.type === 'warning' ? (
              <AlertCircle className="w-5 h-5 text-[#EAB308] shrink-0 mt-0.5" />
            ) : t.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
            ) : (
              <Info className="w-5 h-5 text-[#0E9F8E] shrink-0 mt-0.5" />
            );

          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.94 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.92, transition: { duration: 0.16 } }}
              transition={{ type: 'spring', stiffness: 450, damping: 32 }}
              className={`pointer-events-auto rounded-2xl border-l-4 p-4 shadow-xl flex items-start gap-3 backdrop-blur-md transition-shadow hover:shadow-2xl ${styles}`}
            >
              {icon}
              <div className="flex-1 text-xs">
                <div className="font-bold leading-tight">{t.title}</div>
                <div
                  className={`mt-1 leading-relaxed ${
                    t.type === 'critical'
                      ? 'text-red-50'
                      : 'text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {t.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                className="p-1 rounded-lg opacity-70 hover:opacity-100 transition-opacity hover:bg-black/5 dark:hover:bg-white/10 shrink-0"
                aria-label="Dismiss notification"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
