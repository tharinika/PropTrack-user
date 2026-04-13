import React, { useState,useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { UserPlus, Mail, Phone, Home, Calendar, Edit, Search, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useCommunity } from '../../contexts/CommunityContext';
import { EmptyState } from './EmptyState';
import { AddTenantDialog } from './AddTenantDialog';
import { EditTenantDialog } from './EditTenantDialog';
import { toast } from 'sonner@2.0.3';
import { Check } from 'lucide-react';

export function TenantsView() {
  const { user } = useAuth();
  const [dbProperties,setDbProperties]=useState([]);
  const { properties, updateProperty } = useProperties();
  const { tenants, addTenant, updateTenant, deleteTenant } = useAppData();
  const { addTenantToCommunity, updateTenantInCommunity, removeTenantFromCommunity } = useCommunity();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<any | null>(null);
  const [tenantToDelete, setTenantToDelete] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  useEffect(() => {
  fetchProperties();

  const refresh = () => {
    fetchProperties();
  };

  window.addEventListener('tenant-updated', refresh);

  return () => {
    window.removeEventListener('tenant-updated', refresh);
  };
}, []);

const fetchProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*, units(*)');

  if (error) {
    console.error(error);
    return;
  }

  const formatted = data.map(p => ({
    ...p,
    units: (p.units || []).map(u => ({
      id: u.id,
      number: u.unit_number,
      status: u.status,
      rent: u.rent,
      monthlyElectricity: u.monthly_electricity || 0,
      totalMonthly:u.total_monthly||0
    })),
    propertyCharges: {
      maintenanceFee: p.maintenance_fee || 0,
      waterBill: p.water_bill || 0,
      gasBill: p.gas_bill || 0
    },
    occupiedUnits: (p.units || []).filter(u => u.status === 'occupied').length
  }));

  setDbProperties(formatted);
};

  // Helper function to get lease end date color
  const getLeaseEndColor = (leaseEndDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const leaseEnd = new Date(leaseEndDate);
    leaseEnd.setHours(0, 0, 0, 0); // Reset time to start of day
    
    const daysRemaining = Math.ceil((leaseEnd.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Red if expired (past date)
    if (daysRemaining < 0) {
      return 'text-red-600';
    }
    
    // Orange if expiring within 10 days
    if (daysRemaining >= 0 && daysRemaining <= 10) {
      return 'text-orange-500';
    }
    
    // Default color
    return 'text-foreground';
  };

  // Filter tenants based on search query
  const filteredTenants = tenants.filter(tenant => 
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.property.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.unit.toLowerCase().includes(searchQuery.toLowerCase())
  );
const getTenantTotal = (tenant: any) => {
  const property = dbProperties.find(
    p => p.id === tenant.propertyId 
  );

  if (!property) return 0;

  const unit = property.units.find(
    u => u.id === tenant.unitId 
  );

  if (!unit) return 0;

  return unit.totalMonthly || 0;
};
  const handleAddTenant = (newTenantData: any) => {
    // Add tenant to global state (auto-creates payment record)
    addTenant({
      name: newTenantData.name,
      email: newTenantData.email,
      phone: newTenantData.phone,
      unit: newTenantData.unit,
      property: newTenantData.property,
      leaseStart: newTenantData.leaseStart,
      leaseEnd: newTenantData.leaseEnd,
      monthlyRent: newTenantData.monthlyRent
    });

    // Automatically add tenant to property community
    addTenantToCommunity(newTenantData.property, newTenantData.name,newTenantData.id,
  newTenantData.unitId);

    // Update the unit status to occupied in the property
    updateProperty(prevProperties => 
      prevProperties.map(property => {
        if (property.id === newTenantData.propertyId) {
          return {
            ...property,
            units: property.units.map(unit => 
              unit.id === newTenantData.unitId
                ? { ...unit, status: 'occupied' as const, tenant: newTenantData.name }
                : unit
            ),
            occupiedUnits: property.occupiedUnits + 1
          };
        }
        return property;
      })
    );
    
    setIsAddDialogOpen(false);
    fetchProperties();
    // Toast notification is already handled in AddTenantDialog
  };

  const handleEditTenant = async(updatedTenantData: any) => {
    const oldTenant = tenants.find(t => t.id === updatedTenantData.id);
    console.log("updated tenant data:",updatedTenantData);
    await supabase
  .from('users')
  .update({
    property_id: updatedTenantData.propertyId,
    unit_id: updatedTenantData.unitId
  })
  .eq('id', updatedTenantData.id);
  await fetchProperties();
    // Update tenant in global state (auto-updates payments and maintenance)
   const selectedProperty = dbProperties.find(
  p => p.id === updatedTenantData.propertyId
);

updateTenant(updatedTenantData.id, {
  name: updatedTenantData.name,
  email: updatedTenantData.email,
  phone: updatedTenantData.phone,
  propertyId: updatedTenantData.propertyId,
  unitId: updatedTenantData.unitId,
  leaseStart: updatedTenantData.leaseStart,
  leaseEnd: updatedTenantData.leaseEnd,
  monthlyRent: updatedTenantData.monthlyRent,
  paymentStatus: updatedTenantData.paymentStatus,
  lastPayment: updatedTenantData.lastPayment
});

    // Automatically update tenant in community (handles property changes and name changes)
    if (oldTenant) {
  updateTenantInCommunity(
    oldTenant.property,
    updatedTenantData.property,
    oldTenant.name,
    updatedTenantData.name,
    updatedTenantData.id,       // ✅ ADD THIS
    updatedTenantData.unitId    // ✅ ADD THIS
  );
}

    // Handle property unit updates
    if (oldTenant) {
      const propertyChanged = oldTenant.property !== updatedTenantData.property;
      const unitChanged = oldTenant.unit !== updatedTenantData.unit;
      
      updateProperty(prevProperties => {
        return prevProperties.map(property => {
          // Free up old unit if property or unit changed
          if (propertyChanged && property.name === oldTenant.property) {
            return {
              ...property,
              units: property.units.map(unit =>
                unit.tenant === oldTenant.name
                  ? { ...unit, status: 'vacant' as const, tenant: undefined }
                  : unit
              ),
              occupiedUnits: property.occupiedUnits - 1
            };
          }
          
          // Occupy new unit
          if (property.id === updatedTenantData.propertyId) {
            return {
              ...property,
              units: property.units.map(unit => {
                if (unit.id === updatedTenantData.unitId) {
                  return { ...unit, status: 'occupied' as const, tenant: updatedTenantData.name };
                }
                // Free up old unit in same property if unit changed
                if (unitChanged && !propertyChanged && unit.tenant === oldTenant.name) {
                  return { ...unit, status: 'vacant' as const, tenant: undefined };
                }
                return unit;
              }),
              occupiedUnits: propertyChanged ? property.occupiedUnits + 1 : property.occupiedUnits
            };
          }
          
          return property;
        });
      });
    }
    
    setIsEditDialogOpen(false);
    
    // Toast notification is already handled in EditTenantDialog
  };

  const handleDeleteTenant = (tenantId: string) => {
    const tenant = tenants.find(t => t.id === tenantId);
    if (tenant) {
      setTenantToDelete(tenant);
      setIsDeleteConfirmOpen(true);
    }
  };

  const confirmDeleteTenant = () => {
    if (tenantToDelete) {
      const { property, unit, name } = tenantToDelete;
      
      // Remove tenant from global state (auto-removes payments and maintenance)
      deleteTenant(tenantToDelete.id);

      // Remove tenant from community
      removeTenantFromCommunity(property, name,tenantToDelete.id);

      // Update the unit status to vacant in the property
      updateProperty(prevProperties => 
        prevProperties.map(prop => {
          if (prop.name === tenantToDelete.property) {
            return {
              ...prop,
              units: prop.units.map(u => 
                u.number === tenantToDelete.unit
                  ? { ...u, status: 'vacant' as const, tenant: undefined }
                  : u
              ),
              occupiedUnits: prop.occupiedUnits - 1
            };
          }
          return prop;
        })
      );
      
      setIsDeleteConfirmOpen(false);
      setIsEditDialogOpen(false);
      
      // Show success toast
      toast.success('Tenant Deleted', {
        description: `${tenantToDelete.name} has been removed from the system`
      });
    }
  };
const getPropertyName = (tenant: any) => {
  const property = dbProperties.find(p => p.id === tenant.propertyId);
  return property?.name || '-';
};

const getUnitName = (tenant: any) => {
  const property = dbProperties.find(p => p.id === tenant.propertyId);
  const unit = property?.units.find(u => u.id === tenant.unitId);
  return unit?.number || '-';
};
  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">Tenants</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage tenant information and leases</p>
        </div>
        <GradientButton onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <UserPlus className="w-4 h-4" />
          <span className="sm:inline">Add Tenant</span>
        </GradientButton>
      </div>

      {/* Search Bar */}
      {tenants.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search tenants by name, email, property, or unit..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Add Tenant Dialog */}
      <AddTenantDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddTenant}
        properties={dbProperties || []}
      />

      {/* Edit Tenant Dialog */}
      <EditTenantDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        onEdit={handleEditTenant}
        onDelete={handleDeleteTenant}
        tenant={selectedTenant}
        properties={dbProperties}
      />

      {/* Delete Tenant Confirmation Dialog */}
      <Dialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Tenant
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4">
            <p className="text-muted-foreground mb-6">
              Deleting <span className="font-semibold text-foreground">{tenantToDelete?.name}</span> will:
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground mb-6 ml-4">
              <li>• Remove the tenant from <strong>{tenantToDelete?.property}</strong></li>
              <li>• Set unit <strong>{tenantToDelete?.unit}</strong> to Vacant</li>
              <li>• Delete all payment records</li>
              <li>• Remove from community</li>
              <li>• Delete all maintenance requests</li>
            </ul>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={confirmDeleteTenant} 
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                Delete Tenant
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Tenants Table */}
      {tenants.length === 0 || (searchQuery && filteredTenants.length === 0) ? (
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={UserPlus}
            title={searchQuery ? "No Matching Tenants" : "No Tenants Yet"}
            description={searchQuery ? "No tenants match your search criteria. Try a different search term." : "Add tenants to your properties to track leases, payments, and communications. You need to add properties first before adding tenants."}
            actionLabel={searchQuery ? undefined : "Add Your First Tenant"}
            onAction={searchQuery ? undefined : () => setIsAddDialogOpen(true)}
          />
        </Card>
      ) : (
        <>
          {/* Desktop Table View */}
          <Card className="overflow-hidden hidden md:block">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    
                    <TableHead>Monthly Rent</TableHead>
                    
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{tenant.name}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Mail className="w-3 h-3" />
                            <span className="text-xs">{tenant.email}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="w-3 h-3" />
                            <span className="text-xs">{tenant.phone}</span>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{tenant.property}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Home className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium">{tenant.unit}</span>
                        </div>
                      </TableCell>
  
                      <TableCell>
                        <span className="font-medium text-primary">₹{getTenantTotal(tenant).toLocaleString()}</span>
                      </TableCell>
                      
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredTenants.map((tenant) => (
              <Card key={tenant.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{tenant.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs truncate">{tenant.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="w-3 h-3 flex-shrink-0" />
                      <span className="text-xs">{tenant.phone}</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 flex-shrink-0"
                    onClick={() => {
                      setSelectedTenant(tenant);
                      setIsEditDialogOpen(true);
                    }}
                  >
                    <Edit className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Property</p>
                    <p className="text-sm font-medium">{tenant.property}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unit</p>
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{tenant.unit}</p>
                    </div>
                  </div>
                  <div>
                    
                    
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Monthly Rent</p>
                    <p className="text-sm font-semibold text-primary">₹{getTenantTotal(tenant).toLocaleString()}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}