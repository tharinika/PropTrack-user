import React from 'react';
import { supabase } from '../../lib/supabase';
import { StatCard } from '../StatCard';
import { Card } from '../ui/card';
import { Building2, Users, TrendingUp, DollarSign, AlertCircle, Wrench, ChevronDown, QrCode } from 'lucide-react';
import { mockChartData, mockTenants, mockProperties, mockMaintenanceRequests } from '../../data/mockData';
import { useAuth } from '../../contexts/AuthContext';
import { useAppData } from '../../contexts/AppDataContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { EmptyState } from './EmptyState';
import { MaintenanceDrillDownDialog } from './MaintenanceDrillDownDialog';
import { Alert, AlertDescription } from '../ui/alert';

interface OverviewDashboardProps {
  onNavigateToProperties?: () => void;
}

export function OverviewDashboard({ onNavigateToProperties }: OverviewDashboardProps) {
  const { user } = useAuth();
  const { getDashboardMetrics, maintenanceRequests } = useAppData();
  const [paymentsData, setPaymentsData] = React.useState<any[]>([]);
  const { properties } = useProperties();
  const metrics = getDashboardMetrics();
  
  // State for time range filter
  const [selectedTimeRange, setSelectedTimeRange] = React.useState<'7days' | '30days' | '3months' | '6months'>('7days');
  
  // State for property filter (using real property names)
  const [selectedProperty, setSelectedProperty] = React.useState<string>('all');
  
  // State for drill-down dialog
  const [drillDownCategory, setDrillDownCategory] = React.useState<string | null>(null);
  const [isDrillDownOpen, setIsDrillDownOpen] = React.useState(false);
const totalTenants = properties.reduce(
  (sum, prop) =>
    sum + (prop.units?.filter(u => u.status === 'occupied').length || 0),
  0
);
  const fetchPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('landlord_id',user.id);

  if (!error) setPaymentsData(data || []);
};
React.useEffect(() => {
  fetchPayments();
  const handleUpdate = () => {
    fetchPayments();
  };

  window.addEventListener('payments-updated', handleUpdate);

  return () => {
    window.removeEventListener('payments-updated', handleUpdate);
  };
}, []);
  // ============================================================================
  // Monthly Indicators - All Dynamic Calculations
  // ============================================================================
  
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  
  // 1️⃣ Calculate properties added this month
  const propertiesAddedThisMonth = React.useMemo(() => {
    return properties.filter(property => {
      if (!property.createdAt) return false;
      const createdDate = new Date(property.createdAt);
      return createdDate.getMonth() === currentMonth && createdDate.getFullYear() === currentYear;
    }).length;
  }, [properties, currentMonth, currentYear]);
  
  // 2️⃣ Calculate units added this month (from new properties + units added to existing properties)
  const unitsAddedThisMonth = React.useMemo(() => {
    let count = 0;
    
    // Count all units from properties added this month
    properties.forEach(property => {
      if (property.createdAt) {
        const propertyCreatedDate = new Date(property.createdAt);
        if (propertyCreatedDate.getMonth() === currentMonth && propertyCreatedDate.getFullYear() === currentYear) {
          count += property.totalUnits;
        } else {
          // For existing properties, count units added this month
          property.units.forEach(unit => {
            if (unit.createdAt) {
              const unitCreatedDate = new Date(unit.createdAt);
              if (unitCreatedDate.getMonth() === currentMonth && unitCreatedDate.getFullYear() === currentYear) {
                count++;
              }
            }
          });
        }
      }
    });
    
    return count;
  }, [properties, currentMonth, currentYear]);
  
  // 3️⃣ Calculate rent collection comparison (current month vs previous month)
  const rentCollectionTrend = React.useMemo(() => {
    const currentMonthPayments = paymentsData.filter(p => {
      if (p.status !== 'paid' || !p.paidDate) return false;
      const paidDate = new Date(p.paidDate);
      return paidDate.getMonth() === currentMonth && paidDate.getFullYear() === currentYear;
    });
    
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    const previousMonthPayments = paymentsData.filter(p => {
      if (p.status !== 'paid' || !p.paidDate) return false;
      const paidDate = new Date(p.paidDate);
      return paidDate.getMonth() === previousMonth && paidDate.getFullYear() === previousYear;
    });
    
    const currentMonthTotal = currentMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    const previousMonthTotal = previousMonthPayments.reduce((sum, p) => sum + p.amount, 0);
    
    if (previousMonthTotal === 0) return null;
    
    const percentageChange = ((currentMonthTotal - previousMonthTotal) / previousMonthTotal) * 100;
    
    return {
      percentage: Math.abs(Math.round(percentageChange)),
      isPositive: percentageChange > 0,
      show: percentageChange > 0 // Only show if positive
    };
  }, [paymentsData, currentMonth, currentYear]);
  
  // 4️⃣ Calculate pending rent change (current month vs last month)
  const overdueRent = paymentsData
  .filter(p => p.status === 'overdue')
  .reduce((sum, p) => sum + p.amount, 0);

