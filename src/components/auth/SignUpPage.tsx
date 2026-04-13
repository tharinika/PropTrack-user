import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GradientButton } from '../GradientButton';
import { Building2, Lock, Mail, User, AlertCircle, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from '../Logo';

interface SignUpPageProps {
  onBack: () => void;
}

export function SignUpPage({ onBack }: SignUpPageProps) {
  
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  // Real-time email validation
  const validateEmail = (email: string): string => {
    if (email.length === 0) return '';
    
    if (!email.toLowerCase().endsWith('@gmail.com')) {
      return 'Email must be a valid Gmail address ending with @gmail.com';
    }

    return '';
  };

  // Real-time password validation
  const validatePassword = (pwd: string): string => {
    if (pwd.length === 0) return '';
    
    const hasUpperCase = /[A-Z]/.test(pwd);
    const hasLowerCase = /[a-z]/.test(pwd);
    const hasNumber = /\d/.test(pwd);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd);

    if (!hasUpperCase) {
      return 'Password must include at least one uppercase letter';
    }
    if (!hasLowerCase) {
      return 'Password must include at least one lowercase letter';
    }
    if (!hasNumber) {
      return 'Password must include at least one numeric digit';
    }
    if (!hasSpecialChar) {
      return 'Password must include at least one special character';
    }

    return '';
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      fullName.trim().length >= 2 &&
      email.trim().length > 0 &&
      emailError === '' &&
      password.length > 0 &&
      passwordError === '' &&
      confirmPassword.length > 0 &&
      password === confirmPassword
    );
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    
    // Validate password in real-time
    const error = validatePassword(newPassword);
    setPasswordError(error);

    // Also check confirm password match if it has a value
    if (confirmPassword.length > 0) {
      if (newPassword !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);

    // Validate confirm password matches
    if (newConfirmPassword.length > 0 && password !== newConfirmPassword) {
      setConfirmPasswordError('Passwords do not match');
    } else {
      setConfirmPasswordError('');
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Validate email in real-time
    const error = validateEmail(newEmail);
    setEmailError(error);
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');

  if (fullName.trim().length < 2) {
    setError('Please enter your full name');
    return;
  }

  const pwdError = validatePassword(password);
  if (pwdError) {
    setError(pwdError);
    return;
  }

  if (password !== confirmPassword) {
    setError('Passwords do not match');
    return;
  }

  setIsLoading(true);

  // 🔥 CREATE USER IN SUPABASE AUTH
  const { error } = await supabase.auth.signUp({
    email,
    password,
  });

  if (error) {
    setError(error.message);
    setIsLoading(false);
    return;
  }

  // 🔥 SAVE EXTRA DATA (YOUR TABLE)
  const { error: dbError } = await supabase.from('users').insert([
    {
      name: fullName,
      email: email,
      role: 'landlord'
    }
  ]);

  if (dbError) {
    setError(dbError.message);
    setIsLoading(false);
    return;
  }

  setIsLoading(false);
  onBack(); // go to login
};
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-background p-4">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-card border border-border rounded-2xl shadow-2xl p-8">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to login</span>
          </button>

          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo size="xl" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-muted-foreground mt-2">
              Start managing your properties today
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive"
            >
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </motion.div>
          )}

          {/* Sign Up Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <div className="relative mt-1.5">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={handleEmailChange}
                  className="pl-10 bg-input-background border-border"
                  required
                />
              </div>
              {emailError && (
                <p className="text-xs text-red-500 mt-1.5">
                  {emailError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={handlePasswordChange}
                  className="pl-10 pr-10 bg-input-background border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                Must be at least 8 characters
              </p>
              {passwordError && (
                <p className="text-xs text-red-500 mt-1.5">
                  {passwordError}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="pl-10 pr-10 bg-input-background border-border"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Eye className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </button>
              </div>
              {confirmPasswordError && (
                <p className="text-xs text-red-500 mt-1.5">
                  {confirmPasswordError}
                </p>
              )}
            </div>

            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-foreground mb-1">Welcome Benefits:</p>
                <ul className="text-muted-foreground space-y-1">
                  <li>• Manage unlimited properties</li>
                  <li>• Track tenants and payments</li>
                  <li>• AI-powered insights</li>
                  <li>• 24/7 maintenance tracking</li>
                </ul>
              </div>
            </div>

            <GradientButton
              type="submit"
              className="w-full"
              disabled={isLoading || !isFormValid()}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </GradientButton>
          </form>

          {/* Sign In Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Already have an account?{' '}
              <button
                type="button"
                onClick={onBack}
                className="font-semibold text-primary hover:text-accent transition-colors underline decoration-primary/30 hover:decoration-accent/50"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}