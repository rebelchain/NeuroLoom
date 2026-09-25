"use client";

import { formatTimeAgo } from "@/lib/utils";
import { Activity, TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";


const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.6";

const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "Yield Farm",
  [ACTIVE_VAULTS[1].toLowerCase()]: "Bluechip Momentum",
  [ACTIVE_VAULTS[2].toLowerCase()]: "Degen Accumulator",
};

function getVaultName(address?: string) {
  if (!address) return "NeuroLoom Vault";
  return VAULT_MAP[address.toLowerCase()] || "NeuroLoom Vault";
}

interface GraphRebalanceData {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  address: string; 
  blockTimestamp: string;
  transactionHash: string;
}

export function AIEventLog() {
  const [events, setEvents] = useState<GraphRebalanceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch("/api/ai-logs");
        const data = await response.json();
        if (data.logs && data.logs.length !== visibleLogs.length) {
          setVisibleLogs(data.logs);
        }
      } catch (error) {
        console.error("Gagal mengambil log:", error);
      }
    };

    const interval = setInterval(fetchLogs, 1000);
    return () => clearInterval(interval);
  }, [visibleLogs.length]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs]);

  const clearLogs = async () => {
    await fetch("/api/ai-logs", {
      method: "POST",
      body: JSON.stringify({ action: "clear" }),
    });
    setVisibleLogs([]);
  };

  useEffect(() => {
    let isMounted = true;
    const fetchGraphData = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
              id tokenIn tokenOut amountIn address blockTimestamp transactionHash
            }
          }
        `;
        const res = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();

        if (isMounted && data?.rebalanceExecuteds?.length > 0) {
          setEvents(data.rebalanceExecuteds);
        }
      } catch (error) {
        console.error("Error fetching AI Events:", error);
      } finally {
        if (isMounted) setIsSyncing(false);
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
    <section className="flex flex-col h-full w-full">
      {/* TOP PANEL AI THINKING PROCESS */}
      <div className="border-b border-[#1f1f1f] bg-transparent relative">
        <header className="flex justify-between items-center px-5 py-4 border-b border-[#1f1f1f] bg-[#121212]/50">
          <div className="flex items-center gap-3">
            <TerminalSquare className="w-[18px] h-[18px] text-primary" />
            <h3 className="text-xs font-mono font-bold text-[#f5f5f5] uppercase tracking-widest">
              Agent Orchestrator Log
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={clearLogs}
              className="text-[10px] text-[#8a8a8a] hover:text-primary uppercase font-mono tracking-widest transition-colors"
            >
              [ Reset ]
            </button>
            <span className="text-[10px] text-primary font-mono tracking-widest uppercase animate-pulse border border-primary/30 bg-primary/10 px-2 py-1">
              Processing
            </span>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="h-[220px] p-5 font-mono text-xs text-[#c5c5c5] overflow-y-auto leading-relaxed scroll-smooth text-left"
        >
          {visibleLogs.length === 0 ? (
            <div className="text-[#8a8a8a] italic">
              {">"} _Awaiting trigger events...
            </div>
          ) : (
            visibleLogs.map((log, index) => {
              if (!log) return null;
              return (
                <div
                  key={index}
                  className="mb-1.5 animate-fade-in-up flex items-start gap-2"
                >
                  <span className="text-[#8a8a8a] mt-0.5">{">"}</span>
                  <span
                    className={
                      log.includes("WARNING") || log.includes("REJECTING")
                        ? "text-[#ff5f5f] font-semibold"
                        : log.includes("SUCCESS") ||
                            log.includes("EXECUTION") ||
                            log.includes("PASS")
                          ? "text-primary font-semibold"
                          : log.includes("NETWORK") || log.includes("ROUTING")
                            ? "text-[#f5f5f5]"
                            : "text-[#c5c5c5]"
                    }
                  >
                    {log}
                  </span>
                </div>
              );
            })
          )}
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[#8a8a8a]">{">"}</span>
            <span className="w-2.5 h-3.5 bg-primary animate-pulse inline-block"></span>
          </div>
        </div>
      </div>

      {/* BOTTOM PANEL: LIVE ON-CHAIN SETTLEMENT */}
      <header className="flex justify-between items-center px-5 py-4 border-b border-[#1f1f1f] bg-[#121212]/80">
        <div className="flex items-center gap-3">
          <Activity className="w-[18px] h-[18px] text-primary" />
          <div className="text-left flex flex-col gap-1">
            <h2 className="text-xs font-bold font-mono text-[#f5f5f5] uppercase tracking-widest">
              Live On-Chain Settlement
            </h2>
            <span className="text-[9px] text-[#8a8a8a] font-mono tracking-[0.2em] uppercase">
              Indexed by The Graph
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono border border-primary/30 bg-primary/10 px-3 py-1.5 tick-frame">
          <span
            className={`w-1.5 h-1.5 bg-primary ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-primary tracking-widest uppercase">
            {isSyncing ? "Syncing..." : "Synced"}
          </span>
        </div>
      </header>

      <div className="overflow-x-auto flex-grow bg-transparent">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-[#121212]/50 text-[#8a8a8a] font-mono text-[10px] uppercase tracking-widest border-b border-[#1f1f1f]">
              <th className="px-6 py-4 font-normal">Event Action</th>
              <th className="px-6 py-4 font-normal">Rebalance Flow</th>
              <th className="px-6 py-4 font-normal">Timestamp</th>
              <th className="px-6 py-4 font-normal">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11px]">
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-[#8a8a8a]"
                >
                  {">"} _Waiting for AI intents...
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const vaultName = getVaultName(event.address);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-[#121212]/80 border-b border-[#1f1f1f] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <strong className="text-[#f5f5f5] font-normal uppercase tracking-wider">
                          {vaultName}
                        </strong>
                        <small className="text-[#8a8a8a] text-[10px] uppercase tracking-widest">
                          {">"} AI Rebalance Executed
                        </small>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold tnum">
                          {Number(
                            formatUnits(BigInt(event.amountIn), 6),
                          ).toFixed(4)}
                        </span>
                        <span className="text-[#8a8a8a] text-[10px] bg-[#1a1a1a] px-2 py-1 border border-[#1f1f1f]">
                          {event.tokenIn.slice(0, 4)}...
                          {event.tokenIn.slice(-4)}
                        </span>
                        <span className="text-[#333]">→</span>
                        <span className="text-[#8a8a8a] text-[10px] bg-[#1a1a1a] px-2 py-1 border border-[#1f1f1f]">
                          {event.tokenOut.slice(0, 4)}...
                          {event.tokenOut.slice(-4)}
                        </span>
                        <span className="text-primary font-normal text-[10px] uppercase tracking-widest border border-primary/20 px-2 py-0.5 ml-2">
                          Executed
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#8a8a8a]">
                      {formatTimeAgo(Number(event.blockTimestamp) * 1000)}
                    </td>
                    <td className="px-6 py-4">
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8a8a8a] hover:text-primary hover:underline transition-colors"
                      >
                        {event.transactionHash.slice(0, 6)}...
                        {event.transactionHash.slice(-4)}
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
