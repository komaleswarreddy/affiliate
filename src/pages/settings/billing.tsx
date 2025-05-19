import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, CreditCard, Download, DollarSign, LucideIcon, Package, TrendingUp, Unlock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useSubscription } from "@/hooks/use-subscription";
import useTenantStore from "@/store/tenant-store";
import { SUBSCRIPTION_PLANS } from "@/lib/config/plans";

interface ResourceUsageProps {
  label: string;
  current: number;
  max: number;
  icon: LucideIcon;
}

function ResourceUsage({ label, current, max, icon: Icon }: ResourceUsageProps) {
  const percentage = Math.round((current / max) * 100);
  
  return (
    <div className="p-4 border rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="font-medium">{label}</p>
        </div>
        <Badge variant={percentage > 90 ? "destructive" : percentage > 70 ? "warning" : "outline"}>
          {current}/{max}
        </Badge>
      </div>
      <Progress value={percentage} className="h-2" />
      <p className="text-xs text-muted-foreground">{percentage}% of limit used</p>
    </div>
  );
}

export default function Billing() {
  const { isOnTrial, subscriptionTier, planLimits } = useSubscription();
  const { tenant } = useTenantStore();
  
  // Calculate days remaining in trial if applicable
  const getDaysRemaining = () => {
    if (!isOnTrial || !tenant?.expiresAt) return 0;
    
    const now = new Date();
    const expiry = new Date(tenant.expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  };
  
  // Find the current plan details
  const currentPlan = SUBSCRIPTION_PLANS.find(plan => plan.id === subscriptionTier) || SUBSCRIPTION_PLANS[0];
  
  // Mock usage data (in a real app, this would come from the backend)
  const usageData = {
    affiliates: 5,
    users: 2,
    tiers: 1,
    products: 3,
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">Manage your subscription and billing details</p>
        </div>
        
        {isOnTrial && (
          <Button asChild>
            <Link to="/settings/upgrade">
              <Unlock className="mr-2 h-4 w-4" />
              Upgrade Plan
            </Link>
          </Button>
        )}
      </div>

      {isOnTrial && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Trial Status
            </CardTitle>
            <CardDescription>
              Your free trial ends in <span className="font-semibold">{getDaysRemaining()}</span> days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p>
                You're currently on a free trial with limited features. Upgrade to a paid plan to unlock all features and continue using the platform after your trial ends.
              </p>
              <Button asChild>
                <Link to="/settings/upgrade">View Plans & Upgrade</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-2">
              {isOnTrial ? 'Trial' : currentPlan.name}
              {!isOnTrial && (
                <Badge variant="outline" className="ml-1 text-xs font-normal">
                  {subscriptionTier}
                </Badge>
              )}
            </div>
            {!isOnTrial && (
              <p className="text-xs text-muted-foreground">
                ${currentPlan.monthlyPrice}/month
              </p>
            )}
          </CardContent>
        </Card>

        {!isOnTrial && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Next Payment</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${currentPlan.monthlyPrice}</div>
              <p className="text-xs text-muted-foreground">
                Due on {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Billing Cycle</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Monthly</div>
            <p className="text-xs text-muted-foreground">
              {isOnTrial ? 'During trial' : 'Auto-renews monthly'}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resource Usage</CardTitle>
          <CardDescription>Your current usage against your plan limits</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <ResourceUsage 
              label="Affiliates" 
              current={usageData.affiliates} 
              max={planLimits.maxAffiliates}
              icon={TrendingUp}
            />
            
            <ResourceUsage 
              label="Users" 
              current={usageData.users} 
              max={planLimits.maxUsers}
              icon={CreditCard}
            />
            
            <ResourceUsage 
              label="Commission Tiers" 
              current={usageData.tiers} 
              max={planLimits.maxTiers}
              icon={TrendingUp}
            />
            
            <ResourceUsage 
              label="Products" 
              current={usageData.products} 
              max={planLimits.maxProducts}
              icon={Package}
            />
          </div>
        </CardContent>
      </Card>

      {!isOnTrial && (
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>View and download past invoices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  amount: `$${currentPlan.monthlyPrice}`,
                  status: "Upcoming",
                  invoice: null
                },
                {
                  date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  amount: `$${currentPlan.monthlyPrice}`,
                  status: "Paid",
                  invoice: "INV-2025-002"
                },
                {
                  date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toLocaleDateString(),
                  amount: `$${currentPlan.monthlyPrice}`,
                  status: "Paid",
                  invoice: "INV-2025-001"
                }
              ].map((payment, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{payment.date}</p>
                    <p className="text-sm text-muted-foreground">{payment.amount}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={payment.status === "Paid" ? "default" : "secondary"}>
                      {payment.status}
                    </Badge>
                    {payment.invoice && (
                      <Download className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="flex justify-between items-center mt-8">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">Need help with billing?</h3>
          <p className="text-sm text-muted-foreground">Contact our support team for assistance.</p>
        </div>
        <Button variant="outline">Contact Support</Button>
      </div>
    </div>
  );
}