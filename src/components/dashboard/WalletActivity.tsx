
import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowUp, ArrowDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import socketService, { Trade } from "@/services/socketService";

export function WalletActivity() {
  const [trades, setTrades] = React.useState<Trade[]>([]);
  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());

  // Connect to socket service when component mounts
  useEffect(() => {
    // Initial data
    setTrades(socketService.getTrades());
    
    // Listen for updates
    const handleTradesUpdate = (newTrades: Trade[]) => {
      setTrades(newTrades);
    };
    
    socketService.addEventListener("tradesUpdate", handleTradesUpdate);
    
    // Clean up
    return () => {
      socketService.removeEventListener("tradesUpdate", handleTradesUpdate);
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
    <Card className="col-span-1 md:col-span-2 lg:col-span-1 token-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Top Wallet Activity</CardTitle>
        <Badge variant="outline" className="font-normal">
          Live Updates
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {trades.length > 0 ? (
              trades.map((trade) => (
                <TradeCard key={trade.id} trade={trade} currentTime={currentTime} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Waiting for wallet activity...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TradeCardProps {
  trade: Trade;
  currentTime: number;
}

function TradeCard({ trade, currentTime }: TradeCardProps) {
  const timeAgo = getTimeAgo(trade.timestamp, currentTime);
  const truncatedWallet = trade.wallet ? 
    `${trade.wallet.substring(0, 4)}...${trade.wallet.substring(trade.wallet.length - 4)}` : 
    "Unknown";
  
  return (
    <div className={cn(
      "group relative rounded-lg border p-3 transition-all hover:bg-accent",
      trade.action === "buy" && "ring-1 ring-success/20",
      trade.action === "sell" && "ring-1 ring-destructive/20"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{trade.walletName || "Top Wallet"}</h3>
            <Badge 
              variant={trade.action === "buy" ? "success" : "destructive"}
              className="text-xs font-normal flex items-center gap-1"
            >
              {trade.action === "buy" && <ArrowUp className="h-3 w-3" />}
              {trade.action === "sell" && <ArrowDown className="h-3 w-3" />}
              {trade.action === "buy" ? "Bought" : "Sold"} {trade.tokenName}
            </Badge>
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground flex-wrap">
            <span>{truncatedWallet}</span>
            <span className="mx-2">•</span>
            <span>{formatNumber(trade.amount)} {trade.tokenSymbol}</span>
            <span className="mx-2">•</span>
            <span>${formatNumber(trade.value)}</span>
            <span className="mx-2">•</span>
            <span>{timeAgo}</span>
          </div>
          {trade.signature && (
            <div className="mt-1 flex items-center text-xs">
              <a 
                href={`https://solscan.io/tx/${trade.signature}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary flex items-center hover:underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                View Transaction
              </a>
            </div>
          )}
        </div>
        <a href={`#/wallet/${trade.wallet}`} className="rounded-full p-1.5 hover:bg-background transition-colors">
          <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
        </a>
      </div>
      
      <div className={cn(
        "absolute -bottom-px left-0 right-0 h-0.5 bg-gradient-to-r",
        trade.action === "buy" && "from-success/0 via-success/50 to-success/0",
        trade.action === "sell" && "from-destructive/0 via-destructive/50 to-destructive/0"
      )} />
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

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
