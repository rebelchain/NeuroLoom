"use client";

import {
  Activity,
  ArrowRight,
  Coins,
  Download,
  Network,
  TrendingUp,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useReadContracts } from "wagmi";
import { ACTIVE_VAULTS } from "../config/addresses";
import { GRAPHQL_ENDPOINT } from "../config/config";
import { EventLog } from "./EventLog";
import { KPICard } from "./KPICard";
import { PageHero } from "./PageHero";

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
  const [totalRebalances, setTotalRebalances] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);

  const { data: totalAssetsData, isLoading: isTvlLoading } = useReadContracts({
    contracts: ACTIVE_VAULTS.map((address) => ({
      address: address as `0x${string}`,
      abi: vaultABI,
      functionName: "totalAssets",
    })),
    query: { refetchInterval: 10000 },
  });

  const tvlYieldFarm = totalAssetsData?.[0]?.result
    ? Number(totalAssetsData[0].result) / 1e18
    : 0;
  const tvlBluechip = totalAssetsData?.[1]?.result
    ? Number(totalAssetsData[1].result) / 1e18
    : 0;
  const tvlDegen = totalAssetsData?.[2]?.result
    ? Number(totalAssetsData[2].result) / 1e18
    : 0;

  const realTVL = tvlYieldFarm + tvlBluechip + tvlDegen;
  const availableYieldFarm = tvlYieldFarm * 0.1;
  const availableBluechip = tvlBluechip * 0.1;
  const availableDegen = tvlDegen * 0.15;
  const trueAvailableLiquidity =
    availableYieldFarm + availableBluechip + availableDegen;

  const globalAPY =
    realTVL > 0
      ? Number(
          (
            (tvlYieldFarm * 14.5 + tvlBluechip * 22.4 + tvlDegen * 38.2) /
            realTVL
          ).toFixed(1),
        )
      : 0;

  const handleDownloadPDF = () => {
    setIsPrinting(true);
    // window.open(
    //   "https://neuroloom-api.duckdns.org/api/report/pdf?vault=global",
    //   "_blank",
    // );
    window.open("http://localhost:9000/api/report/pdf?vault=global", "_blank");
    setTimeout(() => {
      setIsPrinting(false);
    }, 2000);
  };

  useEffect(() => {
    ``;
    let isMounted = true;
    async function fetchRebalanceCount() {
      try {
        const query = `{ rebalanceExecuteds(first: 1000) { id } }`;
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const json = await res.json();

        if (json.errors) {
          console.error("The Graph menolak query rebalance:", json.errors);
          return;
        }

        if (isMounted && json.data?.rebalanceExecuteds) {
          setTotalRebalances(json.data.rebalanceExecuteds.length);
        }
      } catch (error) {
        console.error("Gagal menarik total rebalance:", error);
      }
    }

    fetchRebalanceCount();
    const interval = setInterval(fetchRebalanceCount, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative space-y-8">
      <div className="relative z-10 space-y-8">
        {/* HERO BANNER */}
        <div className="-mt-6">
          <PageHero
            badge="Overview · Global State"
            title="On-Chain"
            accent="Oversight"
            subtitle="Live global state across all AI-managed strategies. Monitor aggregated TVL, total yields, and system-wide routing."
            media={{ kind: "video", src: "/bg/plexuspurple.mp4", opacity: 40 }}
            actions={
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("app-navigate", { detail: "vaults" }),
                    );
                  }}
                  className="flex items-center gap-2 h-[40px] px-5 rounded-xl bg-[#f5f5f5] text-[#111] hover:bg-white font-mono font-bold text-[11px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  Explore Strategies
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleDownloadPDF}
                  disabled={isPrinting}
                  className="flex items-center gap-2 h-[40px] px-5 rounded-xl bg-[#161616] text-[#f5f5f5] border border-[#262626] hover:border-[#444] font-mono font-bold text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  {isPrinting ? "Generating PDF..." : "Export Global Report"}
                </button>
              </div>
            }
          />
        </div>

        <div id="vault-report-content" className="space-y-8 pb-4">
          {/* KPI METRICS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              title="Total Value Locked"
              value={realTVL}
              prefix="$"
              icon={Activity}
              change="Live On-Chain"
              changeType="positive"
              subtext="Aggregated across 3 Vaults"
              delay={0}
              isLoading={isTvlLoading}
            />
            <KPICard
              title="Global Average APY"
              value={globalAPY}
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
              value={trueAvailableLiquidity}
              prefix="$"
              icon={Coins}
              change="Ready"
              changeType="neutral"
              subtext="Awaiting new routes"
              delay={160}
              isLoading={isTvlLoading}
            />
            <KPICard
              title="Total AI Rebalances"
              value={totalRebalances}
              prefix=""
              suffix=""
              icon={Network}
              change="Synced"
              changeType="positive"
              subtext="Immutably stored on BSC"
              delay={240}
            />
          </div>

          {/* EVENT LOG  */}
          <div className="w-full h-full">
            <EventLog maxHeight="max-h-[600px]" />
          </div>
        </div>
      </div>
    </div>
  );
}
