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
        "group relative rounded-2xl border border-[#1f1f1f] bg-[#121212]/90 p-6 transition-all duration-300 flex flex-col hover:border-[#333] overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <ArrowUpRight className="absolute top-5 right-5 w-4 h-4 text-[#444] group-hover:text-primary transition-all duration-300" />

      <div className="relative z-10 flex-grow">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-11 h-11 rounded-xl bg-[#181818] border border-[#262626] flex items-center justify-center text-[#f5f5f5] group-hover:text-primary transition-colors">
            <span className="font-mono text-xs uppercase tracking-widest font-bold">
              {vaultInitials}
            </span>
          </div>
          <div className="min-w-0">
            <div className="text-[14px] font-bold text-[#f5f5f5] uppercase tracking-wide truncate font-mono">
              {vault.name}
            </div>
            <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-1">
              {">"} {vault.symbol} · BSC Network
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
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

        {/* Progress Bar (no glow) */}
        <div className="h-1.5 rounded-full bg-[#181818] border border-[#262626] flex mb-6 overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${allocatedPct}%` }}
          />
          <div
            className="h-full bg-transparent transition-all duration-1000"
            style={{ width: `${100 - allocatedPct}%` }}
          />
        </div>
      </div>

      {showChart && (
        <div className="mb-5 border-t border-[#1f1f1f] pt-5 animate-fade-in-up">
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

      <div className="mt-auto pt-5 border-t border-[#1f1f1f] flex gap-3">
        <button
          onClick={handleToggleChart}
          className="flex-1 flex items-center justify-center gap-2 h-10 rounded-xl bg-[#161616] border border-[#262626] text-[#c5c5c5] text-[10.5px] uppercase tracking-widest font-mono hover:text-[#f5f5f5] hover:border-[#3a3a3a] transition-all cursor-pointer"
        >
          <LineChart className="w-3.5 h-3.5" /> {showChart ? "HIDE" : "CHART"}
        </button>
        <button
          onClick={handleDownloadProof}
          disabled={isDownloading}
          className="flex-[2] flex items-center justify-center gap-2 h-10 rounded-xl bg-[#161616] border border-[#262626] text-[#c5c5c5] text-[10.5px] uppercase tracking-widest font-mono hover:text-[#f5f5f5] hover:border-[#3a3a3a] transition-all disabled:opacity-50 cursor-pointer"
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
            symbol: "CAKE-LP",
          });
          availableBalance = realTotalUsd * 0.1;
        } else if (index === 1) {
          allocations.push({
            protocolName: "Venus Protocol",
            amount: realTotalUsd * 0.4,
            rawAmount: realTotalUsd * 0.4,
            symbol: "vUSDT",
          });
          allocations.push({
            protocolName: "PancakeSwap V3",
            amount: realTotalUsd * 0.5,
            rawAmount: realTotalUsd * 0.5,
            symbol: "WBNB-LP",
          });
          availableBalance = realTotalUsd * 0.1;
        } else {
          allocations.push({
            protocolName: "PancakeSwap V3",
            amount: realTotalUsd * 0.85,
            rawAmount: realTotalUsd * 0.85,
            symbol: "HIGH-BETA",
          });
          availableBalance = realTotalUsd * 0.15;
        }
      }

      return { totalUsd: realTotalUsd, allocations, availableBalance };
    };

    const v0 = getVaultData(0);
    const v1 = getVaultData(1);
    const v2 = getVaultData(2);

    return [
      {
        id: "yield-farm",
        name: "The Yield Farm",
        symbol: "yUSDT",
        contractAddress: ACTIVE_VAULTS[0] as `0x${string}`,
        apy: 14.5,
        totalBalance: v0.totalUsd,
        availableBalance: v0.availableBalance,
        allocations: v0.allocations,
      },
      {
        id: "bluechip-momentum",
        name: "Bluechip Momentum",
        symbol: "bUSDT",
        contractAddress: ACTIVE_VAULTS[1] as `0x${string}`,
        apy: 22.4,
        totalBalance: v1.totalUsd,
        availableBalance: v1.availableBalance,
        allocations: v1.allocations,
      },
      {
        id: "degen-accumulator",
        name: "Degen Accumulator",
        symbol: "dUSDT",
        contractAddress: ACTIVE_VAULTS[2] as `0x${string}`,
        apy: 38.2,
        totalBalance: v2.totalUsd,
        availableBalance: v2.availableBalance,
        allocations: v2.allocations,
      },
    ];
  }, [onChainData]);

  return (
    <div className="space-y-8 relative">
      <div className="relative z-10 space-y-8">
        <div className="-mt-6">
          <PageHero
            badge="Vaults · Autonomous Strategies"
            title="Smart"
            accent="Vaults"
            media={{ kind: "video", src: "/bg/smartvaults.mp4", opacity: 40 }}
            subtitle="Automated, risk-adjusted yield engines running on-chain. Deposit capital into specialized strategies managed by AI agents."
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {strategyVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              isLoading={isVaultsLoading}
            />
          ))}
        </div>

        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            <h3 className="text-[13px] font-mono font-bold tracking-wider uppercase text-[#f5f5f5]">
              Real-Time Protocol Allocation Matrix
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {strategyVaults.map((vault) => (
              <VaultAllocationBar
                key={`alloc-${vault.id}`}
                vault={vault}
                onDeposit={setSelectedVault}
              />
            ))}
          </div>
        </div>
      </div>

      {selectedVault && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <VaultPanel
            vaultId={selectedVault.id}
            vaultName={selectedVault.name}
            vaultAddress={selectedVault.contractAddress}
            vaultSymbol={selectedVault.symbol}
            onClose={() => setSelectedVault(null)}
          />
        </div>
      )}
    </div>
  );
}
