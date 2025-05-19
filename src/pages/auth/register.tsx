import React, { useState, useEffect } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import useAuthStore from '@/store/auth-store';
import { registerSchema } from '@/lib/validations/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, Lock, Mail, User, Building, Building2, EyeOff, Eye, InfoIcon, HelpCircle, AtSign } from 'lucide-react';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ModeToggle } from '@/components/theme/mode-toggle';
import { isDevelopment } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

type FormData = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { isAuthenticated, register: registerUser, isLoading, error, clearError } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Get tenant subdomain from URL if present
  const subdomain = window.location.hostname.split('.')[0];
  const isCustomSubdomain = subdomain !== 'localhost' && subdomain !== 'affiliate-platform';

  // Form defaults
  const formDefaults = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    companyName: '',
    tenant: isCustomSubdomain ? subdomain : '',
    acceptTerms: false
  };

  const form = useForm<FormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: formDefaults,
  });

  // Clear any existing errors when component loads
  useEffect(() => {
    clearError();
  }, [clearError]);

  const onSubmit = async (data: FormData) => {
    clearError();
    setSuccessMessage(null);
    
    // Double-check password matching
    if (data.password !== data.confirmPassword) {
      form.setError('confirmPassword', { 
        type: 'manual', 
        message: 'Passwords do not match' 
      });
      return;
    }
    
    try {
      await registerUser({
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        password: data.password,
        confirmPassword: data.confirmPassword,
        companyName: data.companyName,
        tenant: data.tenant,
        acceptTerms: data.acceptTerms
      });
      
      // Show success message
      setSuccessMessage('Your account has been created successfully!');
      
      // Also show a toast
      toast({
        title: 'Registration Successful',
        description: 'Welcome to Affiliate Pro! Your account has been created.',
      });
      
      // Navigate to dashboard after short delay
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (err: any) {
      console.error('Registration error:', err);
      
      // Enhanced error logging - log complete response details
      console.error('Server response:', err.response?.data);
      
      // More detailed debugging
      console.error('=== DETAILED ERROR INFORMATION ===');
      console.error('Error message:', err.message);
      console.error('Error name:', err.name);
      console.error('Error code:', err.code);
      console.error('Response status:', err.response?.status);
      console.error('Response headers:', err.response?.headers);
      console.error('Request config:', {
        url: err.config?.url,
        method: err.config?.method,
        headers: err.config?.headers
      });
      console.error('================================');
      
      // Handle specific error types
      let errorMessage = 'An error occurred during registration.';
      
      // Get more specific error details from response
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response?.data?.details) {
        // For validation errors that return details array
        const details = err.response.data.details;
        if (Array.isArray(details) && details.length > 0) {
          // Format validation errors
          errorMessage = details.map(d => `${d.field}: ${d.message}`).join(', ');
        } else {
          errorMessage = JSON.stringify(details);
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      // Show more specific toast based on error type
      if (errorMessage.includes('subdomain') || errorMessage.includes('tenant')) {
        toast({
          title: 'Subdomain Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMessage.includes('email')) {
        toast({
          title: 'Email Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else if (errorMessage.includes('password')) {
        toast({
          title: 'Password Error',
          description: errorMessage,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Registration Failed',
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
        title: 'Registration Failed',
        description: error.message || 'An error occurred during registration.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  // Redirect if already logged in
  if (isAuthenticated && !successMessage) {
    return <Navigate to="/" replace />;
  }

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
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            <div className="space-y-1.5 text-center mb-6">
              <h1 className="text-2xl font-bold tracking-tight">Create an account</h1>
              <p className="text-muted-foreground text-sm">
                Enter your details to create a new account
              </p>
            </div>
            
            {successMessage && (
              <Alert className="mb-6 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900">
                <div className="h-4 w-4 text-green-600 dark:text-green-400" />
                <AlertTitle className="text-green-800 dark:text-green-400">Success</AlertTitle>
                <AlertDescription className="text-green-700 dark:text-green-400">
                  {successMessage}
                </AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="John" className="pl-10" disabled={isLoading} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last name</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Doe" className="pl-10" disabled={isLoading} {...field} />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="password"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
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
                        <FormDescription className="text-xs">
                          Must contain at least 8 characters, one uppercase, one lowercase, one number, and one special character.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm Password</FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                              type={showConfirmPassword ? "text" : "password"}
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
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <Eye className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="sr-only">
                                {showConfirmPassword ? "Hide password" : "Show password"}
                              </span>
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="companyName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company name</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="Acme Inc"
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
                  name="tenant"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center gap-2">
                        <FormLabel>Subdomain</FormLabel>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-5 w-5" type="button">
                                <HelpCircle className="h-3 w-3" />
                                <span className="sr-only">Subdomain information</span>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-80">
                              <p>This will be the unique identifier for your account and will be used in your URL (e.g., <strong>{field.value || 'yourcompany'}</strong>.affiliate-pro.com)</p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      <FormControl>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                          <Input
                            placeholder="company"
                            className="pl-10"
                            disabled={isLoading || isCustomSubdomain}
                            {...field}
                          />
                        </div>
                      </FormControl>
                      <FormDescription className="text-xs">
                        Use only lowercase letters, numbers, and hyphens. No spaces.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="acceptTerms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-sm font-medium">
                          Accept terms and conditions
                        </FormLabel>
                        <FormDescription className="text-xs">
                          I agree to the{' '}
                          <Link to="/terms" className="text-primary hover:underline" target="_blank" rel="noopener">
                            terms of service
                          </Link>
                          {' '}and{' '}
                          <Link to="/privacy" className="text-primary hover:underline" target="_blank" rel="noopener">
                            privacy policy
                          </Link>
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                {error && (
                  <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                    {error.message || 'Failed to register. Please check your information and try again.'}
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isLoading || !!successMessage}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : successMessage ? (
                    "Redirecting..."
                  ) : (
                    "Create account"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-6 pt-5 text-center text-sm border-t">
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <Link to="/login" className="font-medium text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Register;