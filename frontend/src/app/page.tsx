"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  BrainCircuit,
  ChevronRight,
  Network,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Komponen Modular
import { IdentityGateModal } from "@/components/IdentityGateModal";
import { AITerminalView } from "../components/AITerminalView";
import { BenefitRow } from "../components/BenefitRow";
import { DashboardView } from "../components/DashboardView";
import { FeatureCard } from "../components/FeatureCard";
import { Header } from "../components/Header";
import { HistoryView } from "../components/HistoryView";
import { LandingEventLog } from "../components/LandingEventLog";
import { LiveTicker } from "../components/LiveTicker";
import { ParticlesBackground } from "../components/ParticlesBackground";
import { ProtocolCard } from "../components/ProtocolCard";
import { SectionLabel } from "../components/SectionLabel";
import { Sidebar, type PageId } from "../components/Sidebar";
import { SmartVaultsView } from "../components/SmartVaultsView";
import { StepCard } from "../components/StepCard";
import { useTyping } from "../lib/useTyping";

// ==========================================
// KONFIGURASI ANIMASI & TEMA (ATM dari Referensi)
// ==========================================
const ease = [0.4, 0, 0.2, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.35, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.2, ease } },
};

const shellVariants = {
  initial: { opacity: 0, scale: 0.985 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.45, ease } },
  exit: { opacity: 0, scale: 1.01, transition: { duration: 0.3, ease } },
};

const PAGE_TITLES: Record<PageId, string> = {
  overview: "Overview",
  vaults: "Smart Vaults",
  terminal: "AI Terminal",
  history: "History",
};

// Pendaran cahaya dinamis yang berubah saat pindah menu
const SECTION_ACCENTS: Record<PageId, string> = {
  overview:
    "radial-gradient(at 15% 20%, rgba(139,92,246,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(6,182,212,0.12) 0%, transparent 50%)",
  vaults:
    "radial-gradient(at 15% 20%, rgba(16,185,129,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(16,185,129,0.11) 0%, transparent 50%)",
  terminal:
    "radial-gradient(at 15% 20%, rgba(6,182,212,0.15) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(16,185,129,0.1) 0%, transparent 50%)",
  history:
    "radial-gradient(at 15% 20%, rgba(139,92,246,0.16) 0%, transparent 55%), radial-gradient(at 85% 88%, rgba(167,139,250,0.11) 0%, transparent 50%)",
};

