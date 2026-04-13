import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { GradientButton } from '../GradientButton';
import { Building2, Lock, Mail, AlertCircle, Eye, EyeOff, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { Logo } from '../Logo';

interface LoginPageProps {
  onForgotPassword: () => void;
  onSignUp: () => void;
}

type UserRole = 'landlord' | 'tenant';

export function LoginPage({ onForgotPassword, onSignUp }: LoginPageProps) {
  const { setUser } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('landlord');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError('');
  setIsLoading(true);

  // 🔐 Step 1: Supabase login
  const { data, error: authError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    setError(error.message);
    setIsLoading(false);
    return;
  }

  // 📦 Step 2: Get user from DB
  const { data: userData, error: dbError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (dbError || !userData) {
    setError("User not found in database");
    setIsLoading(false);
    return;
  }

  // 🔴 👉 ADD THIS HERE (ROLE CHECK)
  if (userData.role !== selectedRole) {
    setError(`You are not registered as ${selectedRole}`);
    setIsLoading(false);
    return;
  }

  // ✅ SUCCESS
  console.log("LOGIN SUCCESS:", userData);
  setUser({
  id: userData.id,
  name: userData.name,
  email: userData.email,
  role: userData.role
});

  setIsLoading(false);

  // 👉 navigate or set user
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
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Logo size="xl" />
            </div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              PropTrack
            </h1>
            <p className="text-muted-foreground mt-2">
              Sign in to your account
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

          {/* Role Selection */}
          <div className="mb-6">
            <Label className="mb-3 block text-center">Select Your Role</Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('landlord');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedRole === 'landlord'
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Building2 className="w-5 h-5" />
                <span>Landlord</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole('tenant');
                  setError('');
                }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
                  selectedRole === 'tenant'
                    ? 'bg-gradient-to-r from-primary to-accent text-white shadow-lg scale-105'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <UserCircle className="w-5 h-5" />
                <span>Tenant</span>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="email">Email Address</Label>
              <div className="relative mt-1.5">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-input-background border-border"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1.5">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
            </div>

            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={onForgotPassword}
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <GradientButton
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </GradientButton>
          </form>

          {/* Sign Up Prompt */}
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              Are you a new landlord?{' '}
              <button
                type="button"
                onClick={onSignUp}
                className="font-semibold text-primary hover:text-accent transition-colors underline decoration-primary/30 hover:decoration-accent/50"
              >
                Sign up
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}