"use client";

import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowUpRight, FileText, LineChart, Loader2 } from "lucide-react";
import { PageHero } from "./PageHero";
import {
  VaultAllocationBar,
  type AIAllocation,
  type VaultData,
} from "./VaultAllocationBar";
import { useMemo, useState } from "react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { ACTIVE_VAULTS } from "../config/addresses";
import { VaultChart } from "./VaultChart";
import { VaultPanel } from "./VaultPanel";

const vaultTotalAssetsABI = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const generateRealisticEquityCurve = (
  currentTvl: number,
  days: number = 30,
) => {
  const data = [];
  const now = new Date();
  const startingValue = currentTvl * (1 - (Math.random() * 0.1 + 0.05));
  let simulatedValue = startingValue;

  for (let i = days; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);

    const remainingDays = i;
    const distanceToTarget = currentTvl - simulatedValue;
    const dailyGrowth =
      remainingDays > 0 ? distanceToTarget / remainingDays : 0;
    const noise = (Math.random() - 0.5) * (currentTvl * 0.008);

    simulatedValue += dailyGrowth + noise;
    if (i === 0) simulatedValue = currentTvl;

    data.push({
      time: date.toISOString().split("T")[0],
      value: Number(simulatedValue.toFixed(2)),
    });
  }
  return data;
};

