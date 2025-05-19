import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuthStore from '@/store/auth-store';
import { loginSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lock, Mail, EyeOff, Eye } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { isDevelopment } from '@/lib/utils';

type FormData = z.infer<typeof loginSchema>;

const Login: React.FC = () => {
  const { isAuthenticated, login, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);

  // Get tenant subdomain from URL if present
  const subdomain = window.location.hostname.split('.')[0];
  const isCustomSubdomain = subdomain !== 'localhost' && subdomain !== 'affiliate-platform';

  const form = useForm<FormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      remember: false,
      tenant: isCustomSubdomain ? subdomain : '',
    },
  });

  // Clear any existing errors when component loads
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: FormData) => {
    clearError();
    try {
      await login(data.email, data.password, data.tenant);
      
      // If successful, show toast notification
      toast({
        title: 'Login Successful',
        description: 'Welcome back to Affiliate Pro',
      });

      // Navigate to dashboard after successful login
      navigate('/');
    } catch (err: any) {
      console.error('Login error:', err);
      
      // Handle specific error types
      let errorMessage = 'An error occurred while logging in.';
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show more specific toast based on error type
      if (errorMessage.includes('tenant')) {
        toast({
          title: 'Tenant Error',
          description: 'The specified tenant/subdomain is invalid or does not exist.',
          variant: 'destructive',
        });
      } else if (errorMessage.includes('credentials')) {
        toast({
          title: 'Authentication Failed',
          description: 'Invalid email or password. Please check your credentials and try again.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Login Failed',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  // Show error toast when error state changes
  useEffect(() => {
    if (error) {
      toast({
        title: 'Login Failed',
        description: error.message || 'An error occurred while logging in.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Redirect if already logged in
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // For development, show login credentials
  const showDevCredentials = isDevelopment && !isAuthenticated;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header with logo and theme toggle */}
      <header className="px-6 py-4 flex items-center justify-between border-b w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative size-8 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Affiliate Pro</span>
        </Link>
        <ModeToggle />
      </header>
      
      {/* Main content - centered */}
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <div className="w-full max-w-md">
          {showDevCredentials && (
            <div className="mb-6 p-4 border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm">
              <h3 className="font-semibold mb-1">Development Mode</h3>
              <p>You can use these demo credentials:</p>
              <ul className="mt-2 space-y-1 text-sm">
                <li><span className="font-medium">Email:</span> demo@example.com</li>
                <li><span className="font-medium">Password:</span> Demo123!</li>
                <li><span className="font-medium">Tenant:</span> demo</li>
              </ul>
            </div>
          )}
          
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="space-y-1.5 text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
              <p className="text-muted-foreground text-sm">
                Enter your credentials to access your account
              </p>
            </div>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            placeholder="name@example.com" 
                            className="pl-10" 
                            disabled={isLoading}
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Password</FormLabel>
                        <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input 
                            type={showPassword ? "text" : "password"} 
                            placeholder="••••••••" 
                            className="pl-10"
                            disabled={isLoading} 
                            {...field} 
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-0 top-0 h-9 w-9"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="sr-only">
                              {showPassword ? "Hide password" : "Show password"}
                            </span>
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isCustomSubdomain && (
                  <FormField
                    control={form.control}
                    name="tenant"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tenant</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="organization" 
                            disabled={isLoading || isCustomSubdomain}
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="remember"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="leading-none">
                        <FormLabel className="text-sm font-normal cursor-pointer">
                          Remember me
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                    {error.message || 'Failed to login. Please check your credentials.'}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 text-center text-sm border-t">
              <p className="text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/register" className="font-medium text-primary hover:underline">
                  Create one now
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Login;