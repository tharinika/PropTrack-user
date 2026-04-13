import React from 'react';
import { Badge } from './ui/badge';
import { cn } from './ui/utils';

export type Status = 
  | 'occupied' 
  | 'vacant' 
  | 'maintenance' 
  | 'paid' 
  | 'pending' 
  | 'overdue'
  | 'new'
  | 'in-progress'
  | 'completed'
  | 'high'
  | 'medium'
  | 'low';

interface StatusBadgeProps {
  status: Status;
  className?: string;
}

const statusConfig: Record<Status, { label: string; className: string }> = {
  occupied: { 
    label: 'Occupied', 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  vacant: { 
    label: 'Vacant', 
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20' 
  },
  maintenance: { 
    label: 'Maintenance', 
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500/20' 
  },
  paid: { 
    label: 'Paid', 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  pending: { 
    label: 'Pending', 
    className: 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-500 border-yellow-500/20' 
  },
  overdue: { 
    label: 'Overdue', 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  new: { 
    label: 'New', 
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20' 
  },
  'in-progress': { 
    label: 'In Progress', 
    className: 'bg-purple-500/10 text-purple-700 dark:text-purple-500 border-purple-500/20' 
  },
  completed: { 
    label: 'Completed', 
    className: 'bg-primary/10 text-primary border-primary/20' 
  },
  high: { 
    label: 'High Priority', 
    className: 'bg-destructive/10 text-destructive border-destructive/20' 
  },
  medium: { 
    label: 'Medium Priority', 
    className: 'bg-orange-500/10 text-orange-700 dark:text-orange-500 border-orange-500/20' 
  },
  low: { 
    label: 'Low Priority', 
    className: 'bg-blue-500/10 text-blue-700 dark:text-blue-500 border-blue-500/20' 
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  
  return (
    <Badge 
      variant="outline"
      className={cn(config.className, 'font-medium', className)}
    >
      {config.label}
    </Badge>
  );
}
