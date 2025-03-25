
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";

class SocketService {
  private socket: Socket | null = null;
  private isConnected = false;
  private listeners: Map<string, Array<(data: any) => void>> = new Map();

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

      // Register event listeners for top trader buys
      this.socket.on("alertTopTraderBuy", (data) => {
        this.notifyListeners("alertTopTraderBuy", data);
        toast.info(`Top Trader Buy Alert`, {
          description: `${data.wallet.substring(0, 6)}... bought ${data.tokenSymbol}`,
        });
        this.playNotificationSound();
      });

      // Register event listener for new tokens
      this.socket.on("newToken", (data) => {
        this.notifyListeners("newToken", data);
        if (data.isCreatorWatched) {
          toast.success(`New Token by Watched Creator`, {
            description: `${data.name} (${data.symbol}) was just launched`,
          });
          this.playNotificationSound();
        }
      });

      // Register event listener for new trades
      this.socket.on("newTrade", (data) => {
        this.notifyListeners("newTrade", data);
      });
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

  // Add a wallet to track
  addWallet(walletAddress: string) {
    if (!this.socket || !this.isConnected) return;
    this.socket.emit("addWallet", walletAddress);
  }
}

// Create a singleton instance
const socketService = new SocketService();
export default socketService;
