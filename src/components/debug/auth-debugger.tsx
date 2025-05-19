import React, { useState, useEffect } from 'react';
import useAuthStore from '@/store/auth-store';
import { isDevelopment } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { runAllTests } from '@/lib/auth-test';

/**
 * Auth Debugger Component
 * 
 * Displays the current authentication state and provides buttons to test auth functionality.
 * Only visible in development mode.
 */
const AuthDebugger: React.FC = () => {
  // Skip rendering in production
  if (!isDevelopment) return null;
  
  const { isAuthenticated, user, isLoading, error, logout, loadUserData } = useAuthStore();
  const [expanded, setExpanded] = useState(false);
  const [running, setRunning] = useState(false);
  
  // Function to run tests
  const handleRunTests = async () => {
    setRunning(true);
    try {
      await runAllTests();
    } catch (error) {
      console.error('Error running tests:', error);
    } finally {
      setRunning(false);
    }
  };
  
  // Function to reload user data
  const handleReloadUser = async () => {
    setRunning(true);
    try {
      await loadUserData();
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setRunning(false);
    }
  };
  
  // Function to logout
  const handleLogout = async () => {
    setRunning(true);
    try {
      await logout();
    } catch (error) {
      console.error('Error logging out:', error);
    } finally {
      setRunning(false);
    }
  };
  
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 rounded-lg border bg-background shadow-md" data-auth-debugger>
      <div className="flex items-center justify-between p-2 border-b">
        <h3 className="text-sm font-semibold">Auth Debugger (Dev Mode)</h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setExpanded(!expanded)}
          className="h-6 w-6 p-0"
        >
          {expanded ? '−' : '+'}
        </Button>
      </div>
      
      {expanded && (
        <div className="p-2 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-medium">Status:</span>
            <span 
              className={`px-2 py-0.5 rounded-full ${
                isAuthenticated 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              {isLoading ? 'Loading...' : isAuthenticated ? 'Authenticated' : 'Not Authenticated'}
            </span>
          </div>
          
          {user && (
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="user">
                <AccordionTrigger className="text-xs py-1">User Details</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-1 rounded-md bg-muted p-2">
                    <div><span className="font-medium">ID:</span> {user.id}</div>
                    <div><span className="font-medium">Email:</span> {user.email}</div>
                    <div><span className="font-medium">Name:</span> {user.firstName} {user.lastName}</div>
                    <div><span className="font-medium">Tenant:</span> {user.tenantId}</div>
                    <div><span className="font-medium">Role:</span> {user.isAdmin ? 'Admin' : 'User'}</div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}
          
          {error && (
            <div className="rounded-md bg-destructive/15 p-2 text-destructive">
              <strong>Error:</strong> {error.message}
            </div>
          )}
          
          <div className="flex gap-2 justify-end pt-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleReloadUser}
              disabled={running}
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Reload User
            </Button>
            
            {isAuthenticated && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleLogout}
                disabled={running}
              >
                {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                Logout
              </Button>
            )}
            
            <Button 
              variant="default" 
              size="sm"
              onClick={handleRunTests}
              disabled={running}
            >
              {running ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
              Run Tests
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuthDebugger; 