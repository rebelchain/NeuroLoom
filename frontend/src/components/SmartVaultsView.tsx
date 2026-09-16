import {
  Coins,
  LockKeyhole,
  ArrowUpRight,
  Boxes,
  Activity,
} from "lucide-react";
import { VaultAllocationBar, type VaultData } from "./VaultAllocationBar";
import { PageHero } from "./PageHero";
import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn, formatCurrency } from "@/lib/utils";

// DUMMY DATA UNTUK HACKATHON
const DUMMY_VAULTS: VaultData[] = [
  {
    id: "1",
    name: "Stablecoin Alpha Vault",
    symbol: "USDT",
    totalBalance: 299989,
    availableBalance: 49989,
    apy: 18.5,
    allocations: [
      { protocolName: "Venus Protocol", amount: 150000 },
      { protocolName: "PancakeSwap V3", amount: 100000 },
    ],
  },
  {
    id: "2",
    name: "BNB Yield Optimizer",
    symbol: "WBNB",
    totalBalance: 339988,
    availableBalance: 39988,
    apy: 24.2,
    allocations: [
      { protocolName: "Radiant Capital", amount: 200000 },
      { protocolName: "Kinza Finance", amount: 100000 },
    ],
  },
];

function VaultCard({ vault }: { vault: VaultData }) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);
  const totalAllocated = vault.totalBalance - vault.availableBalance;
  const allocatedPct = (totalAllocated / vault.totalBalance) * 100;

  return (
    <div
      ref={ref}
      className={cn(
        "group relative liquid-glass rounded-2xl p-5 transition-all duration-500 overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <ArrowUpRight className="absolute top-4 right-4 w-4 h-4 text-gray-500 opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />

      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-5">
          <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-primary/25 bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">
              {vault.symbol.slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-sm font-semibold text-white truncate">
              {vault.name}
            </div>
            <div className="text-xs font-mono text-gray-400">
              {vault.symbol} · BSC Network
            </div>
          </div>
        </div>

        <div className="space-y-2.5 mb-4">
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Coins className="w-3.5 h-3.5" /> Total TVL
            </span>
            <span className="font-mono font-semibold text-white">
              {formatCurrency(vault.totalBalance)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-400">
              <Activity className="w-3.5 h-3.5 text-primary" /> Active Yield
            </span>
            <span className="font-mono font-semibold text-primary">
              {vault.apy}% APY
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="flex items-center gap-1.5 text-gray-400">
              <LockKeyhole className="w-3.5 h-3.5 text-success" /> AI Allocated
            </span>
            <span className="font-mono font-semibold text-success">
              {formatCurrency(totalAllocated)}
            </span>
          </div>
        </div>

        <div className="h-2 rounded-full bg-black/30 border border-white/10 overflow-hidden flex">
          <div
            className="h-full bg-gradient-to-r from-primary to-info transition-all duration-1000"
            style={{ width: `${allocatedPct}%` }}
          />
          <div
            className="h-full bg-success/25 transition-all duration-1000"
            style={{ width: `${100 - allocatedPct}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SmartVaultsView() {
  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Platform · Smart Vaults"
          title="Autonomous"
          accent="Vaults"
          subtitle="Live oversight of your AI-managed vaults — tracking total liquidity, active execution routes, and idle assets across the BSC ecosystem."
          media={{ kind: "video", src: "/bg/smartvaults.mp4", opacity: 55 }}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {DUMMY_VAULTS.map((vault) => (
          <VaultCard key={vault.id} vault={vault} />
        ))}
      </div>

      <div className="space-y-4 pt-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-white">
              AI Routing Breakdown
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              Live allocation visualization per smart vault
            </p>
          </div>
          <span className="text-xs font-mono text-gray-500">
            {DUMMY_VAULTS.length} active vaults
          </span>
        </div>
        {DUMMY_VAULTS.map((vault) => (
          <VaultAllocationBar key={vault.id} vault={vault} />
        ))}
      </div>
    </div>
  );
}
