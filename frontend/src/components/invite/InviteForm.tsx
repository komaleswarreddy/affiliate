import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { usePlanRestriction } from '../../hooks/usePlanRestriction';
import { PlanRestricted, PlanUpgradePrompt } from '../common/PlanRestricted';

// Form validation schema
const inviteSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export function InviteForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, tenant } = useAuthStore();

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
    },
  });

  // Fetch current affiliate count for limit checking
  const [affiliateCount, setAffiliateCount] = useState(0);

  // Fetch current affiliates count
  const fetchAffiliateCount = async () => {
    if (!tenant) return;

    try {
      const { count, error } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .eq('tenant_id', tenant.id)
        .eq('role', 'affiliate');

      if (error) throw error;
      setAffiliateCount(count || 0);
    } catch (err) {
      console.error('Error fetching affiliate count:', err);
    }
  };

  // Check if an invite already exists
  const checkExistingInvite = async (email: string) => {
    if (!tenant) return false;

    try {
      const { data, error } = await supabase
        .from('invites')
        .select('*')
        .eq('tenant_id', tenant.id)
        .eq('email', email)
        .is('accepted_at', null);

      if (error) throw error;
      return data && data.length > 0;
    } catch (err) {
      console.error('Error checking existing invite:', err);
      return false;
    }
  };

  const onSubmit = async (data: InviteFormData) => {
    if (!user || !tenant) return;
    
    setIsSubmitting(true);
    setSuccess(false);
    setError(null);

    try {
      // Check if invite already exists
      const inviteExists = await checkExistingInvite(data.email);
      if (inviteExists) {
        setError('An invite has already been sent to this email');
        setIsSubmitting(false);
        return;
      }

      // Create invite
      const { error: inviteError } = await supabase.from('invites').insert({
        email: data.email,
        tenant_id: tenant.id,
        role: 'affiliate',
        created_by: user.id,
      });

      if (inviteError) throw inviteError;

      // Success!
      setSuccess(true);
      reset();
      fetchAffiliateCount(); // Refresh count after successful invite
    } catch (err) {
      console.error('Error sending invite:', err);
      setError('Failed to send invite. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Fetch affiliate count on mount
  useState(() => {
    fetchAffiliateCount();
  });

  return (
    <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
      <div className="flex flex-col space-y-1.5">
        <h3 className="text-2xl font-semibold leading-none tracking-tight">Invite Affiliate</h3>
        <p className="text-sm text-muted-foreground">
          Invite a new affiliate to join your team.
        </p>
      </div>
      
      <PlanRestricted 
        feature="maxAffiliates" 
        currentCount={affiliateCount} 
        checkLimit
        fallback={<PlanUpgradePrompt feature="maxAffiliates" />}
      >
        {success && (
          <div className="p-4 mt-4 mb-4 text-sm text-green-700 bg-green-100 rounded-lg" role="alert">
            Invite sent successfully!
          </div>
        )}

        {error && (
          <div className="p-4 mt-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              placeholder="affiliate@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          <div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </button>
          </div>
        </form>
      </PlanRestricted>
    </div>
  );
} 