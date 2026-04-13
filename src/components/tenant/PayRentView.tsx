import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { GradientButton } from '../GradientButton';
import { StatusBadge } from '../StatusBadge';
import { UpiPaymentDialog } from './UpiPaymentDialog';
import { DollarSign, Download, Calendar, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useAppData } from '../../contexts/AppDataContext';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';

export function PayRentView() {
  const { user } = useAuth();
  const [tenantData,setTenantData]=useState<any>(null);
  const { properties } = useProperties();
  const[paymentsData,setPaymentsData]=useState<any[]>([]);
  const { updatePaymentStatus, addPayment } = useAppData();
  const [isUpiDialogOpen, setIsUpiDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const [charges, setCharges] = useState({
  electricity: 0,
  maintenanceFee: 0,
  waterBill: 0,
  gasBill: 0,
  rent:0
});

  // ============================================================================
  // SINGLE SOURCE OF TRUTH - Fetch rent from property backend
  // ============================================================================
  
  // Get tenant's property and unit from authenticated user
  const tenantProperty = tenantData?.properties;
const tenantUnit = tenantData?.units;
  console.log("USER:", user);
console.log("PROPERTY:", tenantProperty);
console.log("UNIT:", tenantUnit);
  
  // Get landlord info - In real app, this would come from the property owner data
  const [landlordInfo, setLandlordInfo] = useState<any>(null);
  const fetchPayments = async () => {
  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('tenant_id', user?.id);

  if (!error) setPaymentsData(data || []);
};
useEffect(() => {
  if (user?.id) fetchPayments();
}, [user]);
useEffect(() => {
  if (!user?.id) return;

  // 🔥 prevent duplicate channels
  const channel = supabase.getChannels().find(
    (ch) => ch.topic === 'realtime:payments-realtime'
  );

  if (channel) {
    return; // already exists → do nothing
  }

  const newChannel = supabase.channel('payments-realtime');

  newChannel.on(
    'postgres_changes',
    {
      event: '*',
      schema: 'public',
      table: 'payments',
      filter: `tenant_id=eq.${user.id}`,
    },
    () => {
      fetchPayments();
    }
  );

  newChannel.subscribe();

  return () => {
    supabase.removeChannel(newChannel);
  };
}, [user?.id]);
  // Load landlord info from localStorage
 useEffect(() => {
  const fetchTenantData = async () => {
    const { data, error } = await supabase
      .from('users')
      .select(`
        *,
        properties:property_id(*),
        units:unit_id(*)
      `)
      .eq('id', user?.id)
      .single();

    if (error) {
      console.error(error);
      return;
    }

    console.log("TENANT DATA:", data);

    setTenantData(data);
  };

  if (user?.id) fetchTenantData();
}, [user]);
useEffect(() => {
  const fetchLandlord = async () => {
    if (!tenantData?.landlord_id) return;

    const { data, error } = await supabase
      .from('landlord_payment_details')
      .select('*')
      .eq('landlord_id', tenantData.landlord_id)
      .single();

    if (error) {
      console.error("Landlord fetch error:", error);
      return;
    }

    console.log("LANDLORD:", data);

    setLandlordInfo(data);
  };

  fetchLandlord();
}, [tenantData]);
  // Check if landlord has UPI QR code
  const hasLandlordQrCode = !landlordInfo?.qr_code|| !!landlordInfo?.upi_id;
  
  // Calculate monthly rent from property unit data
  const baseRent = tenantUnit?.rent || 0;
const currentRent = tenantUnit?.total_monthly || 0;
  
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
  
  // ============================================================================
  // REAL-TIME PAYMENT HISTORY WITH DYNAMIC SORTING
  // ============================================================================
  
  // Sort by payment_date DESC (if paid), otherwise by dueDate DESC
  const sortedPayments = React.useMemo(() => {
  return [...paymentsData]
    .sort((a, b) => {
      if (a.paid_date && b.paid_date) {
        return new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime();
      }
      if (a.paid_date) return -1;
      if (b.paid_date) return 1;
      return new Date(b.due_date).getTime() - new Date(a.due_date).getTime();
    });
}, [paymentsData]);
const latestPayment = sortedPayments[0];
  
  // Show initial 3, or all if "Show More" is clicked
  const displayedPayments = showAllHistory ? sortedPayments : sortedPayments.slice(0, 3);
  const hasMoreHistory = sortedPayments.length > 3;

  // ============================================================================
  // UPI-ONLY PAYMENT FLOW
  // ============================================================================
  const handlePayNowClick = () => {
    // Validate landlord has UPI QR code configured
    console.log("landlordinfo:",landlordInfo);
    console.log("qr:",landlordInfo.upi_qr_code_url)
    if (!hasLandlordQrCode) {
      toast.error('Payment Method Not Configured', {
        description: 'UPI payment is not available. Please contact your landlord to set up payment methods.'
      });
      return;
    }
    
    // Directly open UPI Payment Dialog
    setIsUpiDialogOpen(true);
  };
  const amountDue = paymentsData
  .filter(p => p.status === 'pending' || p.status === 'overdue')
  .reduce((sum, p) => sum + p.amount, 0);

  const handleDownloadInvoice = (payment: typeof sortedPayments[0]) => {
    setIsDownloading(true);
    
    try {
      // Extract month and year from due date
      const dueDate = new Date(payment.due_date);
      const month = dueDate.toLocaleDateString('en-US', { month: 'long' });
      const year = dueDate.getFullYear().toString();
      
      // Generate invoice number (format: INV-YYYY-MM-XXX)
      const invoiceNumber = `INV-${year}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${payment.id.split('-')[1] || '001'}`;
      
      const invoiceData = {
        // Invoice Details
        invoiceNumber,
        invoiceMonth: month,
        invoiceYear: year,
        invoiceDate: new Date().toLocaleDateString('en-IN'),
        paymentDate: payment.paid_date ? new Date(payment.paid_date).toLocaleDateString('en-IN') : undefined,
        paymentStatus: payment.status,
        
        // Tenant Details
        tenantName: user?.name || '',
        tenantEmail: user?.email || '',
        
        // Landlord Details
        landlordName: landlordInfo?.name || 'Property Owner',
        
        // Property Details
        propertyName: tenantProperty?.name || '',
        unitNumber: tenantUnit?.number || user?.unitNumber || '',
        
        // Payment Breakdown
        baseRent,
        electricity: charges.electricity,
        waterBill: charges.waterBill,
        gasBill: charges.gasBill,
        maintenanceFee: charges.maintenanceFee,
        totalAmount: payment.amount
      };
      
      generateInvoicePDF(invoiceData);
      toast.success('Invoice Downloaded', {
        description: `${month} ${year} invoice has been downloaded successfully`
      });
    } catch (error) {
      console.error('[PAY RENT] Error generating invoice:', error);
      toast.error('Download Failed', {
        description: 'Unable to generate invoice. Please try again.'
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold mb-1">Pay Rent</h2>
        <p className="text-muted-foreground">Make your rent payment securely</p>
      </div>

      {/* Current Payment Due */}
      <Card className="p-6 bg-gradient-to-br from-primary/10 via-accent/5 to-background border-primary/20">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Amount Due</p>
            <h3 className="text-4xl font-bold text-primary">₹{currentRent.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground mt-2">Due: {nextDueDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
          </div>
          

<StatusBadge status={latestPayment?.status || 'pending'} />
        </div>

        <div className="space-y-3 mb-6">
          <div className="flex justify-between py-2 border-t border-border">
            <span className="text-muted-foreground">Base Rent</span>
            <span className="font-medium">₹{baseRent.toLocaleString()}</span>
          </div>
          {charges.electricity > 0 && (
            <div className="flex justify-between py-2 border-t border-border">
              <span className="text-muted-foreground">Electricity</span>
              <span className="font-medium">₹{charges.electricity.toLocaleString()}</span>
            </div>
          )}
          {charges.maintenanceFee > 0 && (
            <div className="flex justify-between py-2 border-t border-border">
              <span className="text-muted-foreground">Maintenance Fee</span>
              <span className="font-medium">₹{charges.maintenanceFee.toLocaleString()}</span>
            </div>
          )}
          {charges.waterBill > 0 && (
            <div className="flex justify-between py-2 border-t border-border">
              <span className="text-muted-foreground">Water Bill</span>
              <span className="font-medium">₹{charges.waterBill.toLocaleString()}</span>
            </div>
          )}
          {charges.gasBill > 0 && (
            <div className="flex justify-between py-2 border-t border-border">
              <span className="text-muted-foreground">Gas Bill</span>
              <span className="font-medium">₹{charges.gasBill.toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between py-3 border-t-2 border-border font-semibold">
            <span>Total Monthly Rent</span>
            <span className="text-primary">₹{currentRent.toLocaleString()}</span>
          </div>
        </div>

        <GradientButton 
          className="w-full" 
          size="lg"
          onClick={handlePayNowClick}
        >
          <DollarSign className="w-5 h-5" />
          Pay Now
        </GradientButton>
      </Card>

      {/* Payment History with Real-Time Updates */}
      <Card className="p-6">
        <h3 className="font-semibold mb-4">Payment History</h3>
        {displayedPayments.length > 0 ? (
          <>
            <AnimatePresence mode="popLayout">
              <div className="space-y-3">
                {displayedPayments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    layout
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.3 }}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{new Date(payment.due_date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</p>
                        <p className="text-sm text-muted-foreground">₹{currentRent.toLocaleString()}</p>
                        {payment.paid_date && (
                          <p className="text-xs text-muted-foreground">
                            Paid on {new Date(payment.paid_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={payment.status} />
                      {/* Only show download button for paid status */}
                      {payment.status === 'paid' && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => handleDownloadInvoice(payment)}
                          disabled={isDownloading}
                          title="Download Invoice"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
            
            {/* Show More / Show Less Button */}
            {hasMoreHistory && (
              <Button
                variant="ghost"
                className="w-full mt-4"
                onClick={() => setShowAllHistory(!showAllHistory)}
              >
                {showAllHistory ? (
                  <>
                    <ChevronUp className="w-4 h-4 mr-2" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-4 h-4 mr-2" />
                    Show More ({sortedPayments.length - 3} more)
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <div className="text-center py-8">
            <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No payment history yet</p>
          </div>
        )}
      </Card>

      {/* UPI Payment Dialog */}
      {hasLandlordQrCode && landlordInfo && (
        <UpiPaymentDialog
          open={isUpiDialogOpen}
          onOpenChange={setIsUpiDialogOpen}
          landlordName={landlordInfo.name}
          rentAmount={amountDue}
          qrCodeUrl={landlordInfo.qr_code}
          upiId={landlordInfo.upi_id}
        />
      )}
    </div>
  );
}
