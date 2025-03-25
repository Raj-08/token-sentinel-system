import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

export interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  priority: "high" | "medium" | "low";
}

export interface Token {
  id?: string;
  address: string;
  name: string;
  symbol: string;
  createdAt: number;
  creator: string;
  isCreatorWatched: boolean;
  trades: number;
  topTradersBuying: number;
}

export interface Trade {
  id?: string;
  wallet: string;
  walletName?: string;
  tokenName: string;
  tokenSymbol: string;
  action: "buy" | "sell";
  amount: number;
  timestamp: number;
  value: number;
}

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  
  private alerts: Alert[] = [];
  private tokens: Token[] = [];
  private trades: Trade[] = [];
  private topWallets: string[] = [];

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  connect(url: string = "http://localhost:3000") {
    if (this.isConnected) return;

    try {
      this.socket = io(url, {
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: Infinity,
      });

      this.socket.on("connect", () => {
        console.log("Connected to TrenchSniper server");
        this.isConnected = true;
        toast.success("Connected to TrenchSniper server", {
          description: "You'll receive real-time alerts and notifications",
        });
      });

      this.socket.on("disconnect", () => {
        console.log("Disconnected from TrenchSniper server");
        this.isConnected = false;
        toast.error("Disconnected from server", {
          description: "Attempting to reconnect...",
        });
      });

      this.socket.on("alertTopTraderBuy", (data) => {
        const alert: Alert = {
          id: this.generateId(),
          type: "top_trader_buy",
          title: "Top Trader Buy",
          description: `${data.wallet.substring(0, 6)}... bought ${data.amount.toLocaleString()} ${data.tokenSymbol}`,
          timestamp: data.timestamp || Date.now(),
          priority: "high",
        };
        
        this.alerts.unshift(alert);
        this.notifyListeners("alertsUpdate", this.alerts);
        
        toast.info(`Top Trader Buy Alert`, {
          description: alert.description,
        });
        this.playNotificationSound();
      });

      this.socket.on("newToken", (data) => {
        const token: Token = {
          id: this.generateId(),
          address: data.address,
          name: data.name,
          symbol: data.symbol,
          createdAt: data.timestamp || Date.now(),
          creator: data.creator,
          isCreatorWatched: data.isCreatorWatched,
          trades: 0,
          topTradersBuying: 0,
        };
        
        this.tokens.unshift(token);
        this.notifyListeners("tokensUpdate", this.tokens);
        
        if (data.isCreatorWatched) {
          const alert: Alert = {
            id: this.generateId(),
            type: "new_token",
            title: "New Token Launch",
            description: `${data.name} (${data.symbol}) launched by watched creator`,
            timestamp: data.timestamp || Date.now(),
            priority: "medium",
          };
          
          this.alerts.unshift(alert);
          this.notifyListeners("alertsUpdate", this.alerts);
          
          toast.success(`New Token by Watched Creator`, {
            description: `${data.name} (${data.symbol}) was just launched`,
          });
          this.playNotificationSound();
        }
      });

      this.socket.on("newTrade", (data) => {
        const tokenIndex = this.tokens.findIndex(t => t.address === data.token);
        if (tokenIndex !== -1) {
          this.tokens[tokenIndex].trades++;
          if (data.isTopBuyer) {
            this.tokens[tokenIndex].topTradersBuying++;
          }
          this.notifyListeners("tokensUpdate", this.tokens);
        }
        
        if (data.isTopBuyer) {
          const walletName = "Top Wallet " + data.buyer.substring(0, 6);
          
          const trade: Trade = {
            id: this.generateId(),
            wallet: data.buyer,
            walletName,
            tokenName: data.tokenName || "Unknown Token",
            tokenSymbol: data.tokenSymbol || "???",
            action: "buy",
            amount: data.amount,
            timestamp: data.timestamp || Date.now(),
            value: data.value,
          };
          
          this.trades.unshift(trade);
          this.notifyListeners("tradesUpdate", this.trades);
        }
      });
      
      this.socket.on("topWallets", (wallets) => {
        this.topWallets = wallets;
        this.notifyListeners("topWalletsUpdate", this.topWallets);
      });

      setTimeout(() => {
        const defaultAlerts: Alert[] = [
          {
            id: this.generateId(),
            type: "top_trader_buy",
            title: "Top Trader Buy",
            description: "Alpha Whale bought 2.5M TFIGHT",
            timestamp: Date.now() - 1000 * 60 * 2,
            priority: "high",
          },
          {
            id: this.generateId(),
            type: "new_token",
            title: "New Token Launch",
            description: "TrenchFighter (TFIGHT) launched by watched creator",
            timestamp: Date.now() - 1000 * 60 * 10,
            priority: "medium",
          },
        ];
        
        this.alerts = defaultAlerts;
        this.notifyListeners("alertsUpdate", this.alerts);
      }, 1000);
      
    } catch (error) {
      console.error("Socket connection error:", error);
      toast.error("Connection error", {
        description: "Failed to connect to TrenchSniper server",
      });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  getAlerts(): Alert[] {
    return this.alerts;
  }
  
  getTokens(): Token[] {
    return this.tokens;
  }
  
  getTrades(): Trade[] {
    return this.trades;
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

  private playNotificationSound() {
    const audio = new Audio("/notification.mp3");
    audio.volume = 0.5;
    audio.play().catch(e => console.log("Audio play prevented:", e));
  }

  addWallet(walletAddress: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit("addWallet", walletAddress);
    toast.success("Wallet added for tracking", {
      description: `${walletAddress.substring(0, 10)}... will be monitored for activity`,
    });
  }
}

const socketService = new SocketService();
export default socketService;