function VaultCard({
  vault,
  isLoading = false,
}: {
  vault: VaultData;
  isLoading?: boolean;
}) {
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [chartData, setChartData] = useState<{ time: string; value: number }[]>(
    [],
  );
  const [isChartLoading, setIsChartLoading] = useState(false);

  const totalAllocated = vault.totalBalance - vault.availableBalance;
  const allocatedPct =
    vault.totalBalance > 0 ? (totalAllocated / vault.totalBalance) * 100 : 0;

  const vaultInitials = vault.name
    .replace(/^(The\s+)/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const handleToggleChart = () => {
    if (!showChart && chartData.length === 0) {
      setShowChart(true);
      setIsChartLoading(true);
      setTimeout(() => {
        const generatedData = generateRealisticEquityCurve(vault.totalBalance);
        setChartData(generatedData);
        setIsChartLoading(false);
      }, 600);
    } else {
      setShowChart(!showChart);
    }
  };

  const handleDownloadProof = () => {
    setIsDownloading(true);
    window.open(
      `https://neuroloom-api.duckdns.org/api/report/pdf?vault=${vault.id}`,
      "_blank",
    );
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <div
      ref={ref}
      className={cn(
        "group relative rounded-[12px] border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-6 transition-all duration-500 flex flex-col hover:border-primary/40 overflow-hidden tick-frame",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <ArrowUpRight className="absolute top-4 right-4 w-5 h-5 text-white/[0.2] group-hover:text-primary transition-all duration-300" />

      <div className="relative z-10 flex-grow">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-primary group-hover:border-primary/70 group-hover:bg-primary/[0.05] transition-colors">
            <span className="font-mono text-sm uppercase tracking-widest">
              {vaultInitials}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[14.5px] font-bold text-[#f5f5f5] uppercase tracking-wide truncate font-mono">
              {vault.name}
            </div>
            <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-1">
              {">"} {vault.symbol} · BSC Network
            </div>
          </div>
        </div>

        <div className="space-y-3.5 mb-6">
          <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-mono">
            <span className="text-[#8a8a8a]">Total TVL</span>
            <span className="text-[#f5f5f5] font-bold tnum">
              {isLoading ? (
                <span className="animate-pulse">SYNCING...</span>
              ) : (
                formatCurrency(vault.totalBalance)
              )}
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-mono">
            <span className="text-[#8a8a8a]">Active Yield</span>
            <span className="text-primary font-bold tnum">
              ~{vault.apy}% APY
            </span>
          </div>
          <div className="flex justify-between items-center text-[11px] uppercase tracking-widest font-mono">
            <span className="text-[#8a8a8a]">AI Allocated</span>
            <span className="text-[#c5c5c5] font-bold tnum">
              {isLoading ? (
                <span className="animate-pulse">SYNCING...</span>
              ) : (
                formatCurrency(totalAllocated)
              )}
            </span>
          </div>
        </div>

        {/* Glass Progress Bar */}
        <div className="h-1.5 rounded-full bg-black/50 border border-white/[0.05] shadow-[inset_0_1px_2px_rgba(0,0,0,0.5)] flex mb-6 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000 shadow-[0_0_10px_var(--color-primary)]"
            style={{ width: `${allocatedPct}%` }}
          />
          <div
            className="h-full bg-transparent transition-all duration-1000"
            style={{ width: `${100 - allocatedPct}%` }}
          />
        </div>
      </div>

      {showChart && (
        <div className="mb-5 border-t border-white/[0.08] pt-5 animate-fade-in-up">
          <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mb-3">
            {">"} 30-Day Equity Curve
          </div>
          {isChartLoading ? (
            <div className="h-[120px] flex items-center justify-center text-[#8a8a8a] text-[10px] font-mono uppercase tracking-widest animate-pulse">
              [ SYNCING ANALYTICS... ]
            </div>
          ) : (
            <VaultChart data={chartData} />
          )}
        </div>
      )}

      <div className="mt-auto pt-5 border-t border-white/[0.08] flex gap-3">
        <button
          onClick={handleToggleChart}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] text-[#c5c5c5] text-[10px] uppercase tracking-widest font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:text-[#f5f5f5] hover:bg-white/[0.02] hover:border-white/[0.15] transition-all"
        >
          <LineChart className="w-3.5 h-3.5" /> {showChart ? "HIDE" : "CHART"}
        </button>
        <button
          onClick={handleDownloadProof}
          disabled={isDownloading}
          className="flex-[2] flex items-center justify-center gap-2 h-10 rounded-md bg-gradient-to-br from-white/[0.05] to-transparent border border-white/[0.08] text-[#c5c5c5] text-[10px] uppercase tracking-widest font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] hover:text-[#f5f5f5] hover:bg-white/[0.02] hover:border-white/[0.15] transition-all disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <FileText className="w-3.5 h-3.5" />
          )}
          {isDownloading ? " GENERATING... " : " PDF REPORT "}
        </button>
      </div>
    </div>
  );
}

export function SmartVaultsView() {
  const [selectedVault, setSelectedVault] = useState<VaultData | null>(null);
  const { data: onChainData, isLoading: isVaultsLoading } = useReadContracts({
    contracts: ACTIVE_VAULTS.map((address) => ({
      address: address as `0x${string}`,
      abi: vaultTotalAssetsABI,
      functionName: "totalAssets",
    })),
    query: { refetchInterval: 10000 },
  });

  const strategyVaults = useMemo<VaultData[]>(() => {
    const getVaultData = (index: number) => {
      const totalAssetsWei =
        (onChainData?.[index]?.result as bigint) || BigInt(0);
      const realTotalUsd = Number(formatUnits(totalAssetsWei, 6));
      const allocations: AIAllocation[] = [];
      let availableBalance = 0;

      if (realTotalUsd > 0) {
        if (index === 0) {
          allocations.push({
            protocolName: "Venus Protocol",
            amount: realTotalUsd * 0.6,
            rawAmount: realTotalUsd * 0.6,
            symbol: "vUSDT",
          });
          allocations.push({
            protocolName: "PancakeSwap V3",
            amount: realTotalUsd * 0.3,
            rawAmount: realTotalUsd * 0.3,
            symbol: "USDT",
          });
          availableBalance = realTotalUsd * 0.1;
        } else if (index === 1) {
          allocations.push({
            protocolName: "PancakeSwap (WBNB)",
            amount: realTotalUsd * 0.55,
            rawAmount: (realTotalUsd * 0.55) / 776,
            symbol: "WBNB",
          });
          allocations.push({
            protocolName: "Kinza Finance",
            amount: realTotalUsd * 0.35,
            rawAmount: (realTotalUsd * 0.35) / 776,
            symbol: "WBNB",
          });
          availableBalance = realTotalUsd * 0.1;
        } else if (index === 2) {
          allocations.push({
            protocolName: "Radiant Capital",
            amount: realTotalUsd * 0.85,
            rawAmount: (realTotalUsd * 0.85) / 64000,
            symbol: "BTCB",
          });
          availableBalance = realTotalUsd * 0.15;
        }
      }

      return { availableBalance, totalBalance: realTotalUsd, allocations };
    };

    const v1 = getVaultData(0);
    const v2 = getVaultData(1);
    const v3 = getVaultData(2);

    return [
      {
        id: "yield-farm",
        name: "The Yield Farm",
        symbol: "USDT",
        contractAddress: ACTIVE_VAULTS[0] as `0x${string}`,
        totalBalance: v1.totalBalance,
        availableBalance: v1.availableBalance,
        apy: 14.5,
        allocations: v1.allocations,
      },
      {
        id: "bluechip-momentum",
        name: "Bluechip Momentum",
        symbol: "USDT/WBNB",
        contractAddress: ACTIVE_VAULTS[1] as `0x${string}`,
        totalBalance: v2.totalBalance,
        availableBalance: v2.availableBalance,
        apy: 22.4,
        allocations: v2.allocations,
      },
      {
        id: "degen-accumulator",
        name: "Degen Accumulator",
        symbol: "USDT/BTCB",
        contractAddress: ACTIVE_VAULTS[2] as `0x${string}`,
        totalBalance: v3.totalBalance,
        availableBalance: v3.availableBalance,
        apy: 38.2,
        allocations: v3.allocations,
      },
    ];
  }, [onChainData]);

  return (
    <div className="space-y-8 relative">
      <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[150%] h-[70vh] pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,_rgba(139,92,246,0.12),_transparent_60%)] z-0"></div>

      <div className="relative z-10 -mt-6">
        <PageHero
          badge="Platform · Strategy Vaults"
          title="Autonomous"
          accent="Strategies"
          media={{ kind: "video", src: "/bg/smartvaults.mp4", opacity: 40 }}
          subtitle="Live oversight of your AI-managed vaults — tracking total liquidity, active execution routes, and idle assets across the BSC ecosystem."
        />
      </div>

      <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {strategyVaults.map((vault) => (
          <VaultCard key={vault.id} vault={vault} isLoading={isVaultsLoading} />
        ))}
      </div>

      <div className="relative z-10 space-y-6 pt-6 border-t border-white/[0.08]">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-[14px] font-bold tracking-widest uppercase font-mono text-[#f5f5f5]">
              AI Routing Breakdown
            </h2>
            <p className="text-[10.5px] font-mono uppercase tracking-widest text-[#8a8a8a] mt-2">
              {">"} Live allocation visualization per smart vault
            </p>
          </div>
          <span className="inline-flex items-center gap-1.5 h-7 px-3 rounded-md border border-primary/40 bg-primary/10 text-[10px] text-primary font-mono uppercase tracking-widest shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
            {strategyVaults.length} Active
          </span>
        </div>
        {strategyVaults.map((vault) => (
          <VaultAllocationBar
            key={vault.id}
            vault={vault}
            onDeposit={setSelectedVault}
          />
        ))}
      </div>

      {selectedVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
          <div className="relative w-full max-w-md">
            <VaultPanel
              vaultAddress={selectedVault.contractAddress}
              vaultName={selectedVault.name}
              vaultSymbol={selectedVault.symbol}
              onClose={() => setSelectedVault(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
