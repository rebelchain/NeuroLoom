"use client";

import { cn, formatTimeAgo } from "@/lib/utils";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
// IMPOR ALAMAT VAULT AKTIF DARI CONFIG
import { ACTIVE_VAULTS } from "../config/addresses";

// SESUAIKAN DENGAN VERSI DEPLOY TERBARUMU (v0.0.6)
const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.6";

// KAMUS PEMETAAN ALAMAT KE NAMA VAULT
const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "Yield Farm",
  [ACTIVE_VAULTS[1].toLowerCase()]: "Bluechip Momentum",
  [ACTIVE_VAULTS[2].toLowerCase()]: "Degen Accumulator",
};

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
  address?: string; 
  blockTimestamp: string;
  transactionHash: string;
}

const eventMeta: Record<EventOp, { glyph: string; text: string }> = {
  ROUTE_OPTIMIZED: { glyph: "[⟳]", text: "text-[#c5c5c5]" },
  REBALANCE_EXECUTED: { glyph: "[→]", text: "text-primary" },
  YIELD_HARVESTED: { glyph: "[↑]", text: "text-primary" },
  SLIPPAGE_REJECTED: { glyph: "[✕]", text: "text-[#ff5f5f]" },
  VAULT_DEPOSITED: { glyph: "[+]", text: "text-[#f5f5f5]" },
  VAULT_WITHDRAWN: { glyph: "[-]", text: "text-[#ff5f5f]" },
};

// Fungsi pembantu untuk menerjemahkan alamat menjadi nama
function getVaultName(address?: string) {
  if (!address) return "NeuroLoom Vault";
  return VAULT_MAP[address.toLowerCase()] || "NeuroLoom Vault";
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

        const query = `{ 
          deposits(first: 5, orderBy: blockTimestamp, orderDirection: desc) { id assets address blockTimestamp transactionHash } 
          withdraws(first: 5, orderBy: blockTimestamp, orderDirection: desc) { id assets address blockTimestamp transactionHash } 
        }`;

        const response = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await response.json();

        if (isMounted && data) {
          const combinedEvents: AIEventRow[] = [];

          if (data.deposits) {
            combinedEvents.push(
              ...data.deposits.map((item: GraphEvent) => {
                const vaultName = getVaultName(item.address);
                return {
                  id: item.id,
                  type: "VAULT_DEPOSITED" as EventOp,
                  protocol: vaultName, 
                  asset: "USDT",
                  amount: Number(formatUnits(BigInt(item.assets), 6)),
                  detail: `To ${vaultName}`, 
                  timestamp: Number(item.blockTimestamp) * 1000,
                  txHash: item.transactionHash,
                };
              }),
            );
          }

          if (data.withdraws) {
            combinedEvents.push(
              ...data.withdraws.map((item: GraphEvent) => {
                const vaultName = getVaultName(item.address);
                return {
                  id: item.id,
                  type: "VAULT_WITHDRAWN" as EventOp,
                  protocol: vaultName, 
                  asset: "USDT",
                  amount: Number(formatUnits(BigInt(item.assets), 6)),
                  detail: `From ${vaultName}`, 
                  timestamp: Number(item.blockTimestamp) * 1000,
                  txHash: item.transactionHash,
                };
              }),
            );
          }

          combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
          if (combinedEvents.length > 0) setEvents(combinedEvents);
        }
      } catch (error) {
        console.error("Gagal menarik data Subgraph:", error);
      } finally {
        if (isMounted) setIsLoading(false);
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
    <div className="animate-fade-in-up h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <h3 className="text-xs font-mono tracking-widest text-[#f5f5f5] uppercase">
            Event Ledger
          </h3>
        </div>
        <div className="text-[10px] text-primary font-mono tracking-widest uppercase">
          {isLoading ? "[ SYNCING ]" : "[ LIVE ]"}
        </div>
      </div>

      <div
        className={cn(
          "bg-[#0a0a0a] border border-[#1f1f1f] flex-grow flex flex-col",
          maxHeight,
        )}
      >
        {/* Header Terminal */}
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1f1f1f] bg-[#121212]">
          <span className="w-2 h-2 bg-[#1f1f1f]" />
          <span className="w-2 h-2 bg-[#1f1f1f]" />
          <span className="w-2 h-2 bg-[#1f1f1f]" />
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-mono">
            sys.graph.log
          </span>
        </div>

        {/* List Transaksi */}
        <div className="px-4 py-3 font-mono text-[11px] leading-relaxed overflow-y-auto [scrollbar-width:thin] flex-grow">
          {events.length === 0 && !isLoading ? (
            <div className="text-[#8a8a8a] italic py-4">
              &gt; _Awaiting network events...
            </div>
          ) : (
            events.map((event, i) => {
              const meta = eventMeta[event.type];
              return (
                <div
                  key={event.id}
                  className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-b border-[#1f1f1f] last:border-0 hover:bg-[#121212] transition-colors -mx-4 px-4"
                >
                  <div className="flex-grow flex items-center gap-3">
                    <span className={cn(meta.text, "w-6 text-center")}>
                      {meta.glyph}
                    </span>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[#c5c5c5]">{event.type}</span>
                        <span className="text-[#8a8a8a]">::</span>
                        <span className="text-primary">{event.asset}</span>
                      </div>
                      {event.detail && (
                        <div className="text-[#8a8a8a] text-[10px]">
                          &gt; {event.detail}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 min-w-[120px]">
                    <span className={cn(meta.text, "whitespace-nowrap")}>
                      {event.amount > 0 ? "+" : ""}
                      {event.amount.toFixed(2)} USDT
                    </span>
                    <div className="flex items-center gap-2 text-[9px] text-[#8a8a8a]">
                      <span>{formatTimeAgo(event.timestamp)}</span>
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:text-primary hover:underline"
                      >
                        [{event.txHash.slice(0, 6)}]
                      </a>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div className="mt-4 text-[#8a8a8a]">
            &gt; <span className="text-primary animate-pulse">_</span>
          </div>
        </div>
      </div>
    </div>
  );
}
