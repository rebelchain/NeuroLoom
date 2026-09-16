import { Activity, Coins, TrendingUp, Network, BadgePlus } from "lucide-react";
import { PageHero } from "./PageHero";
import { KPICard } from "./KPICard";
import { EventLog, type AIEventRow } from "./EventLog";
import { VaultPanel } from "./VaultPanel";

const DUMMY_EVENTS: AIEventRow[] = [
  {
    id: "1",
    type: "ROUTE_OPTIMIZED",
    protocol: "PancakeSwap",
    asset: "USDT/WBNB",
    amount: 15400,
    detail: "Found +2.4% APY Arbitrage",
    timestamp: Date.now() - 30000,
    txHash: "0xabc123456789",
  },
  {
    id: "2",
    type: "REBALANCE_EXECUTED",
    protocol: "Venus",
    asset: "USDT",
    amount: 5000,
    detail: "Moved to higher yield pool",
    timestamp: Date.now() - 120000,
    txHash: "0xdef456789abc",
  },
  {
    id: "3",
    type: "YIELD_HARVESTED",
    protocol: "NeuroLoom",
    asset: "WBNB",
    amount: 120,
    detail: "Auto-compounded",
    timestamp: Date.now() - 360000,
    txHash: "0xghi789abcdef",
  },
];

export function DashboardView() {
  return (
    // UBAH BARIS INI: Hanya gunakan space-y-6
    <div className="space-y-6">
      {/* 1. HERO BANNER */}
      {/* UBAH BARIS INI: Tambahkan div pembungkus dengan margin-top negatif */}
      <div className="-mt-6">
        <PageHero
          badge="Overview · Autonomous Vault"
          title="On-Chain"
          accent="Oversight"
          subtitle="Live strategy state across the BSC network — what is held, what is yielding, and where the AI is routing funds."
          media={{ kind: "video", src: "/bg/plexuspurple.mp4", opacity: 60 }}
          actions={
            <button className="liquid-glass liquid-cta liquid-glass-button px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2">
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
          value={145200}
          prefix="$"
          icon={Activity}
          change="+12.5%"
          changeType="positive"
          subtext="Managed by AI Agent"
          delay={0}
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
          value={45000}
          prefix="$"
          icon={Coins}
          change="Ready"
          changeType="neutral"
          subtext="Awaiting new routes"
          delay={160}
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
        <div className="lg:col-span-1 h-full">
          <VaultPanel />
        </div>
        <div className="lg:col-span-2 h-full">
          <EventLog events={DUMMY_EVENTS} />
        </div>
      </div>
    </div>
  );
}
