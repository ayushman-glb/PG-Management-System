import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';

interface PhoneVerifiedBadgeProps {
  phone?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const PhoneVerifiedBadge: React.FC<PhoneVerifiedBadgeProps> = ({
  phone,
  size = 'md',
  showLabel = true,
}) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3 py-1.5 gap-2',
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={`inline-flex items-center rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-medium ${sizeClasses[size]}`}
    >
      <CheckCircle2 className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-4.5 h-4.5' : 'w-4 h-4'} />
      {showLabel && <span>Phone Verified</span>}
      {phone && <span className="text-emerald-700 dark:text-emerald-300 font-mono">({phone})</span>}
    </motion.div>
  );
};
