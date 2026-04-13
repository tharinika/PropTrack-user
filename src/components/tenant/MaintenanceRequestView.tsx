import React, { useState,useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { Badge } from '../ui/badge';
import { Wrench, Plus, Calendar, Upload, Sparkles, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { toast } from 'sonner';

export function MaintenanceRequestView() {
  const { user } = useAuth();
  const [dbUser,setDbUser]=useState<any>(null);
  const [maintenanceRequests, setMaintenanceRequests] = useState([]);
  const { properties } = useProperties();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    title: '',
    description: '',
    image: null as File | null
  });
useEffect(() => {
  if(user?.id){
  fetchUserDetails();
  fetchRequests();}
}, [user]);
const fetchUserDetails = async () => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single();

  if (error) {
    console.error(error);
    return;
  }

  setDbUser(data);
};
const fetchRequests = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', user?.id);

  if (error) {
    console.error(error);
    return;
  }

  setMaintenanceRequests(data);
};
  // ============================================================================
  // REAL BACKEND DATA - Fetch only tenant's own maintenance requests
  // ============================================================================
  
  // Filter maintenance requests for current tenant only
  const tenantRequests = maintenanceRequests;
  
  // Get tenant's property and unit info
  const tenantProperty = properties.find((p:any) => p.id === dbUser?.property_id);
  const tenantUnit = tenantProperty?.units?.find((u:any) => u.id === dbUser?.unit_id);

  const handleSubmit = async () => {
  if (!newRequest.title || !newRequest.description) return;
console.log("USER:", user);
console.log("PROPERTY:", tenantProperty);
console.log("UNIT:", tenantUnit);
  const { error } = await supabase
  
    .from('maintenance_requests')
    
    .insert([
  {
    title: newRequest.title,
    description: newRequest.description,

    category: detectCategory(newRequest.title + ' ' + newRequest.description),
    priority: detectPriority(newRequest.title + ' ' + newRequest.description),

    status: 'pending',

    tenant_id: dbUser?.id,
    tenant_name: dbUser?.name,

    landlord_id: dbUser?.landlord_id || null,

    property_id: dbUser?.property_id || null,
    unit_id: dbUser?.unit_id || null,

    

    date_submitted: new Date().toISOString()
  }
]);

  if (error) {
    console.error(error);
    toast.error("Failed to submit request");
    return;
  }

  toast.success("Request submitted!");

  setIsAddDialogOpen(false);
  setNewRequest({ title: '', description: '', image: null });

  fetchRequests(); // refresh list
};

  // ============================================================================
  // AI-BASED CATEGORY AND PRIORITY DETECTION
  // ============================================================================
  
  const detectCategory = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    if (lowerText.includes('plumb') || lowerText.includes('water') || lowerText.includes('leak') || lowerText.includes('pipe') || lowerText.includes('faucet') || lowerText.includes('toilet') || lowerText.includes('drain')) {
      return 'Plumbing';
    }
    if (lowerText.includes('electric') || lowerText.includes('light') || lowerText.includes('power') || lowerText.includes('outlet') || lowerText.includes('switch') || lowerText.includes('wire')) {
      return 'Electrical';
    }
    if (lowerText.includes('hvac') || lowerText.includes('ac') || lowerText.includes('air') || lowerText.includes('heat') || lowerText.includes('cooling') || lowerText.includes('thermostat') || lowerText.includes('temperature')) {
      return 'HVAC';
    }
    if (lowerText.includes('paint') || lowerText.includes('wall') || lowerText.includes('ceiling') || lowerText.includes('floor') || lowerText.includes('tile')) {
      return 'Painting';
    }
    if (lowerText.includes('door') || lowerText.includes('window') || lowerText.includes('lock') || lowerText.includes('key') || lowerText.includes('hinge')) {
      return 'Carpentry';
    }
    if (lowerText.includes('pest') || lowerText.includes('insect') || lowerText.includes('rodent') || lowerText.includes('bug')) {
      return 'Pest Control';
    }
    if (lowerText.includes('appliance') || lowerText.includes('refrigerator') || lowerText.includes('stove') || lowerText.includes('oven') || lowerText.includes('dishwasher')) {
      return 'Appliances';
    }
    if (
  lowerText.includes('clean') ||
  lowerText.includes('dirty') ||
  lowerText.includes('dust') ||
  lowerText.includes('garbage') ||
  lowerText.includes('trash') ||
  lowerText.includes('sweep') ||
  lowerText.includes('mop')
) {
  return 'Cleaning';
}
if (
    lowerText.includes('crack') ||
    lowerText.includes('wall damage') ||
    lowerText.includes('structure') ||
    lowerText.includes('ceiling broken') ||
    lowerText.includes('foundation')
  ) return 'Structural';
    
    return 'General';
  };
  
  const detectPriority = (text: string): string => {
    const lowerText = text.toLowerCase();
    
    // Urgent keywords
    if (lowerText.includes('urgent') || lowerText.includes('emergency') || lowerText.includes('flood') || lowerText.includes('fire') || lowerText.includes('gas leak') || lowerText.includes('no power') || lowerText.includes('burst') || lowerText.includes('broken') || lowerText.includes('danger')) {
      return 'urgent';
    }
    
    // High priority keywords
    if (lowerText.includes('leak') || lowerText.includes('not working') || lowerText.includes('doesn\'t work') || lowerText.includes('major') || lowerText.includes('serious') || lowerText.includes('unsafe')) {
      return 'high';
    }
    
    // Low priority keywords
    if (lowerText.includes('minor') || lowerText.includes('small') || lowerText.includes('cosmetic') || lowerText.includes('whenever')) {
      return 'low';
    }
    
    // Default to medium
    return 'medium';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Maintenance Requests</h2>
          <p className="text-muted-foreground">Submit and track your requests</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <GradientButton>
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Request</span>
            </GradientButton>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Submit Maintenance Request</DialogTitle>
              <DialogDescription>
                Describe the issue and we'll assign a technician to help you.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="issue-title">Issue Title</Label>
                <Input
                  id="issue-title"
                  placeholder="e.g., Leaking faucet"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="issue-description">Description</Label>
                <Textarea
                  id="issue-description"
                  placeholder="Describe the issue in detail..."
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  className="mt-1.5 min-h-[100px]"
                />
              </div>
              <div>
                <Label htmlFor="issue-image">Photo (Optional)</Label>
                <div className="mt-1.5 border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors cursor-pointer">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Click to upload image</p>
                  <input
                    id="issue-image"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setNewRequest({ ...newRequest, image: e.target.files?.[0] || null })}
                  />
                </div>
              </div>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Our AI will automatically categorize and prioritize your request
                </p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <GradientButton onClick={handleSubmit} className="flex-1">
                  Submit Request
                </GradientButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Requests */}
      <div className="space-y-4">
        {tenantRequests.map((request) => (
          <Card key={request.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-start gap-3 flex-1">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center flex-shrink-0">
                  <Wrench className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold mb-1">{request.category} Issue</h3>
                  <p className="text-sm text-muted-foreground">{request.description}</p>
                </div>
              </div>
              <StatusBadge status={request.status} className="flex-shrink-0" />
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
              <Calendar className="w-4 h-4" />
              <span>Submitted: {new Date(request.date_submitted).toLocaleDateString()}</span>
            </div>

            {/* AI Classification */}
            <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">AI Classification</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-background">
                  {request.category}
                </Badge>
                <StatusBadge status={request.priority} />
              </div>
            </div>

            {request.status === 'completed' && (
              <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2 text-primary">
                <CheckCircle2 className="w-5 h-5" />
                <span className="text-sm font-medium">Issue resolved</span>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {tenantRequests.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-muted mx-auto mb-4 flex items-center justify-center">
            <Wrench className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="font-semibold mb-2">No Maintenance Requests</h3>
          <p className="text-sm text-muted-foreground mb-4">
            You haven't submitted any maintenance requests yet
          </p>
          <Button variant="outline" onClick={() => setIsAddDialogOpen(true)}>
            Submit Your First Request
          </Button>
        </Card>
      )}
    </div>
  );
}