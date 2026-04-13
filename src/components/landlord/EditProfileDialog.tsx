import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Eye, EyeOff, Upload, X, QrCode, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner@2.0.3';

interface EditProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  scrollToPayment?: boolean;
}

export function EditProfileDialog({ open, onOpenChange, scrollToPayment = false }: EditProfileDialogProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation error states
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // UPI Payment Details states
  const [upiId, setUpiId] = useState(user?.upiId || '');
  const [qrCodePreview, setQrCodePreview] = useState<string | null>(user?.upiQrCodeUrl || null);
  const [isDragging, setIsDragging] = useState(false);

  // Ref for payment section
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to payment section when opened from "Setup Now" button
  useEffect(() => {
    if (open && scrollToPayment && paymentSectionRef.current) {
      // Small delay to ensure modal is fully rendered
      setTimeout(() => {
        paymentSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  }, [open, scrollToPayment]);

  // Get the actual stored password for the current user
  const getStoredPassword = (): string | null => {
    // For demo accounts
    if (user?.email === 'landlord@proptrack.com' || user?.email === 'tenant@proptrack.com') {
      return 'demo123'; // Demo account default password
    }

    // For regular signed up accounts
    const savedAccounts = localStorage.getItem('proptrack_accounts');
    if (savedAccounts) {
      const accounts = JSON.parse(savedAccounts);
      const account = accounts.find((acc: any) => acc.email === user?.email);
      return account ? account.password : null;
    }

    return null;
  };

  // Validate current password
  const validateCurrentPassword = (password: string): boolean => {
    const storedPassword = getStoredPassword();
    return password === storedPassword;
  };

  // Validate new password requirements
  const validateNewPassword = (password: string): { isValid: boolean; message: string } => {
    if (password.length < 8) {
      return { isValid: false, message: 'Password must be at least 8 characters long.' };
    }
    if (!/[A-Z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one uppercase letter.' };
    }
    if (!/[a-z]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one lowercase letter.' };
    }
    if (!/[0-9]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one number.' };
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return { isValid: false, message: 'Password must contain at least one special character.' };
    }
    if (password === formData.currentPassword) {
      return { isValid: false, message: 'New password must be different from current password.' };
    }
    return { isValid: true, message: '' };
  };

  // Handle current password blur
  const handleCurrentPasswordBlur = () => {
    if (formData.currentPassword && !validateCurrentPassword(formData.currentPassword)) {
      setCurrentPasswordError('Current password is incorrect.');
    } else {
      setCurrentPasswordError('');
    }
  };

  // Handle current password change
  const handleCurrentPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, currentPassword: value });
    
    // Clear error if corrected
    if (value && validateCurrentPassword(value)) {
      setCurrentPasswordError('');
    }
    
    // Re-validate new password when current password changes
    if (formData.newPassword) {
      const validation = validateNewPassword(formData.newPassword);
      setNewPasswordError(validation.message);
    }
  };

  // Handle new password blur
  const handleNewPasswordBlur = () => {
    if (formData.newPassword) {
      const validation = validateNewPassword(formData.newPassword);
      setNewPasswordError(validation.message);
    }
  };

  // Handle new password change
  const handleNewPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, newPassword: value });
    
    if (value) {
      const validation = validateNewPassword(value);
      setNewPasswordError(validation.message);
    } else {
      setNewPasswordError('');
    }
    
    // Re-validate confirm password
    if (formData.confirmPassword) {
      if (value !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  // Handle confirm password blur
  const handleConfirmPasswordBlur = () => {
    if (formData.confirmPassword && formData.confirmPassword !== formData.newPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Handle confirm password change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, confirmPassword: value });
    
    if (value && value !== formData.newPassword) {
      setConfirmPasswordError('Passwords do not match.');
    } else {
      setConfirmPasswordError('');
    }
  };

  // Check if password change is valid
  const isPasswordChangeValid = (): boolean => {
    if (!formData.currentPassword && !formData.newPassword && !formData.confirmPassword) {
      return true; // No password change requested
    }

    if (formData.currentPassword || formData.newPassword || formData.confirmPassword) {
      // All password fields must be valid
      if (!validateCurrentPassword(formData.currentPassword)) {
        return false;
      }
      
      const newPasswordValidation = validateNewPassword(formData.newPassword);
      if (!newPasswordValidation.isValid) {
        return false;
      }
      
      if (formData.newPassword !== formData.confirmPassword) {
        return false;
      }
    }

    return true;
  };

  // Handle QR Code file upload
  const handleQrCodeUpload = (file: File) => {
    if (!file.type.match('image/(png|jpg|jpeg)')) {
      toast.error('Invalid file type', {
        description: 'Please upload a PNG or JPG image'
      });
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast.error('File too large', {
        description: 'Please upload an image smaller than 5MB'
      });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setQrCodePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleQrCodeUpload(file);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleQrCodeUpload(file);
    }
  };

  // Remove QR code
  const handleRemoveQrCode = () => {
    setQrCodePreview(null);
  };

  const handleSave = async () => {
  try {
    // ===============================
    // 1️⃣ PASSWORD VALIDATION (optional)
    // ===============================
    if (formData.newPassword || formData.confirmPassword || formData.currentPassword) {
      if (!validateCurrentPassword(formData.currentPassword)) {
        setCurrentPasswordError('Current password is incorrect.');
        return;
      }

      const newPasswordValidation = validateNewPassword(formData.newPassword);
      if (!newPasswordValidation.isValid) {
        setNewPasswordError(newPasswordValidation.message);
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        return;
      }
    }

    // ===============================
    // 2️⃣ SAVE UPI + QR TO SUPABASE (ALWAYS RUN)
    // ===============================
    console.log("Saving UPI:", upiId, "User:", user?.id);

    const { error } = await supabase
      .from('landlord_payment_details')
      .upsert(
        {
          landlord_id: user?.id,
          upi_id: upiId,
          qr_code: qrCodePreview,
        },
        { onConflict: 'landlord_id' } // VERY IMPORTANT
      );

    if (error) {
      console.error("UPI SAVE ERROR:", error);
      toast.error("Failed to save payment details");
      return;
    }

    // ===============================
    // 3️⃣ UPDATE PASSWORD (if needed)
    // ===============================
    if (formData.newPassword) {
      const savedAccounts = localStorage.getItem('proptrack_accounts');

      if (savedAccounts) {
        const accounts = JSON.parse(savedAccounts);
        const index = accounts.findIndex((acc: any) => acc.email === user?.email);

        if (index !== -1) {
          accounts[index].password = formData.newPassword;
          localStorage.setItem('proptrack_accounts', JSON.stringify(accounts));
        }
      }
    }

    // ===============================
    // 4️⃣ UPDATE LOCAL USER DATA
    // ===============================
    const savedUser = localStorage.getItem('proptrack_user');

    if (savedUser) {
      const userData = JSON.parse(savedUser);
      userData.upiId = upiId;
      userData.upiQrCodeUrl = qrCodePreview;

      localStorage.setItem('proptrack_user', JSON.stringify(userData));
      window.dispatchEvent(new Event('storage'));
    }

    // ===============================
    // 5️⃣ SUCCESS MESSAGE
    // ===============================
    const changedPassword = !!formData.newPassword;
    const changedPayment = !!upiId || !!qrCodePreview;

    let description = "Profile updated successfully";

    if (changedPassword && changedPayment) {
      description = "Profile, password & payment details updated";
    } else if (changedPassword) {
      description = "Password updated successfully";
    } else if (changedPayment) {
      description = "Payment details updated successfully";
    }

    toast.success("Success", { description });

    // ===============================
    // 6️⃣ CLOSE MODAL + RESET
    // ===============================
    onOpenChange(false);

    setFormData({
      ...formData,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });

    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');

  } catch (err) {
    console.error("HANDLE SAVE ERROR:", err);
    toast.error("Something went wrong");
  }
};

  const handleCancel = () => {
    onOpenChange(false);
    // Reset to original values
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    });
    setCurrentPasswordError('');
    setNewPasswordError('');
    setConfirmPasswordError('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Profile</DialogTitle>
          <DialogDescription>
            Update your profile information, payment details, and password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Enter your full name"
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Enter your email"
            />
          </div>

          {/* Payment Details Section */}
          {user?.role === 'landlord' && (
  <div 
    className={`border-t border-border pt-4 transition-all ${
      scrollToPayment ? 'ring-2 ring-primary/50 rounded-lg p-4 -m-4 mt-0' : ''
    }`} 
    ref={paymentSectionRef}
  >
            <div className="flex items-center gap-2 mb-4">
              <QrCode className="w-5 h-5 text-primary" />
              <h3 className="font-medium">Payment Details</h3>
            </div>
            
            <p className="text-sm text-muted-foreground mb-4">
              Upload your UPI QR code so tenants can pay rent directly
            </p>

            {/* UPI ID */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="upiId">UPI ID (Optional)</Label>
              <Input
                id="upiId"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
                placeholder="example@upi"
              />
            </div>

            {/* QR Code Upload */}
            <div className="space-y-2">
              <Label>Upload UPI QR Code</Label>
              
              {qrCodePreview ? (
                // QR Code Preview
                <div className="relative">
                  <div className="border-2 border-primary/30 rounded-lg p-4 bg-muted/30">
                    <img 
                      src={qrCodePreview} 
                      alt="UPI QR Code" 
                      className="w-full max-w-[200px] mx-auto rounded-lg"
                    />
                    <div className="mt-3 flex items-center justify-center gap-2 text-sm text-primary">
                      <Check className="w-4 h-4" />
                      <span>QR Code uploaded successfully</span>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRemoveQrCode}
                    className="absolute top-2 right-2 bg-background/80 hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                // Upload Area
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <Upload className="w-8 h-8 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm font-medium mb-1">Drag & drop your QR code here</p>
                  <p className="text-xs text-muted-foreground mb-3">or</p>
                  <label htmlFor="qr-upload">
                    <Button variant="outline" size="sm" className="cursor-pointer" asChild>
                      <span>Browse Files</span>
                    </Button>
                    <input
                      id="qr-upload"
                      type="file"
                      accept="image/png,image/jpg,image/jpeg"
                      onChange={handleFileInputChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-xs text-muted-foreground mt-3">PNG or JPG (max 5MB)</p>
                </div>
              )}
            </div>
          </div>)}

          {/* Divider */}
          <div className="border-t border-border pt-4">
            <h3 className="font-medium mb-4">Change Password</h3>

            {/* Current Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="currentPassword">Current Password</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={formData.currentPassword}
                  onChange={handleCurrentPasswordChange}
                  onBlur={handleCurrentPasswordBlur}
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {currentPasswordError && <p className="text-red-500 text-sm mt-1">{currentPasswordError}</p>}
            </div>

            {/* New Password */}
            <div className="space-y-2 mb-4">
              <Label htmlFor="newPassword">New Password</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={formData.newPassword}
                  onChange={handleNewPasswordChange}
                  onBlur={handleNewPasswordBlur}
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {newPasswordError && <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>}
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  onBlur={handleConfirmPasswordBlur}
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {confirmPasswordError && <p className="text-red-500 text-sm mt-1">{confirmPasswordError}</p>}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!isPasswordChangeValid()}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}