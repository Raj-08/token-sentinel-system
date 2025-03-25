import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUp, ArrowDown, Info, ExternalLink, Wallet } from "lucide-react";
import socketService, { Token } from "@/services/socketService";
import walletService from "@/services/walletService";
import { toast } from "sonner";

export function TokenDetail() {
  const { address } = useParams<{ address: string }>();
  const [token, setToken] = useState<Token | null>(null);
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(walletService.connected);

  useEffect(() => {
    // Get token data
    const tokens = socketService.getTokens();
    const foundToken = tokens.find(t => t.address === address);
    if (foundToken) {
      setToken(foundToken);
    }

    // Listen for updates
    const handleTokensUpdate = (newTokens: Token[]) => {
      const updatedToken = newTokens.find(t => t.address === address);
      if (updatedToken) {
        setToken(updatedToken);
      }
    };

    const handleWalletConnect = (data: any) => {
      setConnected(data.connected);
    };

    socketService.addEventListener("tokensUpdate", handleTokensUpdate);
    walletService.addEventListener("connect", handleWalletConnect);
    walletService.addEventListener("disconnect", handleWalletConnect);

    return () => {
      socketService.removeEventListener("tokensUpdate", handleTokensUpdate);
      walletService.removeEventListener("connect", handleWalletConnect);
      walletService.removeEventListener("disconnect", handleWalletConnect);
    };
  }, [address]);

  const handleBuy = async () => {
    if (!token || !amount) return;
    
    if (!connected) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to trade",
        action: {
          label: "Connect",
          onClick: () => walletService.connect(),
        },
      });
      return;
    }
    
    setLoading(true);
    try {
      await socketService.buyToken(token.address, parseFloat(amount), walletService.wallet);
      setAmount("");
    } catch (error) {
      console.error("Buy error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSell = async () => {
    if (!token || !amount) return;
    
    if (!connected) {
      toast.error("Wallet not connected", {
        description: "Please connect your wallet to trade",
        action: {
          label: "Connect",
          onClick: () => walletService.connect(),
        },
      });
      return;
    }
    
    setLoading(true);
    try {
      await socketService.sellToken(token.address, parseFloat(amount), walletService.wallet);
      setAmount("");
    } catch (error) {
      console.error("Sell error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <p className="text-muted-foreground">Token not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle className="text-2xl">{token.name}</CardTitle>
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="outline">{token.symbol}</Badge>
              {token.isCreatorWatched && (
                <Badge variant="secondary">Watched Creator</Badge>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!connected && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => walletService.connect()}
              >
                <Wallet className="h-4 w-4 mr-2" />
                Connect Wallet
              </Button>
            )}
            <a
              href={`https://solscan.io/token/${token.address}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-5 w-5" />
            </a>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Market Cap</p>
              <p className="text-lg font-medium">
                {token.marketCapSol?.toFixed(2)} SOL
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Price</p>
              <p className="text-lg font-medium">${token.priceUsd}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Liquidity</p>
              <p className="text-lg font-medium">${token.liquidity?.toLocaleString()}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Trades</p>
              <p className="text-lg font-medium">{token.trades}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Trade</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="buy">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="buy">Buy</TabsTrigger>
              <TabsTrigger value="sell">Sell</TabsTrigger>
            </TabsList>
            <TabsContent value="buy" className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Amount to buy"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleBuy}
                  disabled={loading || !amount}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Buy"}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="sell" className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Amount to sell"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <Button
                  className="w-full"
                  onClick={handleSell}
                  disabled={loading || !amount}
                  variant="destructive"
                >
                  <ArrowDown className="mr-2 h-4 w-4" />
                  {loading ? "Processing..." : "Sell"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {token.socialInfo && (
        <Card>
          <CardHeader>
            <CardTitle>Social Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {token.socialInfo.telegram && (
              <a
                href={token.socialInfo.telegram}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Telegram
              </a>
            )}
            {token.socialInfo.twitter && (
              <a
                href={token.socialInfo.twitter}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Twitter
              </a>
            )}
            {token.socialInfo.website && (
              <a
                href={token.socialInfo.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center text-sm text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Website
              </a>
            )}
            {token.socialInfo.bondingCurve && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Info className="h-4 w-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Bonding Curve</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Price</p>
                    <p className="text-sm">{token.socialInfo.bondingCurve.unitPrice} SOL</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Unit Limit</p>
                    <p className="text-sm">{token.socialInfo.bondingCurve.unitLimit}</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
} 