export default function NeuroLoomApp() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const typedText = useTyping(view === "landing");
  const [activeStep, setActiveStep] = useState(0);
  const [activeProtocol, setActiveProtocol] = useState(0);
  const [showGate, setShowGate] = useState(false);

  useEffect(() => {
    const handleCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActivePage(customEvent.detail as PageId);
      }
    };

    window.addEventListener("app-navigate", handleCustomNavigate);
    return () =>
      window.removeEventListener("app-navigate", handleCustomNavigate);
  }, []);

  // Kunci scroll body saat menu mobile terbuka
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [mobileOpen]);

  useEffect(() => {
    if (view === "landing") {
      document.body.style.overflow = "";
      window.scrollTo(0, 0);
    }
  }, [view]);

  const navigate = (page: PageId) => {
    setActivePage(page);
    setMobileOpen(false);
  };

  // Saklar Halaman (Router Manual)
  const renderPage = () => {
    switch (activePage) {
      case "overview":
        return <DashboardView />;
      case "vaults":
        return <SmartVaultsView />;
      case "terminal":
        return <AITerminalView />;
      case "history":
        return <HistoryView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
      {/* =========================================
          MODAL GERBANG IDENTITAS
      ========================================= */}
      <IdentityGateModal
        isOpen={showGate}
        onClose={() => setShowGate(false)}
        onContinue={() => {
          setShowGate(false);
          setView("app");
        }}
      />
      <AnimatePresence mode="wait">
        {view === "landing" ? (
          /* =========================================
             VIEW 1: LANDING PAGE
          ========================================= */
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0, transition: { duration: 0.3 } }}
            className="min-h-screen bg-[#04060d] text-white relative flex flex-col overflow-x-hidden font-sans"
          >
            {/* Latar Belakang Interaktif Baru */}
            <ParticlesBackground />
            {/* <FloatingCoins /> */}

            {/* Latar Belakang Statis (Di bawah partikel) */}
            <div
              className="fixed inset-0 pointer-events-none opacity-20 z-0"
              style={{
                backgroundImage:
                  "radial-gradient(at 40% 20%, hsla(267,100%,74%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,100%,56%,0.15) 0px, transparent 50%)",
              }}
            />

            <nav className="fixed top-0 left-0 right-0 w-full z-50 border-b border-white/[0.05] bg-[#04060d]/80 backdrop-blur-xl">
              <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                {/* Logo: Bisa diklik untuk otomatis scroll mulus ke paling atas */}
                <div
                  className="flex items-center gap-3 cursor-pointer"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] overflow-hidden p-0">
                    <Image
                      src="/neuroloom2.png"
                      alt="NeuroLoom Logo"
                      width={40}
                      height={40}
                      className="w-full h-full object-contain scale-110"
                      priority
                    />
                  </div>
                  <span className="font-bold text-xl tracking-widest">
                    NEUROLOOM
                  </span>
                </div>

                {/* UBAHAN 2: Routing antar Section & Tambahan link Github */}
                <div className="hidden md:flex items-center gap-8 font-semibold text-xs uppercase tracking-[0.1em]">
                  <button
                    onClick={() =>
                      document
                        .getElementById("features")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    Why NeuroLoom
                  </button>
                  <button
                    onClick={() =>
                      document
                        .getElementById("how-it-works")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    Execution Flow
                  </button>
                  <button
                    onClick={() =>
                      document
                        .getElementById("protocols")
                        ?.scrollIntoView({ behavior: "smooth" })
                    }
                    className="text-gray-400 hover:text-primary transition-colors"
                  >
                    Ecosystem
                  </button>

                  {/* Link Github */}
                  <a
                    href="https://github.com/r3belchain/NeuroLoom"
                    target="_blank"
                    rel="noreferrer"
                    className="text-gray-400 hover:text-primary transition-colors duration-200 flex items-center gap-1.5"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                    </svg>
                    GitHub
                  </a>
                </div>

                {/* UBAHAN 3: Sembunyikan Launch Dashboard di Mobile (tambah class 'hidden md:flex') */}
                <button
                  onClick={() => setShowGate(true)}
                  className="hidden md:flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.05] border border-white/[0.1] hover:bg-white/[0.1] transition-colors text-sm font-semibold"
                >
                  <Wallet className="w-4 h-4" /> Launch Dashboard
                </button>
              </div>
            </nav>

            <main className="flex-grow flex flex-col z-10 pt-20">
              <section className="flex flex-col items-center justify-center text-center px-6 py-24 min-h-[85vh] relative">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[#F3BA2F] text-xs font-medium mb-8">
                  <Image
                    src="https://cryptologos.cc/logos/bnb-bnb-logo.svg?v=035"
                    alt="BNB Logo"
                    width={16}
                    height={16}
                    className="w-4 h-4"
                    unoptimized
                  />
                  BSC Testnet Live
                </div>
                <h1 className="text-5xl md:text-7xl lg:text-[5.5rem] font-black tracking-tight mb-6 leading-[1.1]">
                  On-Chain <br />
                  <span className="gradient-text-shimmer">{typedText}</span>
                </h1>
                <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                  NeuroLoom is an enterprise-grade DeFi vault that dynamically
                  rebalances your portfolio across the Binance Smart Chain.
                </p>
                <div className="flex gap-4">
                  <button
                    onClick={() => setShowGate(true)}
                    className="group flex items-center gap-3 px-8 py-4 rounded-xl bg-gradient-to-r from-primary to-info hover:shadow-[0_0_30px_rgba(139,92,246,0.5)] transition-all hover:-translate-y-1 text-white font-bold text-base"
                  >
                    Launch Dashboard{" "}
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </section>

              <LiveTicker />
              {/* =========================================
                  SEKSI: THE PROBLEM & FEATURES
              ========================================= */}
              <section
                id="features"
                className="py-24 px-6 relative border-t border-white/[0.02] mt-12 bg-gradient-to-b from-transparent to-[#04060d]"
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[100px] pointer-events-none" />
                <div className="max-w-7xl mx-auto relative z-10">
                  <div className="max-w-3xl mb-14">
                    <SectionLabel>The Problem</SectionLabel>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-5 leading-tight">
                      Static Strategies in a <br className="hidden md:block" />{" "}
                      Dynamic Market.
                    </h2>
                    <p className="text-gray-400 text-lg leading-relaxed">
                      DeFi yields fluctuate by the minute. Traditional vaults
                      lock your assets into rigid strategies. By the time a
                      human manually rebalances a position, the alpha is gone,
                      and gas fees eat the profits.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
                    {/* Problem Narrative (Kiri) */}
                    <div className="lg:col-span-3 flex flex-col gap-6">
                      <div className="liquid-glass rounded-2xl p-6 md:p-8 flex-1 border border-white/[0.05]">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500 mb-5">
                          Without Autonomous AI
                        </div>
                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-3">
                            <span className="text-gray-400">
                              Market Shift Detected
                            </span>
                            <span className="text-white font-medium">
                              Human sleeping (T+4 hrs)
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-white/[0.02] border border-white/[0.05] px-4 py-3">
                            <span className="text-gray-400">
                              Manual Withdraw & Swap
                            </span>
                            <span className="text-warning font-medium">
                              High Gas / Slippage
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-lg bg-error/10 border border-error/20 px-4 py-3">
                            <span className="text-gray-400">
                              Resulting Yield
                            </span>
                            <span className="text-error font-medium">
                              Sub-optimal APY
                            </span>
                          </div>
                        </div>
                        <p className="mt-5 text-sm text-gray-400 leading-relaxed">
                          In a market that operates 24/7 at the speed of code,
                          human execution is the ultimate bottleneck.
                        </p>
                      </div>
                      <figure className="liquid-glass rounded-2xl p-6 md:p-8 border border-white/[0.05]">
                        <blockquote className="text-lg md:text-2xl font-semibold gradient-text leading-snug">
                          “The biggest risk in modern DeFi isn&apos;t smart
                          contract failure, it&apos;s inefficient capital
                          allocation.”
                        </blockquote>
                      </figure>
                    </div>

                    {/* The Answer / Features (Kanan) */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <FeatureCard
                        featured
                        icon={
                          <BrainCircuit
                            className="w-6 h-6 text-primary"
                            strokeWidth={1.5}
                          />
                        }
                        title="Real-Time AMM Liquidity Analysis"
                        desc="Powered by an Agentic Workflow, our system constantly analyzes concentrated liquidity depth and lending pool utilization rates across DeFi protocols. The Orchestrator LLM dynamically calculates the optimal multi-protocol route, while an Evaluator-Optimizer loop refines the execution to secure maximum APY before the market shifts."
                        accent="from-primary/10 to-transparent"
                        delay="0ms"
                      />
                      <BenefitRow
                        icon={
                          <Network
                            className="w-6 h-6 text-info"
                            strokeWidth={1.5}
                          />
                        }
                        title="Dynamic Multi-Routing"
                        desc="The AI Orchestrator evaluates hundreds of potential yield routes off-chain to minimize slippage and optimize gas efficiency before broadcasting."
                        delay="100ms"
                      />
                      <BenefitRow
                        icon={
                          <ShieldCheck
                            className="w-6 h-6 text-success"
                            strokeWidth={1.5}
                          />
                        }
                        title="Immutable Audit Trail"
                        desc="Every execution and rebalance is cryptographically verified and recorded permanently on the BSC network."
                        delay="200ms"
                      />
                    </div>
                  </div>
                </div>
              </section>
              {/* =========================================
                  SEKSI: HOW IT WORKS
              ========================================= */}
              <section
                id="how-it-works"
                className="py-24 px-6 relative border-t border-white/[0.02]"
              >
                <div className="max-w-7xl mx-auto relative z-10">
                  <div className="text-center mb-16">
                    <SectionLabel>The Execution Flow</SectionLabel>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                      How NeuroLoom Works
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      No manual bridges, no complex staking. The AI agent
                      handles the entire yield optimization lifecycle in three
                      automated steps.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative mb-10">
                    {/* Garis Penghubung (Desktop) */}
                    <div className="hidden md:block absolute top-8 left-[18%] right-[18%] h-px">
                      <div className="w-full h-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />
                      <div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-shimmer"
                        style={{ backgroundSize: "200% 100%" }}
                      />
                    </div>

                    <StepCard
                      step="01"
                      title="Smart Deposit"
                      desc="Deposit single-sided assets (like USDT or BNB) into the unified NeuroLoom vault."
                      active={activeStep === 0}
                      onClick={() => setActiveStep(0)}
                    />
                    <StepCard
                      step="02"
                      title="Market State Analysis"
                      desc="The AI continuously indexes The Graph to monitor liquidity shifts and APY spikes."
                      active={activeStep === 1}
                      onClick={() => setActiveStep(1)}
                    />
                    <StepCard
                      step="03"
                      title="Autonomous Routing"
                      desc="Assets are dynamically routed to the optimal protocol with absolute on-chain slippage protection."
                      active={activeStep === 2}
                      onClick={() => setActiveStep(2)}
                    />
                  </div>

                  {/* Panel Detail Terminal UI */}
                  <div className="max-w-4xl mx-auto liquid-glass rounded-2xl p-6 md:p-10 relative overflow-hidden border border-white/5">
                    {activeStep === 0 && (
                      <div className="text-center animate-fade-in-up">
                        <h4 className="text-xl font-semibold text-white mb-2">
                          Initialize Vault Position
                        </h4>
                        <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8">
                          User deposits $5,000 USDT. The smart contract
                          validates the deposit and queues the capital for the
                          next AI execution cycle.
                        </p>
                        <div className="max-w-xl mx-auto">
                          <LandingEventLog
                            events={[
                              {
                                msg: "TX DEPOSIT · 5,000 USDT -> Vault",
                                type: "info",
                              },
                              {
                                msg: "CONTRACT VERIFIED · Balance Updated",
                                type: "pass",
                              },
                              {
                                msg: "STATUS: WAITING AI ALLOCATION QUEUE",
                                type: "mint",
                              },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                    {activeStep === 1 && (
                      <div className="text-center animate-fade-in-up">
                        <h4 className="text-xl font-semibold text-white mb-2">
                          Real-Time Graph Indexing
                        </h4>
                        <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8">
                          The AI detects a massive liquidity withdrawal on
                          PancakeSwap, projecting a temporary APY spike to 24%
                          for WBNB pairs.
                        </p>
                        <div className="max-w-xl mx-auto">
                          <LandingEventLog
                            events={[
                              {
                                msg: "INDEXING · Venus Protocol Rates ... OK",
                                type: "info",
                              },
                              {
                                msg: "INDEXING · PancakeSwap V2 Liquidity",
                                type: "info",
                              },
                              {
                                msg: "ALERT · Market Inefficiency Found (Spread 2.1%)",
                                type: "mint",
                              },
                              {
                                msg: "TARGET APY PROJECTED: 24.1%",
                                type: "pass",
                              },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                    {activeStep === 2 && (
                      <div className="text-center animate-fade-in-up">
                        <h4 className="text-xl font-semibold text-white mb-2">
                          Execute Optimal Path
                        </h4>
                        <p className="text-sm text-gray-400 max-w-2xl mx-auto mb-8">
                          The agent constructs a multi-hop transaction, swaps
                          the assets with minimal slippage, and stakes them in
                          the target protocol.
                        </p>
                        <div className="max-w-xl mx-auto">
                          <LandingEventLog
                            events={[
                              {
                                msg: "ROUTING · USDT -> WBNB (Optimal Route)",
                                type: "info",
                              },
                              {
                                msg: "EXECUTE · Stake in PancakeSwap Pool",
                                type: "pass",
                              },
                              {
                                msg: "OPTIMIZATION · Gas saved: $14.20",
                                type: "mint",
                              },
                              { msg: "YIELD GENERATION ACTIVE", type: "pass" },
                            ]}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>

              {/* =========================================
                  SEKSI: SUPPORTED PROTOCOLS
              ========================================= */}
              <section
                id="protocols"
                className="py-24 px-6 relative border-t border-white/[0.02]"
              >
                <div className="max-w-7xl mx-auto relative z-10">
                  <div className="text-center mb-16">
                    <SectionLabel>Ecosystem</SectionLabel>
                    <h2 className="text-3xl md:text-5xl font-bold text-white mb-4">
                      Integrated Protocols
                    </h2>
                    <p className="text-gray-400 max-w-2xl mx-auto">
                      NeuroLoom seamlessly interfaces with the largest liquidity
                      pools on the BNB Chain, ensuring deep liquidity and exit
                      safety.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <ProtocolCard
                      image="/protocolcard/venus.jpeg"
                      name="Venus"
                      desc="The largest lending and borrowing protocol on BNB Chain."
                      metric="$1.4B TVL"
                      sub="Lending Markets"
                      active={activeProtocol === 0}
                      onClick={() => setActiveProtocol(0)}
                    />
                    <ProtocolCard
                      image="/protocolcard/pancakeswap.jpeg"
                      name="PancakeSwap"
                      desc="Deepest AMM liquidity for efficient and secure asset routing."
                      metric="$2.1B TVL"
                      sub="DEX & Yield Farms"
                      active={activeProtocol === 1}
                      onClick={() => setActiveProtocol(1)}
                    />
                    <ProtocolCard
                      image="/protocolcard/radiant.jpeg"
                      name="Radiant"
                      desc="Omni-chain money market for cross-chain yield."
                      metric="Upcoming Integration"
                      sub="Upcoming Integration"
                      active={activeProtocol === 2}
                      onClick={() => setActiveProtocol(2)}
                    />
                    <ProtocolCard
                      image="/protocolcard/kinza.jpeg"
                      name="Kinza"
                      desc="Next-generation lending protocol with ve-tokenomics."
                      metric="Upcoming Integration"
                      sub="Upcoming Integration"
                      active={activeProtocol === 3}
                      onClick={() => setActiveProtocol(3)}
                    />
                  </div>
                </div>
              </section>
            </main>
          </motion.div>
        ) : (
          /* =========================================
             VIEW 2: DASHBOARD APPLICATION
          ========================================= */
          <motion.div
            key="app"
            variants={shellVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="relative flex h-screen bg-[#04060d] text-white overflow-hidden font-sans"
          >
            {/* Latar Belakang Ambient (Termasuk Grid CSS kita) */}
            <div
              className="fixed inset-0 mesh-gradient pointer-events-none"
              aria-hidden
            />
            <div
              className="fixed inset-0 grid-bg opacity-25 pointer-events-none"
              aria-hidden
            />

            {/* Aksen Pendaran Warna Berdasarkan Halaman Aktif */}
            <AnimatePresence>
              <motion.div
                key={activePage}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.8, ease }}
                className="fixed inset-0 pointer-events-none"
                style={{
                  background:
                    SECTION_ACCENTS[activePage] ?? SECTION_ACCENTS.overview,
                }}
                aria-hidden
              />
            </AnimatePresence>

            <Sidebar
              activePage={activePage}
              onNavigate={navigate}
              mobileOpen={mobileOpen}
              onCloseMobile={() => setMobileOpen(false)}
              onBackToLanding={() => setView("landing")}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative z-10">
              <Header
                onBackToLanding={() => setView("landing")}
                onOpenMobile={() => setMobileOpen(true)}
                pageTitle={PAGE_TITLES[activePage] ?? "Overview"}
              />

              <main className="flex-1 overflow-y-auto px-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activePage}
                    variants={pageVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    className="py-6"
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </main>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
