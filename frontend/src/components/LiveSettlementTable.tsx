"use client";

import { formatTimeAgo } from "@/lib/utils";
import { Activity, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.8";

const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "The Yield Farm",
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

export function LiveSettlementTable() {
  const [events, setEvents] = useState<GraphRebalanceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchGraphData = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 6, orderBy: blockTimestamp, orderDirection: desc) {
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
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#121212] overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#1f1f1f] bg-[#161616]">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-[#262626] flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[13px] font-bold font-mono text-[#f5f5f5] uppercase tracking-widest">
              Live On-Chain Settlement
            </h2>
            <span className="text-[10px] text-[#8a8a8a] font-mono tracking-wider uppercase">
              Indexed by The Graph (BSC Testnet)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono border border-primary/25 bg-primary/10 rounded-full px-3 py-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full bg-primary ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-primary tracking-widest uppercase font-semibold">
            {isSyncing ? "Syncing..." : "Synced"}
          </span>
        </div>
      </header>

      {/* TABLE */}
      <div className="overflow-x-auto bg-[#0e0e0e]">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-[#141414] text-[#8a8a8a] font-mono text-[10px] uppercase tracking-widest border-b border-[#1f1f1f]">
              <th className="px-6 py-3.5 font-normal">Target Vault</th>
              <th className="px-6 py-3.5 font-normal">Rebalance Flow</th>
              <th className="px-6 py-3.5 font-normal">Execution Time</th>
              <th className="px-6 py-3.5 font-normal">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11.5px] divide-y divide-[#1a1a1a]">
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-[#666] italic"
                >
                  &gt; _No on-chain rebalance executions found in this cycle.
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const vaultName = getVaultName(event.address);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <strong className="text-[#f5f5f5] font-semibold tracking-wide text-[12px]">
                          {vaultName}
                        </strong>
                        <span className="text-[#777] text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          AI Rebalance
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2.5">
                        <span className="text-primary font-bold tnum text-[12.5px]">
                          {Number(
                            formatUnits(BigInt(event.amountIn), 6),
                          ).toFixed(4)}
                        </span>

                        <span className="text-[#999] text-[10px] bg-[#1a1a1a] rounded px-2 py-0.5 border border-[#262626]">
                          {event.tokenIn.slice(0, 4)}...
                          {event.tokenIn.slice(-4)}
                        </span>
                        <span className="text-[#555] text-[11px]">→</span>
                        <span className="text-[#999] text-[10px] bg-[#1a1a1a] rounded px-2 py-0.5 border border-[#262626]">
                          {event.tokenOut.slice(0, 4)}...
                          {event.tokenOut.slice(-4)}
                        </span>

                        <span className="text-[#10b981] font-semibold text-[9px] uppercase tracking-wider border border-[#10b981]/30 rounded bg-[#10b981]/10 px-2 py-0.5 ml-2">
                          Executed
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#8a8a8a] text-[11px]">
                      {formatTimeAgo(Number(event.blockTimestamp) * 1000)}
                    </td>

                    <td className="px-6 py-4">
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8a8a8a] hover:text-primary transition-colors inline-flex items-center gap-1 font-mono text-[11px] group"
                      >
                        <span>
                          {event.transactionHash.slice(0, 6)}...
                          {event.transactionHash.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
