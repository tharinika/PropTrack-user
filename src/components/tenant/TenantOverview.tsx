import React from 'react';
import{useState,useEffect}from 'react';
import{supabase}from '../../lib/supabase';
import { StatCard } from '../StatCard';
import { Card } from '../ui/card';
import { DollarSign, AlertCircle, Calendar, TrendingUp, CreditCard, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useAppData } from '../../contexts/AppDataContext';
import { GradientButton } from '../GradientButton';

interface TenantOverviewProps {
  onPayRent: () => void;
  tenantData:any;
}

export function TenantOverview({ onPayRent,tenantData }: TenantOverviewProps) {
  const { user } = useAuth();
  const { properties } = useProperties();
  const{payments}=useAppData();
  const [maintenanceRequests,setMaintenanceRequests]=useState([]);
  const [paymentsData, setPaymentsData] = useState<any[]>([]);

useEffect(() => {
  if (!user?.id) return;

  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('tenant_id', user.id);

    if (!error) setPaymentsData(data || []);
  };

  fetchPayments();
}, [user]);
  useEffect(() => {
  if (user?.id) {
    fetchMaintenance();
  }
}, [user]);

const fetchMaintenance = async () => {
  const { data, error } = await supabase
    .from('maintenance_requests')
    .select('*')
    .eq('tenant_id', user.id)
    .order('date_submitted', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  setMaintenanceRequests(data);
};
  // ============================================================================
  // SINGLE SOURCE OF TRUTH - Fetch rent from property backend
  // ============================================================================
  
  // Get tenant's property and unit from authenticated user
 // 🔥 Get property from PropertiesContext
const property = properties.find(p => String(p.id) === String(tenantData?.propertyId));

// 🔥 Get unit from that property
const unit = property?.units?.find(u =>String( u.id) === String(tenantData?.unitId));

// ✅ MAIN FIX
const baseRent = unit?.rent || 0;
const monthlyElectricity = unit?.monthlyElectricity || 0;

// 🔥 Property-level charges
const propertyCharges = {
  maintenanceFee: property?.maintenanceFee || 0,
  waterBill: property?.waterBill || 0,
  gasBill: property?.gasBill || 0
};
const [unitData, setUnitData] = useState(null);

useEffect(() => {
  if (!tenantData?.unitId) return;

  const fetchUnit = async () => {
    const { data } = await supabase
      .from("units")
      .select("*")
      .eq("id", tenantData.unitId)
      .single();

    setUnitData(data);
  };

  fetchUnit();
}, [tenantData?.unitId]);
  // Total monthly payable (same calculation as landlord uses)
  const totalRent = unitData?.total_monthly || 0;
  // ============================================================================
  // DYNAMIC DUE DATE CALCULATION - Always 1st of the month
  // ============================================================================
  const calculateNextDueDate = () => {
    const today = new Date();
    let dueDate = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // If today is after the 1st, set due date to 1st of next month
    if (today.getDate() > 1) {
      dueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
    
    return dueDate;
  };
  
  const nextDueDate = calculateNextDueDate();
  const daysUntilDue = Math.ceil(
    (nextDueDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );
  
  // ============================================================================
  // REAL BACKEND DATA - Fetch tenant's actual payments and requests
  // ============================================================================
  
  // Filter payments for current tenant
  const tenantPayments = paymentsData;
  
  // Get pending and overdue amounts
  const pendingPayments = tenantPayments.filter(p => p.status === 'pending');
  const overduePayments = tenantPayments.filter(p => p.status === 'overdue');
  const paidPayments = tenantPayments.filter(p => p.status === 'paid');
  
  const pendingRent = pendingPayments.reduce((sum, p) => sum + p.amount, 0);
  const overdueRent = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  
  // Get last payment (most recent paid payment)
  const lastPayment = paidPayments.length > 0 
    ? paidPayments.sort((a, b) => new Date(b.paidDate || '').getTime() - new Date(a.paidDate || '').getTime())[0]
    : null;
  
  // ============================================================================
  // PAYMENT STATUS ANALYTICS - Real-time calculation
  // ============================================================================
  
  // Determine current payment status based on most recent payment or pending status
  let paymentStatus: 'paid' | 'pending' | 'overdue' | 'no-data' = 'no-data';
  let paymentStatusColor = 'from-gray-500 to-slate-500';
  let paymentStatusIcon = AlertCircle;
  let paymentStatusText = 'No Data';
  
  if (tenantPayments.length === 0) {
    paymentStatus = 'no-data';
    paymentStatusText = 'Not Started';
    paymentStatusColor = 'from-gray-500 to-slate-500';
    paymentStatusIcon = AlertCircle;
  } else if (overduePayments.length > 0) {
    paymentStatus = 'overdue';
    paymentStatusText = 'Overdue';
    paymentStatusColor = 'from-red-500 to-rose-500';
    paymentStatusIcon = XCircle;
  } else if (pendingPayments.length > 0) {
    paymentStatus = 'pending';
    paymentStatusText = 'Pending';
    paymentStatusColor = 'from-orange-500 to-amber-500';
    paymentStatusIcon = Clock;
  } else {
    paymentStatus = 'paid';
    paymentStatusText = 'Paid';
    paymentStatusColor = 'from-green-500 to-emerald-500';
    paymentStatusIcon = CheckCircle;
  }
  
  // ============================================================================
  // DAYS REMAINING ANALYTICS - Dynamic calculation
  // ============================================================================
  
  let daysRemainingText = '';
  let daysRemainingColor = 'from-green-500 to-emerald-500';
  let daysRemainingIcon = Calendar;
  
  if (daysUntilDue < 0) {
    const daysOverdue = Math.abs(daysUntilDue);
    daysRemainingText = `Overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'}`;
    daysRemainingColor = 'from-red-500 to-rose-500';
    daysRemainingIcon = AlertCircle;
  } else if (daysUntilDue === 0) {
    daysRemainingText = 'Due Today';
    daysRemainingColor = 'from-orange-500 to-amber-500';
    daysRemainingIcon = AlertCircle;
  } else if (daysUntilDue <= 5) {
    daysRemainingText = `${daysUntilDue} ${daysUntilDue === 1 ? 'day' : 'days'}`;
    daysRemainingColor = 'from-orange-500 to-amber-500';
    daysRemainingIcon = Calendar;
  } else {
    daysRemainingText = `${daysUntilDue} days`;
    daysRemainingColor = 'from-green-500 to-emerald-500';
    daysRemainingIcon = Calendar;
  }
  
  // Filter maintenance requests for current tenant
  const tenantMaintenanceRequests = maintenanceRequests;
  
  // ============================================================================
  // RECENT ACTIVITY - Real data only
  // ============================================================================
  
  // Combine payments and maintenance into activity feed
  const recentActivity = [
    // Add paid payments
    ...paidPayments.slice(0, 2).map(payment => ({
      id: `payment-${payment.id}`,
      type: 'payment' as const,
      description: 'Rent Payment',
      date: new Date(payment.paidDate || payment.dueDate),
      amount: payment.amount,
      status: 'completed' as const,
    })),
    // Add maintenance requests
    ...tenantMaintenanceRequests.slice(0, 2).map(request => ({
      id: `maintenance-${request.id}`,
      type: 'maintenance' as const,
      description: `${request.category} Request`,
      date: new Date(request.date_submitted),
      status: request.status === 'completed' ? 'completed' as const : 'in-progress' as const,
    }))
  ]
  .sort((a, b) => b.date.getTime() - a.date.getTime())
  .slice(0, 3); // Show top 3 most recent

  console.log('[TENANT OVERVIEW] Backend data sync:', {
    propertyId: tenantData?.propertyId,
    unitId: tenantData?.unitId,
    tenantProperty: tenantData?.propertyName,
    tenantUnit: tenantData?.unitNumber,
    baseRent,
    monthlyElectricity,
    propertyCharges,
    totalRent,
    tenantPayments: tenantPayments.length,
    pendingRent,
    overdueRent,
    lastPayment: lastPayment?.paidDate,
    maintenanceRequests: tenantMaintenanceRequests.length,
    recentActivity: recentActivity.length,
    source: 'PropertiesContext & AppDataContext'
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-1">
          Welcome back, {user?.name?.split(' ')[0]}!
        </h2>
        <p className="text-muted-foreground">
          {tenantData?.propertyName || 'Your Property'} - Unit {tenantData.unitNumber || 'N/A'}
        </p>
      </div>

      {/* Rent Due Alert */}
      {daysUntilDue <= 5 && pendingRent > 0 && (
        <Card className="p-4 border-l-4 border-l-orange-500 bg-orange-500/5">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-orange-500 mb-1">Rent Due Soon</p>
              <p className="text-sm text-muted-foreground">
                Your rent of ₹{pendingRent.toLocaleString()} is due in {daysUntilDue} days
              </p>
            </div>
            <GradientButton size="sm" onClick={onPayRent}>
              Pay Now
            </GradientButton>
          </div>
        </Card>
      )}

      {/* Stats Grid - Fixed 4-card layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Rent"
          value={`₹${totalRent.toLocaleString()}`}
          icon={DollarSign}
          iconColor="from-primary to-accent"
        />
        <StatCard
          title="Next Due Date"
          value={nextDueDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
          icon={Calendar}
          subtitle={nextDueDate.toLocaleDateString('en-IN', { year: 'numeric' })}
          iconColor="from-blue-500 to-cyan-500"
        />
        <StatCard
          title="Payment Status"
          value={paymentStatusText}
          icon={paymentStatusIcon}
          iconColor={paymentStatusColor}
        />
        <StatCard
          title="Days Remaining"
          value={daysRemainingText}
          icon={daysRemainingIcon}
          iconColor={daysRemainingColor}
        />
      </div>

      {/* Payment Status Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment Summary */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Payment Summary
          </h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-primary/5 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl font-semibold text-primary">
                  ₹{totalRent.toLocaleString()}
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-white" />
              </div>
            </div>
            
            {lastPayment ? (
              <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                <div>
                  <p className="text-sm text-muted-foreground">Last Payment</p>
                  <p className="font-medium">
                    {new Date(lastPayment.paidDate || '').toLocaleDateString('en-IN')}
                  </p>
                </div>
                <div className="text-primary font-semibold">
                  ₹{lastPayment.amount.toLocaleString()}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center p-4 bg-muted/50 rounded-lg">
                <p className="text-sm text-muted-foreground">No payments yet</p>
              </div>
            )}
            
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Next Due</p>
                <p className="font-medium">
                  {nextDueDate.toLocaleDateString('en-IN')}
                </p>
              </div>
              <div className="text-orange-500 font-semibold">
                {daysUntilDue} days
              </div>
            </div>
          </div>
        </Card>

        {/* Recent Activity */}
        <Card className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Recent Activity
          </h3>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      activity.type === 'payment'
                        ? 'bg-primary/10'
                        : 'bg-orange-500/10'
                    }`}
                  >
                    {activity.type === 'payment' ? (
                      <DollarSign className="w-5 h-5 text-primary" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {activity.date.toLocaleDateString('en-IN', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {'amount' in activity && (
                    <div className="text-sm font-semibold text-primary">
                      ₹{activity.amount.toLocaleString()}
                    </div>
                  )}
                  <div
                    className={`px-2 py-1 rounded-full text-xs font-medium ${
                      activity.status === 'completed'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-orange-500/10 text-orange-500'
                    }`}
                  >
                    {activity.status === 'completed' ? 'Completed' : 'In Progress'}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Clock className="w-12 h-12 text-muted-foreground/30 mb-3" />
                <p className="text-sm text-muted-foreground">No recent activity</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Your payment and maintenance history will appear here
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}