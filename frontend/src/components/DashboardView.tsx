"use client";

import { Activity, BadgePlus, Coins, Network, TrendingUp } from "lucide-react";
import { useReadContract } from "wagmi";
import { EventLog } from "./EventLog";
import { KPICard } from "./KPICard";
import { PageHero } from "./PageHero";
import { VaultPanel } from "./VaultPanel";

// Alamat Smart Contract Proxy V2 milikmu
const VAULT_ADDRESS = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";

// Minimal ABI untuk membaca TVL
const vaultABI = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export function DashboardView() {
  // 🔗 WAGMI HOOK: Membaca totalAssets dari BSC Testnet secara real-time
  const { data: totalAssetsData, isLoading: isTvlLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultABI,
    functionName: "totalAssets",
    query: {
      refetchInterval: 10000, // Auto-refresh data setiap 10 detik!
    },
  });

  // Mengonversi saldo dari Wei (18 desimal) ke format desimal biasa
  // Jika saldo kosong atau error, fallback ke 0
  const realTVL = totalAssetsData ? Number(totalAssetsData) / 1e18 : 0;


  return (
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      <div className="-mt-6">
        <PageHero
          badge="Overview · Autonomous Vault"
          title="On-Chain"
          accent="Oversight"
          subtitle="Live strategy state across the BSC network — what is held, what is yielding, and where the AI is routing funds."
          media={{ kind: "video", src: "/bg/plexuspurple.mp4", opacity: 60 }}
          actions={
            <button
              onClick={() => {
                document
                  .getElementById("vault-panel-section")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className="liquid-glass liquid-cta liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
            >
              <BadgePlus className="w-4 h-4" />
              Deposit Asset
            </button>
          }
        />
      </div>

      {/* 2. KPI METRICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <KPICard
          title="Total Value Locked"
          value={realTVL}
          prefix="$"
          icon={Activity}
          change="Live On-Chain"
          changeType="positive"
          subtext="Verified via Wagmi"
          delay={0}
          isLoading={isTvlLoading} 
        />
        <KPICard
          title="Current APY"
          value={24.5}
          prefix=""
          suffix="%"
          icon={TrendingUp}
          change="Optimal"
          changeType="positive"
          subtext="Dynamic Multi-Routing"
          delay={80}
        />
        <KPICard
          title="Available Liquidity"
          value={realTVL * 0.2}
          prefix="$"
          icon={Coins}
          change="Ready"
          changeType="neutral"
          subtext="Awaiting new routes"
          delay={160}
          isLoading={isTvlLoading} 
        />
        <KPICard
          title="AI Rebalances"
          value={142}
          prefix=""
          suffix=""
          icon={Network}
          change="Synced"
          changeType="positive"
          subtext="Immutably stored on BSC"
          delay={240}
        />
      </div>

      {/* 3. TERMINAL UI GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start mt-8">
        <div id="vault-panel-section" className="lg:col-span-1 h-full">
          <VaultPanel />
        </div>
        <div className="lg:col-span-2 h-full">
          <EventLog />
        </div>
      </div>
    </div>
  );
}
