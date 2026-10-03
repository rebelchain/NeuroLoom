"use client";

import {
  Activity,
  ArrowUpRight,
  ChevronDown,
  ShieldCheck,
  Zap,
} from "lucide-react";
import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";

interface HeroSectionProps {
  onLaunchDashboard: () => void;
  onExploreClick?: () => void;
}

export function HeroSection({
  onLaunchDashboard,
  onExploreClick,
}: HeroSectionProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [activeAllocation, setActiveAllocation] = useState(0);

  // Auto-cycle allocation highlight for subtle live feel
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveAllocation((prev) => (prev + 1) % 3);
    }, 3200);
    return () => clearInterval(timer);
  }, []);

  // Mouse Parallax & 3D Tilt calculation (inspired by reference motion.tsx)
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = sceneRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2; // -1 to 1
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2; // -1 to 1
    setPointer({ x, y });
  };

  const handlePointerLeave = () => {
    setPointer({ x: 0, y: 0 });
  };

  const handleScrollToProblem = () => {
    if (onExploreClick) {
      onExploreClick();
    } else {
      document
        .getElementById("features")
        ?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 pt-10 pb-20 lg:pt-16 lg:pb-32 overflow-hidden">
      {/* 2-Column Asymmetric Grid Layout (Inspired by Reference Hero) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        {/* =========================================
            LEFT COLUMN: Direct Copy & Value Proposition
           ========================================= */}
        <div className="lg:col-span-7 flex flex-col items-start text-left z-10">
          {/* Eyebrow Badge */}
          <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-xs font-mono tracking-wider uppercase text-[#c5c5c5] backdrop-blur-md mb-6 hover:border-primary/40 transition-colors">
            <Image
              src="/bnbcoin.png"
              alt="BNB Chain"
              width={15}
              height={15}
              className="w-3.5 h-3.5 object-contain"
            />
            <span className="flex items-center gap-2">
              <span className="text-[#f5f5f5] font-semibold">BSC Testnet</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
              <span className="text-[#8a8a8a]">Live</span>
            </span>
          </div>

          {/* Headline with Reference Editorial Splitting & Signature Highlight */}
          <h1 className="text-4xl sm:text-5xl lg:text-[4.25rem] leading-[1.04] font-medium tracking-tight text-[#f5f5f5]">
            <span className="block font-sans">Autonomous Yield.</span>
            <span className="block serif font-normal text-[#f5f5f5]/90 mt-1">
              Zero Human{" "}
              <span className="relative inline-block text-white">
                Bottleneck.
                {/* Glow Highlighter Stroke under key phrase (inspired by reference .heroLast) */}
                <span
                  className="absolute left-0 -bottom-1 sm:-bottom-2 w-full h-[6px] sm:h-[8px] rounded-full bg-gradient-to-r from-primary via-primary-light to-transparent opacity-85 -rotate-1 pointer-events-none shadow-[0_0_12px_rgba(139,92,246,0.6)]"
                  aria-hidden="true"
                />
              </span>
            </span>
          </h1>

          {/* Value Proposition Description */}
          <p className="mt-6 text-base sm:text-lg text-[#c5c5c5] max-w-xl leading-relaxed font-light">
            Traditional DeFi vaults lock liquidity in static crypto positions.
            NeuroLoom deploys autonomous AI agents to dynamically route and
            rebalance your capital across native DeFi protocols and Tokenized
            Real-World Assets on the BNB Chain, capturing multi-asset yield with
            zero human intervention.
          </p>

          {/* Dual Action Group (Primary Pill + Secondary Text Link with Arrow) */}
          <div className="mt-9 flex flex-wrap items-center gap-4 sm:gap-6">
            <button
              onClick={onLaunchDashboard}
              className="group relative inline-flex items-center justify-center gap-3 px-8 h-[50px] rounded-full bg-[#f5f5f5] text-[#0a0a0a] font-mono font-semibold text-xs tracking-wider uppercase border border-white hover:bg-white hover:shadow-[0_0_28px_rgba(139,92,246,0.45)] hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer"
            >
              <span>Launch Dashboard</span>
              <ArrowUpRight className="w-4 h-4 text-[#0a0a0a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>

            <button
              onClick={handleScrollToProblem}
              className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-[#8a8a8a] hover:text-[#f5f5f5] py-2 px-3 transition-colors cursor-pointer group"
            >
              <span>Why NeuroLoom</span>
              <ChevronDown className="w-4 h-4 text-[#8a8a8a] group-hover:translate-y-0.5 transition-transform" />
            </button>
          </div>

          {/* Micro Telemetry Footnote */}
          <div className="mt-10 pt-6 border-t border-[#1f1f1f] w-full max-w-xl flex flex-wrap items-center justify-between gap-4 text-[11px] font-mono text-[#8a8a8a]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Single Deposit</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>Zero Human Bottleneck</span>
            </div>
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Smart Portfolios</span>
            </div>
          </div>
        </div>

        {/* =========================================
            RIGHT COLUMN: The Protocol Scene Stage
            (Inspired by Reference AgentScene & motion.tsx)
           ========================================= */}
        <div
          ref={sceneRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          className="lg:col-span-5 relative w-full min-h-[520px] sm:min-h-[560px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#121212]/90 via-[#0e0e0e]/85 to-[#0a0a0a]/95 border border-[#1f1f1f] shadow-[0_24px_60px_rgba(0,0,0,0.7)] backdrop-blur-xl select-none group"
          style={{ perspective: "1000px" }}
        >
          {/* Subtle Ambient Radial Purple Glow */}
          <div
            className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full bg-primary/10 blur-[80px] pointer-events-none"
            aria-hidden="true"
          />

          {/* Orbit Geometry & Crosshairs (Reference sceneOrbit & tick-frames) */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none opacity-20 text-[#8a8a8a]"
            viewBox="0 0 500 500"
            fill="none"
            aria-hidden="true"
          >
            <ellipse
              cx="250"
              cy="250"
              rx="210"
              ry="190"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="4 8"
            />
            <ellipse
              cx="250"
              cy="250"
              rx="130"
              ry="110"
              stroke="currentColor"
              strokeWidth="1"
              strokeDasharray="2 6"
              className="opacity-40"
            />
            {/* Technical grid tick markers */}
            <path
              d="M40 40v16m-8-8h16M460 40v16m-8-8h16M40 460v16m-8-8h16M460 460v16m-8-8h16"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>

          {/* Stage Top Header */}
          <div className="relative z-10 flex items-center justify-between w-full pb-4 border-b border-[#1f1f1f]">
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#8a8a8a]">
              <span className="w-2 h-2 rounded-sm bg-primary/80"></span>
              <span>NeuroLoom Protocol Stage</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded">
              <Activity
                className="w-3 h-3 animate-spin"
                style={{ animationDuration: "4s" }}
              />
              <span>DYNAMIC REBALANCE</span>
            </div>
          </div>

          {/* Center Stage: Layered Floating Tilted Cards with Mouse Parallax */}
          <div className="relative flex-1 my-6 flex flex-col justify-center">
            {/* CARD 1: AI Agent Execution Node (Tilted -3deg) */}
            <div
              className="relative w-[92%] sm:w-[88%] self-start bg-[#141414]/95 border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-[0_16px_36px_rgba(0,0,0,0.6)] backdrop-blur-md transition-transform duration-300 ease-out z-10"
              style={{
                transform: `rotate(-3.5deg) translate3d(${pointer.x * 10}px, ${pointer.y * 8}px, 0)`,
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#222]">
                <div className="flex items-center gap-2.5">
                  <div className="w-6 h-6 rounded-md bg-primary/15 border border-primary/30 flex items-center justify-center text-primary text-xs">
                    ✳
                  </div>
                  <span className="text-xs font-mono font-medium text-[#f5f5f5]">
                    Autonomous Agent #01
                  </span>
                </div>
                <span className="text-[10px] font-mono bg-white/[0.05] border border-white/10 px-2 py-0.5 rounded text-[#c5c5c5]">
                  ⌘ RUNNING
                </span>
              </div>

              <p className="mt-3 text-xs sm:text-[13px] text-[#e8e8e8] font-normal leading-relaxed">
                Scan yield spreads:{" "}
                <span className="text-primary font-mono font-semibold">
                  Venus
                </span>{" "}
                vs{" "}
                <span className="text-primary font-mono font-semibold">
                  PancakeSwap
                </span>
                . Rebalance $45,000 liquidity to highest risk-adjusted APY.
              </p>

              <div className="mt-3.5 pt-2.5 border-t border-[#1f1f1f] flex items-center gap-2 text-[10px] font-mono text-[#8a8a8a]">
                <span className="text-primary">↳</span>
                <span className="truncate">
                  Decision: Swap +2.8% spread to PancakeSwap V3 (Gas: 0.0004
                  BNB)
                </span>
              </div>
            </div>

            {/* CARD 2: Execution Receipt & Vault Allocation (Tilted +3deg) */}
            <div
              className="relative w-[94%] sm:w-[90%] self-end -mt-8 bg-[#181818]/95 border border-primary/20 rounded-2xl p-4 sm:p-5 shadow-[0_20px_45px_rgba(0,0,0,0.7)] backdrop-blur-md transition-transform duration-300 ease-out z-20"
              style={{
                transform: `rotate(2.5deg) translate3d(${pointer.x * -12}px, ${pointer.y * -10}px, 0)`,
              }}
            >
              <div className="flex items-center justify-between pb-3 border-b border-[#262626]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-tr from-primary to-primary-light flex items-center justify-center text-[10px] text-white font-bold">
                    NL
                  </div>
                  <span className="text-xs font-mono font-semibold text-[#f5f5f5] tracking-wide">
                    Strategy Vault Receipt
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                  <span>●</span> VERIFIED ON-CHAIN
                </span>
              </div>

              {/* Protocol Allocation Rows */}
              <div className="mt-3 flex flex-col gap-2">
                {[
                  {
                    name: "PancakeSwap V3",
                    pair: "USDT / USDC LP",
                    apy: "19.8% APY",
                    state: "Active",
                  },
                  {
                    name: "Venus Protocol",
                    pair: "vUSDT Supply",
                    apy: "13.4% APY",
                    state: "Allocated",
                  },
                  {
                    name: "Backed.fi (SPYx)",
                    pair: "S&P 500 xStock",
                    apy: "11.2% APY",
                    state: "Routed RWA",
                  },
                ].map((item, idx) => (
                  <div
                    key={item.name}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-mono transition-all duration-300 ${
                      activeAllocation === idx
                        ? "bg-primary/10 border-primary/40 text-[#f5f5f5] shadow-[0_0_12px_rgba(139,92,246,0.15)]"
                        : "bg-[#121212] border-[#222] text-[#8a8a8a]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                      <span className="font-medium text-[#f5f5f5]">
                        {item.name}
                      </span>
                      <span className="text-[10px] text-[#8a8a8a] hidden sm:inline">
                        ({item.pair})
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-primary font-bold">{item.apy}</span>
                      <span className="text-emerald-400 text-xs">✓</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Card Footer Note */}
              <div className="mt-3.5 pt-2 border-t border-dashed border-[#262626] flex items-center justify-between text-[10px] font-mono text-[#8a8a8a]">
                <span>Automated Yield Optimization</span>
                <span className="text-[#f5f5f5]">Net Projected: +21.8%</span>
              </div>
            </div>
          </div>

          {/* Stage Bottom Live Telemetry (Reference sceneBottom) */}
          <div className="relative z-10 flex items-center justify-between pt-3 border-t border-[#1f1f1f] text-[10px] font-mono text-[#8a8a8a]">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-[#c5c5c5]">
                BSC Testnet Block #38,291,410
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span>
                Latency: <strong className="text-[#f5f5f5]">84ms</strong>
              </span>
              <span>
                Gas Saved: <strong className="text-primary">$18.40</strong>
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
