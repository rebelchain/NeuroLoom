"use client";

import {
  Coins,
  LockKeyhole,
  ArrowUpRight,
  Boxes,
  Activity,
  Loader2,
} from "lucide-react";
import { VaultAllocationBar, type VaultData } from "./VaultAllocationBar";
import { PageHero } from "./PageHero";
import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn, formatCurrency } from "@/lib/utils";
import { useReadContract } from "wagmi";
import { useMemo } from "react";

const VAULT_ADDRESS = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";
const vaultABI = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;


function VaultCard({
  vault,
  isLoading = false,
}: {
  vault: VaultData;
  isLoading?: boolean;
}) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);

  // DEFENSE: Mencegah NaN crash jika totalBalance 0
  const totalAllocated = vault.totalBalance - vault.availableBalance;
  const allocatedPct =
    vault.totalBalance > 0 ? (totalAllocated / vault.totalBalance) * 100 : 0;

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
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-gray-500 animate-pulse text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> SYNCING
                </span>
              ) : (
                formatCurrency(vault.totalBalance)
              )}
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
              {isLoading ? (
                <span className="flex items-center gap-1.5 text-gray-500 animate-pulse text-xs">
                  <Loader2 className="w-3 h-3 animate-spin" /> SYNCING
                </span>
              ) : (
                formatCurrency(totalAllocated)
              )}
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
  // 1. Ambil Data sekaligus status isLoading dari Wagmi
  const { data: totalAssetsData, isLoading: isVaultLoading } = useReadContract({
    address: VAULT_ADDRESS,
    abi: vaultABI,
    functionName: "totalAssets",
    query: { refetchInterval: 10000 },
  });

  // 2. Gabungkan Data
  const hybridVaults = useMemo<VaultData[]>(() => {
    // Pertahankan angka 0 murni jika memang saldonya 0, agar akurat dengan Blockchain
    const realTVL = totalAssetsData ? Number(totalAssetsData) / 1e18 : 0;

    return [
      {
        id: "1",
        name: "Stablecoin Alpha Vault",
        symbol: "USDT",
        totalBalance: realTVL, // 100% Akurat On-Chain
        availableBalance: realTVL * 0.2, // Simulasi AI memegang 20%
        apy: 18.5,
        allocations: [
          { protocolName: "Venus Protocol", amount: realTVL * 0.5 },
          { protocolName: "PancakeSwap V3", amount: realTVL * 0.3 },
        ],
      },
      {
        id: "2",
        name: "BNB Yield Optimizer",
        symbol: "WBNB",
        totalBalance: 339988, // Visi Produk Ekosistem (Statik)
        availableBalance: 39988,
        apy: 24.2,
        allocations: [
          { protocolName: "Radiant Capital", amount: 200000 },
          { protocolName: "Kinza Finance", amount: 100000 },
        ],
      },
    ];
  }, [totalAssetsData]);

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
        {hybridVaults.map((vault) => (
          <VaultCard
            key={vault.id}
            vault={vault}
            // Hanya aplikasikan efek loading ke Vault 1 (karena Vault 2 statis)
            isLoading={vault.id === "1" ? isVaultLoading : false}
          />
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
            {hybridVaults.length} active vaults
          </span>
        </div>
        {hybridVaults.map((vault) => (
          <VaultAllocationBar key={vault.id} vault={vault} />
        ))}
      </div>
    </div>
  );
}
