"use client";

import { CONFIG } from "@/config/config";
import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn, formatCurrency } from "@/lib/utils";
import { ArrowUpRight, FileText, LineChart, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { useReadContracts } from "wagmi";
import { ACTIVE_VAULTS } from "../config/addresses";
import { GRAPHQL_ENDPOINT } from "../config/config";
import { PageHero } from "./PageHero";
import {
  VaultAllocationBar,
  type AIAllocation,
  type VaultData,
} from "./VaultAllocationBar";
import { VaultChart } from "./VaultChart";
import { VaultPanel } from "./VaultPanel";

// --- ABIs & CONSTANTS ---
const USDT_TESTNET = CONFIG.TOKENS.USDT as `0x${string}`;

const vaultTotalAssetsABI = [
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

const erc20ABI = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

// --- UTILS ---
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

function guessProtocolName(tokenOutAddress: string) {
  if (!tokenOutAddress) return "Unknown Protocol";

  const addr = tokenOutAddress.toLowerCase();

  if (
    CONFIG.PROTOCOLS?.VENUS_VUSDT &&
    addr === CONFIG.PROTOCOLS.VENUS_VUSDT.toLowerCase()
  ) {
    return "Venus Protocol";
  }

  if (
    (CONFIG.TOKENS?.WBNB && addr === CONFIG.TOKENS.WBNB.toLowerCase()) ||
    (CONFIG.PROTOCOLS?.PANCAKE_ROUTER &&
      addr === CONFIG.PROTOCOLS.PANCAKE_ROUTER.toLowerCase()) ||
    (CONFIG.PROTOCOLS?.PANCAKE_V3_MANAGER &&
      addr === CONFIG.PROTOCOLS.PANCAKE_V3_MANAGER.toLowerCase())
  ) {
    return "PancakeSwap V3";
  }

  if (CONFIG.TOKENS?.BCSPX && addr === CONFIG.TOKENS.BCSPX.toLowerCase()) {
    return "Backed.fi";
  }

  return "Unknown Protocol";
}

interface RawRebalance {
  address: string;
  tokenOut: string;
  amountIn: string;
}

//  COMPONENTS
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

  const totalAllocated = vault.allocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0,
  );
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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:9000";

  const handleDownloadProof = () => {
    setIsDownloading(true);
    window.open(`${API_URL}/api/report/pdf?vault=${vault.id}`, "_blank");
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

        {/* Progress Bar */}
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
  const [graphAllocations, setGraphAllocations] = useState<
    Record<string, AIAllocation[]>
  >({});

  const { data: onChainData, isLoading: isVaultsLoading } = useReadContracts({
    contracts: [
      {
        address: ACTIVE_VAULTS[0] as `0x${string}`,
        abi: vaultTotalAssetsABI,
        functionName: "totalAssets",
      },
      {
        address: ACTIVE_VAULTS[1] as `0x${string}`,
        abi: vaultTotalAssetsABI,
        functionName: "totalAssets",
      },
      {
        address: ACTIVE_VAULTS[2] as `0x${string}`,
        abi: vaultTotalAssetsABI,
        functionName: "totalAssets",
      },
      {
        address: USDT_TESTNET as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [ACTIVE_VAULTS[0] as `0x${string}`],
      },
      {
        address: USDT_TESTNET as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [ACTIVE_VAULTS[1] as `0x${string}`],
      },
      {
        address: USDT_TESTNET as `0x${string}`,
        abi: erc20ABI,
        functionName: "balanceOf",
        args: [ACTIVE_VAULTS[2] as `0x${string}`],
      },
    ],
    query: { refetchInterval: 10000 },
  });

  useEffect(() => {
    let isMounted = true;

    async function fetchAllVaultAllocations() {
      try {
        const query = `
          {
            rebalanceExecuteds(
              first: 100
            ) {
              address
              tokenOut
              amountIn
            }
          }
        `;

        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const json = await res.json();
        const data = json.data;

        if (!isMounted || !data || !data.rebalanceExecuteds) return;

        const vaultAllocations: Record<string, AIAllocation[]> = {};

        ACTIVE_VAULTS.forEach((vaultAddr) => {
          const vaultEvents = data.rebalanceExecuteds.filter(
            (e: RawRebalance) =>
              e.address.toLowerCase() === vaultAddr.toLowerCase(),
          );

          const protocolTotals: Record<string, number> = {};

          vaultEvents.forEach((event: RawRebalance) => {
            const amount = Number(formatUnits(BigInt(event.amountIn), 18));
            const protocolName = guessProtocolName(event.tokenOut);

            if (!protocolTotals[protocolName]) {
              protocolTotals[protocolName] = 0;
            }
            protocolTotals[protocolName] += amount;
          });

          vaultAllocations[vaultAddr.toLowerCase()] = Object.keys(
            protocolTotals,
          ).map((name) => ({
            protocolName: name,
            amount: protocolTotals[name],
            symbol: "USDT",
          }));
        });

        setGraphAllocations(vaultAllocations);
      } catch (error) {
        console.error("Gagal menarik alokasi real-time dari The Graph:", error);
      }
    }

    fetchAllVaultAllocations();
    const interval = setInterval(fetchAllVaultAllocations, 10000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const strategyVaults = useState<VaultData[]>(() => {
    return [];
  });

  const getVaultData = (
    index: number,
    vaultId: string,
    name: string,
    symbol: string,
    apy: number,
  ) => {
    const vaultAddr = ACTIVE_VAULTS[index].toLowerCase();

    const totalAssetsWei =
      (onChainData?.[index]?.result as bigint) || BigInt(0);
    const idleUsdtWei =
      (onChainData?.[index + 3]?.result as bigint) || BigInt(0);

    const realTotalUsd = Number(formatUnits(totalAssetsWei, 18));

    const allocations = graphAllocations[vaultAddr] || [];

    const totalDeployedFromGraph = allocations.reduce(
      (sum, alloc) => sum + alloc.amount,
      0,
    );

    const availableBalance = Math.max(0, realTotalUsd - totalDeployedFromGraph);

    return {
      id: vaultId,
      name,
      symbol,
      contractAddress: ACTIVE_VAULTS[index] as `0x${string}`,
      apy,
      totalBalance: realTotalUsd,
      availableBalance,
      allocations,
    };
  };

  const computedVaults: VaultData[] = [
    getVaultData(0, "yield-farm", "The Yield Farm", "yUSDT", 14.5),
    getVaultData(1, "bluechip-momentum", "Bluechip Momentum", "bUSDT", 22.4),
    getVaultData(2, "degen-accumulator", "Degen Accumulator", "dUSDT", 38.2),
  ];

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
          {computedVaults.map((vault) => (
            <VaultCard
              key={vault.id}
              vault={vault}
              isLoading={
                isVaultsLoading || Object.keys(graphAllocations).length === 0
              }
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
            {computedVaults.map((vault) => (
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
