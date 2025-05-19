import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '@/store/auth-store';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  BarChart3,
  Users,
  CreditCard,
  FileText,
  Settings,
  Link as LinkIcon,
  ChevronsUpDown,
  UserPlus,
  Wallet,
  LineChart,
  Megaphone
} from 'lucide-react';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Individual sidebar item
const SidebarItem = ({ href, icon, title, isCurrent, badge }) => {
  return (
    <Link
      to={href}
      className={cn(
        "flex items-center justify-between rounded-md px-3 py-2 text-sm transition-colors",
        isCurrent
          ? "bg-accent text-accent-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{title}</span>
      </div>
      {badge && (
        <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-medium text-primary">
          {badge}
        </span>
      )}
    </Link>
  );
};

// Collapsible group of sidebar items
const SidebarGroup = ({ title, icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between py-2 px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-md transition-colors">
        <div className="flex items-center gap-3">
          {icon}
          <span>{title}</span>
        </div>
        <ChevronsUpDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </CollapsibleTrigger>
      <CollapsibleContent className="pl-6 pt-1">
        {children}
      </CollapsibleContent>
    </Collapsible>
  );
};

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuthStore();

  // Check if the current path matches a given path
  const isActivePath = (path) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  return (
    <aside className="w-64 border-r bg-background h-[calc(100vh-4rem)] overflow-hidden">
      <ScrollArea className="flex-1 py-2 px-4 h-full">
        <div className="space-y-1">
          {/* Dashboard */}
          <SidebarItem
            href="/"
            icon={<BarChart3 className="h-4 w-4" />}
            title="Dashboard"
            isCurrent={isActivePath('/')}
          />
          
          {/* Affiliate Management */}
          <SidebarGroup 
            title="Affiliate Management" 
            icon={<Users className="h-5 w-5" />}
            defaultOpen={isActivePath('/affiliates')}
          >
            <SidebarItem
              href="/affiliates"
              icon={<Users className="h-4 w-4" />}
              title="All Affiliates"
              isCurrent={isActivePath('/affiliates')}
            />
            <SidebarItem
              href="/affiliates/pending"
              icon={<UserPlus className="h-4 w-4" />}
              title="Pending Approvals"
              isCurrent={isActivePath('/affiliates/pending')}
              badge={3}
            />
          </SidebarGroup>
          
          {/* Financial */}
          <SidebarGroup 
            title="Financial" 
            icon={<CreditCard className="h-5 w-5" />}
            defaultOpen={isActivePath('/commissions') || isActivePath('/payments')}
          >
            <SidebarItem
              href="/commissions"
              icon={<Wallet className="h-4 w-4" />}
              title="Commissions"
              isCurrent={isActivePath('/commissions')}
            />
            <SidebarItem
              href="/payments"
              icon={<CreditCard className="h-4 w-4" />}
              title="Payments"
              isCurrent={isActivePath('/payments')}
            />
          </SidebarGroup>
          
          {/* Reports */}
          <SidebarItem
            href="/reports"
            icon={<FileText className="h-4 w-4" />}
            title="Reports"
            isCurrent={isActivePath('/reports')}
          />
          
          {/* Marketing */}
          <SidebarGroup 
            title="Marketing" 
            icon={<Megaphone className="h-5 w-5" />}
            defaultOpen={isActivePath('/campaigns') || isActivePath('/creatives')}
          >
            <SidebarItem
              href="/campaigns"
              icon={<LineChart className="h-4 w-4" />}
              title="Campaigns"
              isCurrent={isActivePath('/campaigns')}
            />
            <SidebarItem
              href="/creatives"
              icon={<LinkIcon className="h-4 w-4" />}
              title="Creatives & Links"
              isCurrent={isActivePath('/creatives')}
            />
          </SidebarGroup>
          
          {/* Settings */}
          <SidebarItem
            href="/settings"
            icon={<Settings className="h-4 w-4" />}
            title="Settings"
            isCurrent={isActivePath('/settings')}
          />
        </div>
      </ScrollArea>
    </aside>
  );
};

export default Sidebar;