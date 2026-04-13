import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { mockTenants, mockMaintenanceRequests } from '../data/mockData';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner@2.0.3';
import { Check } from 'lucide-react';
import { useAuth } from './AuthContext';

// ============================================================================
// Type Definitions
// ============================================================================

export interface Unit {
  id: string;
  number: string;
  status: 'occupied' | 'vacant' | 'maintenance';
  tenant?: string;
  rent: number;
  monthlyElectricity: number;
  maintenanceType?: string; // Type of maintenance (e.g., Plumbing, Electrical, Painting)
}

export interface PropertyCharges {
  maintenanceFee: number;
  waterBill: number;
  gasBill: number;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  totalUnits: number;
  occupiedUnits: number;
  propertyCharges: PropertyCharges;
  units: Unit[];
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  phone: string;
  unit: string;
  property: string;
  propertyId:string;
  unitId:string;
  leaseStart: string;
  leaseEnd: string;
  monthlyRent: number;
  paymentStatus: 'paid' | 'pending' | 'overdue';
  lastPayment: string;
}

export interface Payment {
  id: string;
  tenantId: string;
  tenantName: string;
  property: string;
  unit: string;
  amount: number;
  dueDate: string;
  paidDate?: string;
  status: 'paid' | 'pending' | 'overdue';
  method?: string;
  statusChangedAt?: string; // ISO date string tracking when status last changed (especially for overdue)
}

export interface MaintenanceRequest {
  id: string;
  tenantId: string;
  tenantName: string;
  landlordId: string; // Link to landlord for proper filtering
  propertyId: string; // Property ID for filtering
  property: string;
  unit: string;
  title: string; // Request title
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'in-progress' | 'completed';
  description: string;
  dateSubmitted: string;
  dateCompleted?: string;
  updatedAt?: string; // Track when status was last updated
  images?: string[];
}

// ============================================================================
// Calendar Events (Personal Events for Tenants)
// ============================================================================

export interface CalendarEvent {
  id: string;
  tenantId: string; // Owner of the event
  title: string;
  description?: string;
  date: string; // YYYY-MM-DD format
  type: 'personal';
  createdAt: string;
}

// ============================================================================
// Context Interface
// ============================================================================

interface AppDataContextType {
  // State
  tenants: Tenant[];
  payments: Payment[];
  maintenanceRequests: MaintenanceRequest[];
  calendarEvents: CalendarEvent[];
  
  // Tenant Actions
  addTenant:(tenantData:any)=>void;
  updateTenant: (id: string, updates: Partial<Tenant>) => void;
  deleteTenant: (id: string) => void;
  
  // Payment Actions
  addPayment: (payment: Omit<Payment, 'id'>) => void;
  updatePaymentStatus: (id: string, status: 'paid' | 'pending' | 'overdue', paidDate?: string, method?: string) => void;
  
  // Maintenance Actions
  addMaintenanceRequest: (request: Omit<MaintenanceRequest, 'id' | 'dateSubmitted' | 'updatedAt'>) => void;
  updateMaintenanceStatus: (id: string, status: 'pending' | 'in-progress' | 'completed') => void;
  
  // Calendar Event Actions
  addCalendarEvent: (event: Omit<CalendarEvent, 'id' | 'createdAt'>) => void;
  updateCalendarEvent: (id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'tenantId' | 'createdAt'>>) => void;
  deleteCalendarEvent: (id: string) => void;
  
  // Analytics (derived state)
  getDashboardMetrics: () => DashboardMetrics;
}

interface DashboardMetrics {
  totalRentCollected: number;
  pendingRent: number;
  overdueRent: number;
  totalPayments: number;
  paidPayments: number;
  pendingPayments: number;
  overduePayments: number;
  paymentStatusDistribution: {
    paid: number;
    pending: number;
    overdue: number;
  };
  maintenanceStats: {
    total: number;
    pending: number;
    inProgress: number;
    completed: number;
  };
}

// ============================================================================
// Context Creation
// ============================================================================