const overdueCount = paymentsData
  .filter(p => p.status === 'overdue')
  .length;
  const pendingRentTrend = React.useMemo(() => {
    const currentPending = metrics.pendingRent;
    
    // Calculate previous month's pending rent (approximation based on current data)
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    
    // This is an approximation - in a real system, you'd track historical pending amounts
    // For now, we'll check if pending rent increased based on new pending payments this month
    const pendingPaymentsThisMonth = paymentsData.filter(p => {
      if (p.status !== 'pending') return false;
      const dueDate = new Date(p.due_date);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });
    
    const newPendingCount = pendingPaymentsThisMonth.length;
    
    return newPendingCount > 0 ? {
      count: newPendingCount,
      show: true
    } : null;
  }, [paymentsData, metrics.pendingRent, currentMonth, currentYear]);
  
  // 5️⃣ Calculate overdue payments that became overdue this month
  const overduePaymentsThisMonth = React.useMemo(() => {
    const overdueThisMonth = paymentsData.filter(p => {
      if (p.status !== 'overdue') return false;
      
      // Check if payment became overdue this month
      if (p.statusChangedAt) {
        const changedDate = new Date(p.statusChangedAt);
        return changedDate.getMonth() === currentMonth && changedDate.getFullYear() === currentYear;
      }
      
      // Fallback: Check if due date was this month (approximate)
      const dueDate = new Date(p.due_date);
      return dueDate.getMonth() === currentMonth && dueDate.getFullYear() === currentYear;
    });
    
    return overdueThisMonth.length;
  }, [paymentsData, currentMonth, currentYear]);
  
  // Use real-time synchronized data from AppDataContext
const monthlyRent = paymentsData
  .filter(p => p.status === 'paid')
  .reduce((sum, p) => sum + p.amount, 0);

