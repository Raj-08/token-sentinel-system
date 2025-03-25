import { PublicKey } from "@solana/web3.js";
import { toast } from "sonner";

export interface WalletAdapter {
  publicKey: PublicKey | null;
  connected: boolean;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  signTransaction: (transaction: any) => Promise<any>;
  signAllTransactions: (transactions: any[]) => Promise<any[]>;
}

class WalletService {
  private _wallet: WalletAdapter | null = null;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

  constructor() {
    // Check if Phantom is installed
    if ("solana" in window) {
      this._wallet = (window as any).solana;
    }
  }

  get wallet() {
    return this._wallet;
  }

  get connected() {
    return this._wallet?.connected || false;
  }

  get publicKey() {
    return this._wallet?.publicKey || null;
  }

  async connect() {
    try {
      if (!this._wallet) {
        window.open("https://phantom.app/", "_blank");
        toast.error("Phantom wallet not found", {
          description: "Please install Phantom wallet to continue",
        });
        return;
      }

      await this._wallet.connect();
      
      toast.success("Wallet connected", {
        description: `Connected to ${this._wallet.publicKey?.toString().substring(0, 8)}...`,
      });

      this.notifyListeners("connect", {
        publicKey: this._wallet.publicKey,
        connected: true,
      });
    } catch (error) {
      console.error("Error connecting wallet:", error);
      toast.error("Failed to connect wallet", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  async disconnect() {
    try {
      if (this._wallet?.connected) {
        await this._wallet.disconnect();
        
        toast.success("Wallet disconnected", {
          description: "Successfully disconnected wallet",
        });

        this.notifyListeners("disconnect", {
          publicKey: null,
          connected: false,
        });
      }
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
      toast.error("Failed to disconnect wallet", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    }
  }

  addEventListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  removeEventListener(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  private notifyListeners(event: string, data: any) {
    if (!this.listeners.has(event)) return;
    
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`Error in event listener for ${event}:`, error);
      }
    });
  }
}

const walletService = new WalletService();
export default walletService; 