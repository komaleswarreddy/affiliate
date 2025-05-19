import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Eye, EyeOff, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { ModeToggle } from '@/components/theme/mode-toggle';
import authService from '@/services/auth-service';
import { isDevelopment } from '@/lib/utils';

const resetPasswordSchema = z.object({
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type FormData = z.infer<typeof resetPasswordSchema>;

export function ResetPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    // Validate token
    if (!token || !email) {
      setIsTokenValid(false);
      return;
    }

    const validateToken = async () => {
      if (isDevelopment) {
        // In development, just assume the token is valid
        return;
      }
      
      try {
        // In production, validate the token with the backend
        await authService.validateResetToken(token);
      } catch (err) {
        console.error('Invalid or expired token:', err);
        setIsTokenValid(false);
      }
    };

    validateToken();
  }, [token, email]);

  const form = useForm<FormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    if (!token || !email) return;
    
    setIsLoading(true);
    setError(null);

    try {
      if (isDevelopment) {
        // In development, just simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
      } else {
        // In production, call the actual API
        await authService.updatePassword({ token, password: data.password });
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to reset password:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    navigate('/login');
  };

  if (!isTokenValid) {
    return (
      <div className="min-h-screen flex flex-col">
        <header className="px-6 py-4 flex items-center justify-between border-b w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative size-8 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
              <Lock className="h-4 w-4 text-primary" />
            </div>
            <span className="text-xl font-bold tracking-tight">Affiliate Pro</span>
          </Link>
          <ModeToggle />
        </header>
        
        <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
          <div className="w-full max-w-md">
            <div className="rounded-lg border bg-card p-8 shadow-sm text-center space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-destructive/20">
                <Lock className="h-6 w-6 text-destructive" />
              </div>
              <h2 className="text-2xl font-semibold">Invalid or expired link</h2>
              <p className="text-muted-foreground text-sm">
                This password reset link is invalid or has expired. Please request a new password reset link.
              </p>
              <div className="mt-6 pt-4 border-t">
                <Button asChild className="gap-2">
                  <Link to="/forgot-password">
                    Request new reset link
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="px-6 py-4 flex items-center justify-between border-b w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <Link to="/" className="flex items-center gap-2">
          <div className="relative size-8 overflow-hidden rounded-md bg-primary/10 flex items-center justify-center">
            <Lock className="h-4 w-4 text-primary" />
          </div>
          <span className="text-xl font-bold tracking-tight">Affiliate Pro</span>
        </Link>
        <ModeToggle />
      </header>
      
      <main className="flex-1 flex items-center justify-center p-6 bg-gradient-to-b from-background to-muted/30">
        <div className="w-full max-w-md">
          <div className="rounded-lg border bg-card p-8 shadow-sm">
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold">Password reset successful</h2>
                <p className="text-muted-foreground text-sm">
                  Your password has been reset successfully. You can now login with your new password.
                </p>
                <div className="mt-6 pt-4 border-t">
                  <Button onClick={handleLoginRedirect} className="gap-2">
                    Go to login
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 text-center mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Reset password</h1>
                  <p className="text-muted-foreground text-sm">
                    Enter your new password below
                  </p>
                </div>

                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>New Password</FormLabel>
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
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
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

                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>Password must contain:</p>
                      <ul className="list-disc pl-4 space-y-0.5">
                        <li>At least 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                      </ul>
                    </div>

                    {error && (
                      <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                        {error.message || 'Failed to reset password. Please try again.'}
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
                          Resetting password...
                        </>
                      ) : (
                        "Reset password"
                      )}
                    </Button>
                  </form>
                </Form>

                <div className="mt-6 pt-5 text-center text-sm border-t">
                  <Button asChild variant="link" size="sm" className="gap-1">
                    <Link to="/login">
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Back to login
                    </Link>
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
} 