"use client";

import { cn, formatTimeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.2";

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
          let combinedEvents: AIEventRow[] = [];

          if (data.deposits && data.deposits.length > 0) {
            combinedEvents = combinedEvents.concat(
              data.deposits.map((item: GraphEvent) => ({
                id: item.id,
                type: "VAULT_DEPOSITED",
                protocol: "NeuroLoom Vault",
                asset: "USDT",
                amount: Number(item.assets) / 1e18,
                detail: "User Deposited Liquidity",
                timestamp: Number(item.blockTimestamp) * 1000,
                txHash: item.transactionHash,
              })),
            );
          }

          if (data.withdraws && data.withdraws.length > 0) {
            combinedEvents = combinedEvents.concat(
              data.withdraws.map((item: GraphEvent) => ({
                id: item.id,
                type: "VAULT_WITHDRAWN",
                protocol: "NeuroLoom Vault",
                asset: "USDT",
                amount: Number(item.assets) / 1e18,
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
                  className="flex items-start gap-3 py-2 border-b border-white/[0.03] last:border-0 animate-fade-in-up"
                  style={{ animationDelay: `${140 + i * 180}ms` }}
                >
                  <span
                    className="text-gray-600 select-none mt-0.5"
                    aria-hidden
                  >
                    ›
                  </span>

                  <div className="flex flex-col min-w-0 w-full gap-1.5">
                    {/* Aksi & Protokol */}
                    <div className="flex flex-wrap items-center gap-2">
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

                    {/* Detail, Waktu, & Hash */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-gray-500">
                      <span
                        className={cn(
                          meta.text,
                          "whitespace-nowrap flex-shrink-0",
                        )}
                      >
                        {event.amount.toFixed(2)} USDT
                      </span>

                      {event.detail && (
                        <>
                          <span className="text-gray-700 select-none">·</span>
                          <span className="text-info truncate max-w-[150px] sm:max-w-[220px]">
                            {event.detail}
                          </span>
                        </>
                      )}

                      <span className="text-gray-700 select-none">·</span>
                      <span className="whitespace-nowrap flex-shrink-0">
                        {formatTimeAgo(event.timestamp)}
                      </span>

                      <span className="text-gray-700 select-none">·</span>
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-primary hover:underline cursor-pointer whitespace-nowrap flex-shrink-0"
                      >
                        {event.txHash.slice(0, 10)}...
                      </a>
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