const AppDataContext = createContext<AppDataContextType | undefined>(undefined);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  // Initialize with demo data ONLY for demo users, empty arrays for new landlords
  const [tenants, setTenants] = useState<Tenant[]>(user?.isDemo ? mockTenants : []);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [properties,setProperties]=useState<Property[]>([]);
  // Transform mock maintenance requests to match AppDataContext structure (only for demo users)
  const initialMaintenanceRequests: MaintenanceRequest[] = user?.isDemo 
    ? mockMaintenanceRequests.map((req, index) => ({
        id: req.id,
        tenantId: `tenant-${index + 1}`, // Generate a tenant ID
        tenantName: req.tenant,
        landlordId: 'landlord-1', // Placeholder landlord ID
        propertyId: 'property-1', // Placeholder property ID
        property: req.property,
        unit: req.unit,
        title: req.title, // Add title
        category: req.category,
        priority: req.priority,
        status: req.status === 'new' ? 'pending' : req.status,
        description: req.description,
        dateSubmitted: req.createdAt,
        dateCompleted: req.completedAt,
        images: req.image ? [req.image] : []
      }))
    : [];

  
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>(initialMaintenanceRequests);
  const [lastCheckedDate, setLastCheckedDate] = useState<string>('');

  // Initialize calendar events
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);

  // ============================================================================
  // Real-Time Cross-Context Synchronization
  // ============================================================================
  useEffect(() => {
  if (!user?.id) return;

  const fetchProperties = async () => {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        units (
          id,
          unit_number,
          rent,
          monthly_electricity,
          status,
          total_monthly
        )
      `)
      .eq('landlord_id', user.id);

    if (error) {
      console.error(error);
      return;
    }

    const formatted = data.map(p => ({
      id: p.id,
      name: p.name,
      address: p.address,
      totalUnits: p.total_units,
      occupiedUnits: 0,
      propertyCharges: {
        maintenanceFee: p.maintenance_fee || 0,
        waterBill: p.water_bill || 0,
        gasBill: p.gas_bill || 0
      },
      units: p.units.map(u => ({
        id: u.id,
        number: u.unit_number,
        rent: u.rent,
        monthlyElectricity: u.monthly_electricity,
        status: u.status,

        totalMonthly: u.total_monthly || 0   // 🔥 THIS IS THE FIX
      }))
    }));

    setProperties(formatted);
  };

  fetchProperties();
}, [user]);
useEffect(() => {
  if (!user?.id) return;

  const fetchTenants = async () => {
    console.log("Fetching tenants for:", user.id);

    const { data, error } = await supabase
      .from('users')
      .select('*,properties:property_id(name),units:unit_id(unit_number,rent)')
      .eq('landlord_id', user.id)
      .eq('role', 'tenant');

    if (error) {
      console.error("Tenant fetch error:", error);
      return;
    }

    const formatted = data.map(t => ({
  id: t.id,
  name: t.name,
  email: t.email,
  phone: t.phone || '',

  propertyId: t.property_id,
  unitId: t.unit_id,

  property: t.properties?.name || 'No Property',
  
  unit: t.units?.unit_number || 'No Unit',

  leaseStart: t.lease_start || '',
  leaseEnd: t.lease_end || '',
  monthlyRent: Number(t.units?.rent) || 0,

  paymentStatus: 'pending',
  lastPayment: ''
}));

    setTenants(formatted);
  };

  fetchTenants();   // ✅ ONLY ONE closing

}, [user,properties]);         // ✅ ONLY ONE closing
useEffect(() => {
  if (!user?.id) return;

  const fetchMaintenance = async () => {
    const { data, error } = await supabase
      .from("maintenance_requests")
      .select("*")
      .eq("landlord_id", user.id);

    if (error) {
      console.error("Maintenance fetch error:", error);
      return;
    }

    console.log("MAINTENANCE FROM DB:", data); // 🔥 debug

    const formatted = data.map(req => ({
      id: req.id,
      tenantId: req.tenant_id,
      tenantName: req.tenant_name,
      landlordId: req.landlord_id,
      propertyId: req.property_id,
     property: properties.find(p => p.id === req.property_id)?.name || "Unknown",
unit: properties
  .find(p => p.id === req.property_id)
  ?.units.find(u => u.id === req.unit_id)?.number || "No Unit",        // 🔥 IMPORTANT FIX
      title: req.title,
      category: req.category,
      priority: req.priority,
      status: req.status,
      description: req.description,
      dateSubmitted: req.created_at,
      dateCompleted: req.completed_at || null
    }));

    setMaintenanceRequests(formatted);
  };

  fetchMaintenance();
}, [user,properties]);
useEffect(() => {
  const reload = () => {
    console.log("Reload maintenance...");
    // call fetch again
    window.location.reload();
  };

  window.addEventListener("maintenance-updated", reload);

  return () => {
    window.removeEventListener("maintenance-updated", reload);
  };
}, []);
  // Listen for property changes and sync related data
  useEffect(() => {
    const handlePropertyUpdated = (event: CustomEvent) => {
      const { property } = event.detail;
      const oldPropertyName = payments.find(p => p.property !== property.name)?.property;
      
      // Update all payments with the new property name if it changed
      setPayments(prev => prev.map(payment => 
        payment.property === oldPropertyName || payment.property === property.name
          ? { ...payment, property: property.name }
          : payment
      ));
      
      // Update all tenants with the new property name
      setTenants(prev => prev.map(tenant =>
        tenant.property === oldPropertyName || tenant.property === property.name
          ? { ...tenant, property: property.name }
          : tenant
      ));
      
      // Update all maintenance requests with the new property name
      setMaintenanceRequests(prev => prev.map(request =>
        request.property === oldPropertyName || request.property === property.name
          ? { ...request, property: property.name }
          : request
      ));
    };

    const handlePropertyDeleted = (event: CustomEvent) => {
      const { propertyId, propertyName } = event.detail;
      
      // Remove all tenants from deleted property
      const deletedTenantIds = tenants
        .filter(t => t.property === propertyName)
        .map(t => t.id);
      
      setTenants(prev => prev.filter(t => t.property !== propertyName));
      
      // Remove all payments for deleted property/tenants
      setPayments(prev => prev.filter(p => 
        p.property !== propertyName && !deletedTenantIds.includes(p.tenantId)
      ));
      
      // Remove all maintenance requests for deleted property
      setMaintenanceRequests(prev => prev.filter(r => 
        r.property !== propertyName && !deletedTenantIds.includes(r.tenantId)
      ));
      
      // Show notification if data was cleaned up
      if (deletedTenantIds.length > 0) {
        toast.info('Data Synchronized', {
          description: `Removed ${deletedTenantIds.length} tenant(s) and associated data from deleted property`
        });
      }
    };

    window.addEventListener('property-updated', handlePropertyUpdated as EventListener);
    window.addEventListener('property-deleted', handlePropertyDeleted as EventListener);

    return () => {
      window.removeEventListener('property-updated', handlePropertyUpdated as EventListener);
      window.removeEventListener('property-deleted', handlePropertyDeleted as EventListener);
    };
  }, [tenants, payments, maintenanceRequests]);

  // Initialize payments from tenants on mount
  useEffect(() => {
    const today = new Date();
const dueDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
).toISOString().split('T')[0];
    const initialPayments: Payment[] = tenants.map((tenant, index) => ({
      
      id: `payment-${tenant.id}`,
      tenantId: tenant.id,
      tenantName: tenant.name,
      property: tenant.property,
      unit: tenant.unit,
      amount: tenant.monthlyRent,
      dueDate: dueDate,
      paidDate: tenant.paymentStatus === 'paid' ? tenant.lastPayment : undefined,
      status: tenant.paymentStatus,
      method: tenant.paymentStatus === 'paid' ? 'Bank Transfer' : undefined
    }));
    setPayments(initialPayments);
  }, [tenants]);

  // Automatic payment status checker - runs on mount and checks periodically
  useEffect(() => {
    const checkAndUpdatePaymentStatuses = () => {
      const today = new Date();
      const currentDateString = today.toISOString().split('T')[0];
      const currentDay = today.getDate();
      const currentMonth = today.getMonth();
      const currentYear = today.getFullYear();

      // Check if it's the 1st of the month and we haven't reset today
      const isFirstOfMonth = currentDay === 1;
      const hasResetToday = lastCheckedDate === currentDateString;

      let hasChanges = false;
      const updatedPayments = payments.map(payment => {
        // Skip already paid payments
        if (payment.status === 'paid') {
          return payment;
        }

        const dueDate = new Date(payment.dueDate);
        const isPastDue = today > dueDate;

        // On the 1st of the month, reset non-overdue pending payments
        if (isFirstOfMonth && !hasResetToday) {
          // Generate new due date for current month
          const newDueDate = new Date(currentYear, currentMonth, 1);
          
          // If payment is pending (not overdue), reset it for the new month
          if (payment.status === 'pending' && !isPastDue) {
            hasChanges = true;
            return {
              ...payment,
              dueDate: newDueDate.toISOString().split('T')[0],
              status: 'pending' as const
            };
          }
          
          // If payment is overdue, keep it as overdue
          if (payment.status === 'overdue' || isPastDue) {
            if (payment.status !== 'overdue') {
              hasChanges = true;
            }
            return {
              ...payment,
              status: 'overdue' as const
            };
          }
        }

        // Regular check: mark as overdue if past due date
        // BUT: Only auto-mark as overdue if it's not already manually set to pending
        // This allows landlords to manually keep payments as "pending" even if past due
        // The system will only auto-update to overdue on monthly reset (1st of month)
        if (isPastDue && payment.status !== 'overdue' && payment.status !== 'pending') {
          hasChanges = true;
          return {
            ...payment,
            status: 'overdue' as const
          };
        }

        return payment;
      });

      if (hasChanges) {
        setPayments(updatedPayments);

        // Sync tenant statuses with payment updates
        setTenants(prevTenants => 
          prevTenants.map(tenant => {
            const tenantPayment = updatedPayments.find(p => p.tenantId === tenant.id);
            if (tenantPayment && tenantPayment.status !== tenant.paymentStatus) {
              return {
                ...tenant,
                paymentStatus: tenantPayment.status
              };
            }
            return tenant;
          })
        );
      }

      // Update last checked date if it's the 1st of the month
      if (isFirstOfMonth && !hasResetToday) {
        setLastCheckedDate(currentDateString);
        
        // Show notification about monthly reset
        toast.info('Monthly Payment Reset', {
          description: 'Payment statuses have been updated for the new month'
        });
      }
    };

    // Run immediately on mount
    checkAndUpdatePaymentStatuses();

    // Run every hour to check for status updates
    const intervalId = setInterval(checkAndUpdatePaymentStatuses, 60 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [lastCheckedDate, payments]);

  // ============================================================================
  // Tenant Actions
  // ============================================================================

  const addTenant = (tenantData: any) => {
  const newTenant: Tenant = {
    ...tenantData,
    propertyId: tenantData.propertyId,
  unitId: tenantData.unitId,
    id: tenantData.id || `tenant-${Date.now()}`,
    paymentStatus: 'pending',
    lastPayment: ''
  };

  setTenants(prev => [...prev, newTenant]);

  const today = new Date();
  const dueDate = new Date(
    today.getFullYear(),
    today.getMonth(),
    1
  ).toISOString().split('T')[0];

  const newPayment: Payment = {
    id: `payment-${newTenant.id}`,
    tenantId: newTenant.id,
    tenantName: newTenant.name,
    property: newTenant.property,
    unit: newTenant.unit,
    amount: newTenant.monthlyRent,
    dueDate: dueDate,
    status: 'pending'
  };

  setPayments(prev => [...prev, newPayment]);

  toast.success('Tenant Added', {
    description: `${newTenant.name} added successfully`
  });

  window.dispatchEvent(
    new CustomEvent('tenant-added', {
      detail: { tenant: newTenant }
    })
  );
};
  const updateTenant = (id: string, updates: Partial<Tenant>) => {
    const oldTenant = tenants.find(t => t.id === id);
    
    setTenants(prev => prev.map(tenant => 
      tenant.id === id ? { ...tenant, ...updates } : tenant
    ));
    
    // Sync payment records when tenant is updated
    if (updates.property || updates.unit || updates.name || updates.monthlyRent) {
      setPayments(prev => prev.map(payment => {
        if (payment.tenantId === id) {
          return {
            ...payment,
            tenantName: updates.name || payment.tenantName,
            property: updates.property || payment.property,
            unit: updates.unit || payment.unit,
            amount: updates.monthlyRent || payment.amount
          };
        }
        return payment;
      }));
    }
    
    // Sync maintenance requests when tenant is updated
    if (updates.property || updates.unit || updates.name) {
      setMaintenanceRequests(prev => prev.map(request => {
        if (request.tenantId === id) {
          return {
            ...request,
            tenantName: updates.name || request.tenantName,
            property: updates.property || request.property,
            unit: updates.unit || request.unit
          };
        }
        return request;
      }));
    }
    
    // Show success notification
    const updatedTenant = { ...oldTenant, ...updates };
    toast.success('Tenant Updated', {
      description: `${updatedTenant.name}'s information has been successfully updated`
    });
    
    // Dispatch event for real-time sync with community
    window.dispatchEvent(new CustomEvent('tenant-updated', { 
      detail: { 
        oldTenant, 
        newTenant: updatedTenant 
      } 
    }));
  };

  const deleteTenant = (id: string) => {
    const deletedTenant = tenants.find(t => t.id === id);
    
    setTenants(prev => prev.filter(t => t.id !== id));
    
    // Remove associated payments
    setPayments(prev => prev.filter(p => p.tenantId !== id));
    
    // Remove associated maintenance requests
    setMaintenanceRequests(prev => prev.filter(r => r.tenantId !== id));
    
    // Dispatch event for real-time sync with community
    if (deletedTenant) {
      window.dispatchEvent(new CustomEvent('tenant-deleted', { 
        detail: { tenant: deletedTenant } 
      }));
    }
  };

  // ============================================================================
  // Payment Actions
  // ============================================================================

  const addPayment = (paymentData: Omit<Payment, 'id'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: `payment-${Date.now()}`
    };
    
    setPayments(prev => [...prev, newPayment]);
  };

  const updatePaymentStatus = (
    id: string, 
    status: 'paid' | 'pending' | 'overdue',
    paidDate?: string,
    method?: string
  ) => {
    const payment = payments.find(p => p.id === id);
    if (!payment) return;
    
    // Update payment
    setPayments(prev => prev.map(p => 
      p.id === id ? { 
        ...p, 
        status, 
        paidDate: status === 'paid' ? (paidDate || new Date().toISOString()) : undefined,
        method: status === 'paid' ? (method || p.method) : undefined,
        statusChangedAt: status === 'overdue' ? new Date().toISOString() : undefined
      } : p
    ));
    
    // Sync tenant payment status
    setTenants(prev => prev.map(tenant => {
      if (tenant.id === payment.tenantId) {
        return {
          ...tenant,
          paymentStatus: status,
          lastPayment: status === 'paid' ? (paidDate || new Date().toISOString()) : tenant.lastPayment
        };
      }
      return tenant;
    }));
    
    // Show toast notification based on status
    if (status === 'paid') {
      toast.success('Payment Recorded', {
        description: `${payment.tenantName}'s payment of ₹${payment.amount.toLocaleString()} has been marked as paid`
      });
    } else if (status === 'pending') {
      toast.warning('Payment Pending', {
        description: `${payment.tenantName}'s payment has been marked as pending`
      });
    } else if (status === 'overdue') {
      toast.error('Payment Overdue', {
        description: `${payment.tenantName}'s payment has been marked as overdue`
      });
    }
  };

  // ============================================================================
  // Maintenance Actions
  // ============================================================================

  const addMaintenanceRequest = async (requestData) => {
  console.log("sending request:", requestData);

  const { error } = await supabase.from("maintenance_requests").insert([
    {
      tenant_id: requestData.tenantId,
      tenant_name: requestData.tenantName,
      landlord_id: requestData.landlordId,
      property_id: requestData.propertyId,

      // ✅ ADD THESE TWO
      property_name: requestData.property,
      unit_number: requestData.unit,

      // optional but fine
      unit_id: requestData.unitId,

      title: requestData.title,

      // ✅ SAFETY FIX
      category: requestData.category?.trim() || "General",

      priority: requestData.priority,
      status: "pending",
      description: requestData.description
    }
  ]);

  if (error) {
    console.error(error);
    return;
  }

  window.dispatchEvent(new Event("maintenance-updated"));
};

  const updateMaintenanceStatus = (
    id: string, 
    status: 'pending' | 'in-progress' | 'completed'
  ) => {
    const request = maintenanceRequests.find(r => r.id === id);
    if (!request) return;
    
    setMaintenanceRequests(prev => prev.map(r => 
      r.id === id ? { 
        ...r, 
        status,
        dateCompleted: status === 'completed' ? new Date().toISOString() : r.dateCompleted,
        updatedAt: new Date().toISOString() // Track when status was last updated
      } : r
    ));
    
    // Show toast notification
    const statusText = status === 'in-progress' ? 'In Progress' : status === 'completed' ? 'Completed' : 'Pending';
    toast.success('Status Updated', {
      description: `Maintenance request for ${request.category} is now ${statusText}.`,
      icon: <Check className="w-4 h-4" />
    });
  };

  // ============================================================================
  // Calendar Event Actions
  // ============================================================================

  const addCalendarEvent = (eventData: Omit<CalendarEvent, 'id' | 'createdAt'>) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `event-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    
    setCalendarEvents(prev => [...prev, newEvent]);
    
    toast.success('Event Added', {
      description: `${newEvent.title} has been added to your calendar.`
    });
  };

  const updateCalendarEvent = (
    id: string, 
    updates: Partial<Omit<CalendarEvent, 'id' | 'tenantId' | 'createdAt'>>
  ) => {
    const event = calendarEvents.find(e => e.id === id);
    if (!event) return;
    
    setCalendarEvents(prev => prev.map(e => 
      e.id === id ? { 
        ...e, 
        ...updates
      } : e
    ));
    
    // Show toast notification
    toast.success('Event Updated', {
      description: `Event "${event.title}" has been updated.`
    });
  };

  const deleteCalendarEvent = (id: string) => {
    const deletedEvent = calendarEvents.find(e => e.id === id);
    
    setCalendarEvents(prev => prev.filter(e => e.id !== id));
    
    // Dispatch event for real-time sync with community
    if (deletedEvent) {
      window.dispatchEvent(new CustomEvent('event-deleted', { 
        detail: { event: deletedEvent } 
      }));
    }
  };

  // ============================================================================
  // Analytics
  // ============================================================================

  const getDashboardMetrics = (): DashboardMetrics => {
    const paidPayments = payments.filter(p => p.status === 'paid');
    const pendingPayments = payments.filter(p => p.status === 'pending');
    const overduePayments = payments.filter(p => p.status === 'overdue');
    
    const totalRentCollected = paidPayments.reduce((sum, p) => sum + p.amount, 0);
    const pendingRent = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
    
    // Calculate overdue rent with months multiplier
    const overdueRent = overduePayments.reduce((sum, p) => {
      const dueDate = new Date(p.dueDate);
      const today = new Date();
      const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + 
                         (today.getMonth() - dueDate.getMonth());
      const monthsOverdue = Math.max(1, monthsDiff);
      
      // Multiply monthly rent by number of months overdue
      return sum + (p.amount * monthsOverdue);
    }, 0);
    
    const pendingMaintenance = maintenanceRequests.filter(r => r.status === 'pending');
    const inProgressMaintenance = maintenanceRequests.filter(r => r.status === 'in-progress');
    const completedMaintenance = maintenanceRequests.filter(r => r.status === 'completed');
    
    return {
      totalRentCollected,
      pendingRent,
      overdueRent,
      totalPayments: payments.length,
      paidPayments: paidPayments.length,
      pendingPayments: pendingPayments.length,
      overduePayments: overduePayments.length,
      paymentStatusDistribution: {
        paid: paidPayments.length,
        pending: pendingPayments.length,
        overdue: overduePayments.length
      },
      maintenanceStats: {
        total: maintenanceRequests.length,
        pending: pendingMaintenance.length,
        inProgress: inProgressMaintenance.length,
        completed: completedMaintenance.length
      }
    };
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AppDataContextType = {
    // State
    
    tenants,
    payments,
    maintenanceRequests,
    calendarEvents,
    
    
    // Actions
    addTenant,
    updateTenant,
    deleteTenant,
    addPayment,
    updatePaymentStatus,
    addMaintenanceRequest,
    updateMaintenanceStatus,
    addCalendarEvent,
    updateCalendarEvent,
    deleteCalendarEvent,
    getDashboardMetrics
  };

  return (
    <AppDataContext.Provider value={value}>
      {children}
    </AppDataContext.Provider>
  );
}

// ============================================================================
// Hook - Force reload fix
// ============================================================================

export function useAppData() {
  const context = useContext(AppDataContext);
  if (context === undefined) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  return context;
}