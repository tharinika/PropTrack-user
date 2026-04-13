import React, { useState} from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { GradientButton } from '../GradientButton';
import { Copy, CheckCircle2, Upload, X } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import { useAuth } from '../../contexts/AuthContext';
import { useProperties } from '../../contexts/PropertiesContext';
import { useAppData } from '../../contexts/AppDataContext';

interface UpiPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  landlordName: string;
  rentAmount: number;
  qrCodeUrl: string;
  upiId?: string;
}

export function UpiPaymentDialog({
  open,
  onOpenChange,
  rentAmount,
  qrCodeUrl,
  upiId
}: UpiPaymentDialogProps) {
  const { user } = useAuth();
  const { properties } = useProperties();
  const { payments, updatePaymentStatus, addPayment } = useAppData();
  const [paymentScreenshot, setPaymentScreenshot] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  

  // Get tenant's property and unit
  const tenantProperty = properties.find(p => p.id === user?.propertyId);
  const tenantUnit = tenantProperty?.units.find(u => u.id === user?.unitId);

  const handleCopyUpiId = () => {
    if (upiId) {
      navigator.clipboard.writeText(upiId);
      toast.success('UPI ID Copied', {
        description: 'UPI ID has been copied to clipboard'
      });
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.match('image/(png|jpg|jpeg)')) {
        toast.error('Invalid file type', {
          description: 'Please upload a PNG or JPG image'
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setPaymentScreenshot(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveScreenshot = () => {
    setPaymentScreenshot(null);
  };

  const handleConfirmPayment = async () => {
    setIsConfirming(true);
    
    // Simulate payment confirmation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Calculate next due date (always 1st of month)
    const today = new Date();
    let nextDueDate = new Date(today.getFullYear(), today.getMonth(), 1);
    if (today.getDate() > 1) {
      nextDueDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    }
    
    // Find the current month's payment record and update it
    const currentMonthPayment = payments.find(p => 
      p.tenantId === user?.id && 
      new Date(p.dueDate).getMonth() === nextDueDate.getMonth() &&
      new Date(p.dueDate).getFullYear() === nextDueDate.getFullYear()
    );
    
    if (currentMonthPayment) {
      // Update existing payment record
      updatePaymentStatus(
        currentMonthPayment.id, 
        'paid', 
        new Date().toISOString(),
        'upi'
      );
    } else {
      // Create new payment record if it doesn't exist
      addPayment({
        tenantId: user?.id || '',
        tenantName: user?.name || '',
        propertyId: user?.propertyId || '',
        property: tenantProperty?.name || '',
        unit: tenantUnit?.number || user?.unitNumber || '',
        amount: rentAmount,
        dueDate: nextDueDate.toISOString(),
        status: 'paid',
        paidDate: new Date().toISOString(),
        method: 'upi'
      });
    }
    
    setIsConfirming(false);
    setIsSuccess(true);

    // Close after showing success
    setTimeout(() => {
      setIsSuccess(false);
      setPaymentScreenshot(null);
      onOpenChange(false);
      
      toast.success('Payment Submitted', {
        description: 'Your payment has been submitted for verification'
      });
    }, 2000);
  };

  const handleClose = () => {
    setPaymentScreenshot(null);
    setIsSuccess(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle>Pay Rent via UPI</DialogTitle>
          <DialogDescription>
            Scan the QR code below to pay your rent securely
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Payment Submitted!</h3>
            <p className="text-muted-foreground">Your payment is pending verification by the landlord</p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Title: Scan to Pay */}
            <div className="text-center mb-2">
              <h3 className="text-2xl font-bold mb-1">Scan to Pay</h3>
              <p className="text-sm text-muted-foreground">
                Scan this QR code using any UPI app (GPay, PhonePe, Paytm)
              </p>
            </div>

            {/* Amount Display */}
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-background border border-primary/20 rounded-lg p-4">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-1">Amount to Pay</p>
                <h3 className="text-3xl font-bold text-primary">₹{rentAmount.toLocaleString()}</h3>
              </div>
            </div>

            {/* QR Code */}
            {/* Payment Method */}
<div className="border-2 border-primary/30 rounded-xl p-6 bg-white dark:bg-muted/30 text-center">

  {qrCodeUrl ? (
    <>
      <img 
        src={qrCodeUrl}
        alt="UPI QR Code"
        className="w-full max-w-[250px] mx-auto rounded-lg"
      />
      <p className="text-xs text-muted-foreground mt-2">
        Scan QR using any UPI app
      </p>
    </>
  ) : upiId ? (
    <>
      <p className="text-sm text-muted-foreground mb-2">UPI ID</p>

      <div className="flex gap-2 items-center justify-center">
        <div className="px-3 py-2 bg-muted rounded-lg font-mono text-sm break-all">
          {upiId}
        </div>

        <Button size="sm" variant="outline" onClick={handleCopyUpiId}>
          <Copy className="w-4 h-4" />
        </Button>
      </div>

      <p className="text-xs text-muted-foreground mt-2">
        Copy & pay using any UPI app
      </p>
    </>
  ) : (
    <p className="text-sm text-muted-foreground">
      No payment method configured
    </p>
  )}

</div>

            {/* Tenant & Property Info */}
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Tenant</span>
                <span className="font-medium">{user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Property</span>
                <span className="font-medium">{tenantProperty?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-sm text-muted-foreground">Unit</span>
                <span className="font-medium">{tenantUnit?.number || user?.unitNumber || 'N/A'}</span>
              </div>
            </div>

            {/* UPI ID (if available) */}
            {/* UPI ID (if available) */}
{upiId&& (
  <div className="space-y-2">
    <Label className="text-sm font-medium">UPI ID</Label>
    <div className="flex gap-2">
      <div className="flex-1 px-3 py-2 bg-muted rounded-lg font-mono text-sm break-all">
        {upiId}
      </div>
      <Button 
        variant="outline" 
        size="sm"
        onClick={handleCopyUpiId}
        className="gap-1 flex-shrink-0"
      >
        <Copy className="w-4 h-4" />
        Copy
      </Button>
    </div>
  </div>
)}

            {/* Payment Screenshot Upload (Optional) */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Screenshot (Optional)</Label>
              <p className="text-xs text-muted-foreground mb-2">
                Upload a screenshot of your payment for faster verification
              </p>
              
              {paymentScreenshot ? (
                <div className="relative">
                  <div className="border-2 border-primary/30 rounded-lg p-3 bg-muted/30">
                    <img 
                      src={paymentScreenshot} 
                      alt="Payment Screenshot" 
                      className="w-full max-w-[200px] mx-auto rounded-lg"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveScreenshot}
                    className="absolute top-1 right-1 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <label htmlFor="screenshot-upload">
                  <div className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm font-medium mb-1">Upload Screenshot</p>
                    <p className="text-xs text-muted-foreground">PNG or JPG</p>
                  </div>
                  <input
                    id="screenshot-upload"
                    type="file"
                    accept="image/png,image/jpg,image/jpeg"
                    onChange={handleScreenshotUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Confirmation Note */}
            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3">
              <p className="text-xs text-muted-foreground">
                By clicking "I Have Paid", you confirm that you have completed the payment. 
                Your landlord will verify and approve the transaction.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleClose}
                className="flex-1"
                disabled={isConfirming}
              >
                Cancel
              </Button>
              <GradientButton 
                onClick={handleConfirmPayment}
                className="flex-1"
                disabled={isConfirming}
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                {isConfirming ? 'Submitting...' : 'I Have Paid'}
              </GradientButton>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}