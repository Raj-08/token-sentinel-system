import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowUpRight, ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";

// Mock data for demonstration purposes
const mockTrades = [
  {
    id: "1",
    wallet: "AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    walletName: "Alpha Whale",
    tokenName: "TrenchFighter",
    tokenSymbol: "TFIGHT",
    action: "buy" as const,
    amount: 2500000,
    timestamp: new Date().getTime() - 1000 * 60 * 5, // 5 minutes ago
    value: 4280,
  },
  {
    id: "2",
    wallet: "BQrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    walletName: "DeFi Degen",
    tokenName: "SnipeToken",
    tokenSymbol: "SNIPE",
    action: "sell" as const,
    amount: 1200000,
    timestamp: new Date().getTime() - 1000 * 60 * 12, // 12 minutes ago
    value: 1980,
  },
  {
    id: "3",
    wallet: "CRrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    walletName: "Smart Money",
    tokenName: "PumpDetector",
    tokenSymbol: "PUMP",
    action: "buy" as const,
    amount: 4800000,
    timestamp: new Date().getTime() - 1000 * 60 * 18, // 18 minutes ago
    value: 7450,
  },
  {
    id: "4",
    wallet: "DRrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    walletName: "Blue Chip Investor",
    tokenName: "AlphaFinder",
    tokenSymbol: "ALPHA",
    action: "buy" as const,
    amount: 950000,
    timestamp: new Date().getTime() - 1000 * 60 * 23, // 23 minutes ago
    value: 1820,
  },
  {
    id: "5",
    wallet: "ERrPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
    walletName: "Early Adopter",
    tokenName: "GemHunter",
    tokenSymbol: "GEM",
    action: "sell" as const,
    amount: 3200000,
    timestamp: new Date().getTime() - 1000 * 60 * 35, // 35 minutes ago
    value: 5340,
  },
];

export function WalletActivity() {
  const [trades, setTrades] = React.useState(mockTrades);
  const [currentTime, setCurrentTime] = React.useState(new Date().getTime());

  // Update current time every second to refresh relative timestamps
  React.useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().getTime());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-2 token-card animate-fade-in">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Top Wallet Activity</CardTitle>
        <Badge variant="outline" className="font-normal">
          Live Updates
        </Badge>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[320px] pr-4">
          <div className="space-y-4">
            {trades.map((trade) => (
              <TradeCard key={trade.id} trade={trade} currentTime={currentTime} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TradeCardProps {
  trade: {
    id: string;
    wallet: string;
    walletName: string;
    tokenName: string;
    tokenSymbol: string;
    action: "buy" | "sell";
    amount: number;
    value: number;
    timestamp: number;
  };
  currentTime: number;
}

function TradeCard({ trade, currentTime }: TradeCardProps) {
  const timeAgo = getTimeAgo(trade.timestamp, currentTime);
  const truncatedWallet = `${trade.wallet.substring(0, 4)}...${trade.wallet.substring(trade.wallet.length - 4)}`;
  
  return (
    <div className={cn(
      "group relative rounded-lg border p-3 transition-all hover:bg-accent",
      trade.action === "buy" && "ring-1 ring-success/20",
      trade.action === "sell" && "ring-1 ring-destructive/20"
    )}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{trade.walletName}</h3>
            <Badge 
              variant="secondary" 
              className={cn(
                "text-xs font-normal flex items-center gap-1",
                trade.action === "buy" && "bg-success/20 text-success",
                trade.action === "sell" && "bg-destructive/20 text-destructive"
              )}
            >
              {trade.action === "buy" && <ArrowUp className="h-3 w-3" />}
              {trade.action === "sell" && <ArrowDown className="h-3 w-3" />}
              {trade.action === "buy" ? "Bought" : "Sold"} {trade.tokenName}
            </Badge>
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground">
            <span>{truncatedWallet}</span>
            <span className="mx-2">•</span>
            <span>{formatNumber(trade.amount)} {trade.tokenSymbol}</span>
            <span className="mx-2">•</span>
            <span>${formatNumber(trade.value)}</span>
            <span className="mx-2">•</span>
            <span>{timeAgo}</span>
          </div>
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
