import React from 'react';
import { Card } from './ui/card';
import { cn } from './ui/utils';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  className?: string;
  variant?: 'default' | 'danger';
}

export function StatCard({ title, value, icon: Icon, trend, className, variant = 'default' }: StatCardProps) {
  const isOverdue = variant === 'danger' || title.includes('Overdue');
  
  return (
    <Card className={cn(
      'p-6 hover:shadow-lg transition-shadow border border-border bg-card',
      className
    )}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className={cn(
            'text-3xl font-semibold',
            isOverdue ? 'text-red-500' : 'text-foreground'
          )}>{value}</h3>
          {trend && (
            <p className={cn(
              'text-sm mt-2',
              trend.isPositive ? 'text-primary' : 'text-destructive'
            )}>
              {trend.value}
            </p>
          )}
        </div>
        <div className={cn(
          'ml-4 p-3 rounded-xl',
          isOverdue ? 'bg-red-500/10' : 'bg-gradient-to-br from-primary/20 to-accent/20'
        )}>
          <Icon className={cn('w-6 h-6', isOverdue ? 'text-red-500' : 'text-primary')} />
        </div>
      </div>
    </Card>
  );
}