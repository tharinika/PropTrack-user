import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import emailjs from '@emailjs/browser';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { UserPlus, Building2, Home, AlertCircle, Check, Users } from 'lucide-react';
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

interface NewTenant {
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
}

interface AddTenantDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (tenant: NewTenant) => void;
  properties: Property[];
}

export function AddTenantDialog({ open, onOpenChange, onAdd, properties }: AddTenantDialogProps) {
  const { user } = useAuth();
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
  
  // Validation state
  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [hasEmailBlurred, setHasEmailBlurred] = useState(false);
  const [hasPhoneBlurred, setHasPhoneBlurred] = useState(false);

  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const availableUnits = selectedProperty?.units.filter(u => u.status === 'vacant') || [];
  const selectedUnit = selectedProperty?.units.find(u => u.id === selectedUnitId);

  // Validation functions
  const validateEmail = (email: string): boolean => {
    const gmailRegex = /^[a-zA-Z0-9._-]+@gmail\.com$/;
    return gmailRegex.test(email);
  };

  const validatePhone = (phone: string): boolean => {
    const phoneRegex = /^\+\d+\s?\d+$/;
    return phoneRegex.test(phone.trim());
  };

  // Handle email blur validation
  const handleEmailBlur = () => {
    setHasEmailBlurred(true);
    if (tenantData.email && !validateEmail(tenantData.email)) {
      setEmailError('Email must be a valid Gmail address (example: name@gmail.com)');
    } else {
      setEmailError('');
    }
  };

  // Handle phone blur validation
  const handlePhoneBlur = () => {
    setHasPhoneBlurred(true);
    if (tenantData.phone && !validatePhone(tenantData.phone)) {
      setPhoneError('Phone number must include a valid country code and digits (example: +91 98765xxxxx)');
    } else {
      setPhoneError('');
    }
  };

  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setTenantData({ ...tenantData, email: newEmail });
    
    // Clear error when user starts typing after blur
    if (hasEmailBlurred) {
      if (newEmail && !validateEmail(newEmail)) {
        setEmailError('Email must be a valid Gmail address (example: name@gmail.com)');
      } else {
        setEmailError('');
      }
    }
  };

  // Handle phone change
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPhone = e.target.value;
    setTenantData({ ...tenantData, phone: newPhone });
    
    // Clear error when user starts typing after blur
    if (hasPhoneBlurred) {
      if (newPhone && !validatePhone(newPhone)) {
        setPhoneError('Phone number must include a valid country code and digits (example: +91 98765xxxxx)');
      } else {
        setPhoneError('');
      }
    }
  };

  // Auto-fill rent when unit is selected
  useEffect(() => {
    if (selectedUnit && selectedProperty) {
      // Calculate total monthly payable: Base Rent + All Charges
      const totalMonthlyPayable = 
        selectedUnit.rent + 
        selectedUnit.monthlyElectricity + 
        selectedProperty.propertyCharges.maintenanceFee + 
        selectedProperty.propertyCharges.waterBill + 
        selectedProperty.propertyCharges.gasBill;
      
      setTenantData(prev => ({ ...prev, monthlyRent: totalMonthlyPayable }));
    }
  }, [selectedUnit, selectedProperty]);

  // Reset unit selection when property changes
  useEffect(() => {
    setSelectedUnitId('');
  }, [selectedPropertyId]);
  console.log("current_user:",user);



  const handleSubmit = async () => {
  let hasErrors = false;

  if (!validateEmail(tenantData.email)) {
    setEmailError('Invalid email');
    hasErrors = true;
  }

  if (!validatePhone(tenantData.phone)) {
    setPhoneError('Invalid phone');
    hasErrors = true;
  }

  if (hasErrors || !selectedProperty || !selectedUnit) return;

  const tempPassword = "%" + Math.floor(100000 + Math.random() * 900000);

  try {
    // 🔥 STEP 1: CREATE AUTH USER (ORIGINAL WORKING)
    const { data, error } = await supabase.auth.signUp({
      email: tenantData.email,
      password: tempPassword,
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    if (!data.user) {
      toast.error("User creation failed");
      return;
    }
const tenantId=data.user.id;
    // 🔥 STEP 2: SAVE IN USERS TABLE
    const { error: insertError } = await supabase.from('users').insert([
      {
        id: data.user.id,
        name: tenantData.name,
        email: tenantData.email,
        role: 'tenant',
        landlord_id: user?.id,
        property_id: selectedPropertyId,   // ✅ ADD THIS
    unit_id: selectedUnitId,
        // ⚠️ temporarily REMOVE property_id & unit_id
        lease_start: tenantData.leaseStart,
    lease_end: tenantData.leaseEnd,
    monthly_rent: tenantData.monthlyRent
      }
    ]);

    if (insertError) {
      console.error(insertError);
      toast.error(insertError.message);
      return;
    }

    // ✅ ADD THIS HERE
await supabase
  .from('units')
  .update({
    status: 'occupied'
  })
  .eq('id', selectedUnitId);
  if (!selectedProperty || !selectedUnit) {
  toast.error("Property or Unit missing");
  return;
}


// AFTER THIS PART



// 🔥 ADD THIS HERE


const today = new Date();

const dueDate = new Date(
  today.getFullYear(),
  today.getMonth(),
  1
).toISOString().split('T')[0];

const { data: existingPayment } = await supabase
  .from('payments')
  .select('id')
  .eq('tenant_id', tenantId)
  .eq('due_date', dueDate)
  .maybeSingle();

if (existingPayment) {
  await supabase
    .from('payments')
    .update({
      amount: tenantData.monthlyRent,
      status: 'pending',
      property: selectedProperty.name,
      unit: selectedUnit.number
    })
    .eq('id', existingPayment.id);

} else {
  await supabase
    .from('payments')
    .insert({
      tenant_id: tenantId,
      tenant_name: tenantData.name,
      tenant_email: tenantData.email,
      property: selectedProperty.name,
      unit: selectedUnit.number,
      unit_id: selectedUnitId,
      amount: tenantData.monthlyRent,
      status: 'pending',
      due_date: dueDate
    });
}

    // 🔥 STEP 3: SEND EMAIL (THIS WILL WORK AGAIN)
    await emailjs.send(
      "service_qffzzpc",
      "template_rnmkppb",
      {
        to_email: tenantData.email,
        tenant_email: tenantData.email,
        passcode: tempPassword
      },
      "o3RmpQaAvNyMa1Lu0"
    );

    toast.success("Tenant created & email sent!");

    // 🔥 STEP 4: NORMAL FLOW
    const tenant: NewTenant = {
      ...tenantData,
      id:tenantId,
      propertyId: selectedPropertyId,
      property: selectedProperty.name,
      unitId: selectedUnitId,
      unit: selectedUnit.number
    };

    onAdd(tenant);
    window.dispatchEvent(new Event('tenant-updated'));
    onOpenChange(false);

  } catch (err) {
    console.error(err);
    toast.error("Something went wrong");
  }
};

  const isFormValid = 
    tenantData.name &&
    tenantData.email &&
    validateEmail(tenantData.email) &&
    tenantData.phone &&
    validatePhone(tenantData.phone) &&
    selectedPropertyId &&
    selectedUnitId &&
    tenantData.leaseStart &&
    tenantData.leaseEnd &&
    tenantData.monthlyRent > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">Add New Tenant</DialogTitle>
          <DialogDescription className="text-sm">
            Select a property and available unit, then enter tenant details to create a new lease
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 md:space-y-6 pt-4">
          {/* Property & Unit Selection Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Building2 className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm">Property & Unit Selection</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Property Selection */}
              <div>
                <Label htmlFor="property-select">Select Property</Label>
                <select
                  id="property-select"
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
                <Label htmlFor="unit-select">Select Unit</Label>
                <select
                  id="unit-select"
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
                    </option>
                  ))}
                </select>
                {selectedPropertyId && availableUnits.length === 0 && (
                  <p className="text-xs text-amber-600 mt-1.5 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    No vacant units available in this property
                  </p>
                )}
                {selectedPropertyId && availableUnits.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {availableUnits.length} vacant {availableUnits.length === 1 ? 'unit' : 'units'} available
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
                <Label htmlFor="tenant-name">Full Name</Label>
                <Input
                  id="tenant-name"
                  placeholder="e.g., John Doe"
                  value={tenantData.name}
                  onChange={(e) => setTenantData({ ...tenantData, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="tenant-email">Email Address</Label>
                <Input
                  id="tenant-email"
                  type="email"
                  placeholder="john.doe@email.com"
                  value={tenantData.email}
                  onChange={handleEmailChange}
                  onBlur={handleEmailBlur}
                  className="mt-1.5"
                />
                {emailError && <p className="text-xs text-red-500 mt-1.5">{emailError}</p>}
              </div>

              <div>
                <Label htmlFor="tenant-phone">Phone Number</Label>
                <Input
                  id="tenant-phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={tenantData.phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  className="mt-1.5"
                />
                {phoneError && <p className="text-xs text-red-500 mt-1.5">{phoneError}</p>}
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
                <Label htmlFor="lease-start">Lease Start Date</Label>
                <Input
                  id="lease-start"
                  type="date"
                  value={tenantData.leaseStart}
                  onChange={(e) => setTenantData({ ...tenantData, leaseStart: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label htmlFor="lease-end">Lease End Date</Label>
                <Input
                  id="lease-end"
                  type="date"
                  value={tenantData.leaseEnd}
                  onChange={(e) => setTenantData({ ...tenantData, leaseEnd: e.target.value })}
                  className="mt-1.5"
                />
              </div>

              <div className="md:col-span-2">
                <Label htmlFor="monthly-rent">Monthly Rent (₹)</Label>
                <Input
                  id="monthly-rent"
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
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              An email invitation with login credentials will be sent to the tenant's email address.
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
              <UserPlus className="w-4 h-4 mr-2" />
              Add Tenant & Send Invite
            </GradientButton>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}