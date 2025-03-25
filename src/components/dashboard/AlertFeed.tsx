import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, Wallet, Zap, ArrowRight, Timer } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for demonstration
const mockAlerts = [
  {
    id: "1",
    type: "top_trader_buy",
    title: "Top Trader Buy",
    description: "Alpha Whale bought 2.5M TFIGHT",
    timestamp: new Date().getTime() - 1000 * 60 * 2, // 2 minutes ago
    priority: "high" as const,
  },
  {
    id: "2",
    type: "new_token",
    title: "New Token Launch",
    description: "TrenchFighter (TFIGHT) launched by watched creator",
    timestamp: new Date().getTime() - 1000 * 60 * 10, // 10 minutes ago
    priority: "medium" as const,
  },
  {
    id: "3",
    type: "wallet_movement",
    title: "Wallet Movement",
    description: "Smart Money wallet active after 2 weeks",
    timestamp: new Date().getTime() - 1000 * 60 * 15, // 15 minutes ago
    priority: "medium" as const,
  },
  {
    id: "4",
    type: "top_trader_buy",
    title: "Top Trader Buy",
    description: "Blue Chip Investor bought 950K ALPHA",
    timestamp: new Date().getTime() - 1000 * 60 * 23, // 23 minutes ago
    priority: "high" as const,
  },
  {
    id: "5",
    type: "volume_spike",
    title: "Volume Spike",
    description: "PUMP volume increased 320% in 5 minutes",
    timestamp: new Date().getTime() - 1000 * 60 * 28, // 28 minutes ago
    priority: "medium" as const,
  },
  {
    id: "6",
    type: "new_token",
    title: "New Token Launch",
    description: "SnipeToken (SNIPE) launched",
    timestamp: new Date().getTime() - 1000 * 60 * 35, // 35 minutes ago
    priority: "low" as const,
  },
];

export function AlertFeed() {
  const [alerts, setAlerts] = React.useState(mockAlerts);
  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());

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
  alert: {
    id: string;
    type: string;
    title: string;
    description: string;
    timestamp: number;
    priority: "high" | "medium" | "low";
  };
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
