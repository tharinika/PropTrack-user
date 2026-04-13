import React, { useState,useEffect } from 'react';
import{supabase}from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { StatusBadge } from '../StatusBadge';
import { Badge } from '../ui/badge';
import { Wrench, User, Home, Calendar, Sparkles } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { EmptyState } from './EmptyState';

export function MaintenanceView() {
  const { user } = useAuth();
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const updateStatus = async (id:String, status:String) => {
  await supabase
    .from('maintenance_requests')
    .update({ status })
    .eq('id', id);

  fetchRequests(); // refresh
};
  useEffect(() => {
  if (user?.id) {
    fetchRequests();
  }
}, [user]);

const fetchRequests = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('landlord_id', user.id)
    .order('date_submitted', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setMaintenanceRequests(data);
};

  // ============================================================================
  // REAL-TIME DATA FILTERING - Show only requests for this landlord
  // ============================================================================
  
  // Filter maintenance requests for current landlord only
  const landlordRequests = maintenanceRequests;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Maintenance Requests</h2>
        <p className="text-muted-foreground">Manage and track maintenance issues</p>
      </div>

      {/* Requests Grid */}
      {landlordRequests.length === 0 ? (
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={Wrench}
            title="No Maintenance Requests"
            description="Maintenance requests from tenants will appear here. Once you have tenants, they can submit requests for plumbing, electrical, HVAC, and other issues."
            actionLabel="View Tenants"
            onAction={() => {
              alert('Navigate to Tenants tab to add tenants!');
            }}
          />
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {landlordRequests.map((request) => (
              <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                      <Wrench className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{request.category} Request</h3>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Tenant:</span>
                    <span className="font-medium">{request.tenant_name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Home className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Unit:</span>
                    <span className="font-medium">{request.unit}</span>
                    <span className="text-muted-foreground">• {request.property}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Submitted:</span>
                    <span>{new Date(request.date_submitted).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* AI Classification */}
                <div className="mb-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI Classification</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="bg-background">
                      Category: {request.category}
                    </Badge>
                    <StatusBadge status={request.priority} />
                  </div>
                </div>

                {/* Status and Actions */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <StatusBadge status={request.status} />
                  <div className="flex gap-2">
                    {request.status === 'pending' && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => updateStatus(request.id, 'in-progress')}
                      >
                        Start Work
                      </Button>
                    )}
                    {request.status === 'in-progress' && (
                      <Button 
                        size="sm"
                        className="bg-primary text-white hover:bg-primary/90"
                        onClick={() => updateStatus(request.id, 'completed')}
                      >
                        Mark Complete
                      </Button>
                    )}
                    {request.status === 'completed' && (
                      <span className="text-sm text-muted-foreground">
                        Completed {request.dateCompleted && new Date(request.dateCompleted).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Pending Requests</p>
                <p className="text-2xl font-semibold text-blue-500">
                  {landlordRequests.filter(r => r.status === 'pending').length}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">In Progress</p>
                <p className="text-2xl font-semibold text-purple-500">
                  {landlordRequests.filter(r => r.status === 'in-progress').length}
                </p>
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Completed</p>
                <p className="text-2xl font-semibold text-primary">
                  {landlordRequests.filter(r => r.status === 'completed').length}
                </p>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}