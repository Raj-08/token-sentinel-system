
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Star, Timer, Wallet, TrendingUp, DollarSign, Coins, ExternalLink } from "lucide-react";
import socketService, { Token } from "@/services/socketService";

export function TokenAlerts() {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date().getTime());

  // Connect to socket service when component mounts
  useEffect(() => {
    // Initial data
    setTokens(socketService.getTokens());
    
    // Listen for updates
    const handleTokensUpdate = (newTokens: Token[]) => {
      setTokens(newTokens);
    };
    
    socketService.addEventListener("tokensUpdate", handleTokensUpdate);
    
    // Clean up
    return () => {
      socketService.removeEventListener("tokensUpdate", handleTokensUpdate);
    };
  }, []);

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
            {tokens.length > 0 ? (
              tokens.map((token) => (
                <TokenCard key={token.id} token={token} currentTime={currentTime} />
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Waiting for new token launches...
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

interface TokenCardProps {
  token: Token;
  currentTime: number;
}

function TokenCard({ token, currentTime }: TokenCardProps) {
  const timeAgo = getTimeAgo(token.createdAt, currentTime);
  const truncatedAddress = `${token.address.substring(0, 4)}...${token.address.substring(token.address.length - 4)}`;
  
  // Format number values for display
  const formatValue = (value?: number): string => {
    if (value === undefined) return "N/A";
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };
  
  return (
    <div className={cn(
      "group relative rounded-lg border p-3 transition-all hover:bg-accent",
      token.topTradersBuying > 0 && "ring-1 ring-primary/20"
    )}>
      <div className="flex items-start justify-between">
        <div className="w-full">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium">{token.name} ({token.symbol})</h3>
            {token.isCreatorWatched && (
              <Badge variant="secondary" className="text-xs font-normal flex items-center gap-1">
                <Star className="h-3 w-3" /> Watched Creator
              </Badge>
            )}
            {token.topTradersBuying > 0 && (
              <Badge variant="success" className="text-xs font-normal flex items-center gap-1">
                <Wallet className="h-3 w-3" /> {token.topTradersBuying} Top Traders
              </Badge>
            )}
            {token.marketCapSol && (
              <Badge variant="outline" className="text-xs font-normal flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {token.marketCapSol.toFixed(2)} SOL
              </Badge>
            )}
          </div>
          <div className="mt-1 flex items-center text-xs text-muted-foreground flex-wrap">
            <span className="inline-flex items-center gap-1">
              <Timer className="h-3 w-3" /> {timeAgo}
            </span>
            <span className="mx-2">•</span>
            <span>{truncatedAddress}</span>
            <span className="mx-2">•</span>
            <span>{token.trades} trades</span>
          </div>
          
          {/* Additional token details */}
          <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs pt-1 border-t">
            {token.initialBuy && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Coins className="h-3 w-3" /> Initial Buy: {formatValue(token.initialBuy)}
              </div>
            )}
            {token.solAmount && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" /> Initial SOL: {formatValue(token.solAmount)}
              </div>
            )}
            {token.vTokensInBondingCurve && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Coins className="h-3 w-3" /> Tokens in Pool: {formatValue(token.vTokensInBondingCurve)}
              </div>
            )}
            {token.vSolInBondingCurve && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3" /> SOL in Pool: {formatValue(token.vSolInBondingCurve)}
              </div>
            )}
          </div>
          
          {/* Links */}
          <div className="mt-2 flex flex-wrap gap-3">
            {token.uri && (
              <a 
                href={token.uri} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary flex items-center text-xs hover:underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Metadata
              </a>
            )}
            {token.bondingCurveKey && (
              <a 
                href={`https://solscan.io/account/${token.bondingCurveKey}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary flex items-center text-xs hover:underline"
              >
                <ExternalLink className="h-3 w-3 mr-1" />
                Pool
              </a>
            )}
            <a 
              href={`https://solscan.io/token/${token.address}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary flex items-center text-xs hover:underline"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              Token
            </a>
          </div>
        </div>
        
        <a href={`#/token/${token.address}`} className="rounded-full p-1.5 hover:bg-background transition-colors flex-shrink-0">
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
