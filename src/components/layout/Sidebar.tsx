import React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronLeft, Activity, Wallet, Bell, BarChart3, LineChart, Settings, List, Eye } from "lucide-react";

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export function Sidebar({ open, setOpen }: SidebarProps) {
  return (
    <div
      className={cn(
        "fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r bg-card/80 backdrop-blur-xl transition-transform duration-300 ease-in-out lg:static lg:transition-none",
        open ? "translate-x-0" : "-translate-x-full lg:translate-x-0 lg:w-20"
      )}
    >
      <div className="flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="relative h-8 w-8 overflow-hidden rounded-full bg-primary/90">
            <Activity className="h-5 w-5 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
          </div>
          <h1 className={cn("font-semibold tracking-tight text-xl transition-opacity", open ? "opacity-100" : "opacity-0 lg:hidden")}>
            TrenchSniper
          </h1>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="hidden lg:flex"
          onClick={() => setOpen(!open)}
        >
          <ChevronLeft className={cn("h-4 w-4 transition-transform", !open && "rotate-180")} />
          <span className="sr-only">Toggle sidebar</span>
        </Button>
      </div>
      
      <ScrollArea className="flex-1 overflow-auto py-2">
        <nav className="grid gap-1 px-2">
          <NavItem icon={Activity} label="Dashboard" href="/" active={true} expanded={open} />
          <NavItem icon={Wallet} label="Top Wallets" href="/wallets" expanded={open} />
          <NavItem icon={Eye} label="Wallet Tracker" href="/wallet-tracker" expanded={open} />
          <NavItem icon={List} label="Recent Tokens" href="/tokens" expanded={open} />
          <NavItem icon={Bell} label="Notifications" href="/notifications" expanded={open} badge={3} />
          <NavItem icon={BarChart3} label="Market Data" href="/market" expanded={open} />
          <NavItem icon={LineChart} label="Analytics" href="/analytics" expanded={open} />
          <NavItem icon={Settings} label="Settings" href="/settings" expanded={open} />
        </nav>
      </ScrollArea>
      
      <div className="mt-auto p-4">
        <div className={cn("flex items-center justify-between", !open && "lg:justify-center")}>
          <div className={cn("flex items-center gap-2", !open && "lg:hidden")}>
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center">
              <span className="text-xs font-medium">TS</span>
            </div>
            <div className={cn("space-y-0.5", !open && "lg:hidden")}>
              <p className="text-sm font-medium">TrenchSniper Pro</p>
              <p className="text-xs text-muted-foreground">v1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface NavItemProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  active?: boolean;
  expanded: boolean;
  badge?: number;
}

function NavItem({ icon: Icon, label, href, active, expanded, badge }: NavItemProps) {
  return (
    <a
      href={href}
      className={cn(
        "group flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground transition-colors",
        active ? "bg-accent text-accent-foreground" : "transparent"
      )}
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className={cn("transition-opacity", expanded ? "opacity-100" : "opacity-0 hidden lg:block")}>{label}</span>
      {badge && (
        <span className={cn("ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary/90 text-[0.625rem] font-medium text-primary-foreground ring-1 ring-inset ring-primary/25 transition-opacity", 
          expanded ? "opacity-100" : "opacity-0 hidden lg:block")}>
          {badge}
        </span>
      )}
    </a>
  );
}
