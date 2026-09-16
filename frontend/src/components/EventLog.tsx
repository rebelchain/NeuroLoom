import { formatCurrency, formatTimeAgo, cn } from "@/lib/utils";

// Data Dummy Sederhana (Nanti diganti The Graph)
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

interface EventLogProps {
  events: AIEventRow[];
  maxHeight?: string;
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
  events,
  maxHeight = "max-h-[520px]",
}: EventLogProps) {
  return (
    <div className="animate-fade-in-up">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
          <h3 className="text-sm font-semibold text-white">
            Live AI Agent Stream
          </h3>
        </div>
        <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-success/10 border border-success/25 text-[10px] text-success font-mono">
          INDEXING
        </div>
      </div>

      <div
        className={cn(
          "rounded-xl bg-black/60 border border-white/10 overflow-hidden shadow-2xl",
          maxHeight,
        )}
      >
        {/* Terminal Header (Mac OS Style) */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-white/[0.07] bg-[#0b1120]">
          <span className="w-2.5 h-2.5 rounded-full bg-danger/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-warning/80" />
          <span className="w-2.5 h-2.5 rounded-full bg-success/80" />
          <span className="ml-2 text-[10px] uppercase tracking-[0.2em] text-gray-500 font-mono">
            neuroloom-agent · the-graph-stream
          </span>
        </div>

        <div className="px-4 py-3 font-mono text-xs leading-7 overflow-y-auto [scrollbar-width:thin]">
          {events.map((event, i) => {
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
                      {formatCurrency(event.amount)}
                    </span>
                    {event.detail && (
                      <>
                        <span>·</span>
                        <span className="text-info truncate max-w-[220px]">
                          {event.detail}
                        </span>
                      </>
                    )}
                    <span>·</span>
                    <span>{formatTimeAgo(event.timestamp)}</span>
                    <span>·</span>
                    <span className="font-mono text-primary hover:underline cursor-pointer">
                      {event.txHash.slice(0, 10)}...
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-600 select-none" aria-hidden>
              ›
            </span>
            <span className="text-primary inline-block animate-pulse">▍</span>
            <span className="text-gray-500">listening for intents…</span>
          </div>
        </div>
      </div>
    </div>
  );
}
