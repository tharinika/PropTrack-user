import React from 'react';
import logoImage from 'figma:asset/bfba98a50dbcef19895a79862e2b07bcaf3c6f95.png';
import { cn } from './ui/utils';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showText?: boolean;
  textSize?: 'sm' | 'md' | 'lg';
  subtitle?: string;
}

const sizeClasses = {
  sm: 'w-6 h-6',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-16 h-16'
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-lg',
  lg: 'text-3xl'
};

export function Logo({ 
  size = 'md', 
  className, 
  showText = false,
  textSize = 'md',
  subtitle
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img 
        src={logoImage} 
        alt="PropTrack Logo" 
        className={cn(
          sizeClasses[size],
          'flex-shrink-0 object-contain'
        )}
      />
      {showText && (
        <div>
          <h1 className={cn(
            'font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent',
            textSizeClasses[textSize]
          )}>
            PropTrack
          </h1>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
      )}
    </div>
  );
}
