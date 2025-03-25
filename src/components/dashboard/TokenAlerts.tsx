
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Star, Timer, Wallet } from "lucide-react";

// Mock data for demonstration purposes
const mockTokens = [
  {
    id: "1",
    address: "9xQsRsR23xhKTGGnzxpuVJQJHyfYQBVno1VcNmrJj6Z",
    name: "TrenchFighter",
    symbol: "TFIGHT",
    createdAt: new Date().getTime() - 1000 * 60 * 10, // 10 minutes ago
    creator: "AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    isCreatorWatched: true,
    trades: 18,
    topTradersBuying: 2,
  },
  {
    id: "2",
    address: "2YsVJJSAGpWTx5wqETBGKvVeGYQxjEZUhpgUfPK91zj9",
    name: "SnipeToken",
    symbol: "SNIPE",
    createdAt: new Date().getTime() - 1000 * 60 * 25, // 25 minutes ago
    creator: "BQrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    isCreatorWatched: false,
    trades: 54,
    topTradersBuying: 0,
  },
  {
    id: "3",
    address: "7zQsRsR23xhKTGGnzxpuVJQJHyfYQBVno1VcNmrJj6Z",
    name: "PumpDetector",
    symbol: "PUMP",
    createdAt: new Date().getTime() - 1000 * 60 * 42, // 42 minutes ago
    creator: "CRrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    isCreatorWatched: true,
    trades: 31,
    topTradersBuying: 3,
  },
  {
    id: "4",
    address: "5YsVJJSAGpWTx5wqETBGKvVeGYQxjEZUhpgUfPK91zj9",
    name: "AlphaFinder",
    symbol: "ALPHA",
    createdAt: new Date().getTime() - 1000 * 60 * 65, // 65 minutes ago
    creator: "DRrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    isCreatorWatched: false,
    trades: 24,
    topTradersBuying: 1,
  },
  {
    id: "5",
    address: "6zQsRsR23xhKTGGnzxpuVJQJHyfYQBVno1VcNmrJj6Z",
    name: "GemHunter",
    symbol: "GEM",
    createdAt: new Date().getTime() - 1000 * 60 * 85, // 85 minutes ago
    creator: "ERrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    isCreatorWatched: false,
    trades: 42,
    topTradersBuying: 0,
  },
];

export function TokenAlerts() {
  const [tokens, setTokens] = useState(mockTokens);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  // Update current time every second to refresh relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 token-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Recent Token Launches</CardTitle>
        <Badge variant="outline" className="font-normal">
          Live Updates
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {tokens.map((token) => (
              <TokenCard key={token.id} token={token} currentTime={currentTime} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TokenCardProps {
  token: {
    id: string;
    address: string;
    name: string;
    symbol: string;
    createdAt: number;
    creator: string;
    isCreatorWatched: boolean;
    trades: number;
    topTradersBuying: number;
  };
  currentTime: number;
}

function TokenCard({ token, currentTime }: TokenCardProps) {
  const timeAgo = getTimeAgo(token.createdAt, currentTime);
  const truncatedAddress = `${token.address.substring(0, 4)}...${token.address.substring(token.address.length - 4)}`;
  
  return (
    <div className={cn(
      "group relative rounded-lg border p-3 transition-all hover:bg-accent",
      token.topTradersBuying > 0 && "ring-1 ring-primary/20"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{token.name} ({token.symbol})</h3>
            {token.isCreatorWatched && (
              <Badge variant="secondary" className="text-xs font-normal flex items-center gap-1">
                <Star className="h-3 w-3" /> Watched Creator
              </Badge>
            )}
            {token.topTradersBuying > 0 && (
              <Badge variant="secondary" className="bg-success/20 text-success text-xs font-normal flex items-center gap-1">
                <Wallet className="h-3 w-3" /> {token.topTradersBuying} Top Traders
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> {timeAgo}
            </span>
            <span className="mx-2">•</span>
            <span>{truncatedAddress}</span>
            <span className="mx-2">•</span>
            <span>{token.trades} trades</span>
          </div>
        </div>
        <a href={`#/token/${token.address}`} className="rounded-full p-1.5 hover:bg-background transition-colors">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
      
      {token.topTradersBuying > 0 && (
        <div className="absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r from-primary/0 via-primary/50 to-primary/0" />
      )}
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
