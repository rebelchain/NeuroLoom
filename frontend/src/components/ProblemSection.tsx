"use client";

import React, { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Layers,
  Moon,
  ShieldAlert,
  TrendingDown,
} from "lucide-react";

export function ProblemSection() {
  const [activeTab, setActiveTab] = useState<number | null>(null);

  return (
    <section
      id="features"
      className="relative w-full max-w-7xl mx-auto px-6 lg:px-8 py-24 lg:py-32"
    >
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-[140px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-3xl mb-16 lg:mb-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.08] text-[11px] font-mono tracking-widest uppercase text-[#8a8a8a] mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
          <span>01 / The Problem</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-normal tracking-tight text-[#f5f5f5]">
          Growing your wealth{" "}
          <span className="serif italic text-[#c5c5c5]">
            <br></br>
            shouldn&apos;t be a second job.
          </span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-[#8a8a8a] leading-relaxed font-light">
          Decentralized markets offer the world&apos;s highest organic yields,
          yet access is engineered for full-time traders and native DeFi users.
          As a busy professional, you are trapped by three fundamental
          structural barriers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch">
        <div
          onMouseEnter={() => setActiveTab(0)}
          onMouseLeave={() => setActiveTab(null)}
          className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-[#121212]/90 border border-[#1f1f1f] hover:border-primary/40 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div>
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8a8a8a] bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
                The Setup Nightmare
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Layers className="w-4 h-4" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-medium text-[#f5f5f5] tracking-tight mb-3">
              The Barrier to Entry
            </h3>

            {/* Copywriting  */}
            <p className="text-sm text-[#8a8a8a] leading-relaxed mb-6 font-light">
              Earning yield in DeFi today demands you to be a crypto trader and
              financial engineer at once. Managing seed phrases, calculating gas
              price spikes, and bridging assets across fragmented chains is
              tedious, time-consuming, and prone to catastrophic error.
            </p>
          </div>

          {/* Micro-Visualizer */}
          <div className="pt-6 border-t border-[#1f1f1f] flex flex-col gap-3">
            <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider flex items-center justify-between">
              <span>Manual DeFi Friction</span>
              <span className="text-amber-400 font-semibold font-mono text-[11px]">
                12 Manual Approvals
              </span>
            </div>

            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-amber-500/20 text-amber-300/90 flex items-center gap-1.5">
                <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                Seed Phrase Risk
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-white/[0.08] text-[#8a8a8a]">
                Bridge Latency
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-white/[0.08] text-[#8a8a8a]">
                Complex Rebalancing
              </span>
              <span className="px-2.5 py-1.5 rounded-lg bg-[#181818] border border-white/[0.08] text-[#8a8a8a]">
                Gas Spikes
              </span>
            </div>

            <div className="mt-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8a8a8a]">Avg. Onboarding:</span>
              <span className="text-[#f5f5f5] font-medium">
                45+ mins & 6 separate tools
              </span>
            </div>
          </div>
        </div>

        <div
          onMouseEnter={() => setActiveTab(1)}
          onMouseLeave={() => setActiveTab(null)}
          className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-[#121212]/90 border border-[#1f1f1f] hover:border-primary/40 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div>
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8a8a8a] bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
                The Maintenance Trap
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Clock className="w-4 h-4" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-medium text-[#f5f5f5] tracking-tight mb-3">
              The 24/7 Market
            </h3>

            {/* Copywriting  */}
            <p className="text-sm text-[#8a8a8a] leading-relaxed mb-6 font-light">
              DeFi never sleeps. While you are busy at the office or asleep at
              night, yield strategies that were profitable hours ago can
              evaporate in minutes. Leaving capital passive in a fast-moving
              market is silently leaving money on the table.
            </p>
          </div>

          {/* Micro-Visualizer */}
          <div className="pt-6 border-t border-[#1f1f1f] flex flex-col gap-3">
            <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider flex items-center justify-between">
              <span>Night Yield Decay</span>
              <span className="text-red-400 font-semibold font-mono text-[11px] flex items-center gap-1">
                <TrendingDown className="w-3 h-3" /> -20.1% Drop
              </span>
            </div>

            <div className="w-full bg-[#161616] rounded-2xl p-3.5 border border-[#222] flex flex-col gap-2">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-[#8a8a8a]">11:00 PM (Active)</span>
                <span className="text-emerald-400 font-semibold">
                  24.2% APY
                </span>
              </div>

              <div className="w-full h-10 py-1">
                <svg
                  viewBox="0 0 240 40"
                  className="w-full h-full text-red-400"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 6 Q 70 8, 120 22 T 240 34"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                  />
                  <path
                    d="M0 6 Q 70 8, 120 22 T 240 34 L 240 40 L 0 40 Z"
                    fill="url(#decay-gradient)"
                    opacity="0.2"
                  />
                  <defs>
                    <linearGradient
                      id="decay-gradient"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="transparent" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              {/* Bottom Reading  */}
              <div className="flex items-center justify-between text-[11px] font-mono pt-1 border-t border-[#202020]">
                <span className="text-red-400 flex items-center gap-1.5">
                  <Moon className="w-3 h-3" />
                  03:00 AM (Asleep)
                </span>
                <span className="text-red-400 font-semibold">4.1% APY</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs font-mono">
              <span className="text-[#8a8a8a]">Human Reaction:</span>
              <span className="text-amber-400 font-medium">
                T+6 hrs lag (Missed Gains)
              </span>
            </div>
          </div>
        </div>

        <div
          onMouseEnter={() => setActiveTab(2)}
          onMouseLeave={() => setActiveTab(null)}
          className="group relative flex flex-col justify-between p-7 sm:p-8 rounded-3xl bg-[#121212]/90 border border-[#1f1f1f] hover:border-primary/40 transition-all duration-300 shadow-[0_16px_40px_rgba(0,0,0,0.5)] backdrop-blur-xl"
        >
          <div>
            {/* Top Badge */}
            <div className="flex items-center justify-between mb-6">
              <span className="text-[10px] font-mono tracking-widest uppercase text-[#8a8a8a] bg-white/[0.03] border border-white/[0.06] px-2.5 py-1 rounded-full">
                The Security Illusion
              </span>
              <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
                <ShieldAlert className="w-4 h-4" />
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl sm:text-2xl font-medium text-[#f5f5f5] tracking-tight mb-3">
              Automation Without Seatbelts
            </h3>

            {/* Copywriting  */}
            <p className="text-sm text-[#8a8a8a] leading-relaxed mb-6 font-light">
              Handing your capital to unconstrained bots or opaque AI is a fatal
              gamble. Meanwhile, legacy vaults are too rigid to react when
              market conditions shift. You need intelligent autopilot execution,
              backed by mathematical smart contract seatbelts.
            </p>
          </div>

          <div className="pt-6 border-t border-[#1f1f1f] flex flex-col gap-3">
            <div className="flex items-baseline justify-between">
              <div className="text-3xl sm:text-4xl font-extrabold font-mono text-[#f5f5f5] tracking-tight">
                $7.5M+
              </div>
              <span className="text-[10px] font-mono text-red-400 uppercase tracking-widest bg-red-500/10 border border-red-500/20 px-2 py-0.5 rounded">
                Drained in 2026
              </span>
            </div>

            <p className="text-[11px] text-[#8a8a8a] font-mono leading-tight">
              Lost by automated bots tricked into approving malicious contracts
              without deterministic guardrails.
            </p>

            <div className="mt-1 flex flex-col gap-1.5 pt-2 border-t border-dashed border-[#222] text-[11px] font-mono text-[#c5c5c5]">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Whitelisted Protocols Only</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Strict 2% Max Slippage Boundary</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-16 lg:mt-24 relative overflow-hidden rounded-3xl p-8 sm:p-12 bg-gradient-to-r from-[#141414] via-[#101010] to-[#0d0d0d] border border-white/[0.08] shadow-[0_20px_50px_rgba(0,0,0,0.6)]">
        <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary-light to-transparent" />

        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-6 sm:gap-8">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-[0.2em] text-primary mb-3 block">
              The Resolution
            </span>
            <blockquote className="serif text-2xl sm:text-3xl lg:text-4xl text-[#f5f5f5] font-normal leading-snug">
              &quot;You don&apos;t need more complex trading tools. You just
              need one gateway that handles everything.&quot;
            </blockquote>
          </div>

          <button
            onClick={() =>
              document
                .getElementById("how-it-works")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="shrink-0 inline-flex items-center gap-3 px-6 py-3.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-mono uppercase tracking-widest text-[#f5f5f5] transition-all duration-200 cursor-pointer group"
          >
            <span>How NeuroLoom Works</span>
            <ChevronRight className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
}
