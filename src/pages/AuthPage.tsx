import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BackgroundWrapper from '@/components/layout/BackgroundWrapper';
import Logo from '@/components/layout/Logo';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().trim().email({ message: "Invalid email address" }).max(255);
const passwordSchema = z.string().min(6, { message: "Password must be at least 6 characters" }).max(100);

type AuthMode = 'signin' | 'signup' | 'forgot';

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; confirmPassword?: string }>({});
  
  const { signIn, signUp, resetPassword } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};
    
    const emailResult = emailSchema.safeParse(email);
    if (!emailResult.success) {
      newErrors.email = emailResult.error.errors[0]?.message;
    }
    
    if (mode !== 'forgot') {
      const passwordResult = passwordSchema.safeParse(password);
      if (!passwordResult.success) {
        newErrors.password = passwordResult.error.errors[0]?.message;
      }
      
      if (mode === 'signup' && password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) {
          toast({
            title: "Sign In Failed",
            description: error.message === 'Invalid login credentials' 
              ? 'Invalid email or password. Please try again.' 
              : error.message,
            variant: "destructive",
          });
        } else {
          navigate('/');
        }
      } else if (mode === 'signup') {
        const { error, hasSession } = await signUp(email, password);
        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Account Exists",
              description: "This email is already registered. Please sign in instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Sign Up Failed",
              description: error.message,
              variant: "destructive",
            });
          }
        } else if (!hasSession) {
          toast({
            title: "Check Your Email",
            description: "Follow the link we sent you to confirm your account.",
          });
          setMode('signin');
        } else {
          toast({
            title: "Welcome!",
            description: "Your account has been created successfully.",
          });
          navigate('/');
        }
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) {
          toast({
            title: "Error",
            description: error.message,
            variant: "destructive",
          });
        } else {
          toast({
            title: "Check Your Email",
            description: "Password reset instructions have been sent to your email.",
          });
          setMode('signin');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((show) => !show)}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
      disabled={loading}
      className="absolute inset-y-0 right-0 flex items-center px-3 text-muted-foreground hover:text-primary transition-colors disabled:opacity-50"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  );

  return (
    <BackgroundWrapper>
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm space-y-8 fade-in">
          <Logo size="lg" />
          
          <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-6 border border-border shadow-card">
            <h2 className="font-oswald text-2xl font-bold text-center uppercase tracking-wide text-foreground mb-6">
              {mode === 'signin' && 'Sign In'}
              {mode === 'signup' && 'Create Account'}
              {mode === 'forgot' && 'Reset Password'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-muted-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="bg-muted border-border text-foreground"
                  disabled={loading}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>
              
              {mode !== 'forgot' && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-muted-foreground">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-muted border-border text-foreground pr-10"
                      disabled={loading}
                    />
                    {passwordToggle}
                  </div>
                  {errors.password && (
                    <p className="text-sm text-destructive">{errors.password}</p>
                  )}
                </div>
              )}
              
              {mode === 'signup' && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-muted-foreground">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="bg-muted border-border text-foreground pr-10"
                      disabled={loading}
                    />
                    {passwordToggle}
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                  )}
                </div>
              )}
              
              <Button
                type="submit"
                variant="hero"
                size="full"
                disabled={loading}
                className="mt-6"
              >
                {loading ? 'Please wait...' : (
                  mode === 'signin' ? 'Sign In' :
                  mode === 'signup' ? 'Create Account' :
                  'Send Reset Link'
                )}
              </Button>
            </form>
            
            <div className="mt-6 space-y-2 text-center">
              {mode === 'signin' && (
                <>
                  <button
                    type="button"
                    onClick={() => setMode('forgot')}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    Forgot password?
                  </button>
                  <p className="text-sm text-muted-foreground">
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => setMode('signup')}
                      className="text-primary hover:underline font-semibold"
                    >
                      Sign Up
                    </button>
                  </p>
                </>
              )}
              
              {mode === 'signup' && (
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => setMode('signin')}
                    className="text-primary hover:underline font-semibold"
                  >
                    Sign In
                  </button>
                </p>
              )}
              
              {mode === 'forgot' && (
                <button
                  type="button"
                  onClick={() => setMode('signin')}
                  className="text-sm text-primary hover:underline font-semibold"
                >
                  Back to Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </BackgroundWrapper>
  );
};

export default AuthPage;
