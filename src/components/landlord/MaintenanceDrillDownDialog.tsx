import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Badge } from '../ui/badge';
import { Building2, Home, User, Calendar, AlertCircle } from 'lucide-react';
import { MaintenanceRequest } from '../../contexts/AppDataContext';

interface MaintenanceDrillDownDialogProps {
  isOpen: boolean;
  onClose: () => void;
  category: string | null;
  requests: MaintenanceRequest[];
}

export function MaintenanceDrillDownDialog({
  isOpen,
  onClose,
  category,
  requests,
}: MaintenanceDrillDownDialogProps) {
  // Get status badge styling
  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'default';
      case 'in-progress':
        return 'secondary';
      case 'pending':
        return 'outline';
      default:
        return 'outline';
    }
  };

  // Format status display
  const getStatusDisplay = (status: string) => {
    switch (status.toLowerCase()) {
      case 'in-progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      case 'completed':
        return 'Completed';
      default:
        return status;
    }
  };

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300';
      case 'medium':
        return 'bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300';
      case 'low':
        return 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300';
      default:
        return 'bg-gray-100 dark:bg-gray-950 text-gray-700 dark:text-gray-300';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <div>{category || 'Maintenance'} Requests</div>
              <DialogDescription className="mt-1">
                {requests.length} {requests.length === 1 ? 'request' : 'requests'} in this category
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-3 mt-4 overflow-y-auto flex-1 pr-2">
          {requests.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">No {category?.toLowerCase() || 'maintenance'} requests found</p>
            </div>
          ) : (
            requests.map((request) => (
              <div
                key={request.id}
                className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                    <AlertCircle className="w-5 h-5 text-primary" />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge
                        className={`${getPriorityColor(request.priority || 'low')} font-semibold text-xs px-2.5 py-0.5`}
                      >
                        {(request.priority || 'low').toUpperCase()}
                      </Badge>
                      <Badge
                        variant={getStatusBadgeVariant(request.status || 'pending') as any}
                        className="font-medium text-xs px-2.5 py-0.5"
                      >
                        {getStatusDisplay(request.status || 'pending')}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {request.description || 'No description provided'}
                    </p>

                    {/* Property, Unit, Tenant Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-border">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-primary flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Property</p>
                          <p className="text-sm font-medium truncate">{request.property || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Home className="w-4 h-4 text-accent flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Unit</p>
                          <p className="text-sm font-medium truncate">{request.unit || 'N/A'}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-blue-500 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-muted-foreground">Tenant</p>
                          <p className="text-sm font-medium truncate">{request.tenantName || 'N/A'}</p>
                        </div>
                      </div>
                    </div>

                    {/* Date Submitted */}
                    <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground">
                        Submitted on {request.dateSubmitted ? new Date(request.dateSubmitted).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        }) : 'Unknown date'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}