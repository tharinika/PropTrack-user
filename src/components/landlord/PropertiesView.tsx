import React, { useState,useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { Building2, Plus, MapPin, Home, Users, Search } from 'lucide-react';
import { AddPropertyDialog } from './AddPropertyDialog';
import { PropertyDetailsView } from './PropertyDetailsView';
import { EmptyState } from './EmptyState';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';

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
  createdAt: string; // Add timestamp for tracking
}

export function PropertiesView() {
  const { user } = useAuth();
  const [dbProperties,setDbProperties]=useState<Property[]>([]);
  const { properties, addProperty, updateProperty, deleteProperty } = useProperties();
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fetchProperties = async () => {
  const { data, error } = await supabase
    .from('properties')
    .select('*,units(*)');

  if (error) {
    console.error(error);
    return;
  }

  const formatted = data.map(p => ({
  id: p.id,
  name: p.name,
  address: p.address,
  totalUnits: p.total_units || (p.units?.length || 0),

  propertyCharges: {   // 🔥 ADD THIS BLOCK
    maintenanceFee: p.maintenance_fee || 0,
    waterBill: p.water_bill || 0,
    gasBill: p.gas_bill || 0
  },

  units: (p.units || []).map(u => ({
    id: u.id,
    number: u.unit_number,
    status: u.status,
    rent: u.rent,
    monthlyElectricity: u.monthly_electricity || 0
  }))
}));
setDbProperties(formatted);
};
useEffect(()=>{
  fetchProperties();
},[]);

  const handleAddProperty = (newPropertyData: Omit<Property, 'id' | 'occupiedUnits'>) => {
    const property: Property = {
      id: crypto.randomUUID(),
      ...newPropertyData,
      occupiedUnits: newPropertyData.units.filter(u => u.status === 'occupied').length,
      createdAt: new Date().toISOString() // Add timestamp for tracking
    };
    addProperty(property);
  };

  const handleUpdateProperty = (updatedProperty: Property) => {
    updateProperty(updatedProperty);
    setSelectedProperty(updatedProperty);
  };

  const handleDeleteProperty = (propertyId: string) => {
    deleteProperty(propertyId);
    setSelectedProperty(null);
  };

  // Filter properties based on search query
  const filteredProperties = dbProperties.filter((property:Property) => 
  property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  property.address.toLowerCase().includes(searchQuery.toLowerCase())
);

  // If a property is selected, show the details view
  return selectedProperty ? (
    <PropertyDetailsView 
      property={selectedProperty} 
      onBack={() => setSelectedProperty(null)}
      onUpdate={handleUpdateProperty}
      onDelete={handleDeleteProperty}
      refreshProperties={fetchProperties}
    />
  ) : (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">Properties</h2>
          <p className="text-sm md:text-base text-muted-foreground">Manage your rental properties</p>
        </div>
        <GradientButton onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span className="sm:inline">Add Property</span>
        </GradientButton>
      </div>

      {/* Search Bar */}
      {properties.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search properties by name or address..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Add Property Dialog */}
      <AddPropertyDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onAdd={handleAddProperty}
      />

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={Building2}
            title="No Properties Added Yet"
            description="Start by adding your first property to begin managing your rental portfolio. Track occupancy, tenants, and rental income all in one place."
            actionLabel="Add Your First Property"
            onAction={() => setIsAddDialogOpen(true)}
          />
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProperties.map((property:Property) => {
            const totalUnits = property.units?.length || 0;

const occupiedUnits = property.units?.filter(u => u.status === 'occupied').length || 0;

const vacantUnits = totalUnits - occupiedUnits;

const occupancyRate = totalUnits > 0
  ? Math.round((occupiedUnits / totalUnits) * 100)
  : 0;

            return (
              <Card key={property.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                      <Building2 className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{property.name}</h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{property.address}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Home className="w-4 h-4" />
                      <span>Total Units</span>
                    </div>
                    <span className="font-semibold">{totalUnits}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span>Occupied</span>
                    </div>
                    <span className="font-semibold text-primary">{occupiedUnits}</span>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                    <span className="font-semibold">{occupancyRate}%</span>
                  </div>

                  {vacantUnits > 0 && (
                    <div className="pt-2">
                      <StatusBadge status="vacant" />
                      <span className="text-sm text-muted-foreground ml-2">{vacantUnits} vacant units</span>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border">
                  <Button variant="outline" className="w-full" onClick={() => setSelectedProperty(property)}>
                    View Details
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}