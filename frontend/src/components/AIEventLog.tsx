"use client";

import { useEffect, useState, useRef } from "react";
import { formatTimeAgo } from "@/lib/utils";
import { TerminalSquare, Activity } from "lucide-react";

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.2";

interface GraphRebalanceData {
  id: string;
  amountIn: string;
  expectedAmountOutMin: string;
  blockTimestamp: string;
  transactionHash: string;
}

const mockAILogs = [
  "[AGENT_SPAWN] Initializing RiskManager & YieldAnalyzer...",
  "[FETCH] Querying Venus Protocol utilization rates...",
  "[FETCH] Querying PancakeSwap V3 USDT/WBNB pool liquidity...",
  "[ANALYSIS] Venus APY: 3.2% | PancakeSwap APY: 12.4%",
  "[RISK_CHECK] Calculating Impermanent Loss exposure on PancakeSwap...",
  "[WARNING] Volatility detected on WBNB. IL risk elevated to 4.1%.",
  "[ROUTING] Proposing multi-hop route: 70% Venus, 30% PancakeSwap.",
  "[EVALUATOR] Rejecting proposal. Gas fees (0.004 BNB) exceed expected 12hr yield.",
  "[AGENT_SPAWN] Re-evaluating fallback single-asset staking...",
  "[ROUTING] Target locked: Radiant Capital (Stablecoin Vault).",
  "[EVALUATOR] Route approved. Expected slippage < 0.1%.",
  "[EXECUTION] Generating payload for NeuroLoomVaultV2.rebalance()...",
  ">>> TRANSACTION BROADCASTED TO BSC TESTNET <<<",
];

export function AIEventLog() {
  const [events, setEvents] = useState<GraphRebalanceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // LOGIKA TERMINAL YANG SUDAH DIPERBAIKI (Bebas Error)
  useEffect(() => {
    let currentIndex = 0;
    let isWaiting = false;

    const interval = setInterval(() => {
      if (isWaiting) return;

      if (currentIndex < mockAILogs.length) {
        const nextLog = mockAILogs[currentIndex];
        if (nextLog) {
          setVisibleLogs((prev) => [...prev, nextLog]);
        }
        currentIndex++;

        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      } else {
        isWaiting = true;
        setTimeout(() => {
          setVisibleLogs([]);
          currentIndex = 0;
          isWaiting = false;
        }, 5000);
      }
    }, 800);

    return () => clearInterval(interval);
  }, []);

  // LOGIKA THE GRAPH (Asli & Aman)
  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
              id
              amountIn
              expectedAmountOutMin
              blockTimestamp
              transactionHash
            }
          }
        `;
        const res = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();

        if (
          isMounted &&
          data?.rebalanceExecuteds &&
          data.rebalanceExecuteds.length > 0
        ) {
          setEvents(data.rebalanceExecuteds);
        }
      } catch (error) {
        console.error("Error fetching AI Events:", error);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    void fetchGraphData();
    const interval = setInterval(fetchGraphData, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <section className="flex flex-col h-full bg-[#0b1120]/80 rounded-3xl border border-white/[0.05] overflow-hidden backdrop-blur-2xl">
      {/* 1. TOP PANEL: AI THINKING PROCESS */}
      <div className="border-b border-white/[0.05] bg-black/40">
        <header className="flex justify-between items-center px-5 py-3 border-b border-white/[0.05]">
          <div className="flex items-center gap-2">
            <TerminalSquare className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-white">
              Agent Orchestrator Log
            </h3>
          </div>
          <span className="text-[10px] text-primary font-mono tracking-widest uppercase animate-pulse">
            Processing
          </span>
        </header>
        <div
          ref={scrollRef}
          className="h-[180px] p-4 font-mono text-[11px] text-gray-400 overflow-y-auto leading-relaxed scroll-smooth text-left"
        >
          {visibleLogs.length === 0 ? (
            <div className="text-gray-600 italic">
              Awaiting trigger events...
            </div>
          ) : (
            visibleLogs.map((log, index) => {
              // DEFENSE: Jika string kosong atau undefined, jangan render
              if (!log) return null;
              return (
                <div key={index} className="mb-1">
                  <span className="text-gray-600 mr-2">{">"}</span>
                  <span
                    className={
                      log.includes("WARNING")
                        ? "text-warning"
                        : log.includes("REJECTING")
                          ? "text-danger"
                          : log.includes("EXECUTION") ||
                              log.includes("TRANSACTION")
                            ? "text-success font-bold"
                            : log.includes("ROUTING")
                              ? "text-info"
                              : "text-gray-300"
                    }
                  >
                    {log}
                  </span>
                </div>
              );
            })
          )}
          <div className="mt-1 flex items-center">
            <span className="text-gray-600 mr-2">{">"}</span>
            <span className="w-2 h-4 bg-primary animate-pulse inline-block"></span>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM PANEL: THE GRAPH EXECUTION LOG */}
      <header className="flex justify-between items-center p-5 border-b border-white/[0.05] bg-black/20">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-success" />
          <div className="text-left">
            <h2 className="text-base font-semibold text-white">
              Live On-Chain Settlement
            </h2>
            <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
              Indexed by The Graph
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono bg-success/10 border border-success/20 px-3 py-1 rounded-full">
          <span
            className={`w-2 h-2 rounded-full bg-success ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-success tracking-widest">
            {isSyncing ? "SYNCING..." : "SYNCED"}
          </span>
        </div>
      </header>

      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-white/[0.02] text-gray-500 font-mono text-[10px] uppercase tracking-wider border-b border-white/[0.05]">
              <th className="px-5 py-3 font-medium">Event Action</th>
              <th className="px-5 py-3 font-medium">Rebalance Flow</th>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  Waiting for AI intents...
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors group"
                >
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <strong className="text-white">RebalanceExecuted</strong>
                      <small className="text-gray-500 text-[10px]">
                        AI Threshold Reached
                      </small>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-error font-medium">
                        {(Number(event.amountIn) / 1e18).toFixed(4)} WBNB
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="text-success font-medium">
                        Min.{" "}
                        {(Number(event.expectedAmountOutMin) / 1e18).toFixed(4)}{" "}
                        USDT
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-[11px]">
                    {formatTimeAgo(Number(event.blockTimestamp) * 1000)}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`https://testnet.bscscan.com/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                    >
                      {event.transactionHash.slice(0, 6)}...
                      {event.transactionHash.slice(-4)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
