"use client";

import { formatTimeAgo } from "@/lib/utils";
import { Activity, TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.7";

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
  const [wibTime, setWibTime] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour12: false,
      });
      setWibTime(`${formattedTime} WIB`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);


  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const response = await fetch(
          "https://neuroloom-api.duckdns.org/api/ai-logs",
          { cache: "no-store" },
        );
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted && data.logs) {
          setVisibleLogs(data.logs);
        }
      } catch (error) {
        console.error("Gagal mengambil log AI:", error);
      }
    };
    void fetchLogs();
    const interval = setInterval(fetchLogs, 1000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);


  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs.length]);

  const clearLogs = async () => {
    await fetch("https://neuroloom-api.duckdns.org/api/ai-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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

      <div className="bg-transparent relative">
        <header className="flex justify-between items-center px-6 py-4 border-b border-white/[0.08] bg-white/[0.02]">
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <TerminalSquare className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-[13.5px] font-mono font-bold text-[#f5f5f5] uppercase tracking-widest">
              Agent Orchestrator Log
            </h3>
          </div>
          <div className="flex items-center gap-4">

            <span className="hidden sm:inline-block text-[10px] text-[#c5c5c5] font-mono tracking-widest uppercase border border-white/[0.1] bg-white/[0.03] rounded-md px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              {wibTime || "SYNCING CLOCK..."}
            </span>
            <button
              onClick={clearLogs}
              className="text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.05] rounded-md px-2.5 py-1.5 uppercase font-mono tracking-widest transition-colors"
            >
              [ Reset ]
            </button>
            <span className="flex items-center gap-1.5 text-[10px] text-primary font-mono tracking-widest uppercase border border-primary/30 bg-primary/10 rounded-full px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
              Processing
            </span>
          </div>
        </header>

        <div
          ref={scrollRef}
          className="h-[250px] p-6 font-mono text-[12px] text-[#c5c5c5] overflow-y-auto leading-relaxed scroll-smooth text-left"
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
                  className="mb-2 animate-fade-in-up flex items-start gap-2.5"
                >
                  <span className="text-[#6a6a6a] mt-0.5">{">"}</span>
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
          <div className="mt-3 flex items-center gap-2.5 pl-1">
            <span className="text-[#6a6a6a]">{">"}</span>
            <span className="w-2.5 h-3.5 bg-primary animate-pulse inline-block shadow-[0_0_8px_var(--color-primary)]"></span>
          </div>
        </div>
      </div>

      <header className="flex justify-between items-center px-6 py-4 border-y border-white/[0.08] bg-white/[0.01]">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="text-left flex flex-col gap-0.5">
            <h2 className="text-[13.5px] font-bold font-mono text-[#f5f5f5] uppercase tracking-widest">
              Live On-Chain Settlement
            </h2>
            <span className="text-[9.5px] text-[#8a8a8a] font-mono tracking-[0.2em] uppercase">
              Indexed by The Graph
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono border border-primary/30 bg-primary/10 rounded-md px-3 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span
            className={`w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_var(--color-primary)] ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-primary tracking-widest uppercase font-bold">
            {isSyncing ? "Syncing..." : "Synced"}
          </span>
        </div>
      </header>

      <div className="overflow-x-auto flex-grow bg-transparent">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-white/[0.02] text-[#8a8a8a] font-mono text-[10.5px] uppercase tracking-widest border-b border-white/[0.08]">
              <th className="px-6 py-4 font-normal">Event Action</th>
              <th className="px-6 py-4 font-normal">Rebalance Flow</th>
              <th className="px-6 py-4 font-normal">Timestamp</th>
              <th className="px-6 py-4 font-normal">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11.5px]">
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-[#8a8a8a] italic"
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
                    className="hover:bg-white/[0.02] border-b border-white/[0.06] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        <strong className="text-[#e8e8e8] font-bold uppercase tracking-wider text-[12.5px]">
                          {vaultName}
                        </strong>
                        <small className="text-[#8a8a8a] text-[10px] uppercase tracking-widest flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          AI Rebalance Executed
                        </small>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-primary font-bold tnum text-[13px]">
                          {Number(
                            formatUnits(BigInt(event.amountIn), 6),
                          ).toFixed(4)}
                        </span>


                        <span className="text-[#a0a0a0] text-[10.5px] bg-white/[0.03] rounded-md px-2.5 py-1 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                          {event.tokenIn.slice(0, 4)}...
                          {event.tokenIn.slice(-4)}
                        </span>
                        <span className="text-[#555]">→</span>
                        <span className="text-[#a0a0a0] text-[10.5px] bg-white/[0.03] rounded-md px-2.5 py-1 border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
                          {event.tokenOut.slice(0, 4)}...
                          {event.tokenOut.slice(-4)}
                        </span>

                        <span className="text-primary font-bold text-[9px] uppercase tracking-widest border border-primary/30 rounded-md bg-primary/5 px-2 py-1 ml-2">
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
                        className="text-[#8a8a8a] hover:text-primary transition-colors border-b border-dashed border-white/[0.2] hover:border-primary pb-[1px]"
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
