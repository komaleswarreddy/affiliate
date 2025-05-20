import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { supabase } from '../lib/supabase';

interface Credentials {
  email: string;
  password?: string;
  isExistingUser?: boolean;
  message?: string;
}

export const AcceptInvitePage: React.FC = () => {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creds, setCreds] = useState<Credentials | null>(null);
  const [autoLoginLoading, setAutoLoginLoading] = useState(false);
  const [autoLoginError, setAutoLoginError] = useState<string | null>(null);
  const { loginWithEmail } = useAuthStore();

  useEffect(() => {
    let didCancel = false;
    const acceptInvite = async () => {
      if (!inviteId) {
        setError('Invalid invite ID');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setCreds(null);

      try {
        const apiUrl = `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/affiliates/accept-invite/${inviteId}`;
        const res = await fetch(apiUrl, { method: 'POST' });
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to accept invite.');
        }

        if (!didCancel) {
          setCreds(data);
          setLoading(false);
        }
      } catch (err) {
        if (!didCancel) {
          setError(err instanceof Error ? err.message : 'Failed to accept invite. Please try again.');
          setLoading(false);
        }
      }
    };

    acceptInvite();
    return () => { didCancel = true; };
  }, [inviteId]);

  // Handler for new user: auto-login after they click the button
  const handleContinueToDashboard = async () => {
    if (!creds || !creds.email || !creds.password) return;
    setAutoLoginLoading(true);
    setAutoLoginError(null);
    try {
      const { error: loginError } = await loginWithEmail(creds.email, creds.password);
      if (!loginError) {
        navigate('/affiliate-dashboard');
      } else {
        setAutoLoginError(loginError.message || 'Failed to log in. Please try manually.');
      }
    } catch (err) {
      setAutoLoginError(err instanceof Error ? err.message : 'Failed to log in. Please try manually.');
    } finally {
      setAutoLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-lg text-gray-600">Processing your invite, please wait...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4 text-red-600">Invite Error</h1>
            <p className="mb-4 text-red-500">{error}</p>
            <button
              onClick={() => window.location.href = '/login'}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (creds) {
    // Existing user: show already affiliate message
    if (creds.isExistingUser) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-bold mb-4">Welcome back!</h1>
              <p className="mb-6 text-gray-600">You are already an affiliate. Please log in with your existing credentials.</p>
              <div className="space-y-3">
                <button
                  onClick={() => window.location.href = '/login'}
                  className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                >
                  Go to Login
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }
    // New user: show credentials and Continue to Dashboard button
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold mb-4">Welcome to the Affiliate Program!</h1>
            <p className="mb-6 text-gray-600">{creds.message || 'Your account has been successfully created.'}</p>
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-2">Your Login Credentials</h2>
              <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                <p className="mb-2"><span className="font-semibold">Email:</span> {creds.email}</p>
                <p><span className="font-semibold">Password:</span> {creds.password}</p>
              </div>
              <p className="mt-2 text-sm text-gray-500">Please save these credentials for future logins.</p>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleContinueToDashboard}
                className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors disabled:opacity-50"
                disabled={autoLoginLoading}
              >
                {autoLoginLoading ? 'Logging you in...' : 'Continue to Dashboard'}
              </button>
              {autoLoginError && (
                <p className="mt-2 text-sm text-red-500">{autoLoginError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}; 