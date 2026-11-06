import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  transitionKey?: string;
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children,
  className = '',
  transitionKey,
}) => {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`w-full flex-1 flex flex-col min-h-0 ${className}`}>{children}</div>;
  }

  return (
    <motion.div
      key={transitionKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{
        duration: 0.24,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`w-full flex-1 flex flex-col min-h-0 ${className}`}
    >
      {children}
    </motion.div>
  );
};
