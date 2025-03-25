
import React, { useEffect } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { TokenAlerts } from "@/components/dashboard/TokenAlerts";
import { WalletActivity } from "@/components/dashboard/WalletActivity";
import { AlertFeed } from "@/components/dashboard/AlertFeed";
import { toast } from "sonner";

const Index = () => {
  useEffect(() => {
    // Simulate an incoming alert
    const timer = setTimeout(() => {
      toast.success("New token detected", {
        description: "TrenchFighter (TFIGHT) launched by watched creator",
        action: {
          label: "View",
          onClick: () => console.log("Clicked"),
        },
      });
      
      // Play notification sound
      const audio = new Audio("/notification.mp3");
      audio.volume = 0.5;
      audio.play().catch(e => console.log("Audio play prevented:", e));
    }, 3000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <DashboardHeader />
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <TokenAlerts />
          <AlertFeed />
          <WalletActivity />
        </div>
      </div>
    </AppLayout>
  );
};

export default Index;
