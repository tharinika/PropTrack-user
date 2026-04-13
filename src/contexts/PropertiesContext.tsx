import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockProperties } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { toast } from 'sonner@2.0.3';

interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  tenantId?: string; // Tenant user ID for linking to community
  rent: number;
  monthlyElectricity: number;
  createdAt?: string; // ISO date string for tracking when unit was added
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
  createdAt?: string; // ISO date string for tracking when property was added
}

interface PropertiesContextType {
  properties: Property[];
  addProperty: (property: Property) => void;
  updateProperty: (property: Property) => void;
  deleteProperty: (propertyId: string) => void;
}

const PropertiesContext = createContext<PropertiesContextType | undefined>(undefined);

export function PropertiesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);

  // ============================================================================
  // Real-Time Synchronization with Tenant Changes
  // ============================================================================
  useEffect(() => {
  if (!user?.id) return;

  const fetchProperties = async () => {
    console.log("Fetching properties for:", user.id);

    const { data, error } = await supabase
      .from('properties')
      .select('*,units(*)')
      .eq('landlord_id', user.id);

    if (error) {
      console.error("Error fetching properties:", error);
      return;
    }

    console.log("Properties from DB:", data);

    const formatted = (data || []).map(p => ({
  id: p.id,
  name: p.name,
  address: p.address,

  totalUnits: p.total_units || (p.units?.length || 0),

  units: (p.units || []).map(u => ({
    id: u.id,
    number: u.unit_number,
    status: u.status,
    rent: u.rent,
    monthlyElectricity: u.monthly_electricity || 0,
    totalMonthly:u.total_monthly
  })),

  occupiedUnits: (p.units || []).filter(u => u.status === 'occupied').length,

  createdAt: p.created_at
}));

setProperties(formatted);
  };

  fetchProperties();
}, [user]);
  useEffect(() => {
    const handleTenantAdded = (event: CustomEvent) => {
      const { tenant } = event.detail;
      
      // Update property occupancy when tenant is added
      setProperties(prev => prev.map(property => {
        if (property.name === tenant.property) {
          // Find if the unit exists and update its status
          const updatedUnits = property.units.map(unit => 
            unit.number === tenant.unit 
              ? { ...unit, status: 'occupied' as const, tenant: tenant.name, tenantId: tenant.id }
              : unit
          );
          
          const occupiedCount = updatedUnits.filter(u => u.status === 'occupied').length;
          
          return {
            ...property,
            units: updatedUnits,
            occupiedUnits: occupiedCount
          };
        }
        return property;
      }));
    };

    window.addEventListener('tenant-added', handleTenantAdded as EventListener);

    return () => {
      window.removeEventListener('tenant-added', handleTenantAdded as EventListener);
    };
  }, []);

  const addProperty = (property: Property) => {
    setProperties(prev => [...prev, property]);
    
    // Show success notification
    toast.success('Property Added', {
      description: `${property.name} has been successfully added to your properties`
    });
    
    // Dispatch event for other modules to sync
    window.dispatchEvent(new CustomEvent('property-added', { 
      detail: { property } 
    }));
  };

  const updateProperty = (updatedProperty: Property) => {
    setProperties(prev => prev.map(p => 
      p.id === updatedProperty.id ? updatedProperty : p
    ));
    
    // Show success notification
    toast.success('Property Updated', {
      description: `${updatedProperty.name} has been successfully updated`
    });
    
    // Dispatch event for other modules to sync
    window.dispatchEvent(new CustomEvent('property-updated', { 
      detail: { property: updatedProperty } 
    }));
  };

  const deleteProperty = (propertyId: string) => {
    const propertyToDelete = properties.find(p => p.id === propertyId);
    setProperties(prev => prev.filter(p => p.id !== propertyId));
    
    // Show success notification
    if (propertyToDelete) {
      toast.success('Property Deleted', {
        description: `${propertyToDelete.name} has been removed from your portfolio`
      });
    }
    
    // Dispatch event for other modules to sync
    window.dispatchEvent(new CustomEvent('property-deleted', { 
      detail: { 
        propertyId,
        propertyName: propertyToDelete?.name 
      } 
    }));
  };

  return (
    <PropertiesContext.Provider value={{ properties, addProperty, updateProperty, deleteProperty }}>
      {children}
    </PropertiesContext.Provider>
  );
}

export function useProperties() {
  const context = useContext(PropertiesContext);
  if (context === undefined) {
    throw new Error('useProperties must be used within a PropertiesProvider');
  }
  return context;
}