import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import useAuthStore from '@/store/auth-store';
import useTenantStore from '@/store/tenant-store';
import { useSubscription } from '@/hooks/use-subscription';
import { PlanRestricted } from '@/components/subscription/plan-restricted';

// Validation schema for inviting an affiliate
const inviteSchema = z.object({
  email: z.string().email({ message: 'Please enter a valid email address' }),
  tier: z.string().min(1, { message: 'Please select a tier' }),
  initialCommission: z.coerce.number()
    .min(0, { message: 'Commission must be at least 0%' })
    .max(100, { message: 'Commission cannot exceed 100%' })
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface InviteFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  currentAffiliateCount: number;
}

export function AffiliateInviteForm({ onSuccess, onCancel, currentAffiliateCount }: InviteFormProps) {
  const { inviteAffiliate, hasPermission } = useAuthStore();
  const { tenant } = useTenantStore();
  const { isOnTrial, planLimits } = useSubscription();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Set up form with default values
  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
      tier: 'bronze',
      initialCommission: 10
    }
  });

  // Handle form submission
  const onSubmit = async (data: InviteFormData) => {
    try {
      setIsSubmitting(true);
      
      // Call the auth store's inviteAffiliate method
      await inviteAffiliate(data.email);
      
      toast({
        title: 'Invitation Sent',
        description: `An invitation has been sent to ${data.email}`,
      });
      
      // Reset form and call success callback
      form.reset();
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to send invitation',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if user has appropriate permissions
  const canInviteAffiliates = hasPermission('affiliates:invite');

  return (
    <PlanRestricted 
      feature="maxAffiliates" 
      currentCount={currentAffiliateCount}
      fallback={
        <div className="space-y-4">
          <div className="text-center p-6 border border-dashed rounded-lg">
            <h3 className="text-lg font-medium">Affiliate Limit Reached</h3>
            <p className="text-sm text-muted-foreground mt-2">
              You've reached the maximum of {planLimits.maxAffiliates} affiliates 
              allowed on your {isOnTrial ? 'trial' : tenant?.subscriptionTier} plan.
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.href = '/settings/billing'}
            >
              Upgrade Plan
            </Button>
          </div>
        </div>
      }
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email Address</FormLabel>
                <FormControl>
                  <Input
                    placeholder="affiliate@example.com"
                    type="email"
                    disabled={isSubmitting || !canInviteAffiliates}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Enter the email address of the affiliate you want to invite.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="tier"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Initial Tier</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={isSubmitting || !canInviteAffiliates}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>
                  The starting tier for this affiliate.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="initialCommission"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Commission Rate (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    disabled={isSubmitting || !canInviteAffiliates}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  The initial commission rate for this affiliate.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {!canInviteAffiliates && (
            <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-4 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                You don't have permission to invite affiliates. Please contact your administrator.
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            {onCancel && (
              <Button
                type="button"
                variant="outline" 
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            )}
            <Button 
              type="submit"
              disabled={isSubmitting || !canInviteAffiliates}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </Form>
    </PlanRestricted>
  );
} 