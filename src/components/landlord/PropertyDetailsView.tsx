import React, { useState } from 'react';
import{supabase}from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { Building2, MapPin, Users, Home, ArrowLeft, Edit, Trash2, AlertTriangle, Zap, Droplet, Flame, DollarSign, Receipt, ChevronDown, Check, Wrench } from 'lucide-react';
import { useAppData } from '../../contexts/AppDataContext';

interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  rent: number;
  monthlyElectricity: number;
  maintenanceType?: string;
  totalMonthly?:number;
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

interface PropertyDetailsViewProps {
  property: Property;
  onBack: () => void;
  onUpdate: (updatedProperty: Property) => void;
  onDelete: (propertyId: string) => void;
  refreshProperties:()=>void;
}

export function PropertyDetailsView({ property, onBack, onUpdate, onDelete ,refreshProperties}: PropertyDetailsViewProps) {
  const { tenants, updateTenant } = useAppData();
  const [isEditPropertyDialogOpen, setIsEditPropertyDialogOpen] = useState(false);
  const [isEditChargesDialogOpen, setIsEditChargesDialogOpen] = useState(false);
  const [isEditUnitDialogOpen, setIsEditUnitDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editedProperty, setEditedProperty] = useState(property);
  const [selectedUnitIndex, setSelectedUnitIndex] = useState<number | null>(null);
  const safeEditedCharges = editedProperty.propertyCharges ?? {
  maintenanceFee: 0,
  waterBill: 0,
  gasBill: 0
};
  const safeCharges = property.propertyCharges ?? {
  maintenanceFee: 0,
  waterBill: 0,
  gasBill: 0
};
  // Tenant autocomplete state
  const [tenantSearchQuery, setTenantSearchQuery] = useState('');
  const [showTenantSuggestions, setShowTenantSuggestions] = useState(false);

 const totalUnits = property.totalUnits || property.units?.length || 0;

const occupiedUnits = property.units?.filter(u => u.status === 'occupied').length || 0;

const vacantUnits = totalUnits - occupiedUnits;

const occupancyRate = totalUnits > 0
  ? Math.round((occupiedUnits / totalUnits) * 100)
  : 0;

  // Get tenants for this property
  const propertyTenants = tenants.filter(tenant => tenant.property === property.name);
  
  // Get available tenants (not assigned to any occupied unit in ANY property)
  const getAvailableTenants = () => {
    const assignedTenantIds = new Set<string>();
    
    // Get all assigned tenants from current property units
    property.units.forEach(unit => {
      if (unit.status === 'occupied' && unit.tenant) {
        // Find tenant by name and add their ID
        const tenant = tenants.find(t => t.name === unit.tenant);
        if (tenant) {
          assignedTenantIds.add(tenant.id);
        }
      }
    });
    
    // Also exclude tenants that have a property assignment already
    return tenants.filter(tenant => {
      // If already assigned to a unit in current property, exclude
      if (assignedTenantIds.has(tenant.id)) {
        return false;
      }
      // If tenant has a property assignment in another property, exclude
      if (tenant.property && tenant.property !== property.name) {
        return false;
      }
      return true;
    });
  };
  
  // Filter tenants based on search query
  const getFilteredTenants = () => {
    const availableTenants = getAvailableTenants();
    
    if (!tenantSearchQuery.trim()) {
      return availableTenants;
    }
    
    const query = tenantSearchQuery.toLowerCase();
    return availableTenants.filter(tenant => 
      tenant.name.toLowerCase().includes(query) ||
      tenant.unit.toLowerCase().includes(query)
    );
  };

  const handleSavePropertyChanges = async () => {
  if (!editedProperty.name || !editedProperty.address || editedProperty.totalUnits <= 0) {
    return;
  }

  const oldUnits = property.units || [];
  const newCount = editedProperty.totalUnits;
  const oldCount = oldUnits.length;

  let updatedUnits:Unit[] = [...oldUnits];

  // 🔥 CASE 1: ADD NEW UNITS
  if (newCount > oldCount) {
  const unitsToAdd: Unit[] = [];

  for (let i = oldCount + 1; i <= newCount; i++) {
    unitsToAdd.push({
      id: '', // ✅ temporary
      number: `Unit-${i}`,
      status: 'vacant',
      tenant: '',
      rent: 0,
      monthlyElectricity: 0
    });
  }
  

  // 👉 INSERT INTO DB
  const { data: insertedUnits, error } = await supabase
    .from('units')
    .insert(
      unitsToAdd.map(u => ({
        property_id: property.id,
        unit_number: u.number,
        rent: 0,
        monthly_electricity: 0,
        status: 'vacant'
      }))
    )
    .select();

  if (error) {
    console.error(error);
    return;
  }

  // 👉 MAP DB DATA
  
}
  // 🔥 CASE 2: REMOVE UNITS
  if (newCount < oldCount) {
    const unitsToRemove = updatedUnits.slice(newCount);

    updatedUnits = updatedUnits.slice(0, newCount);

    // 👉 DELETE FROM DB
    await supabase
      .from('units')
      .delete()
      .in('unit_number', unitsToRemove.map(u => u.number))
      .eq('property_id', property.id);
  }

  const updatedProperty = {
    ...editedProperty,
    units: updatedUnits,
    occupiedUnits: updatedUnits.filter(u => u.status === 'occupied').length
  };

  onUpdate(updatedProperty);
  setIsEditPropertyDialogOpen(false);
};

  const handleSaveCharges = async () => {
  const { error } = await supabase
    .from('properties')
    .update({
      maintenance_fee: editedProperty.propertyCharges.maintenanceFee,
      water_bill: editedProperty.propertyCharges.waterBill,
      gas_bill: editedProperty.propertyCharges.gasBill
    })
    .eq('id', property.id);

  if (error) {
    console.error(error);
    return;
  }

  onUpdate(editedProperty);
  await refreshProperties();
  setIsEditChargesDialogOpen(false);
};

  const handleSaveUnitChanges = async() => {
    if (selectedUnitIndex !== null) {
      const editedUnit = editedProperty.units[selectedUnitIndex];
      const originalUnit = property.units[selectedUnitIndex];
      const total =
  editedUnit.rent +
  editedUnit.monthlyElectricity +
  (property.propertyCharges?.maintenanceFee || 0) +
  (property.propertyCharges?.waterBill || 0) +
  (property.propertyCharges?.gasBill || 0);
  console.log("unit  id",editedUnit.id);
  // 🔥 CREATE PAYMENT ENTRY
await supabase.from('payments').insert({
  tenant_id: tenants.find(t => t.name === editedUnit.tenant)?.id,
  unit_id: editedUnit.id,   // 🔥 IMPORTANT
  amount: total,
  status: 'pending',
  due_date: new Date().toISOString()
});
      // Validate required fields based on status
      if (!editedUnit.number || editedUnit.rent < 0) {
        return;
      }
      
      
      
      if (editedUnit.status === 'maintenance' && !editedUnit.maintenanceType) {
        return; // Maintenance type required for maintenance status
      }
      
      // Handle tenant assignment sync
      const oldTenantName = originalUnit.tenant;
      const newTenantName = editedUnit.tenant;
      
      // If tenant changed, update tenant objects in AppDataContext
      if (oldTenantName !== newTenantName) {
        // Remove old tenant from this property
        if (oldTenantName) {
          const oldTenant = tenants.find(t => t.name === oldTenantName);
          if (oldTenant) {
            updateTenant(oldTenant.id, {
              property: '',
              unit: ''
            });
          }
        }
        
        // Assign new tenant to this property and unit
        if (newTenantName) {
          const newTenant = tenants.find(t => t.name === newTenantName);
          if (newTenant) {
            updateTenant(newTenant.id, {
              property: property.name,
              unit: editedUnit.number,
              monthlyRent: total
            });
            
          }
        }
      }
      
      // Handle maintenance type reset when status changes away from maintenance
      if (originalUnit.status === 'maintenance' && editedUnit.status !== 'maintenance') {
        editedUnit.maintenanceType = undefined;
      }
      

const { error } = await supabase
  .from('units')
  .update({
    rent: editedUnit.rent,
    total_monthly:Number(total),
    monthly_electricity: editedUnit.monthlyElectricity,
    status: editedUnit.status
  })
  
  .eq('id', editedUnit.id)
  .select();
// 🔥 UPDATE PAYMENT AMOUNT ALSO
if (editedUnit.tenant) {
  const { error: paymentError } = await supabase
    .from('payments')
    .update({ amount: total })
    .eq('unit', editedUnit.number)
    .eq('property', property.name);

  if (paymentError) {
    console.error("❌ Payment update failed:", paymentError);
  }
}
if (error) {
  console.error("❌ Update failed:", error);
} else {
  console.log("✅ Updated successfully:", editedUnit);
}
      // Update the property with the edited unit
      const updatedUnits = property.units.map((u, i) =>
  i === selectedUnitIndex
    ? { ...editedUnit, totalMonthly: total }
    : u
);

const updatedProperty = {
  ...property,
  units: updatedUnits
};
      updatedProperty.occupiedUnits = updatedProperty.units.filter(u => u.status === 'occupied').length;
      await refreshProperties();
      onUpdate(updatedProperty);
     
      setIsEditUnitDialogOpen(false);
      setSelectedUnitIndex(null);
    }
  };

  const handleDelete = () => {
    onDelete(property.id);
    setIsDeleteDialogOpen(false);
  };

  
  const openEditUnit = (index: number) => {
    setSelectedUnitIndex(index);
    setEditedProperty({ ...property, units: [...property.units] });
    
    // Initialize tenant search query with existing tenant name
    const existingTenant = property.units[index]?.tenant || '';
    setTenantSearchQuery(existingTenant);
    setShowTenantSuggestions(false);
    
    setIsEditUnitDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button 
          variant="ghost" 
          onClick={onBack}
          className="mb-4 -ml-2"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Properties
        </Button>
        
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-semibold mb-1">{property.name}</h2>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{property.address}</span>
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline"
              onClick={() => {
                setEditedProperty(property);
                setIsEditPropertyDialogOpen(true);
              }}
            >
              <Edit className="w-4 h-4 mr-2" />
              Edit Property
            </Button>
            <Button 
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </div>
      </div>

      {/* Property Overview */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Property Overview</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Home className="w-4 h-4" />
              <span>Total Units</span>
            </div>
            <p className="text-2xl font-semibold">{totalUnits}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span>Occupied Units</span>
            </div>
            <p className="text-2xl font-semibold text-primary">{occupiedUnits}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Building2 className="w-4 h-4" />
              <span>Vacant Units</span>
            </div>
            <p className="text-2xl font-semibold">{vacantUnits}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
              <Users className="w-4 h-4" />
              <span>Occupancy Rate</span>
            </div>
            <p className="text-2xl font-semibold text-emerald-600">{occupancyRate}%</p>
          </div>
        </div>
      </Card>

      {/* Property-Level Charges */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold">Property-Level Charges</h3>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              setEditedProperty(property);
              setIsEditChargesDialogOpen(true);
            }}
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Charges
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Home className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Maintenance Fee</p>
              <p className="text-lg font-semibold">₹{safeCharges.maintenanceFee??0}/unit</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <Droplet className="w-5 h-5 text-cyan-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Water Bill</p>
              <p className="text-lg font-semibold">₹{safeCharges.waterBill??0}/unit</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-muted/30 rounded-lg">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <Flame className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Gas Bill</p>
              <p className="text-lg font-semibold">₹{safeCharges.gasBill??0}/unit</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Units List with Billing Preview */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Units & Billing</h3>
        {!property.units||property.units.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No Units Added</h4>
            <p className="text-sm text-muted-foreground">
              Units for this property haven't been added yet.
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {property.units?.map((unit, index) => (
              <Card key={unit.id} className="p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Home className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">{unit.number}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <StatusBadge status={unit.status} />
                        {unit.tenant && (
                          <span className="text-sm text-muted-foreground">• {unit.tenant}</span>
                        )}
                      </div>
                      {/* Show maintenance type if unit is under maintenance */}
                      {unit.status === 'maintenance' && unit.maintenanceType && (
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Wrench className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-xs text-amber-600 font-medium">{unit.maintenanceType}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => openEditUnit(index)}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Edit Unit
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Unit Details */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Unit Charges</h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Monthly Rent</span>
                        <span className="font-medium">₹{unit.rent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <Zap className="w-3 h-3" />
                          Electricity (Monthly)
                        </span>
                        <span className="font-medium">₹{unit.monthlyElectricity}</span>
                      </div>
                    </div>
                  </div>

                  {/* Billing Preview */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-medium text-muted-foreground">Billing Summary</h5>
                    <div className="space-y-2 text-sm bg-gradient-to-br from-primary/5 to-accent/5 p-3 rounded-lg">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Rent</span>
                        <span>₹{unit.rent}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">+ Electricity</span>
                        <span>₹{unit.monthlyElectricity}</span>
                      </div>
                      <div className="border-t border-border pt-2 space-y-1">
                        <p className="text-xs text-muted-foreground mb-1">Property Charges:</p>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">+ Maintenance</span>
                          <span>₹{safeCharges.maintenanceFee??0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">+ Water</span>
                          <span>₹{safeCharges.waterBill??0}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">+ Gas</span>
                          <span>₹{safeCharges.gasBill ??0}</span>
                        </div>
                      </div>
                      <div className="border-t border-border pt-2 flex justify-between font-semibold text-primary">
                        <span>Total Monthly</span>
                        <span>₹{
  unit.totalMonthly ??
  (unit.rent +
    unit.monthlyElectricity +
    (safeCharges.maintenanceFee || 0) +
    (safeCharges.waterBill || 0) +
    (safeCharges.gasBill || 0))
}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Tenants List */}
      <div>
        <h3 className="text-xl font-semibold mb-4">Tenants</h3>
        {propertyTenants.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h4 className="font-semibold mb-2">No Tenants</h4>
            <p className="text-sm text-muted-foreground">
              No tenants are currently assigned to this property.
            </p>
          </Card>
        ) : (
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border">
                  <tr className="text-left">
                    <th className="p-4 text-sm font-medium text-muted-foreground">Tenant Name</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Unit Number</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Lease Status</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Monthly Rent</th>
                    <th className="p-4 text-sm font-medium text-muted-foreground">Payment Status</th>
                  </tr>
                </thead>
                <tbody>
                  {propertyTenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-border last:border-0 hover:bg-muted/50">
                      <td className="p-4">
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                          <p className="text-xs text-muted-foreground">{tenant.email}</p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium">{tenant.unit}</span>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <p className="text-muted-foreground">
                            {new Date(tenant.leaseStart).toLocaleDateString()} - {new Date(tenant.leaseEnd).toLocaleDateString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <span className="font-medium text-primary">₹{tenant.monthlyRent}</span>
                      </td>
                      <td className="p-4">
                        <StatusBadge status={tenant.paymentStatus} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      {/* Edit Property Dialog */}
      <Dialog open={isEditPropertyDialogOpen} onOpenChange={setIsEditPropertyDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property Details</DialogTitle>
            <DialogDescription>
              Update the property name, address, and number of units
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="edit-property-name">
                Property Name <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-property-name"
                value={editedProperty.name}
                onChange={(e) => setEditedProperty({ ...editedProperty, name: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-property-address">
                Address <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-property-address"
                value={editedProperty.address}
                onChange={(e) => setEditedProperty({ ...editedProperty, address: e.target.value })}
                className="mt-1.5"
                required
              />
            </div>
            <div>
              <Label htmlFor="edit-property-total-units">
                Number of Units <span className="text-red-500">*</span>
              </Label>
              <Input
                id="edit-property-total-units"
                type="number"
                min="1"
                value={editedProperty.totalUnits}
                onChange={(e) => setEditedProperty({ ...editedProperty, totalUnits: parseInt(e.target.value) || 0 })}
                className="mt-1.5"
                required
              />
              <p className="text-xs text-muted-foreground mt-1.5">
                Total number of units in this property
              </p>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditPropertyDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <GradientButton 
                onClick={handleSavePropertyChanges} 
                className="flex-1"
                disabled={!editedProperty.name || !editedProperty.address || editedProperty.totalUnits <= 0}
              >
                Save Changes
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Property Charges Dialog */}
      <Dialog open={isEditChargesDialogOpen} onOpenChange={setIsEditChargesDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Property Charges</DialogTitle>
            <DialogDescription>
              Update property-level charges that apply to all units
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/30 p-3 rounded-lg">
              <p className="text-xs text-muted-foreground">
                These charges apply to all units in this property and can be updated monthly.
              </p>
            </div>
            <div>
              <Label htmlFor="edit-maintenance">Maintenance Fee (per unit)</Label>
              <Input
                id="edit-maintenance"
                type="number"
                min="0"
                step="any"
                value={safeEditedCharges.maintenanceFee === 0 ? '' : safeEditedCharges.maintenanceFee??0}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedProperty({
                    ...editedProperty,
                    propertyCharges: {
                      ...safeEditedCharges,
                      maintenanceFee: value === '' ? 0 : Math.max(0, parseFloat(value) || 0)
                    }
                  });
                }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-water">Water Bill (per unit)</Label>
              <Input
                id="edit-water"
                type="number"
                min="0"
                step="any"
                value={safeEditedCharges.waterBill === 0 ? '' : safeEditedCharges.waterBill}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedProperty({
                    ...editedProperty,
                    propertyCharges: {
                      ...safeEditedCharges,
                      waterBill: value === '' ? 0 : Math.max(0, parseFloat(value) || 0)
                    }
                  });
                }}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label htmlFor="edit-gas">Gas Bill (per unit)</Label>
              <Input
                id="edit-gas"
                type="number"
                min="0"
                step="any"
                value={safeEditedCharges.gasBill === 0 ? '' : safeEditedCharges.gasBill}
                onChange={(e) => {
                  const value = e.target.value;
                  setEditedProperty({
                    ...editedProperty,
                    propertyCharges: {
                      ...safeEditedCharges,
                      gasBill: value === '' ? 0 : Math.max(0, parseFloat(value) || 0)
                    }
                  });
                }}
                className="mt-1.5"
              />
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" onClick={() => setIsEditChargesDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <GradientButton onClick={handleSaveCharges} className="flex-1">
                Save Changes
              </GradientButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Unit Dialog */}
      {selectedUnitIndex !== null && (
        <Dialog open={isEditUnitDialogOpen} onOpenChange={setIsEditUnitDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Unit - {editedProperty.units[selectedUnitIndex]?.number}</DialogTitle>
              <DialogDescription>
                Update unit details including rent, status, tenant, and monthly electricity usage
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="edit-unit-number">Unit Name/Number</Label>
                <Input
                  id="edit-unit-number"
                  value={editedProperty.units[selectedUnitIndex]?.number}
                  onChange={(e) => {
                    const units = [...editedProperty.units];
                    units[selectedUnitIndex] = { ...units[selectedUnitIndex], number: e.target.value };
                    setEditedProperty({ ...editedProperty, units });
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-unit-rent">Monthly Rent (₹)</Label>
                <Input
                  id="edit-unit-rent"
                  type="number"
                  value={editedProperty.units[selectedUnitIndex]?.rent}
                  onChange={(e) => {
                    const units = [...editedProperty.units];
                    units[selectedUnitIndex] = { ...units[selectedUnitIndex], rent: parseFloat(e.target.value) || 0 };
                    setEditedProperty({ ...editedProperty, units });
                  }}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="edit-unit-status">Occupancy Status</Label>
                <select
                  id="edit-unit-status"
                  value={editedProperty.units[selectedUnitIndex]?.status}
                  onChange={(e) => {
                    const units = [...editedProperty.units];
                    const newStatus = e.target.value as 'occupied' | 'vacant' | 'maintenance';
                    units[selectedUnitIndex] = { ...units[selectedUnitIndex], status: newStatus };
                    
                    // Clear tenant if status is not occupied
                    if (newStatus !== 'occupied') {
                      units[selectedUnitIndex].tenant = '';
                    }
                    
                    // Clear maintenance type if status is not maintenance
                    if (newStatus !== 'maintenance') {
                      units[selectedUnitIndex].maintenanceType = undefined;
                    }
                    
                    setEditedProperty({ ...editedProperty, units });
                    setTenantSearchQuery('');
                  }}
                  className="mt-1.5 w-full h-10 px-3 rounded-md border border-input bg-background"
                >
                  <option value="vacant">Vacant</option>
                  <option value="occupied">Occupied</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              
              {/* Conditional Tenant Name Field - Only show when status is occupied */}
             
              
              {/* Conditional Maintenance Type Field - Only show when status is maintenance */}
              {editedProperty.units[selectedUnitIndex]?.status === 'maintenance' && (
                <div>
                  <Label htmlFor="edit-unit-maintenance-type">
                    Type of Maintenance <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="edit-unit-maintenance-type"
                    value={(editedProperty.units[selectedUnitIndex] as any)?.maintenanceType || ''}
                    onChange={(e) => {
                      const units = [...editedProperty.units];
                      units[selectedUnitIndex] = { ...units[selectedUnitIndex], maintenanceType: e.target.value } as any;
                      setEditedProperty({ ...editedProperty, units });
                    }}
                    className="mt-1.5"
                    placeholder="e.g., Plumbing, Electrical, Painting"
                    required
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Specify the type of maintenance work being performed
                  </p>
                </div>
              )}
              
              <div>
                <Label htmlFor="edit-unit-electricity">Monthly Electricity Bill (₹)</Label>
                <Input
                  id="edit-unit-electricity"
                  type="number"
                  value={editedProperty.units[selectedUnitIndex]?.monthlyElectricity}
                  onChange={(e) => {
                    const units = [...editedProperty.units];
                    units[selectedUnitIndex] = { ...units[selectedUnitIndex], monthlyElectricity: parseFloat(e.target.value) || 0 };
                    setEditedProperty({ ...editedProperty, units });
                  }}
                  className="mt-1.5"
                  placeholder="Update monthly based on usage"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  Update this value each month based on actual usage
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setIsEditUnitDialogOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <GradientButton onClick={handleSaveUnitChanges} className="flex-1">
                  Save Changes
                </GradientButton>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Property
            </DialogTitle>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-muted-foreground mb-6">
              Are you sure you want to delete <span className="font-semibold text-foreground">{property.name}</span>? 
              This action cannot be undone. All associated units and tenant assignments will be removed.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={handleDelete} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Property
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}