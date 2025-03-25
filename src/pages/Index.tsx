
import React, { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TokenAlerts } from "@/components/dashboard/TokenAlerts";
import { WalletActivity } from "@/components/dashboard/WalletActivity";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import socketService from "@/services/socketService";
import { toast } from "sonner";

const Index = () => {
  useEffect(() => {
    // Connect to the socket server when the app loads
    socketService.connect();
    
    // Show a welcome toast
    toast.info("TrenchSniper Active", {
      description: "Monitoring network for trading activity and new tokens",
      duration: 5000,
    });
    
    // Clean up on unmount
    return () => {
      socketService.disconnect();
    };
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TokenAlerts />
          <WalletActivity />
          <AlertFeed />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
