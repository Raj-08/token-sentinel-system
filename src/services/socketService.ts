import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { DEFAULT_DECIMALS, PumpFunSDK } from "pumpdotfun-sdk";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Buffer } from 'buffer';
import { Keypair } from "@solana/web3.js";

// Polyfill Buffer for the browser environment
if (typeof window !== 'undefined') {
  window.Buffer = window.Buffer || Buffer;
}

const HELIUS_RPC_URL = process.env.HELIUS_RPC_URL || "https://api.mainnet-beta.solana.com";

export interface Alert {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: number;
  priority: "high" | "medium" | "low";
}

export interface TokenBondingCurve {
  unitLimit: number;
  unitPrice: number;
  currentSupply?: number;
}

export interface TokenSocialInfo {
  telegram?: string;
  twitter?: string;
  website?: string;
  replies?: number;
  marketCap?: string;
  creatorName?: string;
  createdAgo?: string;
  bondingCurve?: TokenBondingCurve;
}

export interface Token {
  id: string;
  address: string;
  name: string;
  symbol: string;
  createdAt: number;
  creator: string;
  isCreatorWatched: boolean;
  trades: number;
  topTradersBuying: number;
  marketCapSol?: number;
  priceUsd?: string;
  liquidity?: number;
  socialInfo?: TokenSocialInfo;
}

export interface Trade {
  id: string;
  tokenAddress: string;
  traderAddress: string;
  type: string;
  amount: number;
  timestamp: number;
}

