import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  PlusCircle, 
  XCircle, 
  Wallet, 
  Clock, 
  ExternalLink,
  AlertCircle,
  Bell
} from "lucide-react";
import socketService from "@/services/socketService";
import { toast } from "sonner";

interface TrackedWallet {
  address: string;
  displayName: string;
  lastCheckedTimestamp: number;
}

export function WalletTracker() {
  const [walletAddress, setWalletAddress] = useState<string>("");
  const [walletName, setWalletName] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [trackedWallets, setTrackedWallets] = useState<TrackedWallet[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Update time every minute to refresh "last checked" times
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  // Get initial tracked wallets and listen for updates
  useEffect(() => {
    // Get initial data
    setTrackedWallets(socketService.getTrackedWallets());
    
    // Listen for updates
    const handleTrackedWalletsUpdate = (wallets: TrackedWallet[]) => {
      // The data is already in the correct format, just set it directly
      setTrackedWallets(wallets);
    };
    
    socketService.addEventListener("trackedWalletsUpdate", handleTrackedWalletsUpdate);
    
    // Clean up
    return () => {
      socketService.removeEventListener("trackedWalletsUpdate", handleTrackedWalletsUpdate);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!walletAddress.trim()) {
      toast.error("Wallet address required", {
        description: "Please enter a wallet address to track",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const success = socketService.trackWallet(walletAddress, walletName);
      
      if (success) {
        // Clear form on success
        setWalletAddress("");
        setWalletName("");
      }
    } catch (error) {
      console.error("Error tracking wallet:", error);
      toast.error("Failed to track wallet", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemoveWallet = (address: string | undefined) => {
    if (!address) {
      toast.error("Invalid wallet address", {
        description: "Cannot remove wallet with invalid address",
      });
      return;
    }
    socketService.removeTrackedWallet(address);
  };

  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((currentTime - timestamp) / 1000);
    
    if (seconds < 60) return `${seconds}s ago`;
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Wallet Tracker
        </CardTitle>
        <CardDescription>
          Track Solana wallets and get notified when they make purchases
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-2">
            <Input
              placeholder="Enter wallet address to track"
              value={walletAddress}
              onChange={(e) => setWalletAddress(e.target.value)}
              className="font-mono text-sm"
            />
            <Input
              placeholder="Optional wallet name (for easier identification)"
              value={walletName}
              onChange={(e) => setWalletName(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            <PlusCircle className="h-4 w-4 mr-2" />
            {isSubmitting ? "Adding..." : "Track Wallet"}
          </Button>
        </form>

        <div>
          <h3 className="text-sm font-medium mb-2 flex items-center">
            <Wallet className="h-4 w-4 mr-1" />
            Tracked Wallets ({trackedWallets.length})
          </h3>
          
          {trackedWallets.length === 0 ? (
            <div className="bg-muted/30 rounded-md p-4 text-center text-sm text-muted-foreground">
              <AlertCircle className="h-5 w-5 mx-auto mb-2 opacity-50" />
              <p>No wallets being tracked yet</p>
              <p className="text-xs mt-1">Add a wallet address above to start tracking</p>
            </div>
          ) : (
            <ScrollArea className="h-[280px]">
              <div className="space-y-2">
                {trackedWallets.map((wallet) => (
                  <div 
                    key={wallet.address} 
                    className="flex items-center justify-between p-2 rounded-md border bg-card hover:bg-accent/50 transition-colors"
                  >
                    <div className="overflow-hidden">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">
                          {wallet.displayName}
                        </p>
                        <Badge variant="outline" className="font-mono text-xs">
                          {wallet.address ? 
                            `${wallet.address.substring(0, 4)}...${wallet.address.substring(wallet.address.length - 4)}` : 
                            'Invalid Address'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3" />
                        <span>Last checked: {getTimeAgo(wallet.lastCheckedTimestamp || Date.now())}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <a 
                        href={wallet.address ? `https://solscan.io/account/${wallet.address}` : '#'}
                        target="_blank"
                        rel="noopener noreferrer" 
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 text-destructive hover:text-destructive/80"
                        onClick={() => handleRemoveWallet(wallet.address)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 