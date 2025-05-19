import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUpDown, FileSpreadsheet, MoreHorizontal, PlusCircle, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from '@/components/ui/command';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AffiliateInviteForm } from '@/components/affiliate/invite-form';
import useAuthStore from '@/store/auth-store';
import { useSubscription } from '@/hooks/use-subscription';

export default function Affiliates() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [selectedAffiliate, setSelectedAffiliate] = useState<string | null>(null);
  const { hasPermission } = useAuthStore();
  const { planLimits } = useSubscription();
  const { toast } = useToast();

  // Sample affiliate data
  const affiliates = [
    {
      id: '1',
      name: 'Jane Smith',
      email: 'jane@example.com',
      status: 'active',
      joinDate: '2025-01-15',
      earnings: 3675,
      sales: 24500,
      referralCode: 'JANE2025',
      clicks: 1256,
      conversions: 85,
      conversionRate: '6.77%',
      activeLinks: 5,
      paymentMethod: 'PayPal',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Gold'
    },
    {
      id: '2',
      name: 'Alex Johnson',
      email: 'alex@example.com',
      status: 'active',
      joinDate: '2025-02-01',
      earnings: 2812.50,
      sales: 18750,
      referralCode: 'ALEX2025',
      clicks: 856,
      conversions: 62,
      conversionRate: '7.24%',
      activeLinks: 3,
      paymentMethod: 'Bank Transfer',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Silver'
    },
    {
      id: '3',
      name: 'Lisa Brown',
      email: 'lisa@example.com',
      status: 'active',
      joinDate: '2025-02-15',
      earnings: 2280,
      sales: 15200,
      referralCode: 'LISA2025',
      clicks: 723,
      conversions: 45,
      conversionRate: '6.22%',
      activeLinks: 4,
      paymentMethod: 'Wise',
      lastPayout: '2025-02-01',
      nextPayout: '2025-03-01',
      tier: 'Bronze'
    }
  ];

  // Filter affiliates by search query
  const filteredAffiliates = searchQuery
    ? affiliates.filter(
        affiliate =>
          affiliate.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affiliate.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          affiliate.referralCode.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : affiliates;

  // Check permissions
  const canManageAffiliates = hasPermission('affiliates:manage');

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Affiliates</h1>
          <p className="text-muted-foreground">Manage your affiliate partners</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="icon">
            <FileSpreadsheet className="h-4 w-4" />
          </Button>
          
          <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!canManageAffiliates}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Invite Affiliate
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Invite New Affiliate</DialogTitle>
                <DialogDescription>
                  Send an invitation to a new affiliate to join your program.
                </DialogDescription>
              </DialogHeader>
              <AffiliateInviteForm 
                onSuccess={() => setIsInviteDialogOpen(false)}
                onCancel={() => setIsInviteDialogOpen(false)}
                currentAffiliateCount={affiliates.length}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search affiliates..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="h-8 px-2 lg:px-3">
                Filters
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[200px] p-0">
              <Command>
                <CommandInput placeholder="Filter by..." />
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup>
                  <CommandItem>Status: Active</CommandItem>
                  <CommandItem>Status: Pending</CommandItem>
                  <CommandItem>Tier: Gold</CommandItem>
                  <CommandItem>Tier: Silver</CommandItem>
                  <CommandItem>Tier: Bronze</CommandItem>
                </CommandGroup>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-0">
          <CardTitle>Affiliates</CardTitle>
          <CardDescription>
            You have {affiliates.length} affiliates of {planLimits.maxAffiliates} allowed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Affiliate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead className="text-right">Sales</TableHead>
                <TableHead className="text-right">Earnings</TableHead>
                <TableHead className="text-right">Conv. Rate</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAffiliates.map(affiliate => (
                <TableRow key={affiliate.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${affiliate.name}`} />
                        <AvatarFallback>{affiliate.name.split(' ').map(n => n[0]).join('')}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{affiliate.name}</p>
                        <p className="text-sm text-muted-foreground">{affiliate.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={affiliate.status === 'active' ? 'default' : 'secondary'}
                    >
                      {affiliate.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{affiliate.tier}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(affiliate.sales)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(affiliate.earnings)}
                  </TableCell>
                  <TableCell className="text-right">
                    {affiliate.conversionRate}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => 
                            window.location.href = `/affiliates/${affiliate.id}`
                          }
                        >
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>Edit</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          Send Message
                        </DropdownMenuItem>
                        {affiliate.status === 'active' ? (
                          <DropdownMenuItem className="text-destructive focus:text-destructive">
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem>
                            Activate
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
              
              {filteredAffiliates.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-6">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Search className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="space-y-1">
                        <p className="text-lg font-medium">No affiliates found</p>
                        <p className="text-sm text-muted-foreground">
                          {searchQuery 
                            ? `No affiliates match "${searchQuery}"`
                            : "You haven't added any affiliates yet"}
                        </p>
                      </div>
                      {!searchQuery && (
                        <Button
                          onClick={() => setIsInviteDialogOpen(true)}
                          disabled={!canManageAffiliates}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Invite Your First Affiliate
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
        {!canManageAffiliates && (
          <CardFooter className="bg-yellow-50 dark:bg-yellow-900/20 border-t">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              You don't have permission to manage affiliates. Please contact your administrator.
            </p>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}