// Sample data for development
const exampleTokens: Token[] = [
  {
    id: "example1",
    address: "D1MfDgLMg1gV3Vjs2tR1yvY3LP2Aw9HWfHsX8ndapump",
    name: "Neocircle",
    symbol: "NEO",
    creator: "81T1mZ9yKdV9hjhYj7GNBgcRwoZLDcGZzaZAQB6GzxCL",
    marketCapSol: 33.83,
    createdAt: Date.now(),
    isCreatorWatched: true,
    trades: 0,
    topTradersBuying: 0,
    priceUsd: "0.00012345",
    liquidity: 50000
  },
  {
    id: "example2",
    address: "gB7zXi8hv9qUt19KvgZ6QvaouNYzYcrHTpm3qeGpump",
    name: "Trump Core", 
    symbol: "TC",
    creator: "Cbn2mBJZzTJ28Hw5VcVYwwbuDnXVobbaU8oKUXM3mZB2",
    marketCapSol: 38.05,
    createdAt: Date.now(),
    isCreatorWatched: false,
    trades: 0,
    topTradersBuying: 0,
    priceUsd: "0.00054321",
    liquidity: 75000
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
  private pollingInterval: number | null = null;
  private sdk: PumpFunSDK;
  private provider: AnchorProvider;
  
  private alerts: Alert[] = [];
  private tokens: Token[] = [];
  private trades: Trade[] = [];
  private topWallets: string[] = topWalletsExample;
  private trackedWallets: Map<string, {
    lastCheckedTimestamp: number;
    displayName: string;
  }> = new Map();
  private walletPollingInterval: number | null = null;

  constructor() {
    this.initializeSDK();
    this.startPolling();
  }

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

      // Simulate some initial data
      this.simulateInitialData();
      
    } catch (error) {
      console.error("Socket connection error:", error);
      toast.error("Connection error", {
        description: "Failed to connect to TrenchSniper server",
      });
    }
  }

  private initializeSDK() {
    try {
      const connection = new Connection(HELIUS_RPC_URL);
      // Note: We're using a read-only provider since we're just fetching data
      this.provider = new AnchorProvider(
        connection,
        {
          publicKey: PublicKey.default,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        },
        { commitment: "confirmed" }
      );
      this.sdk = new PumpFunSDK(this.provider);
    } catch (error) {
      console.error("Failed to initialize PumpFun SDK:", error);
    }
  }

  private async fetchTokenBondingCurve(tokenAddress: string): Promise<TokenBondingCurve | undefined> {
    try {
      const mintPubkey = new PublicKey(tokenAddress);
      const bondingCurveAccount = await this.sdk.getBondingCurveAccount(mintPubkey);
      
      if (bondingCurveAccount) {
        return {
          unitLimit: 250000, // Default values since we can't get them directly
          unitPrice: 250000,
          currentSupply: 0
        };
      }
      return undefined;
    } catch (error) {
      console.error('Error fetching bonding curve:', error);
      return undefined;
    }
  }

  private async fetchTokenSocialInfo(tokenAddress: string): Promise<TokenSocialInfo | undefined> {
    try {
      const response = await fetch(`https://pump.fun/coin/${tokenAddress}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      const socialInfo: TokenSocialInfo = {};

      // Extract social links
      const socialLinks = doc.querySelectorAll('a[href]');
      socialLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href?.includes('t.me/')) {
          socialInfo.telegram = href;
        } else if (href?.includes('twitter.com/') || href?.includes('x.com/')) {
          socialInfo.twitter = href;
        } else if (!href?.includes('pump.fun')) {
          socialInfo.website = href;
        }
      });

      // Get bonding curve data
      const bondingCurve = await this.fetchTokenBondingCurve(tokenAddress);
      if (bondingCurve) {
        socialInfo.bondingCurve = bondingCurve;
      }

      // Extract market cap
      const marketCapText = doc.querySelector('div:contains("market cap:")');
      if (marketCapText) {
        socialInfo.marketCap = marketCapText.textContent?.split(':')[1].trim();
      }

      // Extract replies count
      const repliesText = doc.querySelector('div:contains("replies:")');
      if (repliesText) {
        const repliesCount = repliesText.textContent?.split(':')[1].trim();
        socialInfo.replies = parseInt(repliesCount || '0');
      }

      // Extract creator info
      const creatorLink = doc.querySelector('a[href^="/user/"]');
      if (creatorLink) {
        socialInfo.creatorName = creatorLink.textContent?.trim();
      }

      // Extract creation time
      const timeElement = doc.querySelector('time');
      if (timeElement) {
        socialInfo.createdAgo = timeElement.textContent?.trim();
      }

      return socialInfo;
    } catch (error) {
      console.error('Error fetching social info:', error);
      return undefined;
    }
  }

  private async fetchNewTokens() {
    try {
      // For now, we'll just use the example tokens
      // In production, this would fetch from the PumpFun SDK
      if (this.tokens.length === 0) {
        this.simulateInitialData();
      }
    } catch (error) {
      console.error('Error fetching new tokens:', error);
      toast.error('Failed to fetch new tokens', {
        description: 'There was an error getting the latest token data.'
      });
    }
  }

  private handleTopTraderBuy(data: any) {
    const alert: Alert = {
      id: this.generateId(),
      type: "top_trader_buy",
      title: "Top Trader Buy",
      description: `${data.traderAddress.substring(0, 6)}... bought ${data.amount.toLocaleString()} ${data.symbol}`,
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
      priceUsd: data.priceUsd,
      liquidity: data.liquidity
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
  }

  private handleNewTrade(data: any) {
    try {
      const trade: Trade = {
        id: this.generateId(),
        tokenAddress: data.tokenAddress,
        traderAddress: data.traderAddress,
        type: data.type,
        amount: data.amount,
        timestamp: data.timestamp || Date.now()
      };

      // Update token stats if we have the token
      const token = this.tokens.find(t => t.address === trade.tokenAddress);
      if (token) {
        token.trades++;
        if (this.topWallets.includes(trade.traderAddress)) {
          token.topTradersBuying++;
        }
        this.notifyListeners("tokensUpdate", this.tokens);
      }

      // Add to trades array
      this.trades.push(trade);
      this.notifyListeners("tradesUpdate", this.trades);

      // Create alert for significant buys
      if (trade.type === "buy" && token) {
        this.handleTopTraderBuy({
          traderAddress: trade.traderAddress,
          amount: trade.amount,
          symbol: token.symbol,
          timestamp: trade.timestamp
        });
      }
    } catch (error) {
      console.error('Error processing trade data:', error);
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
        const token: Token = {
          id: this.generateId(),
          address: tokenData.address,
          name: tokenData.name,
          symbol: tokenData.symbol,
          createdAt: Date.now() - (index * 1000 * 60 * 5), // Stagger creation times
          creator: tokenData.creator,
          isCreatorWatched: index === 0, // First one is from watched creator
          trades: Math.floor(Math.random() * 10),
          topTradersBuying: Math.floor(Math.random() * 3),
          marketCapSol: parseFloat(tokenData.priceUsd || '0'),
          priceUsd: tokenData.priceUsd,
          liquidity: tokenData.liquidity
        };
        
        this.tokens.push(token);
        this.notifyListeners("tokensUpdate", this.tokens);
      }, 1000 + index * 500);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
    this.stopPolling();
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
      
      toast.success("Wallet added for tracking", {
        description: `${walletAddress.substring(0, 10)}... will be monitored for activity`,
      });
    }
  }

  private startPolling() {
    // Fetch immediately on start
    this.fetchNewTokens();
    
    // Then poll every minute
    this.pollingInterval = window.setInterval(() => {
      this.fetchNewTokens();
    }, 60000); // 1 minute
  }

  private stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
  }

  private createNewTokenAlert(token: Token) {
    const alert: Alert = {
      id: this.generateId(),
      type: "new_token",
      title: "New Token Launch",
      description: `${token.name} (${token.symbol}) launched by watched creator`,
      timestamp: Date.now(),
      priority: "medium",
    };
    
    this.alerts.unshift(alert);
    this.notifyListeners("alertsUpdate", this.alerts);
    
    toast.success(`New Token by Watched Creator`, {
      description: `${token.name} (${token.symbol}) was just launched`,
    });
    this.playNotificationSound();
  }

  async buyToken(tokenAddress: string, amount: number, wallet: any) {
    try {
      const mintPubkey = new PublicKey(tokenAddress);
      
      // Update provider with user's wallet
      this.provider = new AnchorProvider(
        this.provider.connection,
        wallet,
        { commitment: "confirmed" }
      );
      this.sdk = new PumpFunSDK(this.provider);

      // Create and send the buy transaction
      const result = await this.sdk.buy(
        wallet,
        mintPubkey,
        BigInt(amount * LAMPORTS_PER_SOL),
        100n, // 1% slippage in basis points
        {
          unitLimit: 250000,
          unitPrice: 250000,
        }
      );
      
      if (result.success) {
        toast.success("Buy order successful", {
          description: `Bought ${amount} tokens`,
        });
      } else {
        throw new Error("Buy transaction failed");
      }

      return result.signature;
    } catch (error) {
      console.error("Error buying token:", error);
      toast.error("Failed to buy token", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  async sellToken(tokenAddress: string, amount: number, wallet: any) {
    try {
      const mintPubkey = new PublicKey(tokenAddress);
      
      // Update provider with user's wallet
      this.provider = new AnchorProvider(
        this.provider.connection,
        wallet,
        { commitment: "confirmed" }
      );
      this.sdk = new PumpFunSDK(this.provider);

      // Create and send the sell transaction
      const result = await this.sdk.sell(
        wallet,
        mintPubkey,
        BigInt(amount * Math.pow(10, DEFAULT_DECIMALS)),
        100n, // 1% slippage in basis points
        {
          unitLimit: 250000,
          unitPrice: 250000,
        }
      );
      
      if (result.success) {
        toast.success("Sell order successful", {
          description: `Sold ${amount} tokens`,
        });
      } else {
        throw new Error("Sell transaction failed");
      }

      return result.signature;
    } catch (error) {
      console.error("Error selling token:", error);
      toast.error("Failed to sell token", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  async createToken(
    name: string,
    symbol: string,
    unitPrice: number,
    unitLimit: number,
    wallet: any,
    imageFile?: File
  ) {
    try {
      // Update provider with user's wallet
      this.provider = new AnchorProvider(
        this.provider.connection,
        wallet,
        { commitment: "confirmed" }
      );
      this.sdk = new PumpFunSDK(this.provider);

      // Generate a new keypair for the mint
      const mint = Keypair.generate();

      // In development mode, we need to handle CORS issues with image uploads
      const isDevelopment = window.location.hostname === 'localhost';
      let file: File;
      
      if (imageFile && !isDevelopment) {
        // Use the provided image file in production
        file = imageFile;
        console.log("Using custom image file:", imageFile.name);
      } else {
        // In development or if no image file, use default image
        if (imageFile && isDevelopment) {
          console.log("Development mode detected - using default image instead of custom image to avoid CORS issues");
          toast.warning("Using default image", {
            description: "Custom images can't be uploaded in development mode due to CORS restrictions",
          });
        } else {
          console.log("Using default image");
        }
        
        // Create a default token image
        const base64Image = 'data:image/png;base64,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';
        
        // Create a file from the base64 data
        const response = await fetch(base64Image);
        const blob = await response.blob();
        file = new File([blob], 'token-image.png', { type: 'image/png' });
      }

      try {
        // Create token metadata with minimal required fields
        const tokenMetadata = {
          name,
          symbol,
          description: `${name} (${symbol}): Created with TrenchSniper`,
          file
        };
  
        console.log("Creating token with metadata:", name, symbol);
        
        // Create and buy initial tokens with unitPrice and unitLimit in the bonding curve config
        const bondingCurveConfig = {
          unitPrice,
          unitLimit
        };
        
        const result = await this.sdk.createAndBuy(
          wallet,
          mint,
          tokenMetadata,
          BigInt(0.0001 * LAMPORTS_PER_SOL), // Initial buy amount
          100n, // 1% slippage in basis points
          bondingCurveConfig, // Pass bonding curve config
          "confirmed" // commitment
        );
        
        if (result.success) {
          toast.success("Token created successfully", {
            description: `Token ${symbol} has been created and initialized with address ${mint.publicKey.toBase58()}`,
          });
          
          // Add this token to our list
          this.handleNewToken({
            id: this.generateId(),
            address: mint.publicKey.toBase58(),
            name,
            symbol,
            createdAt: Date.now(),
            creator: wallet.publicKey.toBase58(),
            isCreatorWatched: false,
            trades: 0,
            topTradersBuying: 0,
            marketCapSol: 0.0001,
            priceUsd: (0.0001 * 20).toString(), // Rough estimate
            liquidity: 0.0001 * LAMPORTS_PER_SOL
          });
          
          return mint.publicKey.toBase58();
        } else {
          throw new Error("Token creation failed: Transaction unsuccessful");
        }
      } catch (innerError) {
        console.error("Error in token creation process:", innerError);
        
        if (innerError instanceof Error && innerError.message.includes("CORS")) {
          throw new Error("Token creation failed due to CORS issues. This is expected in development environment. In production, this should work correctly.");
        } else {
          throw innerError;
        }
      }
    } catch (error) {
      console.error("Error creating token:", error);
      toast.error("Failed to create token", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  }

  trackWallet(walletAddress: string, displayName: string = "") {
    const normalizedAddress = walletAddress.trim();
    
    // Validate Solana address format
    try {
      new PublicKey(normalizedAddress);
    } catch (error) {
      toast.error("Invalid wallet address", {
        description: "Please enter a valid Solana wallet address",
      });
      return false;
    }
    
    // Add to tracked wallets if not already there
    if (!this.trackedWallets.has(normalizedAddress)) {
      this.trackedWallets.set(normalizedAddress, {
        lastCheckedTimestamp: Date.now(),
        displayName: displayName || `Wallet ${normalizedAddress.substring(0, 6)}...`
      });
      
      toast.success("Wallet tracked successfully", {
        description: `${normalizedAddress.substring(0, 8)}... will be monitored for purchases`,
      });
      
      // Add to top wallets as well
      this.addWallet(normalizedAddress);
      
      // Start polling if this is our first tracked wallet
      if (this.trackedWallets.size === 1) {
        this.startWalletPolling();
      }
      
      // Notify listeners with properly formatted wallet objects
      this.notifyListeners("trackedWalletsUpdate", this.getTrackedWallets());
      return true;
    } else {
      toast.info("Wallet already tracked", {
        description: `${normalizedAddress.substring(0, 8)}... is already being monitored`,
      });
      return false;
    }
  }
  
  removeTrackedWallet(walletAddress: string) {
    if (this.trackedWallets.has(walletAddress)) {
      this.trackedWallets.delete(walletAddress);
      
      toast.success("Wallet no longer tracked", {
        description: `${walletAddress.substring(0, 8)}... has been removed from monitoring`,
      });
      
      // Stop polling if no more wallets to track
      if (this.trackedWallets.size === 0 && this.walletPollingInterval) {
        this.stopWalletPolling();
      }
      
      // Notify listeners with properly formatted wallet objects
      this.notifyListeners("trackedWalletsUpdate", this.getTrackedWallets());
      return true;
    }
    return false;
  }
  
  getTrackedWallets() {
    // Return the transformed wallet objects directly to match the TrackedWallet interface
    return Array.from(this.trackedWallets.entries()).map(([address, data]) => ({
      address,
      displayName: data.displayName,
      lastCheckedTimestamp: data.lastCheckedTimestamp
    }));
  }
  
  private startWalletPolling() {
    // Check immediately
    this.checkTrackedWallets();
    
    // Then poll every 2 minutes
    this.walletPollingInterval = window.setInterval(() => {
      this.checkTrackedWallets();
    }, 2 * 60 * 1000); // 2 minutes
  }
  
  private stopWalletPolling() {
    if (this.walletPollingInterval) {
      clearInterval(this.walletPollingInterval);
      this.walletPollingInterval = null;
    }
  }
  
  private async checkTrackedWallets() {
    if (this.trackedWallets.size === 0) return;
    
    for (const [address, data] of this.trackedWallets.entries()) {
      try {
        // Get transactions since last check
        const transactions = await this.fetchRecentTransactions(address, data.lastCheckedTimestamp);
        
        // Update last checked timestamp
        this.trackedWallets.set(address, {
          ...data,
          lastCheckedTimestamp: Date.now()
        });
        
        // Process new transactions
        if (transactions.length > 0) {
          this.processWalletTransactions(address, data.displayName, transactions);
        }
      } catch (error) {
        console.error(`Error checking wallet ${address}:`, error);
      }
    }
  }
  
  private async fetchRecentTransactions(walletAddress: string, sinceTimestamp: number) {
    try {
      // If we're in development mode, return simulated transactions
      if (window.location.hostname === 'localhost') {
        return this.simulateTransactions(walletAddress);
      }
      
      // Real implementation using Solscan API
      const response = await fetch(`https://public-api.solscan.io/account/transactions?account=${walletAddress}&limit=10`, {
        headers: {
          'accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Solscan API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filter transactions that are newer than the last check time
      return data.filter((tx: any) => {
        const txTimestamp = tx.blockTime * 1000; // Convert to milliseconds
        return txTimestamp > sinceTimestamp;
      });
    } catch (error) {
      console.error("Error fetching transactions:", error);
      return [];
    }
  }
  
  private simulateTransactions(walletAddress: string) {
    // Generate a random number (0-2) of simulated transactions
    const numTransactions = Math.floor(Math.random() * 3);
    
    if (numTransactions === 0) return [];
    
    return Array(numTransactions).fill(null).map((_, index) => {
      const randomTokenIndex = Math.floor(Math.random() * exampleTokens.length);
      const randomToken = exampleTokens[randomTokenIndex];
      
      return {
        txHash: `simulate_${Math.random().toString(36).substring(2, 15)}`,
        blockTime: Math.floor(Date.now() / 1000) - (index * 60), // Stagger by a minute
        status: "Success",
        tokenTransfers: [{
          tokenAddress: randomToken.address,
          tokenAmount: Math.floor(Math.random() * 1000) + 1,
          tokenSymbol: randomToken.symbol,
          tokenName: randomToken.name
        }]
      };
    });
  }
  
  private processWalletTransactions(walletAddress: string, displayName: string, transactions: any[]) {
    // Process each transaction
    transactions.forEach(tx => {
      // Focus only on token purchases
      if (tx.tokenTransfers && tx.tokenTransfers.length > 0) {
        tx.tokenTransfers.forEach((transfer: any) => {
          // Create a trade record from the transaction
          const trade: Trade = {
            id: this.generateId(),
            tokenAddress: transfer.tokenAddress || "unknown",
            traderAddress: walletAddress,
            type: "buy", // Assume it's a buy
            amount: transfer.tokenAmount || 0,
            timestamp: (tx.blockTime * 1000) || Date.now()
          };
          
          // Add to trades
          this.trades.unshift(trade);
          
          // Create alert
          const alert: Alert = {
            id: this.generateId(),
            type: "tracked_wallet_purchase",
            title: "Tracked Wallet Purchase",
            description: `${displayName} bought ${transfer.tokenAmount} ${transfer.tokenSymbol || 'tokens'}`,
            timestamp: Date.now(),
            priority: "high",
          };
          
          // Add to alerts
          this.alerts.unshift(alert);
          
          // Notify
          toast.info(`Purchase Alert`, {
            description: alert.description,
          });
          this.playNotificationSound();
          
          // Update listeners
          this.notifyListeners("tradesUpdate", this.trades);
          this.notifyListeners("alertsUpdate", this.alerts);
        });
      }
    });
  }
}

const socketService = new SocketService();
export default socketService;
