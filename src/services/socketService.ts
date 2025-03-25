
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
  marketCapSol?: number;
  bondingCurveKey?: string;
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
  signature?: string;
}

// Sample data for development
const exampleTokens = [
  {
    address: "D1MfDgLMg1gV3Vjs2tR1yvY3LP2Aw9HWfHsX8ndapump",
    name: "Neocircle",
    symbol: "NEO",
    creator: "81T1mZ9yKdV9hjhYj7GNBgcRwoZLDcGZzaZAQB6GzxCL",
    marketCapSol: 33.83,
    bondingCurveKey: "59wUQqKD6CEaDZgGwstPJsxP1kCqFjUxgQnJUGw72ekq"
  },
  {
    address: "gB7zXi8hv9qUt19KvgZ6QvaouNYzYcrHTpm3qeGpump",
    name: "Trump Core", 
    symbol: "TC",
    creator: "Cbn2mBJZzTJ28Hw5VcVYwwbuDnXVobbaU8oKUXM3mZB2",
    marketCapSol: 38.05,
    bondingCurveKey: "9TF85a3nZPKoaArPBARD5pd4c3PCJW7pyPG379NufPcn"
  }
];

const topWalletsExample = [
  "AArPXm8JatJiuyEffuC1un2Sc835SULa4uQqDcaGpAjV",
  "Cbn2mBJZzTJ28Hw5VcVYwwbuDnXVobbaU8oKUXM3mZB2",
  "81T1mZ9yKdV9hjhYj7GNBgcRwoZLDcGZzaZAQB6GzxCL"
];

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();
  private wsConnection: WebSocket | null = null;
  
  private alerts: Alert[] = [];
  private tokens: Token[] = [];
  private trades: Trade[] = [];
  private topWallets: string[] = topWalletsExample;

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }

  connect(url: string = "http://localhost:3000") {
    if (this.isConnected) return;

    // Connect to the WebSocket directly for real-time data
    this.connectToPumpPortal();

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
        this.handleTopTraderBuy(data);
      });

      this.socket.on("newToken", (data) => {
        this.handleNewToken(data);
      });

      this.socket.on("newTrade", (data) => {
        this.handleNewTrade(data);
      });
      
      this.socket.on("topWallets", (wallets) => {
        this.topWallets = wallets;
        this.notifyListeners("topWalletsUpdate", this.topWallets);
      });

      // Simulate some initial data
      this.simulateInitialData();
      
    } catch (error) {
      console.error("Socket connection error:", error);
      toast.error("Connection error", {
        description: "Failed to connect to TrenchSniper server",
      });
    }
  }

  private connectToPumpPortal() {
    try {
      this.wsConnection = new WebSocket('wss://pumpportal.fun/api/data');
      
      this.wsConnection.onopen = () => {
        console.log('Connected to PumpPortal WebSocket');
        
        // Subscribe to new token events
        this.wsConnection?.send(JSON.stringify({
          method: "subscribeNewToken",
        }));
        
        // Subscribe to trades by top wallets
        this.wsConnection?.send(JSON.stringify({
          method: "subscribeAccountTrade",
          keys: this.topWallets
        }));

        // Subscribe to specific tokens
        const tokenAddresses = this.tokens.map(token => token.address);
        if (tokenAddresses.length > 0) {
          this.wsConnection?.send(JSON.stringify({
            method: "subscribeTokenTrade",
            keys: tokenAddresses
          }));
        }
      };
      
      this.wsConnection.onmessage = (event) => {
        try {
          const parsedData = JSON.parse(event.data);
          console.log('PumpPortal data received:', parsedData);
          
          if (parsedData.event === 'token') {
            this.processNewTokenData(parsedData);
          } else if (parsedData.event === 'trade') {
            this.processTradeData(parsedData);
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      this.wsConnection.onerror = (error) => {
        console.error('PumpPortal WebSocket error:', error);
      };
      
      this.wsConnection.onclose = () => {
        console.log('Disconnected from PumpPortal WebSocket, reconnecting...');
        setTimeout(() => this.connectToPumpPortal(), 3000);
      };
    } catch (error) {
      console.error('Error connecting to PumpPortal:', error);
      setTimeout(() => this.connectToPumpPortal(), 5000);
    }
  }

  private processNewTokenData(data: any) {
    const tokenData = data.data || {};
    
    // Extract token data from the message
    const token: Token = {
      id: this.generateId(),
      address: tokenData.mint || tokenData.signature,
      name: tokenData.name || "Unknown Token",
      symbol: tokenData.symbol || "???",
      createdAt: Date.now(),
      creator: tokenData.traderPublicKey || "Unknown",
      isCreatorWatched: this.topWallets.includes(tokenData.traderPublicKey),
      trades: 0,
      topTradersBuying: 0,
      marketCapSol: tokenData.marketCapSol,
      bondingCurveKey: tokenData.bondingCurveKey
    };
    
    // Process the token
    this.handleNewToken(token);
    
    // Log what we received
    console.log(`New token detected: ${token.name} (${token.symbol}) - Address: ${token.address}`);
  }

  private processTradeData(data: any) {
    const tradeData = data.data || {};
    
    // Extract trade data
    const trade = {
      wallet: tradeData.traderPublicKey || "Unknown",
      token: tradeData.mint || "",
      tokenName: "Unknown", // We'll try to find this
      tokenSymbol: "???",
      action: tradeData.txType === "buy" ? "buy" : "sell",
      amount: tradeData.initialBuy || tradeData.amount || 0,
      value: tradeData.solAmount || 0,
      timestamp: Date.now(),
      signature: tradeData.signature
    };
    
    // Find token details if possible
    const matchingToken = this.tokens.find(t => t.address === trade.token);
    if (matchingToken) {
      trade.tokenName = matchingToken.name;
      trade.tokenSymbol = matchingToken.symbol;
    }
    
    // Check if this is a top wallet we're tracking
    const isTopWallet = this.topWallets.includes(trade.wallet);
    
    // Process the trade
    this.handleNewTrade({
      ...trade,
      isTopBuyer: isTopWallet
    });
    
    // Log what we received
    console.log(`New trade: ${trade.action} ${trade.amount} ${trade.tokenSymbol} for ${trade.value} SOL by ${trade.wallet}`);
  }

  private handleTopTraderBuy(data: any) {
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
  }

  private handleNewToken(data: Token) {
    // Create token object
    const token: Token = {
      id: this.generateId(),
      address: data.address,
      name: data.name,
      symbol: data.symbol,
      createdAt: data.createdAt || Date.now(),
      creator: data.creator,
      isCreatorWatched: data.isCreatorWatched || this.topWallets.includes(data.creator),
      trades: 0,
      topTradersBuying: 0,
      marketCapSol: data.marketCapSol,
      bondingCurveKey: data.bondingCurveKey
    };
    
    this.tokens.unshift(token);
    this.notifyListeners("tokensUpdate", this.tokens);
    
    // If creator is watched, create an alert
    if (token.isCreatorWatched) {
      const alert: Alert = {
        id: this.generateId(),
        type: "new_token",
        title: "New Token Launch",
        description: `${data.name} (${data.symbol}) launched by watched creator`,
        timestamp: Date.now(),
        priority: "medium",
      };
      
      this.alerts.unshift(alert);
      this.notifyListeners("alertsUpdate", this.alerts);
      
      toast.success(`New Token by Watched Creator`, {
        description: `${data.name} (${data.symbol}) was just launched`,
      });
      this.playNotificationSound();
    }

    // Subscribe to trades for this token if we have an active websocket
    if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
      this.wsConnection.send(JSON.stringify({
        method: "subscribeTokenTrade",
        keys: [token.address]
      }));
    }
  }

  private handleNewTrade(data: any) {
    // Find the token in our list
    const tokenIndex = this.tokens.findIndex(t => t.address === data.token);
    if (tokenIndex !== -1) {
      this.tokens[tokenIndex].trades++;
      if (data.isTopBuyer) {
        this.tokens[tokenIndex].topTradersBuying++;
      }
      this.notifyListeners("tokensUpdate", [...this.tokens]);
    }
    
    // Create a trade record if it's from a top wallet
    if (data.isTopBuyer) {
      const walletName = this.getWalletName(data.wallet);
      
      const trade: Trade = {
        id: this.generateId(),
        wallet: data.wallet,
        walletName,
        tokenName: data.tokenName || "Unknown Token",
        tokenSymbol: data.tokenSymbol || "???",
        action: data.action || "buy",
        amount: data.amount,
        timestamp: data.timestamp || Date.now(),
        value: data.value || 0,
        signature: data.signature
      };
      
      this.trades.unshift(trade);
      this.notifyListeners("tradesUpdate", [...this.trades]);

      // Create an alert for significant buys
      if (data.action === "buy" && data.value > 1) {
        this.handleTopTraderBuy({
          wallet: data.wallet,
          amount: data.amount,
          tokenSymbol: data.tokenSymbol,
          timestamp: data.timestamp || Date.now()
        });
      }
    }
  }

  private getWalletName(address: string): string {
    // Simplistic wallet naming - in a real app you would have a more robust system
    return "Top Wallet " + address.substring(0, 6);
  }

  private simulateInitialData() {
    // Simulate tokens
    exampleTokens.forEach((tokenData, index) => {
      setTimeout(() => {
        this.handleNewToken({
          address: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          createdAt: Date.now() - (index * 1000 * 60 * 5), // Stagger creation times
          creator: tokenData.creator,
          isCreatorWatched: index === 0, // First one is from watched creator
          trades: Math.floor(Math.random() * 10),
          topTradersBuying: Math.floor(Math.random() * 3),
          marketCapSol: tokenData.marketCapSol,
          bondingCurveKey: tokenData.bondingCurveKey
        });
      }, 1000 + index * 500);
    });

    // Simulate some trades
    setTimeout(() => {
      if (this.tokens.length > 0) {
        const token = this.tokens[0];
        this.handleNewTrade({
          token: token.address,
          wallet: this.topWallets[0],
          tokenName: token.name,
          tokenSymbol: token.symbol,
          action: "buy",
          amount: 2500000,
          value: 2.5,
          isTopBuyer: true,
          timestamp: Date.now() - 1000 * 60
        });
      }
    }, 2500);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }

    if (this.wsConnection) {
      this.wsConnection.close();
      this.wsConnection = null;
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
    if (!this.topWallets.includes(walletAddress)) {
      this.topWallets.push(walletAddress);
      this.notifyListeners("topWalletsUpdate", this.topWallets);
      
      // Subscribe to the new wallet if websocket is connected
      if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
        this.wsConnection.send(JSON.stringify({
          method: "subscribeAccountTrade",
          keys: [walletAddress]
        }));
      }
      
      toast.success("Wallet added for tracking", {
        description: `${walletAddress.substring(0, 10)}... will be monitored for activity`,
      });
    }
  }
}

const socketService = new SocketService();
export default socketService;
