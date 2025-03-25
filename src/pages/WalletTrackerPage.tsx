import React from "react";
import { PageHeader } from "@/components/layout/PageHeader";
import { WalletTracker } from "@/components/wallet/WalletTracker";
import { WalletActivity } from "@/components/dashboard/WalletActivity";

export function WalletTrackerPage() {
  return (
    <div className="container max-w-screen-xl mx-auto px-4 py-8">
      <PageHeader
        title="Wallet Tracker"
        description="Track any Solana wallet and get notified when they make purchases"
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="lg:col-span-1">
          <WalletTracker />
        </div>
        <div className="lg:col-span-2">
          <WalletActivity />
        </div>
      </div>
    </div>
  );
} 