const pendingRent = paymentsData
  .filter(p => p.status === 'pending')
  .reduce((sum, p) => sum + p.amount, 0);
  // AI Predicted Collection = Total expected monthly rent from all tenants
  // This includes: paid + pending + overdue (without multiplier for overdue months)
  // Calculation: Sum of all payment amounts regardless of status
  const aiPredictedCollection = React.useMemo(() => {
    // Calculate total expected monthly rent (all payments for current month)
    const totalExpectedRent = paymentsData.reduce((sum, payment) => {
      return sum + payment.amount;
    }, 0);
    
    return totalExpectedRent;
  }, [paymentsData]);
  
  // Calculate max value for line chart scaling
  const maxRent = Math.max(...mockChartData.rentCollection.map(d => d.amount));
  // Get filtered maintenance requests for drill-down
  const drillDownRequests = React.useMemo(() => {
    if (!drillDownCategory) return [];
    return maintenanceRequests.filter(
      (request) => request.category.toLowerCase() === drillDownCategory.toLowerCase()
    );
  }, [maintenanceRequests, drillDownCategory]);
  
  // Calculate real-time payment distribution from actual data
  const paymentStats = React.useMemo(() => {
  const filteredPayments = selectedProperty === 'all' 
    ? paymentsData 
    : paymentsData.filter(p => {
        const propertySlug = p.property.toLowerCase().replace(/\s+/g, '-');
        return propertySlug === selectedProperty;
      });

  const paidCount = filteredPayments.filter(p => p.status === 'paid').length;
  const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;
  const overdueCount = filteredPayments.filter(p => p.status === 'overdue').length;
  const total = filteredPayments.length || 1;

  return {
    paid: Math.round((paidCount / total) * 100),
    pending: Math.round((pendingCount / total) * 100),
    overdue: Math.round((overdueCount / total) * 100),
  };
}, [paymentsData, selectedProperty]);

  const realPaymentData = React.useMemo(() => {
    const filteredPayments = selectedProperty === 'all' 
      ? paymentsData 
      : paymentsData.filter(p => {
          const propertySlug = p.property.toLowerCase().replace(/\s+/g, '-');
          return propertySlug === selectedProperty;
        });

    const paidCount = filteredPayments.filter(p => p.status === 'paid').length;
    const pendingCount = filteredPayments.filter(p => p.status === 'pending').length;
    const overdueCount = filteredPayments.filter(p => p.status === 'overdue').length;
    const total = filteredPayments.length || 1; // Avoid division by zero

    const paidPercent = Math.round((paidCount / total) * 100);
    const pendingPercent = Math.round((pendingCount / total) * 100);
    const overduePercent = Math.round((overdueCount / total) * 100);

    return {
      paymentStatus: [
        { name: 'Paid', value: paidPercent, fill: '#10b981' },
        { name: 'Pending', value: pendingPercent, fill: '#f59e0b' },
        { name: 'Overdue', value: overduePercent, fill: '#ef4444' }
      ],
      totalPayments: filteredPayments.length,
      onTime: paidCount,
      late: overdueCount,
      insight: overdueCount > 2 
        ? `${overdueCount} ${overdueCount === 1 ? 'payment needs' : 'payments need'} immediate attention`
        : paidCount > total * 0.8
        ? 'Excellent payment collection rate this period'
        : 'Payment collection is progressing well',
      highlightProperty: null
    };
  }, [paymentsData, selectedProperty]);

  // Calculate real-time maintenance distribution from actual data
  const realMaintenanceData = React.useMemo(() => {
  const categories = ['Plumbing', 'Electrical', 'HVAC', 'Structural', 'Cleaning','General'];

  const normalize = (str?: string) => str?.trim().toLowerCase();

const isWithinRange = (date: string) => {
  const submitted = new Date(date);
  const now = new Date();

  const diffDays =
    (now.getTime() - submitted.getTime()) / (1000 * 60 * 60 * 24);

  if (selectedTimeRange === '7days') return diffDays <= 7;
  if (selectedTimeRange === '30days') return diffDays <= 30;
  if (selectedTimeRange === '3months') return diffDays <= 90;
  if (selectedTimeRange === '6months') return diffDays <= 180;

  return true;
};

const data = categories.map(category => ({
  name: category,
  value: maintenanceRequests.filter(r =>
    normalize(r.category) === normalize(category) &&
    isWithinRange(r.dateSubmitted)
  ).length
}));

  const maxValue = Math.max(...data.map(d => d.value), 1);

  return {
    data,
    maxValue: Math.ceil(maxValue * 1.2)
  };
}, [maintenanceRequests]);
  
  const currentMaintenanceData = realMaintenanceData;
  const currentPaymentData = realPaymentData;
  
  // Calculate real-time stats from actual data
  const totalProperties = properties.length;
  const totalUnits = properties.reduce(
  (sum, prop) => sum + (prop.totalUnits || prop.units?.length || 0),
  0
);
  const occupiedUnits = properties.reduce(
  (sum, prop) => sum + (prop.units?.filter(u => u.status === 'occupied').length || 0),
  0
);
  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
  
  // Show empty state for landlords with no properties (both new and demo)
  if (totalProperties === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Dashboard Overview</h2>
          <p className="text-muted-foreground">Welcome to PropTrack! Let's get started.</p>
        </div>

        {/* Empty State KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-tour="kpi-cards">
          <StatCard
            title="Total Properties"
            value={0}
            icon={Building2}
          />
          <StatCard
            title="Total Units"
            value={0}
            icon={Building2}
          />
          <StatCard
            title="Occupancy Rate"
            value="0%"
            icon={TrendingUp}
          />
          <StatCard
            title="Total Tenants"
            value={0}
            icon={Users}
          />
        </div>

        {/* Welcome Message */}
        <Card className="p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={Building2}
            title="Welcome to Your Dashboard!"
            description="You haven't added any properties yet. Start by adding your first property to unlock powerful insights, tenant management, and automated rent collection."
            actionLabel="Get Started"
            onAction={() => {
              // This would navigate to properties tab in real implementation
              if (onNavigateToProperties) {
                onNavigateToProperties();
              } else {
                alert('Navigate to Properties tab to add your first property!');
              }
            }}
            dataTour="get-started"
          />
        </Card>

        {/* Getting Started Guide */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 text-lg">Quick Start Guide</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium mb-2">1. Add Properties</h4>
              <p className="text-sm text-muted-foreground">
                Add your rental properties and units to start tracking
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium mb-2">2. Add Tenants</h4>
              <p className="text-sm text-muted-foreground">
                Invite tenants and assign them to units
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium mb-2">3. Track Payments</h4>
              <p className="text-sm text-muted-foreground">
                Monitor rent collection and payment status
              </p>
            </div>
            <div className="p-4 rounded-lg border border-border bg-card hover:bg-accent/5 transition-colors">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-3">
                <Wrench className="w-5 h-5 text-primary" />
              </div>
              <h4 className="font-medium mb-2">4. Manage Issues</h4>
              <p className="text-sm text-muted-foreground">
                Handle maintenance requests efficiently
              </p>
            </div>
          </div>
        </Card>
      </div>
    );
  }

  // Show full dashboard when properties exist
  // Use real-time synchronized data from contexts
  

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Dashboard Overview</h2>
        <p className="text-muted-foreground">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Payment Setup Alert Banner */}
      {!user?.upiQrCodeUrl && (
        <Alert className="border-l-4 border-l-accent bg-accent/5">
          <QrCode className="h-5 w-5 text-accent" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <p className="font-medium text-foreground mb-1">Payment Method Not Configured</p>
              <p className="text-sm text-muted-foreground">
                Upload your UPI QR code in profile settings to enable tenants to pay rent directly
              </p>
            </div>
            <button 
              onClick={() => {
                // This will be handled by the Edit Profile dialog
                const event = new CustomEvent('open-edit-profile');
                window.dispatchEvent(event);
              }}
              className="ml-4 px-4 py-2 bg-accent hover:bg-accent/90 text-accent-foreground rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
            >
              Setup Now
            </button>
          </AlertDescription>
        </Alert>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6" data-tour="kpi-cards">
        <StatCard
          title="Total Properties"
          value={totalProperties}
          icon={Building2}
          trend={propertiesAddedThisMonth > 0 ? { 
            value: `+${propertiesAddedThisMonth} this month`, 
            isPositive: true 
          } : undefined}
        />
        <StatCard
          title="Total Units"
          value={totalUnits}
          icon={Building2}
          trend={unitsAddedThisMonth > 0 ? { 
            value: `+${unitsAddedThisMonth} this month`, 
            isPositive: true 
          } : undefined}
        />
        <StatCard
          title="Occupancy Rate"
          value={`${occupancyRate}%`}
          icon={TrendingUp}
          trend={{ value: '+5% from last month', isPositive: true }}
        />
        <StatCard
          title="Total Tenants"
          value={totalTenants}
          icon={Users}
        />
      </div>

      {/* Second Row KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <StatCard
          title="Monthly Rent Collected"
          value={`₹${monthlyRent.toLocaleString()}`}
          icon={DollarSign}
          trend={rentCollectionTrend ? { 
            value: `${rentCollectionTrend.percentage}% ${rentCollectionTrend.isPositive ? 'increase' : 'decrease'}`, 
            isPositive: rentCollectionTrend.isPositive 
          } : undefined}
        />
        <StatCard
          title="Pending Rent"
          value={`₹${pendingRent.toLocaleString()}`}
          icon={AlertCircle}
          trend={pendingRentTrend ? { 
            value: `+${pendingRentTrend.count} ${pendingRentTrend.count === 1 ? 'payment' : 'payments'}`, 
            isPositive: true 
          } : undefined}
        />
        <StatCard
  title="Overdue Payments"
  value={`₹${overdueRent.toLocaleString()}`}
  icon={DollarSign}
  trend={{
    value: `${overdueCount} ${overdueCount === 1 ? 'payment' : 'payments'}`,
    isPositive: false
  }}
/>
        
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6" data-tour="charts">
        {/* Payment Status Distribution - Apartment-Aware with Filter */}
        <Card className="p-4 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <h3 className="font-semibold text-base md:text-lg">Payment Status Distribution</h3>
            
            {/* Apartment filter dropdown */}
            <div className="relative">
              <select 
                className="appearance-none text-xs px-3 md:px-4 py-2 pr-8 rounded-lg border border-border bg-background text-foreground font-medium hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer w-full sm:w-auto"
                value={selectedProperty}
                onChange={(e) => setSelectedProperty(e.target.value)}
              >
                <option value="all">All Properties</option>
                {properties.map((property) => (
                  <option key={property.id} value={property.name.toLowerCase().replace(/\s+/g, '-')}>
                    {property.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          <div className="flex flex-col justify-center gap-4">
            {currentPaymentData.paymentStatus.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">{item.name}</span>
                  <span className="text-sm text-muted-foreground">{item.value}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: `${item.value}%`,
                      backgroundColor: item.fill 
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
          
          {/* Compact Summary Row */}
          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                Total Payments: <span className="font-medium text-foreground">{currentPaymentData.totalPayments}</span>
              </span>
              <div className="flex items-center gap-4">
                <span className="text-emerald-600 font-medium">
                  On-time: {currentPaymentData.onTime}
                </span>
                <span className="text-orange-600 font-medium">
                  Late: {currentPaymentData.late}
                </span>
              </div>
            </div>
            
            {/* Contextual Insight */}
            <div className="mt-3 text-xs text-muted-foreground">
              {currentPaymentData.highlightProperty ? (
                <>
                  {currentPaymentData.insight}{' '}
                  <span className="font-medium text-emerald-600">
                    {currentPaymentData.highlightProperty}
                  </span>
                </>
              ) : (
                <span className={currentPaymentData.late > 2 ? 'text-orange-600' : ''}>
                  {currentPaymentData.insight}
                </span>
              )}
            </div>
          </div>
        </Card>

        {/* Maintenance Categories Chart */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Maintenance Requests by Category</h3>
            
            {/* Custom SaaS-style time filter dropdown */}
            <div className="relative">
              <select 
                className="appearance-none text-xs px-4 py-2 pr-8 rounded-lg border border-border bg-background text-foreground font-medium hover:border-primary hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all cursor-pointer"
                value={selectedTimeRange}
                onChange={(e) => setSelectedTimeRange(e.target.value as '7days' | '30days' | '3months' | '6months')}
              >
                <option value="7days">Last 7 days</option>
                <option value="30days">Last 30 days</option>
                <option value="3months">Last 3 months</option>
                <option value="6months">Last 6 months</option>
              </select>
              <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            </div>
          </div>
          
          {/* Clean Vertical Bar Chart - Dynamic Y-axis */}
          <div className="relative pt-2 pb-2 mt-6">
            <div className="flex gap-2">
              {/* Dynamic Y-axis scale based on maxValue */}
              <div className="flex flex-col justify-between h-[240px] w-6 text-right text-[10px] text-muted-foreground/40 pr-2">
                <span>{currentMaintenanceData.maxValue}</span>
                <span>{Math.round(currentMaintenanceData.maxValue * 0.66)}</span>
                <span>{Math.round(currentMaintenanceData.maxValue * 0.33)}</span>
                <span>0</span>
              </div>
              
              {/* Chart area - centered and balanced */}
              <div className="flex-1 relative">
                {/* Subtle grid lines only */}
                <div className="absolute inset-0 flex flex-col justify-between">
                  {[0, 1, 2, 3].map((index) => (
                    <div key={index} className="w-full border-t border-border/15" />
                  ))}
                </div>
                
                {/* Bars - evenly distributed with smooth animations */}
                <div className="relative h-[240px] flex items-end justify-center">
  <div className="flex items-end justify-evenly w-full max-w-[420px] mx-auto">
                  {currentMaintenanceData.data.map((item, index) => {
                    const maxValue = currentMaintenanceData.maxValue;
                    const barHeight = item.value === 0 ? 0 : Math.max((item.value / maxValue) * 220, 16);
                    
                    return (
                      <div key={index} className="flex flex-col items-center gap-3 group">
                        {/* Tooltip on hover */}
                        <div className="absolute -top-14 opacity-0 group-hover:opacity-100 transition-all bg-card border-2 border-primary shadow-xl rounded-lg px-3 py-2 text-sm font-semibold whitespace-nowrap z-20 pointer-events-none">
                          <div className="text-primary">{item.value} maintenance {item.value === 1 ? 'request' : 'requests'} – {item.name}</div>
                        </div>
                        
                        {/* Slim elegant vertical bar with smooth transitions */}
                        <div 
                          className="w-5 bg-gradient-to-t from-emerald-600 via-emerald-500 to-lime-400 rounded-t-lg transition-all duration-500 ease-out hover:from-emerald-500 hover:via-lime-500 hover:to-lime-300 hover:shadow-lg hover:scale-110 cursor-pointer"
                          style={{ 
                            height: `${barHeight}px`,
                            transitionProperty: 'height, background, transform, box-shadow'
                          }}
                          onClick={() => {
                            setDrillDownCategory(item.name);
                            setIsDrillDownOpen(true);
                          }}
                        />
                        
                        {/* Category label */}
                        <span className="text-[10px] text-muted-foreground font-medium text-center leading-tight max-w-[50px] break-words">
                          {item.name}
                        </span>
                      </div>
                    );
                  })}
                </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* AI Insights Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 border-l-4 border-l-orange-500">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10">
              <AlertCircle className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">AI Insight: Payment Delays</h4>
              <p className="text-sm text-muted-foreground mb-3">
                2 tenants are predicted to delay payment this month based on historical patterns.
              </p>
              <p className="text-sm font-medium text-orange-500">Recommended: Send early reminders</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-l-4 border-l-primary">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-lg bg-primary/10">
              <Wrench className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h4 className="font-semibold mb-2">AI Insight: Maintenance Trends</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Plumbing requests increased by 40% this month. Consider preventive maintenance.
              </p>
              <p className="text-sm font-medium text-primary">Action: Schedule inspections</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Maintenance Drill-Down Dialog */}
      <MaintenanceDrillDownDialog
        isOpen={isDrillDownOpen}
        onClose={() => setIsDrillDownOpen(false)}
        category={drillDownCategory}
        requests={drillDownRequests}
      />
    </div>
  );
}