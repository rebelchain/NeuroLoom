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
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-surface-raised border border-white/10 text-[9px] font-mono tracking-wider text-gray-400">
      {id.toUpperCase()}
    </span>
  );
}

export function EventLog({
  maxHeight = "max-h-[520px]",
}: {
  maxHeight?: string;
}) {
  // [HACKATHON DEMO MODE]: Injeksi Deposit 10 USDT yang kamu lakukan sebelumnya
  const [events, setEvents] = useState<AIEventRow[]>([
    {
      id: "demo-deposit-1",
      type: "VAULT_DEPOSITED",
      protocol: "NeuroLoom Vault",
      asset: "USDT",
      amount: 10,
      detail: "User Deposited Liquidity",
      timestamp: 1789584000000, // Statis & aman dari linter
      txHash:
        "0xfcca1bd79e41ce5b9df81b1eff4762cf9fb013c8b3efa56ff33213ab0fac84b4",
    },
  ]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        // Query disesuaikan untuk melacak aksi User (Deposit & Withdraw)
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
              data.deposits.map((item: any) => ({
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
              data.withdraws.map((item: any) => ({
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

          // Urutkan berdasarkan yang paling baru
          combinedEvents.sort((a, b) => b.timestamp - a.timestamp);

          // Jangan timpa array jika The Graph belum punya data
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

        <div className="px-4 py-3 font-mono text-xs leading-7 overflow-y-auto [scrollbar-width:thin]">
          {events.length === 0 && !isLoading ? (
            <div className="text-gray-500">
              Waiting for user deposits or withdrawals...
            </div>
          ) : (
            events.map((event, i) => {
              const meta = eventMeta[event.type];
              return (
                <div
                  key={event.id}
                  className="flex items-start gap-2 animate-fade-in-up"
                  style={{ animationDelay: `${140 + i * 180}ms` }}
                >
                  <span className="text-gray-600 select-none" aria-hidden>
                    ›
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={meta.text}>{meta.glyph}</span>
                      <span className={meta.text}>{event.type}</span>
                      <ProtocolTag id={event.protocol} />
                      <span className="text-gray-300">{event.asset}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-500">
                      <span className={meta.text}>
                        {event.amount.toFixed(2)} USDT
                      </span>
                      {event.detail && (
                        <>
                          <span className="mx-1">·</span>
                          <span className="text-info truncate max-w-[220px]">
                            {event.detail}
                          </span>
                        </>
                      )}
                      <span className="mx-1">·</span>
                      <span>{formatTimeAgo(event.timestamp)}</span>
                      <span className="mx-1">·</span>
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="font-mono text-primary hover:underline cursor-pointer"
                      >
                        {event.txHash.slice(0, 10)}...
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-600 select-none" aria-hidden>
              ›
            </span>
            <span className="text-primary inline-block animate-pulse">▍</span>
            <span className="text-gray-500">
              listening for user events via The Graph…
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
