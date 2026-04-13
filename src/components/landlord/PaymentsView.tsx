import React, { useState,useEffect } from 'react';
import { Card } from '../ui/card';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { DollarSign, Calendar, Download, Search, ChevronDown, Home } from 'lucide-react';
import { useProperties } from '../../contexts/PropertiesContext';
import { useAuth } from '../../contexts/AuthContext';
import { generateInvoicePDF } from '../../utils/pdfGenerator';
import { toast } from 'sonner';
import { EmptyState } from './EmptyState';

export function PaymentsView() {
  const [payments, setPayments ] = useState<any[]>([]);
  const { properties } = useProperties();
  const { user } = useAuth();
  const totalCollected = payments
  .filter(p => p.status === 'paid')
  .reduce((sum, p) => 
  sum +
  (
    p.units?.total_monthly||p.amount||0
  ), 0);

const pending = payments
  .filter(p => p.status === 'pending')
  .reduce((sum, p) => 
  sum +
  (
    p.units?.total_monthly||p.amount||0
  ), 0);

const overdue = payments
  .filter(p => p.status === 'overdue')
  .reduce((sum, p) => 
  sum +
  (
    p.units?.total_monthly||p.amount||0
  ), 0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDownloading, setIsDownloading] = useState<string | null>(null);
  useEffect(() => {
  const fetchPayments = async () => {
    const { data, error } = await supabase
      .from('payments')
      .select('*,units!payments_unit_id_fkey(total_monthly,rent,monthly_electricity)')
      .eq('landlord_id',user.id);

    if (error) {
      console.error("Error fetching payments:", error);
      return;
    }

    setPayments(data || []);
  };

  fetchPayments();
}, []);

  // NOTE: This view only displays monthly rent payments
  // Festival and community contribution payments are exclusively managed in the Community page
  
  // Filter payments based on search query
  const filteredPayments = payments.filter((payment: any) =>
  payment.tenant_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  payment.property?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  payment.unit?.toLowerCase().includes(searchQuery.toLowerCase()) ||
  payment.status?.toLowerCase().includes(searchQuery.toLowerCase())
);

  const handleStatusChange = async (paymentId: string, newStatus: 'paid' | 'pending' | 'overdue') => {
  const { error } = await supabase
    .from('payments')
    .update({ status: newStatus })
    .eq('id', paymentId);

  if (error) {
    console.error(error);
    return;
  }

  // refresh UI
  setPayments((prev:any[]) =>
    prev.map((p:any) =>
      p.id === paymentId ? { ...p, status: newStatus } : p
    )
  );
  window.dispatchEvent(new Event('payments-updated'));
};

  // Calculate overdue months for a payment
  const getOverdueMonths = (payment: any) => {
    if (payment.status !== 'overdue') return 0;
    const dueDate =payment.due_date ? new Date(payment.due_date):new Date();
    const today = new Date();
    const monthsDiff = (today.getFullYear() - dueDate.getFullYear()) * 12 + 
                       (today.getMonth() - dueDate.getMonth());
    return Math.max(1, monthsDiff);
  };

  // ============================================================================
  // LANDLORD INVOICE PDF GENERATION
  // ============================================================================
  const handleDownloadInvoice = async (payment: any) => {
    setIsDownloading(payment.id);
    
    try {
      // 1. Fetch tenant details
      const tenantName = payment.tenant_name ||"Tenant";
      
      // 2. Fetch property and unit details
      const property = properties.find(p => p.name === payment.property);
      const unit = property?.units.find(u => u.number === payment.unit);
      
      // 3. Extract month and year from due date
      const dueDate = new Date(payment.due_date);
      const month = dueDate.toLocaleDateString('en-US', { month: 'long' });
      const year = dueDate.getFullYear().toString();
      
      // 4. Generate invoice number (format: INV-YYYY-MM-XXX)
      const invoiceNumber = `INV-${year}-${String(dueDate.getMonth() + 1).padStart(2, '0')}-${payment.id.split('-')[1] || '001'}`;
      
      // 5. Get bill breakdown from property and unit data
      const baseRent = unit?.rent || 0;
      const electricity = unit?.monthlyElectricity || 0;
      const waterBill = property?.propertyCharges?.waterBill || 0;
      const gasBill = property?.propertyCharges?.gasBill || 0;
      const maintenanceFee = property?.propertyCharges?.maintenanceFee || 0;
      
      // 6. Prepare complete invoice data
      const invoiceData = {
        // Invoice Details
        invoiceNumber,
        invoiceMonth: month,
        invoiceYear: year,
        invoiceDate: new Date().toLocaleDateString('en-IN'),
        paymentDate: payment.paid_date ? new Date(payment.paid_date).toLocaleDateString('en-IN') : undefined,
        paymentStatus: payment.status,
        
        // Tenant Details
        tenantName: payment.tenant_name || 'Unknown Tenant',
tenantEmail: payment.tenant_email || 'tenant@example.com',
        
        // Landlord Details
        landlordName: user?.name || 'Property Owner',
        
        // Property Details
        propertyName: payment.property,
        unitNumber: payment.unit,
        
        // Payment Breakdown
        baseRent,
        electricity,
        waterBill,
        gasBill,
        maintenanceFee,
        totalAmount: payment.amount
      };
      
      // 7. Generate and download PDF
      generateInvoicePDF(invoiceData);
      
      // 8. Success notification
      toast.success('Invoice Downloaded', {
        description: `${payment.tenant_name}'s ${month} ${year} invoice downloaded`
      });
      
    } catch (error) {
      console.error('[PAYMENTS VIEW] Error generating invoice:', error);
      toast.error('Download Failed', {
        description: 'Unable to generate invoice. Please try again.'
      });
    } finally {
      setIsDownloading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold mb-1">Payments</h2>
          <p className="text-muted-foreground">Track monthly rent payments</p>
        </div>
      </div>

      {/* Search Bar */}
      {payments.length > 0 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by tenant, property, unit, or status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      )}

      {/* Summary Cards - Auto-synced from global state */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Collected</p>
              <p className="text-2xl font-semibold text-primary">₹{totalCollected.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Amount</p>
              <p className="text-2xl font-semibold text-orange-500">₹{pending.toLocaleString()}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Overdue Payments</p>
              <p className="text-2xl font-semibold text-red-500">₹{overdue.toLocaleString()}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payments Table */}
      {filteredPayments.length === 0 ? (
        <Card className="p-8 md:p-12 bg-gradient-to-br from-primary/5 to-accent/5">
          <EmptyState
            icon={DollarSign}
            title="No Payments Yet"
            description="Once you add properties and tenants, you'll be able to track rent payments, festival contributions, and other transactions here."
            actionLabel="View Properties"
            onAction={() => {
              alert('Navigate to Properties tab to add properties and tenants!');
            }}
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
                    <TableHead>Date</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Property</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{new Date(payment.due_date).toLocaleDateString()}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{payment.tenant_name}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">
                          {payment.property}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground">{payment.unit}</span>
                      </TableCell>
                      <TableCell>
  <span className="font-semibold text-primary">
    ₹{payment.units?.total_monthly||payment.amount|| 0}
  </span>
</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="relative inline-block">
                            <select
                              value={payment.status}
                              onChange={(e) => handleStatusChange(payment.id, e.target.value as 'paid' | 'pending' | 'overdue')}
                              className={`appearance-none text-xs font-medium pl-3 pr-8 py-2.5 rounded-lg border border-border bg-background cursor-pointer transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                                payment.status === 'paid'
                                  ? 'text-emerald-600 dark:text-emerald-300'
                                  : payment.status === 'pending'
                                  ? 'text-amber-600 dark:text-amber-300'
                                  : 'text-red-600 dark:text-red-300'
                              }`}
                            >
                              <option value="paid">Paid</option>
                              <option value="pending">Pending</option>
                              <option value="overdue">Overdue</option>
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                          </div>
                          {payment.status === 'overdue' && getOverdueMonths(payment) > 0 && (
                            <p className="text-xs text-red-600 dark:text-red-400">
                              {getOverdueMonths(payment)} {getOverdueMonths(payment) === 1 ? 'month' : 'months'} overdue
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <button 
                          className="p-2 hover:bg-accent/50 rounded-lg transition-colors"
                          title="Download Receipt"
                          onClick={() => handleDownloadInvoice(payment)}
                          disabled={isDownloading === payment.id}
                        >
                          <Download className="w-4 h-4 text-muted-foreground" />
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredPayments.map((payment) => (
              <Card key={payment.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-semibold text-base mb-1">{payment.tenant_name}</h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
                      <span className="text-xs">{new Date(payment.dueDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary text-lg">
  ₹{payment.units?.total_monthly||payment.amount||0}
</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-3 pb-3 border-b border-border">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Property</p>
                    <p className="text-sm font-medium">{payment.property}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Unit</p>
                    <div className="flex items-center gap-1.5">
                      <Home className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-sm font-medium">{payment.unit}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground mb-1.5">Status</p>
                    <div className="relative inline-block w-full max-w-[140px]">
                      <select
                        value={payment.status}
                        onChange={(e) => handleStatusChange(payment.id, e.target.value as 'paid' | 'pending' | 'overdue')}
                        className={`w-full appearance-none text-xs font-medium pl-3 pr-8 py-2.5 rounded-lg border border-border bg-background cursor-pointer transition-all hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 ${
                          payment.status === 'paid'
                            ? 'text-emerald-600 dark:text-emerald-300'
                            : payment.status === 'pending'
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-red-600 dark:text-red-300'
                        }`}
                      >
                        <option value="paid">Paid</option>
                        <option value="pending">Pending</option>
                        <option value="overdue">Overdue</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                    </div>
                    {payment.status === 'overdue' && getOverdueMonths(payment) > 0 && (
                      <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                        {getOverdueMonths(payment)} {getOverdueMonths(payment) === 1 ? 'month' : 'months'} overdue
                      </p>
                    )}
                  </div>
                  <button 
                    className="p-3 hover:bg-accent/50 rounded-lg transition-colors flex-shrink-0"
                    title="Download Receipt"
                    onClick={() => handleDownloadInvoice(payment)}
                    disabled={isDownloading === payment.id}
                  >
                    <Download className="w-5 h-5 text-muted-foreground" />
                  </button>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}