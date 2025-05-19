import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import useAuthStore from '@/store/auth-store';
import { Toaster } from '@/components/ui/toaster';
import { ModeToggle } from '@/components/theme/mode-toggle';
import Sidebar from '@/components/layout/sidebar';
import Header from '@/components/layout/header';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error, resetErrorBoundary: () => void }) => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="p-6 max-w-sm mx-auto bg-card rounded-lg shadow-md">
      <h2 className="text-xl font-bold text-destructive mb-2">Something went wrong</h2>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button 
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  </div>
);

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorFallback 
          error={this.state.error as Error} 
          resetErrorBoundary={() => this.setState({ hasError: false, error: null })} 
        />
      );
    }

    return this.props.children;
  }
}

const AppShell: React.FC = () => {
  const { loadUserData, isLoading, isAuthenticated, user } = useAuthStore();
  const { toast } = useToast();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [hasAttemptedLoad, setHasAttemptedLoad] = useState(false);

  useEffect(() => {
    // Load user data when component mounts, but only if not already loaded
    const loadData = async () => {
      // Skip if we've already attempted to load or if user data is already available
      if (hasAttemptedLoad || (isAuthenticated && user)) {
        return;
      }
      
      try {
        console.log('Loading user data from AppShell');
        await loadUserData();
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error loading profile',
          description: 'Could not load your profile. Please try again later.',
          variant: 'destructive',
        });
      } finally {
        setHasAttemptedLoad(true);
      }
    };
    
    // Create a timeout to show fallback UI if loading takes too long
    const timeout = setTimeout(() => {
      if (isLoading) {
        setLoadingTimedOut(true);
      }
    }, 5000); // 5 seconds timeout
    
    loadData();
    
    return () => {
      clearTimeout(timeout);
    };
  }, [loadUserData, toast, isAuthenticated, user, hasAttemptedLoad]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">
            {loadingTimedOut 
              ? 'Still loading... This is taking longer than expected.' 
              : 'Loading your dashboard...'}
          </p>
        </div>
      </div>
    );
  }

  // If not authenticated but not loading, this will be handled by the PrivateRoute
  // We just render the AppShell structure with the outlet for the routes to handle

  return (
    <AppErrorBoundary>
      <div className="min-h-screen flex flex-col">
        {/* Only render header when we have user data */}
        {isAuthenticated && user && <Header />}
        
        <div className="flex flex-1 overflow-hidden">
          {/* Only render sidebar when authenticated */}
          {isAuthenticated && <Sidebar />}
          
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
            <Outlet />
          </main>
        </div>
        <div className="fixed bottom-4 right-4 z-50">
          <ModeToggle />
        </div>
        <Toaster />
      </div>
    </AppErrorBoundary>
  );
};

export default AppShell;