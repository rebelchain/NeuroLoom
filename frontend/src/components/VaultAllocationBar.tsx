import { useEffect, useState } from "react";
import { BadgePlus, CircleDot } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { useSectionReveal } from "@/lib/useSectionReveal";
import Link from "next/link";

// Tipe Data Khusus AI Vault
export interface AIAllocation {
  protocolName: string;
  amount: number;
}

export interface VaultData {
  id: string;
  name: string;
  symbol: string;
  totalBalance: number;
  availableBalance: number;
  allocations: AIAllocation[];
  apy: number;
}

const segmentStyles = [
  {
    bar: "bg-gradient-to-r from-primary/90 to-primary-light/90",
    dot: "bg-gradient-to-br from-primary to-primary-light",
    text: "text-primary-light",
  },
  {
    bar: "bg-gradient-to-r from-info/90 to-info-light/90",
    dot: "bg-gradient-to-br from-info to-info-light",
    text: "text-info-light",
  },
  {
    bar: "bg-gradient-to-r from-purple-400/90 to-fuchsia-500/90",
    dot: "bg-gradient-to-br from-purple-400 to-fuchsia-500",
    text: "text-fuchsia-300",
  },
];

export function VaultAllocationBar({ vault }: { vault: VaultData }) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  // DEFENSE: Proteksi terhadap nilai negatif (jika the graph glitch) dan pembagian nol (jika TVL = 0)
  const safeTotalBalance = Math.max(0, vault.totalBalance);
  const safeAvailableBalance = Math.max(
    0,
    Math.min(vault.availableBalance, safeTotalBalance),
  );

  const totalAllocated = safeTotalBalance - safeAvailableBalance;

  // Kalkulasi persentase yang aman dari NaN
  const allocatedPercent =
    safeTotalBalance > 0 ? (totalAllocated / safeTotalBalance) * 100 : 0;

  // Fungsi width yang aman dari NaN
  const width = (amount: number) => {
    if (!mounted || !visible || safeTotalBalance === 0) return "0%";
    const percentage = (amount / safeTotalBalance) * 100;
    // Pastikan angka valid dan tidak melebihi 100%
    return `${Math.min(Math.max(percentage, 0), 100)}%`;
  };

  return (
    <div
      ref={ref}
      className={cn(
        "group relative liquid-glass rounded-2xl p-6 transition-all duration-500",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.05] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10">
        <div className="flex items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3 min-w-0">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/15 shrink-0 bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-sm">
                {vault.symbol.slice(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <h3 className="text-[15px] font-semibold text-white truncate">
                {vault.name}
              </h3>
              <span className="text-xs font-mono text-gray-500">
                {vault.symbol} ·{" "}
                <span className="text-gray-400">
                  {formatCurrency(safeTotalBalance)}
                </span>
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-black/25 px-2.5 py-1.5 font-mono text-xs text-success">
              <CircleDot className="w-3 h-3 text-success animate-pulse" />
              {vault.apy}% APY
            </span>
            <button
              onClick={() => {
                window.dispatchEvent(
                  new CustomEvent("app-navigate", { detail: "overview" }),
                );

                setTimeout(() => {
                  document
                    .getElementById("vault-panel-section")
                    ?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="liquid-glass liquid-cta liquid-glass-button px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-transform hover:scale-105 active:scale-95"
            >
              <BadgePlus className="w-3.5 h-3.5" /> Deposit
            </button>
          </div>
        </div>

        {/* Bar */}
        <div className="relative h-11 rounded-xl overflow-hidden flex bg-black/30 border border-white/10 mb-3">
          {safeTotalBalance === 0 ? (
            // Empty State yang Elegan jika TVL 0
            <div className="w-full h-full flex items-center justify-center bg-white/[0.02]">
              <span className="text-[10px] uppercase tracking-widest text-gray-600 font-mono">
                Vault Empty · Awaiting Deposit
              </span>
            </div>
          ) : (
            <>
              {vault.allocations.map((alloc, i) => {
                const style = segmentStyles[i % segmentStyles.length];
                const amount = Math.max(0, alloc.amount); // Proteksi nilai negatif
                return (
                  <div
                    key={alloc.protocolName}
                    className={cn(
                      "h-full cursor-pointer relative transition-all duration-1000 ease-out border-r border-black/20",
                      style.bar,
                    )}
                    style={{ width: width(amount) }}
                    onMouseEnter={() => setHovered(alloc.protocolName)}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {hovered === alloc.protocolName && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0b1120] border border-white/15 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-20 shadow-2xl">
                        <div className="font-semibold text-white">
                          Routed to {alloc.protocolName}
                        </div>
                        <div className={cn("font-mono mt-0.5", style.text)}>
                          {formatCurrency(amount)}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {safeAvailableBalance > 0 && (
                <div
                  className={cn(
                    "h-full cursor-pointer relative transition-all duration-1000 ease-out",
                    hovered === "available" ? "bg-success/40" : "bg-success/20",
                  )}
                  style={{ width: width(safeAvailableBalance) }}
                  onMouseEnter={() => setHovered("available")}
                  onMouseLeave={() => setHovered(null)}
                >
                  {hovered === "available" && (
                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-[#0b1120] border border-white/15 rounded-lg px-3 py-1.5 text-xs whitespace-nowrap z-20 shadow-2xl">
                      <div className="font-semibold text-white">
                        Idle in Vault
                      </div>
                      <div className="font-mono text-success mt-0.5">
                        {formatCurrency(safeAvailableBalance)}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex items-center justify-between gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-4 flex-wrap">
            {vault.allocations.map((alloc, i) => (
              <div
                key={alloc.protocolName}
                className="flex items-center gap-1.5"
              >
                <span
                  className={cn(
                    "w-2.5 h-2.5 rounded-full",
                    segmentStyles[i % segmentStyles.length].dot,
                  )}
                />
                <span className="text-gray-400">{alloc.protocolName}</span>
              </div>
            ))}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-success/40 border border-success/40" />
              <span className="text-gray-400">Idle (Unrouted)</span>
            </div>
          </div>
          <span className="font-mono text-gray-500">
            {allocatedPercent.toFixed(0)}% Allocated ·{" "}
            {safeTotalBalance === 0 ? 0 : vault.allocations.length} Active
            Routes
          </span>
        </div>
      </div>
    </div>
  );
}
