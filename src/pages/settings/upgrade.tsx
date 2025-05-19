import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, CreditCard, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { SUBSCRIPTION_PLANS } from '@/lib/config/plans';
import { useSubscription } from '@/hooks/use-subscription';
import useTenantStore from '@/store/tenant-store';
import { useToast } from '@/hooks/use-toast';

export default function UpgradePage() {
  const navigate = useNavigate();
  const { isOnTrial, subscriptionTier } = useSubscription();
  const { tenant, updateTenantPlan } = useTenantStore();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  // If not on trial and already subscribed, redirect to billing
  React.useEffect(() => {
    if (!isOnTrial && subscriptionTier !== 'trial') {
      navigate('/settings/billing');
    }
  }, [isOnTrial, subscriptionTier, navigate]);

  // Calculate days remaining in trial
  const getDaysRemaining = () => {
    if (!tenant?.expiresAt) return 0;
    
    const now = new Date();
    const expiry = new Date(tenant.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };

  const handleUpgrade = async (planId: string) => {
    try {
      setIsProcessing(true);
      
      // In a real application, this would:
      // 1. Process payment
      // 2. Update subscription in the database
      // 3. Update local state
      
      // For demo purposes, just update the plan in the tenant store
      await updateTenantPlan(planId);
      
      toast({
        title: 'Subscription Updated',
        description: `Your subscription has been upgraded to ${planId}.`,
      });
      
      // Redirect to billing page
      navigate('/settings/billing');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update subscription. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl p-6 space-y-8">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Upgrade Your Plan</h1>
        {isOnTrial && (
          <p className="text-muted-foreground">
            Your trial ends in <span className="font-semibold">{getDaysRemaining()} days</span>. 
            Choose a plan to continue using all features.
          </p>
        )}
      </div>

      <div className="flex justify-center mb-8">
        <Tabs defaultValue="monthly" className="w-full max-w-md mx-auto">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="monthly" onClick={() => setBillingCycle('monthly')}>
              Monthly
            </TabsTrigger>
            <TabsTrigger value="yearly" onClick={() => setBillingCycle('yearly')}>
              Yearly <Badge variant="secondary" className="ml-2">Save 15%</Badge>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {SUBSCRIPTION_PLANS.map((plan) => (
          <Card 
            key={plan.id} 
            className={`flex flex-col ${plan.isPopular ? 'border-primary shadow-md' : ''}`}
          >
            <CardHeader>
              {plan.isPopular && (
                <Badge className="self-start mb-2">Most Popular</Badge>
              )}
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-4">
                <span className="text-3xl font-bold">
                  ${billingCycle === 'monthly' ? plan.monthlyPrice : plan.yearlyPrice / 12}
                </span>
                <span className="text-muted-foreground">/month</span>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-muted-foreground">billed annually (${plan.yearlyPrice}/year)</p>
                )}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <ul className="space-y-2 text-sm">
                {plan.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-primary mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full" 
                onClick={() => handleUpgrade(plan.id)}
                disabled={isProcessing || subscriptionTier === plan.id}
                variant={plan.isPopular ? 'default' : 'outline'}
              >
                {subscriptionTier === plan.id ? 'Current Plan' : 'Select Plan'}
                {!(subscriptionTier === plan.id) && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <div className="rounded-lg border p-6 mt-8">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="p-3 rounded-full bg-primary/10">
            <CreditCard className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-medium">Need a Custom Plan?</h3>
            <p className="text-muted-foreground">
              For larger organizations or specialized requirements, get in touch with our sales team.
            </p>
          </div>
          <Button variant="outline">Contact Sales</Button>
        </div>
      </div>

      <div className="text-sm text-muted-foreground text-center">
        By upgrading, you agree to our <a href="/terms" className="underline">Terms of Service</a> and <a href="/privacy" className="underline">Privacy Policy</a>.
        <br />
        All prices are in USD and exclude applicable taxes.
      </div>
    </div>
  );
} 