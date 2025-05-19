import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Mail, Lock, Loader2, ArrowLeft, CheckCircle } from 'lucide-react';
import { ModeToggle } from '@/components/theme/mode-toggle';
import useAuthStore from '@/store/auth-store';
import authService from '@/services/auth-service';
import { isDevelopment } from '@/lib/utils';

const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  tenant: z.string().default('demo'),
});

type FormData = z.infer<typeof forgotPasswordSchema>;

export function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
      tenant: 'demo',
    },
  });

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    setError(null);

    try {
      if (isDevelopment) {
        // In development, just simulate success
        await new Promise(resolve => setTimeout(resolve, 1000));
        setIsSuccess(true);
      } else {
        // In production, call the actual API
        await authService.requestPasswordReset({
          email: data.email,
          tenant: data.tenant
        });
        setIsSuccess(true);
      }
    } catch (err) {
      setError(err as Error);
      console.error('Failed to request password reset:', err);
    } finally {
      setIsLoading(false);
    }
  };

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
            {isSuccess ? (
              <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/20">
                  <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h2 className="text-2xl font-semibold">Check your email</h2>
                <p className="text-muted-foreground text-sm">
                  We've sent a password reset link to your email address. Please check your inbox and follow the instructions.
                </p>
                <div className="mt-6 pt-4 border-t">
                  <Button asChild variant="outline" className="gap-2">
                    <Link to="/login">
                      <ArrowLeft className="h-4 w-4" />
                      Back to login
                    </Link>
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-1.5 text-center mb-6">
                  <h1 className="text-2xl font-bold tracking-tight">Forgot password?</h1>
                  <p className="text-muted-foreground text-sm">
                    No worries, we'll send you reset instructions
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

                    {error && (
                      <div className="rounded-md bg-destructive/15 px-4 py-3 text-sm text-destructive">
                        {error.message || 'Failed to send reset email. Please try again.'}
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
                          Sending...
                        </>
                      ) : (
                        "Send reset link"
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