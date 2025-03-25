
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Wallet, Zap, ArrowRight, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import socketService, { Alert } from "@/services/socketService";

export function AlertFeed() {
  const [alerts, setAlerts] = React.useState<Alert[]>([]);
  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());

  // Connect to socket service when component mounts
  useEffect(() => {
    // Initial data
    setAlerts(socketService.getAlerts());
    
    // Listen for updates
    const handleAlertsUpdate = (newAlerts: Alert[]) => {
      setAlerts(newAlerts);
    };
    
    socketService.addEventListener("alertsUpdate", handleAlertsUpdate);
    
    // Clean up
    return () => {
      socketService.removeEventListener("alertsUpdate", handleAlertsUpdate);
    };
  }, []);

  // Update current time every second to refresh relative timestamps
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 token-card h-full animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Live Alerts</CardTitle>
        <Badge variant="outline" className="font-normal">
          Real-time
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} currentTime={currentTime} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: Alert;
  currentTime: number;
}

function AlertCard({ alert, currentTime }: AlertCardProps) {
  const timeAgo = getTimeAgo(alert.timestamp, currentTime);
  
  return (
    <div className={cn(
      "group flex items-start gap-3 rounded-lg border p-3 transition-all hover:bg-accent",
      alert.priority === "high" && "ring-1 ring-primary/20",
      alert.priority === "medium" && "ring-1 ring-primary/10",
    )}>
      <div className={cn(
        "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
        alert.priority === "high" && "bg-primary/10 text-primary animate-pulse-glow",
        alert.priority === "medium" && "bg-primary/5 text-primary/80",
        alert.priority === "low" && "bg-muted text-muted-foreground",
      )}>
        {alert.type === "top_trader_buy" && <Wallet className="h-4 w-4" />}
        {alert.type === "new_token" && <Zap className="h-4 w-4" />}
        {alert.type === "wallet_movement" && <ArrowRight className="h-4 w-4" />}
        {alert.type === "volume_spike" && <Bell className="h-4 w-4" />}
      </div>
      
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <h3 className="font-medium">{alert.title}</h3>
          {alert.priority === "high" && (
            <Badge variant="secondary" className="bg-primary/20 text-primary text-xs font-normal">Priority</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">{alert.description}</p>
        <div className="flex items-center text-xs text-muted-foreground">
          <Timer className="mr-1 h-3 w-3" />
          <span>{timeAgo}</span>
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp: number, currentTime: number): string {
  const seconds = Math.floor((currentTime - timestamp) / 1000);
  
  if (seconds < 60) return `${seconds}s ago`;
  
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
