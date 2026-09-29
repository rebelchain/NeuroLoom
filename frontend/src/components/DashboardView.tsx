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

const GRAPHQL_ENDPOINT =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.7";

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
    ? Number(totalAssetsData[0].result) / 1e6
    : 0;
  const tvlBluechip = totalAssetsData?.[1]?.result
    ? Number(totalAssetsData[1].result) / 1e6
    : 0;
  const tvlDegen = totalAssetsData?.[2]?.result
    ? Number(totalAssetsData[2].result) / 1e6
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
    window.open(
      "https://neuroloom-api.duckdns.org/api/report/pdf?vault=global",
      "_blank",
    );
    setTimeout(() => {
      setIsPrinting(false);
    }, 2000);
  };

  useEffect(() => {
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
      <div className="absolute top-[-25%] left-1/2 -translate-x-1/2 w-[150%] h-[75vh] pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,_rgba(139,92,246,0.12),_transparent_60%)] z-0"></div>

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
              <div className="flex flex-wrap items-center gap-3.5">
                <button
                  onClick={() => {
                    window.dispatchEvent(
                      new CustomEvent("app-navigate", { detail: "vaults" }),
                    );
                  }}
                  className="relative flex items-center gap-2 h-[42px] px-6 rounded-md bg-gradient-to-b from-white via-[#e7e7e7] to-[#cfcfcf] text-[#111] font-medium text-[13.5px] border border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] hover:from-white hover:via-[#f3f6ff] hover:to-[#d5def2] hover:shadow-[inset_0_1px_0_#fff,0_0_22px_rgba(186,208,255,0.35),0_8px_18px_rgba(255,255,255,0.12)] transition-all duration-300"
                >
                  Explore Strategies
                  <ArrowRight className="w-4 h-4" />
                </button>

   
                <button
                  onClick={handleDownloadPDF}
                  disabled={isPrinting}
                  className="relative flex items-center gap-2 h-[42px] px-5 rounded-md bg-gradient-to-br from-white/[0.1] to-black/[0.45] text-white border border-white/[0.45] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] font-medium text-[13.5px] hover:border-primary/75 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_20px_rgba(139,92,246,0.3)] transition-all duration-300 disabled:opacity-50"
                >
                  <Download className="w-4 h-4" />
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
