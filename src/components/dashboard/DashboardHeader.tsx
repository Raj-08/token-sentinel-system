
import React from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Bell, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardHeader() {
  const [audioEnabled, setAudioEnabled] = React.useState(true);

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mb-8">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor real-time token activity and top trader movements
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            className={cn(
              "relative overflow-hidden transition-all duration-300",
              audioEnabled ? "text-primary" : "text-muted-foreground"
            )}
            onClick={() => setAudioEnabled(!audioEnabled)}
          >
            {audioEnabled && (
              <span className="absolute inset-0 bg-primary/5 animate-pulse-glow rounded-md" />
            )}
            <Zap className="mr-2 h-4 w-4" />
            <span>{audioEnabled ? "Audio Alerts On" : "Audio Alerts Off"}</span>
          </Button>
          <Button variant="outline" size="sm" className="relative">
            <Bell className="mr-2 h-4 w-4" />
            <span>Notifications</span>
            <span className="notification-badge absolute top-0 right-0 -mt-1 -mr-1">
              <span className="notification-badge-dot"></span>
            </span>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard 
          label="Live Alerts" 
          value="18" 
          delta="+4"
          status="increase" 
        />
        <StatsCard 
          label="Tracked Wallets" 
          value="37" 
          delta="+2"
          status="increase" 
        />
        <StatsCard 
          label="New Tokens Today" 
          value="142" 
          delta="-12%"
          status="decrease" 
        />
        <StatsCard 
          label="Top Trader Activity" 
          value="High" 
          delta="+28%"
          status="increase" 
        />
      </div>
    </div>
  );
}

interface StatsCardProps {
  label: string;
  value: string;
  delta: string;
  status: "increase" | "decrease" | "neutral";
}

function StatsCard({ label, value, delta, status }: StatsCardProps) {
  return (
    <Card className="p-4 overflow-hidden token-card">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <p className="text-2xl font-bold">{value}</p>
        <p className={cn(
          "text-xs font-medium",
          status === "increase" && "text-success",
          status === "decrease" && "text-destructive",
          status === "neutral" && "text-muted-foreground"
        )}>
          {delta}
        </p>
      </div>
    </Card>
  );
}
