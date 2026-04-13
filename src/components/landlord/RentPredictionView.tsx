import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Brain, Sparkles, IndianRupee } from 'lucide-react';
import { mockProperties } from '../../data/mockData';
import { useProperties } from '../../contexts/PropertiesContext';

export function RentPredictionView() {
  const { properties } = useProperties();
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [formData, setFormData] = useState({
    propertyName: '',
    unitName: '',
    locationType: '',
    propertyType: '',
    floorNumber: '',
    builtUpArea: '',
    furnishingType: '',
    numberOfBHKs: '',
    numberOfBathrooms: '',
  });

  const [prediction, setPrediction] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Get selected property for unit suggestions
  const selectedProperty = properties.find(p => p.id === selectedPropertyId);
  const availableUnits = selectedProperty?.units || [];

  // Reset unit name when property changes
  useEffect(() => {
    setFormData(prev => ({ ...prev, unitName: '' }));
  }, [selectedPropertyId]);

  // Check if property type is residential (for BHK field)
  const isResidentialProperty = () => {
    return formData.propertyType === 'house' || formData.propertyType === 'apartment';
  };

  // Check if bathrooms should be shown (house, apartment, commercial)
  const shouldShowBathrooms = () => {
    return formData.propertyType === 'house' || formData.propertyType === 'apartment' || formData.propertyType === 'commercial';
  };

  // Handle property selection
  const handlePropertyChange = (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setFormData(prev => ({ ...prev, propertyName: property.name }));
    } else {
      setFormData(prev => ({ ...prev, propertyName: '' }));
    }
  };

  // Handle property type change with conditional reset
  const handlePropertyTypeChange = (newPropertyType: string) => {
    setFormData(prev => {
      const isNewResidential = newPropertyType === 'house' || newPropertyType === 'apartment';
      
      // If changing from residential to commercial, clear only BHK field
      if (!isNewResidential) {
        return {
          ...prev,
          propertyType: newPropertyType,
          numberOfBHKs: '',
          // Keep numberOfBathrooms - it's still used for commercial
        };
      }
      
      return {
        ...prev,
        propertyType: newPropertyType,
      };
    });
  };

  const handlePredict = () => {
    // Validate required fields
    if (!formData.propertyName || !formData.unitName || !formData.locationType || 
        !formData.propertyType || !formData.floorNumber || !formData.builtUpArea || !formData.furnishingType) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate residential-specific fields
    if (isResidentialProperty()) {
      if (!formData.numberOfBHKs || !formData.numberOfBathrooms) {
        alert('Please fill in Number of BHKs and Number of Bathrooms for residential properties');
        return;
      }
    }

    // Validate bathroom field for commercial
    if (formData.propertyType === 'commercial' && !formData.numberOfBathrooms) {
      alert('Please fill in Number of Bathrooms');
      return;
    }

    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      // Simple prediction algorithm based on inputs
      let baseRent = 10000;
      
      // Location factor
      if (formData.locationType === 'city-center') baseRent *= 1.8;
      else if (formData.locationType === 'urban') baseRent *= 1.3;
      else if (formData.locationType === 'rural') baseRent *= 0.7;

      // Property type factor
      if (formData.propertyType === 'commercial') baseRent *= 2.0;
      else if (formData.propertyType === 'apartment') baseRent *= 1.0;
      else if (formData.propertyType === 'house') baseRent *= 1.2;

      // Area factor (per sq ft)
      const area = parseInt(formData.builtUpArea) || 500;
      baseRent = (area / 500) * baseRent;

      // Floor factor
      const floor = parseInt(formData.floorNumber) || 1;
      if (floor >= 3) baseRent *= 1.1;

      // Furnishing factor
      if (formData.furnishingType === 'fully-furnished') baseRent *= 1.3;
      else if (formData.furnishingType === 'semi-furnished') baseRent *= 1.15;

      // BHK factor (residential only)
      if (isResidentialProperty() && formData.numberOfBHKs) {
        const bhkValue = formData.numberOfBHKs === '5+' ? 6 : parseInt(formData.numberOfBHKs);
        baseRent *= (1 + (bhkValue * 0.15)); // +15% per BHK
      }

      // Bathroom factor (for residential and commercial)
      if (shouldShowBathrooms() && formData.numberOfBathrooms) {
        const bathrooms = parseInt(formData.numberOfBathrooms);
        baseRent *= (1 + (bathrooms * 0.05)); // +5% per bathroom
      }

      // Add some randomness (+/- 10%)
      const randomFactor = 0.9 + Math.random() * 0.2;
      const finalRent = Math.round(baseRent * randomFactor);

      setPrediction(finalRent);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h2 className="text-xl md:text-2xl font-semibold mb-1 flex items-center gap-2">
          <Brain className="w-6 h-6 md:w-7 md:h-7 text-primary" />
          AI Rent Prediction
        </h2>
        <p className="text-sm md:text-base text-muted-foreground">
          Get AI-powered rental price estimates based on property characteristics and market data
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Input Form */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="font-semibold text-lg mb-6">Property Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Property Name */}
            <div className="space-y-2">
              <Label htmlFor="propertyName">
                Property Name <span className="text-destructive">*</span>
              </Label>
              <select
                id="propertyName"
                value={selectedPropertyId}
                onChange={(e) => handlePropertyChange(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select Property</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Unit Name */}
            <div className="space-y-2">
              <Label htmlFor="unitName">
                Unit Name / Number <span className="text-destructive">*</span>
              </Label>
              <select
                id="unitName"
                value={formData.unitName}
                onChange={(e) => setFormData({ ...formData, unitName: e.target.value })}
                disabled={!selectedPropertyId}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {selectedPropertyId ? 'Select Unit' : 'Select a property first'}
                </option>
                {availableUnits.map((unit) => (
                  <option key={unit.id} value={unit.number}>
                    {unit.number}
                  </option>
                ))}
              </select>
              {selectedPropertyId && availableUnits.length === 0 && (
                <p className="text-xs text-amber-600 mt-1.5">
                  No units available in this property
                </p>
              )}
              {selectedPropertyId && availableUnits.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  {availableUnits.length} {availableUnits.length === 1 ? 'unit' : 'units'} available
                </p>
              )}
            </div>

            {/* Location Type */}
            <div className="space-y-2">
              <Label htmlFor="locationType">
                Property Location Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="locationType"
                value={formData.locationType}
                onChange={(e) => setFormData({ ...formData, locationType: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select Location Type</option>
                <option value="city-center">City Center</option>
                <option value="urban">Urban Area</option>
                <option value="rural">Rural / Village Area</option>
              </select>
            </div>

            {/* Property Type */}
            <div className="space-y-2">
              <Label htmlFor="propertyType">
                Property Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="propertyType"
                value={formData.propertyType}
                onChange={(e) => handlePropertyTypeChange(e.target.value)}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select Property Type</option>
                <option value="house">Residential House</option>
                <option value="apartment">Apartment</option>
                <option value="commercial">Commercial Shop</option>
              </select>
            </div>

            {/* Floor Number */}
            <div className="space-y-2">
              <Label htmlFor="floorNumber">
                Floor Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="floorNumber"
                type="number"
                min="0"
                value={formData.floorNumber}
                onChange={(e) => setFormData({ ...formData, floorNumber: e.target.value })}
                placeholder="e.g., 3"
              />
            </div>

            {/* Built-up Area */}
            <div className="space-y-2">
              <Label htmlFor="builtUpArea">
                Built-up Area (Sq. Ft.) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="builtUpArea"
                type="number"
                min="0"
                value={formData.builtUpArea}
                onChange={(e) => setFormData({ ...formData, builtUpArea: e.target.value })}
                placeholder="e.g., 850"
              />
            </div>

            {/* Furnishing Type */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="furnishingType">
                Furnishing Type <span className="text-destructive">*</span>
              </Label>
              <select
                id="furnishingType"
                value={formData.furnishingType}
                onChange={(e) => setFormData({ ...formData, furnishingType: e.target.value })}
                className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              >
                <option value="">Select Furnishing Type</option>
                <option value="unfurnished">Unfurnished</option>
                <option value="semi-furnished">Semi-Furnished</option>
                <option value="fully-furnished">Fully Furnished</option>
              </select>
            </div>

            {/* Number of BHKs */}
            {isResidentialProperty() && (
              <div className="space-y-2">
                <Label htmlFor="numberOfBHKs">
                  Number of BHKs <span className="text-destructive">*</span>
                </Label>
                <select
                  id="numberOfBHKs"
                  value={formData.numberOfBHKs}
                  onChange={(e) => setFormData({ ...formData, numberOfBHKs: e.target.value })}
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                >
                  <option value="">Select BHK</option>
                  <option value="1">1 BHK</option>
                  <option value="2">2 BHK</option>
                  <option value="3">3 BHK</option>
                  <option value="4">4 BHK</option>
                  <option value="5">5 BHK</option>
                  <option value="5+">More than 5 BHK</option>
                </select>
              </div>
            )}

            {/* Number of Bathrooms */}
            {shouldShowBathrooms() && (
              <div className="space-y-2">
                <Label htmlFor="numberOfBathrooms">
                  Number of Bathrooms <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numberOfBathrooms"
                  type="number"
                  min="1"
                  value={formData.numberOfBathrooms}
                  onChange={(e) => setFormData({ ...formData, numberOfBathrooms: e.target.value })}
                  placeholder="e.g., 2"
                />
              </div>
            )}
          </div>

          {/* Predict Button */}
          <div className="mt-8">
            <Button
              onClick={handlePredict}
              disabled={isLoading}
              className="w-full md:w-auto px-8 py-6 text-base font-semibold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Predict Rent
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* AI Output */}
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-accent/5 border-2 border-primary/20">
          <div className="flex items-center gap-2 mb-6">
            <Brain className="w-6 h-6 text-primary" />
            <h3 className="font-semibold text-lg">AI Prediction</h3>
          </div>

          {prediction === null ? (
            <div className="text-center py-12">
              <Sparkles className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground text-sm">
                Fill in the property details and click "Predict Rent" to get AI-powered rent estimation.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Prediction Result */}
              <div className="p-6 rounded-xl bg-gradient-to-br from-primary to-accent text-white">
                <p className="text-sm opacity-90 mb-2">Estimated Monthly Rent</p>
                <div className="flex items-center gap-2">
                  <IndianRupee className="w-8 h-8" />
                  <p className="text-4xl font-bold">
                    {prediction.toLocaleString('en-IN')}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="p-4 rounded-lg border border-primary/30 bg-background/50">
                <p className="text-sm leading-relaxed">
                  The <span className="font-semibold text-primary">{formData.unitName}</span> is 
                  estimated to have a monthly rent of{' '}
                  <span className="font-bold text-primary">₹{prediction.toLocaleString('en-IN')}</span>{' '}
                  based on the provided property characteristics.
                </p>
              </div>

              {/* Factors */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground uppercase">
                  Factors Considered
                </p>
                <ul className="space-y-1.5 text-sm">
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Location type & area</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Property type & size</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Floor level</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    <span className="text-muted-foreground">Furnishing status</span>
                  </li>
                  {isResidentialProperty() && formData.numberOfBHKs && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Number of BHKs</span>
                    </li>
                  )}
                  {shouldShowBathrooms() && formData.numberOfBathrooms && (
                    <li className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      <span className="text-muted-foreground">Number of bathrooms</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Disclaimer */}
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  <strong>Note:</strong> This is an AI-generated estimate. Actual rent may vary based 
                  on market conditions, amenities, and other factors.
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}