import React from 'react';
import { LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { GradientButton } from '../GradientButton';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  illustration?: 'properties' | 'tenants' | 'payments' | 'maintenance' | 'general';
  dataTour?: string;
}

export function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  illustration = 'general',
  dataTour
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center justify-center py-16 px-4 text-center"
    >
      {/* Icon Circle */}
      <div className="relative mb-6">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-accent/20 rounded-full blur-2xl" />
        <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center border border-primary/20">
          <Icon className="w-12 h-12 text-primary" />
        </div>
      </div>

      {/* Title and Description */}
      <h3 className="text-2xl font-semibold mb-3 text-foreground">
        {title}
      </h3>
      <p className="text-muted-foreground max-w-md mb-8 leading-relaxed">
        {description}
      </p>

      {/* Action Button */}
      {actionLabel && onAction && (
        <GradientButton 
          onClick={onAction} 
          className="px-8"
          data-tour={dataTour}
        >
          {actionLabel}
        </GradientButton>
      )}

      {/* Decorative Dots */}
      <div className="mt-12 flex gap-2">
        <div className="w-2 h-2 rounded-full bg-primary/20" />
        <div className="w-2 h-2 rounded-full bg-primary/40" />
        <div className="w-2 h-2 rounded-full bg-primary/60" />
      </div>
    </motion.div>
  );
}