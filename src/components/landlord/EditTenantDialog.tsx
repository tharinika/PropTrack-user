import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { UserPlus, Building2, Home, AlertCircle, Check, Trash2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';

interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  rent: number;
  monthlyElectricity: number;
}

interface PropertyCharges {
  maintenanceFee: number;
  waterBill: number;
  gasBill: number;
}

interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  propertyCharges: PropertyCharges;
  units: Unit[];
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  property: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPayment: string;
}

interface UpdatedTenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  propertyId: string;
  property: string;
  unitId: string;
  unit: string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPayment: string;
}

interface EditTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (tenant: UpdatedTenant) => void;
  onDelete?: (tenantId: string) => void;
  tenant: Tenant | null;
  properties: Property[];
}

export function EditTenantDialog({ open, onOpenChange, onEdit, onDelete, tenant, properties }: EditTenantDialogProps) {
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [selectedUnitId, setSelectedUnitId] = useState('');
  const [tenantData, setTenantData] = useState({
    name: '',
    email: '',
    phone: '',
    leaseStart: '',
    leaseEnd: '',
    monthlyRent: 0
  });

  // Initialize form with tenant data when dialog opens
 useEffect(() => {
  if (tenant && open) {
    // 🔥 safer match (trim + lowercase)
    const property = properties.find(
      p => p.name.trim().toLowerCase() === tenant.property.trim().toLowerCase()
    );

    // 🔥 safer unit match
    const unit = property?.units.find(
      u => u.number.trim().toLowerCase() === tenant.unit.trim().toLowerCase()
    );

    // 🔥 IMPORTANT: only set if found
    if (property) {
      setSelectedPropertyId(property.id);
    }

    if (unit) {
      setSelectedUnitId(unit.id);
    }
  }
}, [tenant, properties, open]);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  
  // Get available units (vacant + current tenant's unit)
  const availableUnits = selectedProperty?.units.filter(u => {
  // show vacant units
  if (u.status === 'vacant') return true;

  // ALWAYS include current tenant unit (based on unitId)
  if (tenant && u.id === selectedUnitId) return true;

  return false;
}) || [];
  
  const selectedUnit = selectedProperty?.units.find(u => u.id === selectedUnitId);

  // Auto-fill rent when unit is selected
  useEffect(() => {
  if (!tenant || !open) return;

  // 🔥 prevent re-running overwrite
  

  const property = properties.find(
    p => p.name === tenant.property
  );

  const unit = property?.units.find(
    u => u.number === tenant.unit
  );

  if (property) setSelectedPropertyId(property.id);
  if (unit) setSelectedUnitId(unit.id);

  setTenantData({
    name: tenant.name,
    email: tenant.email,
    phone: tenant.phone,
    leaseStart: tenant.leaseStart,
    leaseEnd: tenant.leaseEnd,
    monthlyRent: tenant.monthlyRent
  });

}, [tenant, open, properties]);

  // Reset unit selection when property changes
  useEffect(() => {
    if (!open) return; // Don't reset when dialog is closed
    
    const currentProperty = properties.find(p => p.id === selectedPropertyId);
    const currentUnit = currentProperty?.units.find(u => u.id === selectedUnitId);
    
    // If the current unit doesn't belong to the selected property, reset
    if (selectedUnitId && !currentUnit) {
      setSelectedUnitId('');
    }
  }, [selectedPropertyId, properties, selectedUnitId, open]);

  const handleSubmit = () => {
    
    if (!selectedProperty || !selectedUnit || !tenant) return;

    const totalMonthlyPayable =
  (selectedUnit?.rent || 0) +
  (selectedUnit?.monthlyElectricity || 0) +
  (selectedProperty?.propertyCharges?.maintenanceFee || 0) +
  (selectedProperty?.propertyCharges?.waterBill || 0) +
  (selectedProperty?.propertyCharges?.gasBill || 0);

const updatedTenant: UpdatedTenant = {
  id: tenant.id,
  ...tenantData,
  monthlyRent: totalMonthlyPayable, // 🔥 ALWAYS correct
  propertyId: selectedPropertyId,
  property: selectedProperty.name ?? tenant.property,
  unitId: selectedUnitId,
  unit: selectedUnit.number,
  paymentStatus: tenant.paymentStatus,
  lastPayment: tenant.lastPayment
};

    onEdit(updatedTenant);
    onOpenChange(false);
    
    // Toast notification is handled in AppDataContext
    console.log("SUBMIT DATA:", {
  selectedPropertyId,
  selectedUnitId,
  selectedProperty,
  selectedUnit
});
  };

  const isFormValid = 
    tenantData.name &&
    tenantData.email &&
    tenantData.phone &&
    selectedPropertyId &&
    selectedUnitId &&
    tenantData.leaseStart &&
    tenantData.leaseEnd &&
    tenantData.monthlyRent > 0;

  if (!tenant) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Tenant Details</DialogTitle>
          <DialogDescription>
            Update tenant information, lease details, and unit assignment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 pt-4">
          {/* Property & Unit Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Property & Unit Assignment</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Selection */}
              <div>
                <Label htmlFor="edit-property-select">Assigned Property</Label>
                <select
                  id="edit-property-select"
                  value={selectedPropertyId}
                  onChange={(e) => setSelectedPropertyId(e.target.value)}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="">-- Choose a property --</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
                {properties.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No properties available. Add properties first.
                  </p>
                )}
              </div>

              {/* Unit Selection */}
              <div>
                <Label htmlFor="edit-unit-select">Assigned Unit</Label>
                <select
                  id="edit-unit-select"
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  disabled={!selectedPropertyId}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedPropertyId ? '-- Choose a unit --' : 'Select a property first'}
                  </option>
                  {availableUnits.map((unit) => (
                    <option key={unit.id} value={unit.id}>
                      {unit.number} - ₹{unit.rent}/month
                      {unit.tenant === tenant.name ? ' (Current)' : ''}
                    </option>
                  ))}
                </select>
                {selectedPropertyId && availableUnits.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No available units in this property
                  </p>
                )}
                {selectedPropertyId && availableUnits.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {availableUnits.length} {availableUnits.length === 1 ? 'unit' : 'units'} available
                  </p>
                )}
              </div>
            </div>

            {/* Selected Property Info */}
            {selectedProperty && (
              <div className="bg-muted/30 p-3 rounded-lg text-sm">
                <div className="flex items-start gap-3">
                  <Building2 className="w-4 h-4 text-primary mt-0.5" />
                  <div className="flex-1">
                    <p className="font-medium">{selectedProperty.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedProperty.address}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>Total Units: {selectedProperty.totalUnits}</span>
                      <span>•</span>
                      <span>Vacant: {selectedProperty.totalUnits - selectedProperty.occupiedUnits}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Tenant Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <UserPlus className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Tenant Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="edit-tenant-name">Full Name</Label>
                <Input
                  id="edit-tenant-name"
                  placeholder="e.g., John Doe"
                  value={tenantData.name}
                  onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="edit-tenant-email">Email Address</Label>
                <Input
                  id="edit-tenant-email"
                  type="email"
                  placeholder="john.doe@email.com"
                  value={tenantData.email}
                  onChange={(e) => setTenantData({ ...tenantData, email: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="edit-tenant-phone">Phone Number</Label>
                <Input
                  id="edit-tenant-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={tenantData.phone}
                  onChange={(e) => setTenantData({ ...tenantData, phone: e.target.value })}
                  className="mt-1.5"
                />
              </div>
            </div>
          </div>

          {/* Lease Details Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Home className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Lease Details</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-lease-start">Lease Start Date</Label>
                <Input
                  id="edit-lease-start"
                  type="date"
                  value={tenantData.leaseStart}
                  onChange={(e) => setTenantData({ ...tenantData, leaseStart: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="edit-lease-end">Lease End Date</Label>
                <Input
                  id="edit-lease-end"
                  type="date"
                  value={tenantData.leaseEnd}
                  onChange={(e) => setTenantData({ ...tenantData, leaseEnd: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="edit-monthly-rent">Monthly Rent (₹)</Label>
                <Input
                  id="edit-monthly-rent"
                  type="number"
                  placeholder="12000"
                  value={tenantData.monthlyRent || ''}
                  onChange={(e) => setTenantData({ ...tenantData, monthlyRent: parseFloat(e.target.value) || 0 })}
                  className="mt-1.5"
                />
                {selectedUnit && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Auto-filled from unit. You can adjust if needed.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Info Banner */}
          <div className="bg-blue-500/5 border border-blue-500/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              Changes to property or unit assignment will be reflected immediately across all modules including Payments and Community.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)} 
              className="flex-1"
            >
              Cancel
            </Button>
            <GradientButton 
              onClick={handleSubmit} 
              className="flex-1"
              disabled={!isFormValid}
            >
              <Check className="w-4 h-4 mr-2" />
              Save Changes
            </GradientButton>
            {onDelete && (
              <Button 
                variant="destructive" 
                onClick={() => onDelete(tenant.id)} 
                className="flex-1"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Tenant
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}