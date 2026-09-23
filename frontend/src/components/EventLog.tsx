"use client";

import { cn, formatTimeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { formatUnits } from "viem"; 

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/version/latest";

export type EventOp =
  | "ROUTE_OPTIMIZED"
  | "REBALANCE_EXECUTED"
  | "YIELD_HARVESTED"
  | "SLIPPAGE_REJECTED"
  | "VAULT_DEPOSITED"
  | "VAULT_WITHDRAWN";

export interface AIEventRow {
  id: string;
  type: EventOp;
  protocol: string;
  asset: string;
  amount: number;
  detail?: string;
  timestamp: number;
  txHash: string;
}

interface GraphEvent {
  id: string;
  assets: string;
  blockTimestamp: string;
  transactionHash: string;
}

const eventMeta: Record<EventOp, { glyph: string; text: string }> = {
  ROUTE_OPTIMIZED: { glyph: "⟳", text: "text-info-light" },
  REBALANCE_EXECUTED: { glyph: "→", text: "text-primary-light" },
  YIELD_HARVESTED: { glyph: "↑", text: "text-success" },
  SLIPPAGE_REJECTED: { glyph: "✕", text: "text-danger" },
  VAULT_DEPOSITED: { glyph: "▲", text: "text-emerald-300" },
  VAULT_WITHDRAWN: { glyph: "▼", text: "text-warning" },
};

function ProtocolTag({ id }: { id: string }) {
  return (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-raised border border-white/10 text-[9px] font-mono tracking-wider text-gray-400 whitespace-nowrap">
      {id.toUpperCase()}
    </span>
  );
}

export function EventLog({
  maxHeight = "max-h-[520px]",
}: {
  maxHeight?: string;
}) {
  const [events, setEvents] = useState<AIEventRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        const query = `
          {
            deposits(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
              id
              assets
              blockTimestamp
              transactionHash
            }
            withdraws(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
              id
              assets
              blockTimestamp
              transactionHash
            }
          }
        `;

        const response = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const { data } = await response.json();

        if (isMounted && data) {
          const combinedEvents: AIEventRow[] = [];

          if (data.deposits && data.deposits.length > 0) {
            combinedEvents.push(
              ...data.deposits.map((item: GraphEvent) => ({
                id: item.id,
                type: "VAULT_DEPOSITED" as EventOp,
                protocol: "NeuroLoom Vault",
                asset: "USDT",
                amount: Number(formatUnits(BigInt(item.assets), 18)),
                detail: "User Deposited Liquidity",
                timestamp: Number(item.blockTimestamp) * 1000,
                txHash: item.transactionHash,
              })),
            );
          }

          if (data.withdraws && data.withdraws.length > 0) {
            combinedEvents.push(
              ...data.withdraws.map((item: GraphEvent) => ({
                id: item.id,
                type: "VAULT_WITHDRAWN" as EventOp,
                protocol: "NeuroLoom Vault",
                asset: "USDT",
                amount: Number(formatUnits(BigInt(item.assets), 18)),
                detail: "User Withdrew Liquidity",
                timestamp: Number(item.blockTimestamp) * 1000,
                txHash: item.transactionHash,
              })),
            );
          }

          combinedEvents.sort((a, b) => b.timestamp - a.timestamp);

          if (combinedEvents.length > 0) {
            setEvents(combinedEvents);
          }
        }
      } catch (error) {
        console.error("Gagal menarik data The Graph:", error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchGraphData();
    const interval = setInterval(fetchGraphData, 15000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <h3 className="text-sm font-semibold text-white">
            Live Vault Activity
          </h3>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/25 text-[10px] text-success font-mono">
          {isLoading ? "SYNCING..." : "LIVE INDEXING"}
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl bg-black/60 border border-white/10 overflow-hidden shadow-2xl",
          maxHeight,
        )}
      >
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.07] bg-[#0b1120]">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">
            neuroloom-user-ledger · the-graph
          </span>
        </div>

        <div className="px-4 py-3 font-mono text-xs leading-relaxed overflow-y-auto [scrollbar-width:thin]">
          {events.length === 0 && !isLoading ? (
            <div className="text-gray-500 italic py-4">
              Waiting for user deposits or withdrawals...
            </div>
          ) : (
            events.map((event, i) => {
              const meta = eventMeta[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-start md:items-center gap-3 py-3 border-b border-white/[0.03] last:border-0 animate-fade-in-up hover:bg-white/[0.02] transition-colors rounded-lg px-2 -mx-2"
                  style={{ animationDelay: `${140 + i * 180}ms` }}
                >
                  <span
                    className="text-gray-600 select-none hidden sm:block"
                    aria-hidden
                  >
                    ›
                  </span>

                  <div className="flex flex-col md:flex-row justify-between min-w-0 w-full gap-2 md:gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2">
                        <span
                          className={cn(
                            meta.text,
                            "font-semibold whitespace-nowrap",
                          )}
                        >
                          {meta.glyph} {event.type}
                        </span>
                        <ProtocolTag id={event.protocol} />
                        <span className="text-gray-300 font-medium whitespace-nowrap">
                          {event.asset}
                        </span>
                      </div>

                  
                      {event.detail && (
                        <div className="text-info text-[11px] truncate max-w-[250px] sm:max-w-xs">
                          {event.detail}
                        </div>
                      )}
                    </div>
                
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-x-4 gap-y-1 w-full md:w-auto">
                      <span
                        className={cn(
                          meta.text,
                          "whitespace-nowrap font-medium text-sm",
                        )}
                      >
                        {event.amount > 0 ? "+" : ""}
                        {event.amount.toFixed(2)} USDT
                      </span>

                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-mono">
                        <span className="whitespace-nowrap">
                          {formatTimeAgo(event.timestamp)}
                        </span>
                        <span className="text-gray-700 select-none">·</span>
                        <a
                          href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline cursor-pointer whitespace-nowrap"
                        >
                          {event.txHash.slice(0, 6)}...{event.txHash.slice(-4)}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center gap-2 mt-4 pt-2">
            <span className="text-gray-600 select-none" aria-hidden>
              ›
            </span>
            <span className="text-primary inline-block animate-pulse">▍</span>
            <span className="text-gray-500 text-[11px]">
              listening for user events via The Graph…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
