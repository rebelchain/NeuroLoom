"use client";

import { useSectionReveal } from "@/lib/useSectionReveal";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { GRAPHQL_ENDPOINT } from "../config/config";

// --- INTERFACES ---
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
  // allocations ini sekarang akan menjadi fallback jika The Graph belum memuat
  allocations: AIAllocation[];
  apy: number;
}

interface RawRebalance {
  tokenOut: string;
  amountIn: string;
}

// --- HELPERS ---
const getProtocolStyles = (protocolName: string) => {
  const name = protocolName.toLowerCase();
  if (name.includes("venus"))
    return {
      bar: "bg-[#03337f]",
      glow: "hover:shadow-[0_0_20px_rgba(3,51,127,0.6)]",
      text: "text-[#4a84e6]",
      dot: "bg-[#03337f]",
    };
  if (name.includes("pancake"))
    return {
      bar: "bg-[#4cdae6]",
      glow: "hover:shadow-[0_0_20px_rgba(76,218,230,0.6)]",
      text: "text-[#4cdae6]",
      dot: "bg-[#4cdae6]",
    };
  if (name.includes("kinza"))
    return {
      bar: "bg-[#e7c034]",
      glow: "hover:shadow-[0_0_20px_rgba(231,192,52,0.6)]",
      text: "text-[#e7c034]",
      dot: "bg-[#e7c034]",
    };
  if (name.includes("radiant"))
    return {
      bar: "bg-[#0be5b5]",
      glow: "hover:shadow-[0_0_20px_rgba(11,229,181,0.6)]",
      text: "text-[#0be5b5]",
      dot: "bg-[#0be5b5]",
    };
  return {
    bar: "bg-primary",
    glow: "hover:shadow-[0_0_20px_rgba(139,92,246,0.6)]",
    text: "text-primary",
    dot: "bg-primary",
  };
};

// Fungsi kecil untuk menebak protokol dari alamat tokenOut (Mocking Route Name)
function guessProtocolName(tokenOutAddress: string) {
  const addr = tokenOutAddress.toLowerCase();
  // Alamat vUSDT (Venus) Testnet
  if (addr === "0xb7526572ffe56ab9d7489838bf2e18e3323b441a")
    return "Venus Protocol";
  // Alamat bCSPX (RWA)
  if (addr === "0xe2e0f08d4fe0ed7c737353cf03404bf153a0938a")
    return "PancakeSwap V3";
  return "Unknown Protocol";
}

function formatCurrencyLocal(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
}

