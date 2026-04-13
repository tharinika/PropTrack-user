import React, { useState } from 'react';
import{useAuth}from '../../contexts/AuthContext';
import{supabase}from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { GradientButton } from '../GradientButton';
import { Card } from '../ui/card';
import { ChevronLeft, ChevronRight, Home, DollarSign, Zap, Droplet, Flame, Plus, Trash2 } from 'lucide-react';

interface Unit {
  id: string;
  number: string;
  rent: number;
  status: 'vacant' | 'occupied' | 'maintenance';
  tenant?: string;
  monthlyElectricity: number;
}

interface PropertyCharges {
  maintenanceFee: number;
  waterBill: number;
  gasBill: number;
}

interface NewProperty {
  name: string;
  address: string;
  totalUnits: number;
  propertyCharges: PropertyCharges;
  units: Unit[];
}

interface AddPropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (property: NewProperty) => void;
}

export function AddPropertyDialog({ open, onOpenChange, onAdd }: AddPropertyDialogProps) {
  const [step, setStep] = useState(1);
  const {user}=useAuth();
  const [property, setProperty] = useState<NewProperty>({
    name: '',
    address: '',
    totalUnits: 0,
    propertyCharges: {
      maintenanceFee: 0,
      waterBill: 0,
      gasBill: 0
    },
    units: []
  });

  const handleNext = () => {
    if (step === 1 && property.totalUnits > 0) {
      // Generate default units
      const units: Unit[] = Array.from({ length: property.totalUnits }, (_, i) => ({
        id: crypto.randomUUID(),
        number: `Unit-${i + 1}`,
        rent: 0,
        status: 'vacant' as const,
        monthlyElectricity: 0
      }));
      setProperty({ ...property, units });
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    setStep(step - 1);
  };

  const handleFinish = async () => {
  try {
    console.log("🔥 Button clicked");

    // 1️⃣ Insert property
    const { data: propertyData, error: propertyError } = await supabase
      .from('properties')
      .insert([
        {
          name: property.name,
          address: property.address,
          total_units: property.totalUnits,
          landlord_id:user?.id
        }
      ])
      .select()
      .single();

    if (propertyError) {
      console.error("Property error:", propertyError);
      return;
    }

    console.log("✅ Property inserted:", propertyData);

    // 2️⃣ Insert units
    const unitsToInsert = property.units.map((unit) => {
  const totalMonthly =
    unit.rent +
    property.propertyCharges.maintenanceFee +
    property.propertyCharges.waterBill +
    property.propertyCharges.gasBill;

  return {
    property_id: propertyData.id,
    unit_number: unit.number,
    rent: unit.rent,
    status: 'vacant',
    monthly_electricity: unit.monthlyElectricity,
    total_monthly: totalMonthly   // ✅ ADD THIS
  };
});

    const { data: insertedUnits, error: unitsError } = await supabase
      .from('units')
      .insert(unitsToInsert)
      .select();

    if (unitsError) {
      console.error("Units error:", unitsError);
      return;
    }

    console.log("✅ Units inserted:", insertedUnits);

    // 3️⃣ Format for UI
    const formattedUnits = insertedUnits.map((u: any) => ({
      id: u.id,
      number: u.unit_number,
      rent: u.rent,
      status: u.status,
      monthlyElectricity: u.monthly_electricity
    }));

    // 4️⃣ Update UI
    onAdd({
      ...property,
      id: propertyData.id,
      units: formattedUnits
    });

    // 5️⃣ Reset
    setProperty({
      name: '',
      address: '',
      totalUnits: 0,
      propertyCharges: {
        maintenanceFee: 0,
        waterBill: 0,
        gasBill: 0
      },
      units: []
    });

    setStep(1);
    onOpenChange(false);

    console.log("🎉 Property added successfully");

  } catch (err) {
    console.error("Final error:", err);
  }
};

  const updateUnit = (index: number, field: string, value: any) => {
    const updatedUnits = [...property.units];
    updatedUnits[index] = { ...updatedUnits[index], [field]: value };
    setProperty({ ...property, units: updatedUnits });
  };

  const isStep1Valid = property.name && property.address && property.totalUnits > 0;
  const isStep2Valid = property.units.every(u => u.number && u.rent > 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Add New Property</span>
            <div className="flex items-center gap-2 text-sm text-muted-foreground font-normal">
              <span className={step === 1 ? 'text-primary font-medium' : ''}>1. Property Info</span>
              <ChevronRight className="w-4 h-4" />
              <span className={step === 2 ? 'text-primary font-medium' : ''}>2. Units</span>
              <ChevronRight className="w-4 h-4" />
              <span className={step === 3 ? 'text-primary font-medium' : ''}>3. Charges</span>
            </div>
          </DialogTitle>
          <DialogDescription>
            {step === 1 && "Enter basic property information to get started"}
            {step === 2 && "Configure individual units with custom names and rent amounts"}
            {step === 3 && "Set property-level charges that apply to all units"}
          </DialogDescription>
        </DialogHeader>

        <div className="pt-4">
          {/* Step 1: Property Information */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="property-name">Property Name</Label>
                <Input
                  id="property-name"
                  placeholder="e.g., Greenwood Apartments"
                  value={property.name}
                  onChange={(e) => setProperty({ ...property, name: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="property-address">Address</Label>
                <Input
                  id="property-address"
                  placeholder="e.g., 123 Oak Street, Downtown"
                  value={property.address}
                  onChange={(e) => setProperty({ ...property, address: e.target.value })}
                  className="mt-1.5"
                />
              </div>
              <div>
                <Label htmlFor="total-units">Number of Units</Label>
                <Input
                  id="total-units"
                  type="number"
                  placeholder="e.g., 24"
                  value={property.totalUnits || ''}
                  onChange={(e) => setProperty({ ...property, totalUnits: parseInt(e.target.value) || 0 })}
                  className="mt-1.5"
                />
                <p className="text-xs text-muted-foreground mt-1.5">
                  You'll configure individual units in the next step
                </p>
              </div>
            </div>
          )}

          {/* Step 2: Unit Configuration */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Configure each unit with a custom name/number and monthly rent. 
                  You can update these details anytime from the Property Details page.
                </p>
              </div>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {property.units.map((unit, index) => (
                  <Card key={unit.id} className="p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`unit-number-${index}`} className="text-xs">
                          Unit Name/Number
                        </Label>
                        <Input
                          id={`unit-number-${index}`}
                          placeholder="e.g., A-101, 1BHK-01"
                          value={unit.number}
                          onChange={(e) => updateUnit(index, 'number', e.target.value)}
                          className="mt-1.5"
                        />
                      </div>
                      <div>
                        <Label htmlFor={`unit-rent-${index}`} className="text-xs">
                          Monthly Rent (₹)
                        </Label>
                        <Input
                          id={`unit-rent-${index}`}
                          type="number"
                          placeholder="12000"
                          value={unit.rent || ''}
                          onChange={(e) => updateUnit(index, 'rent', parseFloat(e.target.value) || 0)}
                          className="mt-1.5"
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: Property Charges */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  Set property-level charges that apply to all units. These can be updated monthly as needed.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Home className="w-4 h-4 text-blue-600" />
                    </div>
                    <Label className="text-sm font-medium">Maintenance Fee</Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="150"
                    value={property.propertyCharges.maintenanceFee}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProperty({
                        ...property,
                        propertyCharges: {
                          ...property.propertyCharges,
                          maintenanceFee: value === '' ? 0 : Math.max(0, Number(value))
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Per unit/month</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0">
                      <Droplet className="w-4 h-4 text-cyan-600" />
                    </div>
                    <Label className="text-sm font-medium">Water Bill</Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="50"
                    value={property.propertyCharges.waterBill}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProperty({
                        ...property,
                        propertyCharges: {
                          ...property.propertyCharges,
                          waterBill: value === '' ? 0 : Math.max(0, Number(value))
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Per unit/month</p>
                </Card>

                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                      <Flame className="w-4 h-4 text-orange-600" />
                    </div>
                    <Label className="text-sm font-medium">Gas Bill</Label>
                  </div>
                  <Input
                    type="number"
                    min="0"
                    step="any"
                    placeholder="30"
                    value={property.propertyCharges.gasBill}
                    onChange={(e) => {
                      const value = e.target.value;
                      setProperty({
                        ...property,
                        propertyCharges: {
                          ...property.propertyCharges,
                          gasBill: value === '' ? 0 : Math.max(0, Number(value))
                        }
                      });
                    }}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">Per unit/month</p>
                </Card>
              </div>

              {/* Preview */}
              <Card className="p-4 bg-gradient-to-br from-primary/5 to-accent/5">
                <h4 className="font-semibold mb-3 text-sm">Sample Billing Preview (Unit A-101)</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Monthly Rent</span>
                    <span className="font-medium">₹{property.units[0]?.rent || 0}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">+ Electricity (unit-level)</span>
                    <span>₹0 (editable monthly)</span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <p className="text-xs text-muted-foreground mb-2">Property Charges:</p>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">+ Maintenance Fee</span>
                      <span>₹{property.propertyCharges.maintenanceFee}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">+ Water Bill</span>
                      <span>₹{property.propertyCharges.waterBill}</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-muted-foreground">+ Gas Bill</span>
                      <span>₹{property.propertyCharges.gasBill}</span>
                    </div>
                  </div>
                  <div className="border-t border-border pt-2 mt-2 flex justify-between font-semibold">
                    <span>Total Monthly Amount</span>
                    <span className="text-primary">
                      ₹{(property.units[0]?.rent || 0) + 
                        property.propertyCharges.maintenanceFee + 
                        property.propertyCharges.waterBill + 
                        property.propertyCharges.gasBill}
                    </span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 pt-6 border-t border-border mt-6">
            {step > 1 && (
              <Button variant="outline" onClick={handleBack} className="flex-1">
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            {step < 3 ? (
              <GradientButton 
                onClick={handleNext} 
                className="flex-1"
                disabled={step === 1 && !isStep1Valid}
              >
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </GradientButton>
            ) : (
              <GradientButton onClick={handleFinish} className="flex-1">
                <Plus className="w-4 h-4 mr-2" />
                Add Property
              </GradientButton>
            )}
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}