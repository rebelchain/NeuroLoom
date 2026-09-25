import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn, formatCurrency } from "@/lib/utils";
import { useEffect, useState } from "react";

export interface AIAllocation {
  protocolName: string;
  amount: number;
  rawAmount?: number;
  symbol?: string;
}

export interface VaultData {
  id: string;
  name: string;
  symbol: string;
  contractAddress: `0x${string}`;
  totalBalance: number;
  availableBalance: number;
  allocations: AIAllocation[];
  apy: number;
}


const getProtocolStyles = (protocolName: string) => {
  if (protocolName.includes("Venus")) {
    return {
      bar: "bg-[#03337f]",
      glow: "hover:shadow-[0_0_20px_rgba(3,51,127,0.6)]",
      text: "text-[#03337f]",
      dot: "bg-[#03337f]",
    };
  }
  if (protocolName.includes("Pancake")) {
    return {
      bar: "bg-[#4cdae6]",
      glow: "hover:shadow-[0_0_20px_rgba(76,218,230,0.6)]",
      text: "text-[#4cdae6]",
      dot: "bg-[#4cdae6]",
    };
  }
  if (protocolName.includes("Kinza")) {
    return {
      bar: "bg-[#e7c034]",
      glow: "hover:shadow-[0_0_20px_rgba(231,192,52,0.6)]",
      text: "text-[#e7c034]",
      dot: "bg-[#e7c034]",
    };
  }
  if (protocolName.includes("Radiant")) {
    return {
      bar: "bg-[#0be5b5]",
      glow: "hover:shadow-[0_0_20px_rgba(11,229,181,0.6)]",
      text: "text-[#0be5b5]",
      dot: "bg-[#0be5b5]",
    };
  }
  // Warna Default Fallback
  return {
    bar: "bg-primary",
    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.6)]",
    text: "text-primary",
    dot: "bg-primary",
  };
};

