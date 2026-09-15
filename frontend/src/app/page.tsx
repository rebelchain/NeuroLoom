"use client";

import {
  Activity,
  BrainCircuit,
  ChevronRight,
  Lock,
  Server,
  Terminal,
  Wallet,
  Zap,
} from "lucide-react";
import { useState } from "react";
import { AIEventLog } from "../components/AIEventLog";
import { MetricCard } from "../components/MetricCard";
import { VaultPanel } from "../components/VaultPanel";

export default function NeuroLoomApp() {
  const [activeTab, setActiveTab] = useState<"intro" | "dashboard">("intro");

  return (
    <div className="min-h-screen bg-[#04060d] text-white relative overflow-x-hidden font-sans flex flex-col">
      {/* =========================================
          EFEK BACKGROUND (Global)
      ========================================= */}
      <div
        className="fixed inset-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(at 40% 20%, hsla(267,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%)",
        }}
      />
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-info/10 rounded-full blur-[120px] pointer-events-none" />

      {/* =========================================
          GLOBAL NAVBAR
      ========================================= */}
      <nav className="sticky top-0 z-50 border-b border-white/[0.05] bg-[#04060d]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={() => setActiveTab("intro")}
          >
            <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              <Activity className="w-5 h-5 text-primary" />
            </div>
            <span className="font-bold text-xl tracking-widest">NEUROLOOM</span>
          </div>

          <div className="hidden md:flex items-center gap-8 font-mono text-xs uppercase tracking-[0.1em]">
            <button
              onClick={() => setActiveTab("intro")}
              className={`transition-colors hover:text-primary ${activeTab === "intro" ? "text-primary font-bold" : "text-gray-400"}`}
            >
              Introduction
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`transition-colors hover:text-primary ${activeTab === "dashboard" ? "text-primary font-bold" : "text-gray-400"}`}
            >
              Terminal
            </button>
            <a
              href="#"
              className="text-gray-400 hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-white/[0.02] border border-white/[0.05] rounded-full shadow-inner">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-xs font-mono text-gray-300 tracking-wider">
                AI: ONLINE
              </span>
            </div>
            <button className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] transition-colors text-sm font-semibold">
              <Wallet className="w-4 h-4" />
              Connect
            </button>
          </div>
        </div>
      </nav>

      {/* =========================================
          DYNAMIC VIEW RENDERER
      ========================================= */}
      <main className="relative z-10 flex-grow flex flex-col">
        {activeTab === "intro" ? (
          /* --- VIEW 1: INTRODUCTION (LANDING PAGE) --- */
          <div className="flex flex-col w-full animate-in fade-in zoom-in-95 duration-700">
            {/* 1. HERO SECTION */}
            <section className="flex flex-col items-center justify-center text-center px-6 py-32 min-h-[85vh]">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-primary text-xs font-medium mb-8">
                <Terminal className="w-4 h-4" />
                BSC Testnet Live
              </div>
              <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight mb-6 leading-[1.1]">
                Autonomous Yield <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#a78bfa] via-[#38bdf8] to-[#a78bfa] bg-[length:200%_auto] animate-[shimmer_3s_linear_infinite]">
                  Driven by AI Intents
                </span>
              </h1>
              <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                NeuroLoom is an enterprise-grade DeFi vault that dynamically
                rebalances your portfolio across the Binance Smart Chain. No
                manual strategies. Just deposit, and let the AI execute optimal
                routes.
              </p>
              <div className="flex gap-4">
                <button
                  onClick={() => setActiveTab("dashboard")}
                  className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1 text-white font-bold text-base"
                >
                  Launch Terminal
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <a
                  href="#how-it-works"
                  className="flex items-center gap-3 px-8 py-4 rounded-xl bg-white/[0.05] border border-white/10 hover:bg-white/[0.1] transition-all text-white font-medium text-base"
                >
                  How it works
                </a>
              </div>
            </section>

            {/* 2. THE PROBLEM SECTION */}
            <section className="py-24 px-6 border-t border-white/[0.02] bg-gradient-to-b from-transparent to-black/40">
              <div className="max-w-7xl mx-auto">
                <div className="mb-16">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                    The Problem
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-6 leading-tight">
                    Static Strategies in a <br className="hidden md:block" />{" "}
                    Dynamic Market.
                  </h2>
                  <p className="text-gray-400 text-lg max-w-2xl leading-relaxed">
                    DeFi yields fluctuate by the minute. Traditional vaults lock
                    your assets into rigid, static strategies. By the time a
                    human manually rebalances a position, the alpha is gone, and
                    gas fees eat the profits.
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Problem Card */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] backdrop-blur-md">
                    <div className="text-[10px] font-mono text-error uppercase tracking-widest mb-6">
                      Without Autonomous AI
                    </div>
                    <div className="flex flex-col gap-3 font-mono text-xs">
                      <div className="flex justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-gray-400">
                          Market Shift Detected
                        </span>
                        <span className="text-white">
                          Human sleeping (T+4 hrs)
                        </span>
                      </div>
                      <div className="flex justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                        <span className="text-gray-400">
                          Manual Withdraw & Swap
                        </span>
                        <span className="text-white">High Gas / Slippage</span>
                      </div>
                      <div className="flex justify-between p-4 rounded-xl bg-error/10 border border-error/20">
                        <span className="text-error">Resulting Yield</span>
                        <span className="text-error font-bold">
                          Sub-optimal
                        </span>
                      </div>
                    </div>
                  </div>
                  {/* Quote Card */}
                  <div className="p-8 rounded-3xl bg-primary/5 border border-primary/20 backdrop-blur-md flex flex-col justify-center">
                    <BrainCircuit className="w-10 h-10 text-primary mb-6" />
                    <blockquote className="text-2xl font-medium leading-snug">
                      "In a market that operates 24/7 at the speed of code,
                      human execution is the ultimate bottleneck."
                    </blockquote>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. HOW IT WORKS SECTION */}
            <section
              id="how-it-works"
              className="py-24 px-6 border-t border-white/[0.02]"
            >
              <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                  <span className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.2em]">
                    The Architecture
                  </span>
                  <h2 className="text-3xl md:text-5xl font-bold mt-4 mb-4">
                    How NeuroLoom Works
                  </h2>
                  <p className="text-gray-400 max-w-2xl mx-auto">
                    Three simple steps to institutional-grade yield automation,
                    powered by Intent-Driven AI and The Graph protocol.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
                  {/* Step 1 */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-primary/50 transition-colors">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6">
                      <Lock className="w-6 h-6 text-primary" />
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      STEP 01
                    </div>
                    <h3 className="text-xl font-bold mb-3">Smart Deposit</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Users deposit assets into the NeuroLoom Vault smart
                      contract. Funds are securely locked and mathematically
                      accounted for on the BSC chain.
                    </p>
                  </div>
                  {/* Step 2 */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-info/50 transition-colors">
                    <div className="w-12 h-12 bg-info/10 rounded-xl flex items-center justify-center mb-6">
                      <Server className="w-6 h-6 text-info" />
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      STEP 02
                    </div>
                    <h3 className="text-xl font-bold mb-3">AI Monitoring</h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      Our off-chain AI Agent constantly ingests live blockchain
                      data indexed by The Graph, simulating thousands of yield
                      routes to find the perfect intent.
                    </p>
                  </div>
                  {/* Step 3 */}
                  <div className="p-8 rounded-3xl bg-white/[0.02] border border-white/[0.05] hover:border-success/50 transition-colors">
                    <div className="w-12 h-12 bg-success/10 rounded-xl flex items-center justify-center mb-6">
                      <Zap className="w-6 h-6 text-success" />
                    </div>
                    <div className="text-xs font-mono text-gray-500 mb-2">
                      STEP 03
                    </div>
                    <h3 className="text-xl font-bold mb-3">
                      Autonomous Rebalance
                    </h3>
                    <p className="text-gray-400 text-sm leading-relaxed">
                      When the AI finds a strictly profitable route, it calls
                      the vault's rebalance function. The smart contract
                      validates and executes the trade trustlessly.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. CTA SECTION */}
            <section className="py-24 px-6">
              <div className="max-w-5xl mx-auto p-12 md:p-20 rounded-[3rem] bg-gradient-to-br from-[#0b1120] to-black border border-white/[0.05] relative overflow-hidden text-center shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-[100px] pointer-events-none" />
                <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold mb-6">
                    Enter the New Era of DeFi
                  </h2>
                  <p className="text-gray-400 text-lg max-w-xl mx-auto mb-10">
                    Stop managing your yields manually. Connect your wallet and
                    let the NeuroLoom AI agent maximize your portfolio.
                  </p>
                  <button
                    onClick={() => setActiveTab("dashboard")}
                    className="inline-flex items-center gap-3 px-10 py-5 rounded-2xl bg-white text-black font-bold text-lg hover:bg-gray-200 transition-all hover:scale-105"
                  >
                    Launch Terminal
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </section>

            {/* 5. FOOTER */}
            <footer className="py-8 px-6 border-t border-white/[0.05] text-center text-sm text-gray-500 font-mono flex flex-col md:flex-row justify-between items-center max-w-7xl mx-auto w-full gap-4">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-primary" />
                <span className="text-white font-semibold">NEUROLOOM</span>
                <span>· Built for Indonesia Web3 Hackathon 2026</span>
              </div>
              <div>© 2026 NeuroLoom · Built on BNB Chain</div>
            </footer>
          </div>
        ) : (
          /* --- VIEW 2: DASHBOARD (APP) --- */
          <div className="max-w-7xl mx-auto px-6 py-8 flex flex-col gap-8 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <MetricCard
                label="Total Value Locked"
                value="$0.00"
                detail="Managed by Agent"
                accent="default"
              />
              <MetricCard
                label="Current APY"
                value="24.5%"
                detail="Simulated AI Strategy"
                accent="buy"
              />
              <MetricCard
                label="Active AI Routes"
                value="0"
                detail="Awaiting Graph sync"
                accent="sell"
              />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:h-[500px]">
              <div className="lg:col-span-2 h-full flex flex-col">
                <AIEventLog />
              </div>
              <div className="lg:col-span-1 h-full flex flex-col">
                <VaultPanel />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
