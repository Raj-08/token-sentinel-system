import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Wallet, LogOut } from "lucide-react";
import walletService from "@/services/walletService";

export function WalletButton() {
  const [connected, setConnected] = useState(walletService.connected);
  const [publicKey, setPublicKey] = useState(walletService.publicKey);

  useEffect(() => {
    const handleConnect = (data: any) => {
      setConnected(data.connected);
      setPublicKey(data.publicKey);
    };

    const handleDisconnect = (data: any) => {
      setConnected(data.connected);
      setPublicKey(data.publicKey);
    };

    walletService.addEventListener("connect", handleConnect);
    walletService.addEventListener("disconnect", handleDisconnect);

    return () => {
      walletService.removeEventListener("connect", handleConnect);
      walletService.removeEventListener("disconnect", handleDisconnect);
    };
  }, []);

  const handleClick = () => {
    if (connected) {
      walletService.disconnect();
    } else {
      walletService.connect();
    }
  };

  return (
    <Button
      variant={connected ? "outline" : "default"}
      onClick={handleClick}
      className="flex items-center gap-2"
    >
      {connected ? (
        <>
          <LogOut className="h-4 w-4" />
          {publicKey?.toString().substring(0, 4)}...
          {publicKey?.toString().substring(publicKey.toString().length - 4)}
        </>
      ) : (
        <>
          <Wallet className="h-4 w-4" />
          Connect Wallet
        </>
      )}
    </Button>
  );
} 