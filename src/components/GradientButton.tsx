import React from 'react';
import { Button } from './ui/button';
import { cn } from './ui/utils';

interface GradientButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'outline';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const GradientButton = React.forwardRef<HTMLButtonElement, GradientButtonProps>(
  ({ children, className, variant = 'default', size = 'default', ...props }, ref) => {
    if (variant === 'outline') {
      return (
        <Button
          ref={ref}
          variant="outline"
          size={size}
          className={cn(
            'border-2 border-primary text-primary hover:bg-primary/10 transition-all',
            className
          )}
          {...props}
        >
          {children}
        </Button>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md h-9 px-4 py-2 text-sm',
          'bg-gradient-to-r from-[#84cc16] to-[#10b981]',
          'text-white font-medium',
          'hover:shadow-lg hover:scale-105 active:scale-95',
          'transition-all duration-200',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100',
          size === 'sm' && 'h-8 px-3 py-1.5 text-xs',
          size === 'lg' && 'h-10 px-6 py-2.5 text-base',
          className
        )}
        {...props}
      >
        {children}
      </button>
    );
  }
);

GradientButton.displayName = 'GradientButton';