export function VaultAllocationBar({
  vault,
  onDeposit,
}: {
  vault: VaultData;
  onDeposit?: (vault: VaultData) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  const realTvlUsd = Math.max(0, vault.totalBalance);
  const usdtIdle = Math.max(0, vault.availableBalance);
  const allocatedUsd = Math.max(0, realTvlUsd - usdtIdle);
  const allocatedPercent =
    realTvlUsd > 0 ? (allocatedUsd / realTvlUsd) * 100 : 0;

  const width = (amount: number) => {
    if (!mounted || !visible || realTvlUsd === 0) return "0%";
    return `${Math.min(Math.max((amount / realTvlUsd) * 100, 0), 100)}%`;
  };

  const vaultInitials = vault.name
    .replace(/^(The\s+)/i, "")
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      ref={ref}
      className={cn(
        "group relative bg-[#0a0a0a] border border-[#1f1f1f] p-6 transition-all duration-500 hover:border-primary/50 tick-frame overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#1f1f1f] group-hover:bg-primary transition-colors"></div>

      <div className="relative z-10 pl-2">
        {/*  HEADER VAULT  */}
        <div className="flex items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 bg-[#121212] border border-[#1f1f1f] shrink-0 flex items-center justify-center">
              <span className="text-primary font-mono text-sm uppercase tracking-widest">
                {vaultInitials}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-[#f5f5f5] tracking-wide uppercase truncate font-mono">
                  {vault.name}
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-mono text-[#0a0a0a] bg-primary uppercase tracking-widest">
                  {vault.symbol}
                </span>
              </div>
              <span className="text-[11px] font-mono text-[#8a8a8a] uppercase tracking-widest">
                Total Value:{" "}
                <span className="text-[#c5c5c5] font-bold">
                  {formatCurrency(realTvlUsd)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 shrink-0">
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-primary font-bold font-mono text-lg leading-none">
                {vault.apy}%
              </div>
              <div className="text-[#8a8a8a] text-[9px] font-mono uppercase tracking-widest">
                Target Yield
              </div>
            </div>
            <button
              onClick={() => {
                if (onDeposit) onDeposit(vault);
              }}
              className="px-6 py-2 border border-[#1f1f1f] bg-[#121212] text-primary text-[10px] font-bold font-mono uppercase tracking-widest flex items-center gap-2 hover:bg-primary hover:text-[#0a0a0a] hover:border-primary transition-all duration-300"
            >
              Deposit
            </button>
          </div>
        </div>

        {/* TELEMETRY BAR AREA */}
        <div className="mb-6">
          <div className="flex justify-between text-[#444] text-[9px] font-mono mb-1.5 px-1 uppercase tracking-widest">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          <div className="relative h-6 flex bg-[#121212] border border-[#1f1f1f] shadow-inner">
            {realTvlUsd === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest text-[#444] font-mono">
                  [ Awaiting Capital Injection ]
                </span>
              </div>
            ) : (
              <>
                {vault.allocations.map((alloc) => {
                  const style = getProtocolStyles(alloc.protocolName);
                  return (
                    <div
                      key={alloc.protocolName}
                      className={cn(
                        "h-full cursor-crosshair relative transition-all duration-1000 ease-out border-r border-[#0a0a0a] z-10",
                        style.bar,
                        style.glow,
                      )}
                      style={{ width: width(alloc.amount) }}
                      onMouseEnter={() => setHovered(alloc.protocolName)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {hovered === alloc.protocolName && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0a0a0a] border border-[#1f1f1f] p-3 text-[10px] font-mono whitespace-nowrap z-50 shadow-2xl animate-fade-in-up">
                          <div className="text-[#8a8a8a] uppercase tracking-widest mb-1 border-b border-[#1f1f1f] pb-1">
                            {">"} {alloc.protocolName}
                          </div>
                          <div className={cn("font-bold text-xs", style.text)}>
                            {formatCurrency(alloc.amount)}
                          </div>
                          {alloc.rawAmount && alloc.symbol && (
                            <div className="text-[#8a8a8a] mt-0.5">
                              {alloc.rawAmount.toFixed(4)} {alloc.symbol}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}

                {usdtIdle > 0 && (
                  <div
                    className="h-full cursor-crosshair relative transition-all duration-1000 ease-out border-l border-[#1f1f1f] opacity-60 hover:opacity-100"
                    style={{
                      width: width(usdtIdle),
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.1) 4px, rgba(255,255,255,0.1) 8px)",
                    }}
                    onMouseEnter={() => setHovered("available")}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {hovered === "available" && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-[#0a0a0a] border border-[#1f1f1f] p-3 text-[10px] font-mono whitespace-nowrap z-50 shadow-2xl animate-fade-in-up">
                        <div className="text-[#8a8a8a] uppercase tracking-widest mb-1 border-b border-[#1f1f1f] pb-1">
                          {">"} Idle Liquidity
                        </div>
                        <div className="text-[#c5c5c5] font-bold text-xs">
                          {formatCurrency(usdtIdle)}
                        </div>
                        <div className="text-[#8a8a8a] mt-0.5">
                          Ready for routing
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/*  DATA MATRIX LEGEND */}
        <div className="border-t border-[#1f1f1f] pt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#8a8a8a]">
              Allocation Matrix Breakdown
            </span>
            <span className="text-[9px] font-mono uppercase tracking-widest text-[#00ED64] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[#00ED64] animate-pulse"></span>
              {allocatedPercent.toFixed(1)}% Deployed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-3">
            {vault.allocations.map((alloc) => {
              const style = getProtocolStyles(alloc.protocolName);
              const percentage =
                realTvlUsd > 0 ? (alloc.amount / realTvlUsd) * 100 : 0;
              return (
                <div
                  key={alloc.protocolName}
                  className="flex items-center justify-between text-[10px] font-mono border-b border-[#1f1f1f]/50 pb-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("w-1.5 h-1.5", style.dot)} />
                    <span className="text-[#c5c5c5] uppercase">
                      {alloc.protocolName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-bold", style.text)}>
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-[#444] ml-2 block sm:inline">
                      ({formatCurrency(alloc.amount)})
                    </span>
                  </div>
                </div>
              );
            })}

            {usdtIdle > 0 && (
              <div className="flex items-center justify-between text-[10px] font-mono border-b border-[#1f1f1f]/50 pb-2 opacity-70">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 border border-[#444] bg-transparent" />
                  <span className="text-[#8a8a8a] uppercase">
                    Idle / Buffer
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[#c5c5c5]">
                    {realTvlUsd > 0
                      ? ((usdtIdle / realTvlUsd) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span className="text-[#444] ml-2 block sm:inline">
                    ({formatCurrency(usdtIdle)})
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