// --- MAIN COMPONENT ---
export function VaultAllocationBar({
  vault,
  onDeposit,
}: {
  vault: VaultData;
  onDeposit?: (vault: VaultData) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [liveAllocations, setLiveAllocations] = useState<AIAllocation[]>([]);
  const { ref, visible } = useSectionReveal<HTMLDivElement>(0.2);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 150);
    return () => clearTimeout(t);
  }, []);

  // --- MENGAMBIL DATA ON-CHAIN (GRAPHQL) ---
  useEffect(() => {
    let isMounted = true;

    async function fetchLiveAllocations() {
      if (!vault.contractAddress) return;

      try {
        // Ambil data rebalance (dana keluar dari vault ini)
        const query = `
          {
            rebalanceExecuteds(
              first: 100, 
              where: { address: "${vault.contractAddress.toLowerCase()}" }
            ) {
              tokenOut
              amountIn
            }
          }
        `;

        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });

        const json = await res.json();
        const data = json.data;

        if (!isMounted || !data || !data.rebalanceExecuteds) return;

        // Kumpulkan total dana berdasarkan rute protokol
        const protocolTotals: Record<string, number> = {};

        data.rebalanceExecuteds.forEach((event: RawRebalance) => {
          const amount = Number(formatUnits(BigInt(event.amountIn), 18));
          const protocolName = guessProtocolName(event.tokenOut);

          if (!protocolTotals[protocolName]) {
            protocolTotals[protocolName] = 0;
          }
          protocolTotals[protocolName] += amount;
        });

        const newAllocations: AIAllocation[] = Object.keys(protocolTotals).map(
          (name) => ({
            protocolName: name,
            amount: protocolTotals[name],
            symbol: "USDT", // Asumsi semua basisnya USDT
          }),
        );

        setLiveAllocations(newAllocations);
      } catch (error) {
        console.error("Gagal menarik alokasi real-time:", error);
      }
    }

    fetchLiveAllocations();
    const interval = setInterval(fetchLiveAllocations, 10000); // Update tiap 10 detik
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [vault.contractAddress]);

  // --- LOGIKA PERHITUNGAN (MERGE LIVE DATA) ---

  // Gunakan data dari The Graph, jika kosong, gunakan props (fallback)
  const activeAllocations = liveAllocations;

  // Hitung total dana yang terdeploy dari Subgraph
  const totalDeployedFromGraph = activeAllocations.reduce(
    (sum, alloc) => sum + alloc.amount,
    0,
  );

  // Jika vault kosong (baru deposit), pastikan semua dana adalah Idle (tersedia)
  // realTvlUsd harus selalu setidaknya sebesar total yang tersedia + yang dideploy
  const realTvlUsd = Math.max(
    vault.totalBalance,
    vault.availableBalance + totalDeployedFromGraph,
  );

  // Idle cash adalah sisa dari Total TVL dikurangi yang terdeploy
  const usdtIdle = Math.max(0, realTvlUsd - totalDeployedFromGraph);

  // Persentase deployed
  const allocatedPercent =
    realTvlUsd > 0 ? (totalDeployedFromGraph / realTvlUsd) * 100 : 0;

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
        "group relative rounded-[12px] border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] p-6 md:p-8 transition-all duration-500 hover:border-primary/40 tick-frame overflow-hidden",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6",
      )}
    >
      <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-md bg-white/[0.08] group-hover:bg-primary shadow-[0_0_12px_transparent] group-hover:shadow-[0_0_15px_var(--color-primary)] transition-all duration-500" />

      <div className="relative z-10 pl-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-5 min-w-0">
            <div className="w-14 h-14 rounded-xl bg-white/[0.02] border border-white/[0.08] shrink-0 flex items-center justify-center">
              <span className="text-primary font-mono text-base uppercase tracking-widest">
                {vaultInitials}
              </span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-3 mb-1.5">
                <h3 className="text-[15px] font-bold text-[#f5f5f5] tracking-wide uppercase truncate font-mono">
                  {vault.name}
                </h3>
                <span className="px-2.5 py-1 rounded-md text-[9px] font-mono text-[#0a0a0a] bg-primary uppercase tracking-widest shadow-[0_0_10px_var(--color-primary)]">
                  {vault.symbol}
                </span>
              </div>
              <span className="text-[11.5px] font-mono text-[#8a8a8a] uppercase tracking-widest">
                Total Value:{" "}
                <span className="text-[#e8e8e8] font-bold">
                  {formatCurrencyLocal(realTvlUsd)}
                </span>
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5 shrink-0">
            <div className="text-right hidden md:block">
              <div className="text-primary font-bold font-mono text-xl leading-none">
                {vault.apy}%
              </div>
              <div className="text-[#8a8a8a] text-[9.5px] mt-1.5 font-mono uppercase tracking-widest">
                Target Yield
              </div>
            </div>

            <button
              onClick={() => {
                if (onDeposit) onDeposit(vault);
              }}
              className="relative flex items-center gap-2 h-10 px-6 rounded-md bg-gradient-to-b from-white via-[#e7e7e7] to-[#cfcfcf] text-[#111] font-mono font-bold text-[10.5px] uppercase tracking-[0.15em] border border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] hover:from-white hover:via-[#f3f6ff] hover:to-[#d5def2] hover:shadow-[inset_0_1px_0_#fff,0_0_20px_rgba(186,208,255,0.3)] transition-all duration-300 w-full sm:w-auto justify-center"
            >
              Deposit / Withdraw
            </button>
          </div>
        </div>

        {/* TELEMETRY BAR */}
        <div className="mb-8">
          <div className="flex justify-between text-[#555] text-[10px] font-mono mb-2 px-1 uppercase tracking-widest">
            <span>0%</span>
            <span>25%</span>
            <span>50%</span>
            <span>75%</span>
            <span>100%</span>
          </div>

          <div className="relative h-7 rounded-md flex bg-black/60 border border-white/[0.08] shadow-[inset_0_2px_8px_rgba(0,0,0,0.6)] overflow-hidden">
            {realTvlUsd === 0 ? (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-[10px] uppercase tracking-widest text-[#555] font-mono">
                  [ Awaiting Capital Injection ]
                </span>
              </div>
            ) : (
              <>
                {activeAllocations.map((alloc) => {
                  const style = getProtocolStyles(alloc.protocolName);
                  return (
                    <div
                      key={alloc.protocolName}
                      className={cn(
                        "h-full cursor-crosshair relative transition-all duration-1000 ease-out border-r border-black/50 z-10",
                        style.bar,
                        style.glow,
                      )}
                      style={{ width: width(alloc.amount) }}
                      onMouseEnter={() => setHovered(alloc.protocolName)}
                      onMouseLeave={() => setHovered(null)}
                    >
                      {hovered === alloc.protocolName && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 rounded-md bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/[0.12] p-3 text-[10px] font-mono whitespace-nowrap z-50 shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-fade-in-up">
                          <div className="text-[#8a8a8a] uppercase tracking-widest mb-1.5 border-b border-white/[0.08] pb-1.5">
                            {">"} {alloc.protocolName}
                          </div>
                          <div
                            className={cn("font-bold text-[13px]", style.text)}
                          >
                            {formatCurrencyLocal(alloc.amount)}
                          </div>
                          {alloc.rawAmount && alloc.symbol && (
                            <div className="text-[#6a6a6a] mt-1">
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
                    className="h-full cursor-crosshair relative transition-all duration-1000 ease-out border-l border-white/[0.05] opacity-50 hover:opacity-90"
                    style={{
                      width: width(usdtIdle),
                      backgroundImage:
                        "repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(255,255,255,0.15) 4px, rgba(255,255,255,0.15) 8px)",
                    }}
                    onMouseEnter={() => setHovered("available")}
                    onMouseLeave={() => setHovered(null)}
                  >
                    {hovered === "available" && (
                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 rounded-md bg-[#0a0a0a]/95 backdrop-blur-sm border border-white/[0.12] p-3 text-[10px] font-mono whitespace-nowrap z-50 shadow-[0_10px_20px_rgba(0,0,0,0.8)] animate-fade-in-up">
                        <div className="text-[#8a8a8a] uppercase tracking-widest mb-1.5 border-b border-white/[0.08] pb-1.5">
                          {">"} Idle Liquidity
                        </div>
                        <div className="text-[#c5c5c5] font-bold text-[13px]">
                          {formatCurrencyLocal(usdtIdle)}
                        </div>
                        <div className="text-[#6a6a6a] mt-1">
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

        {/* DATA MATRIX */}
        <div className="border-t border-white/[0.08] pt-5">
          <div className="flex justify-between items-center mb-5">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#8a8a8a]">
              Allocation Matrix
            </span>
            <span className="text-[10px] font-mono uppercase tracking-widest text-primary flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
              {allocatedPercent.toFixed(1)}% Deployed
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-3.5">
            {activeAllocations.map((alloc) => {
              const style = getProtocolStyles(alloc.protocolName);
              const percentage =
                realTvlUsd > 0 ? (alloc.amount / realTvlUsd) * 100 : 0;
              return (
                <div
                  key={alloc.protocolName}
                  className="flex items-center justify-between text-[10.5px] font-mono border-b border-white/[0.05] pb-2.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        style.dot,
                        style.glow,
                      )}
                    />
                    <span className="text-[#c5c5c5] uppercase">
                      {alloc.protocolName}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className={cn("font-bold text-[11.5px]", style.text)}>
                      {percentage.toFixed(1)}%
                    </span>
                    <span className="text-[#555] ml-2 hidden sm:inline-block">
                      ({formatCurrencyLocal(alloc.amount)})
                    </span>
                  </div>
                </div>
              );
            })}
            {usdtIdle > 0 && (
              <div className="flex items-center justify-between text-[10.5px] font-mono border-b border-white/[0.05] pb-2.5 opacity-70">
                <div className="flex items-center gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full border border-[#555] bg-transparent" />
                  <span className="text-[#8a8a8a] uppercase">
                    Idle / Buffer
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-bold text-[11.5px] text-[#c5c5c5]">
                    {realTvlUsd > 0
                      ? ((usdtIdle / realTvlUsd) * 100).toFixed(1)
                      : 0}
                    %
                  </span>
                  <span className="text-[#555] ml-2 hidden sm:inline-block">
                    {formatCurrencyLocal(usdtIdle)}
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
