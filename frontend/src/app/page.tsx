"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";

// Komponen
import { AITerminalView } from "@/components/AITerminalView";
import { DashboardView } from "@/components/DashboardView";
import { ExecutionPipeline } from "@/components/ExecutionPipeline";
import { Footer } from "@/components/Footer";
import { HeroSection } from "@/components/HeroSection";
import { HistoryView } from "@/components/HistoryView";
import { IdentityGateModal } from "@/components/IdentityGateModal";
import { LiveTicker } from "@/components/LiveTicker";
import { ProblemSection } from "@/components/ProblemSection";
import { Reveal } from "@/components/Reveal";
import { SmartVaultsView } from "@/components/SmartVaultsView";
import { TopNav, type PageId } from "@/components/TopNav";
import { VaultRebalanceSimulator } from "@/components/VaultRebalanceSimulator";
import { SimulationView } from "@/components/SimulationView";

const ease = [0.22, 1, 0.36, 1] as const;

const pageVariants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.3, ease } },
};

const PAGE_TITLES: Record<PageId, string> = {
  overview: "Dashboard",
  vaults: "Strategy Vaults",
  terminal: "AI Terminal",
  history: "Audit Trail",
  simulation: "Demo Simulation",
};

export default function NeuroLoomApp() {
  const [view, setView] = useState<"landing" | "app">("landing");
  const [activePage, setActivePage] = useState<PageId>("overview");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showGate, setShowGate] = useState(false);

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleCustomNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        setActivePage(customEvent.detail as PageId);
      }
    };
    const handleOpenGate = () => {
      setShowGate(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("app-navigate", handleCustomNavigate);
    window.addEventListener("open-gate", handleOpenGate);
    return () =>
      window.removeEventListener("app-navigate", handleCustomNavigate);
  }, []);
  useEffect(() => {
    if (view === "landing") {
      document.body.style.overflow = "";
      window.scrollTo(0, 0);
    }
  }, [view]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 30);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigate = (page: PageId) => {
    setActivePage(page);
    setMobileOpen(false);
  };

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
      case "simulation":
        return <SimulationView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <>
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
          /*
             VIEW 1: LANDING PAGE */
          <motion.div
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.8 } }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
            className="min-h-screen bg-transparent text-[#f5f5f5] relative flex flex-col overflow-x-hidden font-sans"
          >
            <div className="fixed inset-0 z-0 pointer-events-none">
              {/* Tekstur noise statis */}
              <div className="grain"></div>

              {/* Grid cetak biru khas NeuroLoom (atur opacity sesuai selera, 40-60% biasanya pas) */}
              <div className="absolute inset-0 blueprint opacity-50"></div>
            </div>

            <nav
              className={`fixed top-0 left-0 right-0 w-full z-50 transition-all duration-500 ease-out  ${
                isScrolled
                  ? "bg-[#0a0a0a]/40 border-[#1f1f1f]/30 py-2"
                  : "bg-transparent border-transparent mix-blend-difference py-3"
              }`}
            >
              <div className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between transition-all duration-300">
                <div
                  className="flex items-center gap-4 cursor-pointer"
                  onClick={() =>
                    window.scrollTo({ top: 0, behavior: "smooth" })
                  }
                >
                  <Image
                    src="/neuroloom2.png"
                    alt="NeuroLoom Logo"
                    width={180}
                    height={48}
                    priority
                    className="h-12 w-auto object-contain scale-110 origin-left"
                  />
                </div>

                {/* MENU LINK  */}
                <div className="flex items-center gap-8">
                  <div className="hidden md:flex items-center gap-6 text-[11px] uppercase tracking-widest text-[#8a8a8a]">
                    <button
                      onClick={() =>
                        document
                          .getElementById("features")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      Problem
                    </button>
                    <button
                      onClick={() =>
                        document
                          .getElementById("how-it-works")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      Pipeline
                    </button>
                    <button
                      onClick={() =>
                        document
                          .getElementById("protocols")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      Matrix
                    </button>
                    <button
                      onClick={() =>
                        document
                          .getElementById("vaults")
                          ?.scrollIntoView({ behavior: "smooth" })
                      }
                      className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      Vaults
                    </button>
                    <a
                      href="https://github.com/r3belchain/NeuroLoom"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:text-primary transition-colors cursor-pointer focus:outline-none"
                    >
                      Source
                    </a>
                  </div>

                  <button
                    onClick={() => setShowGate(true)}
                    className="text-[11px] font-mono uppercase tracking-widest text-[#f5f5f5] hover:text-primary transition-colors pointer-events-auto focus:outline-none"
                  >
                    Enter Dashboard
                  </button>
                </div>
              </div>
            </nav>

            <main className="flex-grow flex flex-col z-10 pt-20">
              {/* HERO SECTION */}
              <HeroSection
                onLaunchDashboard={() => setShowGate(true)}
                onExploreClick={() =>
                  document
                    .getElementById("features")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              />

              <LiveTicker />

              {/* THE PROBLEM & TRILEMMA SECTION */}
              <ProblemSection />

              {/* EXECUTION FLOW */}
              <section
                id="how-it-works"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="right"
              >
                <Reveal>
                  <div className="text-left mb-10 border-l-2 border-primary/40 pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
                      02 / The Execution Pipeline
                    </p>
                    <h2 className="text-3xl sm:text-5xl lg:text-[3.5rem] leading-[1.08] font-normal tracking-tight text-[#f5f5f5]">
                      Autonomous Routing{" "}
                      {/* <span className="serif it alic text-[#c5c5c5]">
                        <br></br>
                        across integrated protocols.
                      </span> */}
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] mt-5 max-w-2xl leading-relaxed">
                      The Orchestrator Workflow handles the entire yield
                      optimization lifecycle in four cryptographic steps. No
                      manual bridges, no complex staking.
                    </p>
                  </div>
                </Reveal>

                <ExecutionPipeline />
              </section>

              {/* THE LIQUIDITY MATRIX */}
              <section
                id="protocols"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="left"
              >
                <Reveal>
                  <div className="text-left mb-14 border-l-2 border-primary/40 pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
                      03 / The Liquidity Matrix
                    </p>
                    <h2 className="serif text-3xl md:text-5xl text-[#f5f5f5] mb-5 leading-tight">
                      Institutional Yield.
                      <br />
                      Deep Liquidity.
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] max-w-2xl leading-relaxed">
                      NeuroLoom’s Orchestrator agent does not just hold assets.
                      It actively routes capital across the deepest and most
                      secure protocols on the BNB Chain, capturing fleeting
                      market inefficiencies through autonomous multi-agent
                      execution.
                    </p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12">
                    {/* VENUS PROTOCOL (CORE LENDING BASELINE) */}
                    <div className="liquid-glass tick-frame p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50">
                      <div>
                        {/* Top Badges & Status */}
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1.5">
                            CORE LENDING MARKET
                          </span>
                          <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            <span className="text-[10px] uppercase font-mono text-[#10b981] tracking-widest font-bold">
                              ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Protocol Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 border border-[#1f1f1f] bg-[#0a0a0a] p-2 flex items-center justify-center overflow-hidden shrink-0">
                            <Image
                              src="/protocolcard/venus.jpg"
                              alt="Venus Protocol"
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="serif text-3xl sm:text-4xl text-[#f5f5f5] tracking-tight">
                              Venus Protocol
                            </h3>
                            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-0.5">
                              vUSDT Money Market
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-8 font-light">
                          Acts as the baseline yield generator. The Agent
                          deposits single-sided stablecoins (vUSDT) to secure a
                          low-risk, over-collateralized foundation.
                        </p>
                      </div>

                      {/* Bottom Metric */}
                      <div className="border-t border-[#1f1f1f] pt-5 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Base Yield
                        </span>
                        <span className="text-primary font-bold text-sm sm:text-base tracking-wide">
                          7.5% - 14.5% APY
                        </span>
                      </div>
                    </div>

                    {/* PANCAKESWAP V3 (CONCENTRATED AMM) */}
                    <div className="liquid-glass tick-frame p-6 md:p-8 flex flex-col justify-between transition-all duration-300 hover:border-primary/50">
                      <div>
                        {/* Top Badges & Status */}
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-primary border border-primary/30 bg-primary/10 px-3 py-1.5">
                            CLAMM & SPOT DEX
                          </span>
                          <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-3 py-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse shadow-[0_0_8px_#10b981]"></span>
                            <span className="text-[10px] uppercase font-mono text-[#10b981] tracking-widest font-bold">
                              ACTIVE
                            </span>
                          </div>
                        </div>

                        {/* Protocol Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 border border-[#1f1f1f] bg-[#0a0a0a] p-2 flex items-center justify-center overflow-hidden shrink-0">
                            <Image
                              src="/protocolcard/pancakeswap.jpg"
                              alt="PancakeSwap V3"
                              width={40}
                              height={40}
                              className="w-full h-full object-contain"
                            />
                          </div>
                          <div>
                            <h3 className="serif text-3xl sm:text-4xl text-[#f5f5f5] tracking-tight">
                              PancakeSwap V3
                            </h3>
                            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-0.5">
                              LIQUIDITY & EXECUTION ROUTER
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-8 font-light">
                          The primary engine for active yield. The Agent
                          provides concentrated liquidity to capture trading
                          fees, while also utilizing the spot DEX router to
                          auto-compound harvested rewards back into stablecoins.
                        </p>
                      </div>

                      {/* Bottom Metric */}
                      <div className="border-t border-[#1f1f1f] pt-5 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Active Yield
                        </span>
                        <span className="text-primary font-bold text-sm sm:text-base tracking-wide">
                          12.0% - 38.0% APY
                        </span>
                      </div>
                    </div>

                    {/* BACKED.FI (TOKENIZED EQUITIES RWA) */}
                    <div className="liquid-glass tick-frame p-6 md:p-8 flex flex-col justify-between transition-all duration-500 border border-dashed border-[#262626] bg-[#0a0a0a]/40 group hover:border-[#555]">
                      <div>
                        {/* Top Badges & Status */}
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] border border-[#262626] bg-[#161616] px-3 py-1.5 group-hover:text-[#c5c5c5] transition-colors">
                            TOKENIZED EQUITIES (RWA)
                          </span>
                          <div className="flex items-center gap-2 border border-[#262626] bg-[#161616] px-3 py-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#555555]"></span>
                            <span className="text-[10px] uppercase font-mono text-[#8a8a8a] tracking-widest font-bold">
                              IN QUEUE
                            </span>
                          </div>
                        </div>

                        {/* Protocol Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 border border-[#1f1f1f] bg-[#0a0a0a] p-2 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#333] transition-colors">
                            <Image
                              src="/protocolcard/backed.png"
                              alt="Backed.fi"
                              width={40}
                              height={40}
                              className="w-full h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="serif text-3xl sm:text-4xl text-[#f5f5f5] tracking-tight">
                              Backed.fi
                            </h3>
                            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-0.5">
                              SPYx · S&P 500 xStock
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-8 font-light">
                          Institutional tokenized US equities. Enables
                          autonomous routing into compliant real-world assets
                          when traditional equity risk premiums exceed on-chain
                          yields.
                        </p>
                      </div>

                      {/* Bottom Metric */}
                      <div className="border-t border-[#1f1f1f] pt-5 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Asset Yield
                        </span>
                        <span className="text-[#8a8a8a] font-bold text-sm sm:text-base tracking-wide">
                          Evaluating Model
                        </span>
                      </div>
                    </div>

                    {/* THENA FUSION (ALGEBRA INTEGRAL CLAMM) */}
                    <div className="liquid-glass tick-frame p-6 md:p-8 flex flex-col justify-between transition-all duration-500 border border-dashed border-[#262626] bg-[#0a0a0a]/40 group hover:border-[#555]">
                      <div>
                        {/* Top Badges & Status */}
                        <div className="flex items-center justify-between gap-4 mb-8">
                          <span className="font-mono text-[10px] uppercase tracking-widest text-[#8a8a8a] border border-[#262626] bg-[#161616] px-3 py-1.5 group-hover:text-[#c5c5c5] transition-colors">
                            ALGEBRA INTEGRAL CLAMM
                          </span>
                          <div className="flex items-center gap-2 border border-[#262626] bg-[#161616] px-3 py-1.5 shrink-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#555555]"></span>
                            <span className="text-[10px] uppercase font-mono text-[#8a8a8a] tracking-widest font-bold">
                              IN QUEUE
                            </span>
                          </div>
                        </div>

                        {/* Protocol Identity */}
                        <div className="flex items-center gap-4 mb-6">
                          <div className="w-12 h-12 border border-[#1f1f1f] bg-[#0a0a0a] p-2 flex items-center justify-center overflow-hidden shrink-0 group-hover:border-[#333] transition-colors">
                            <Image
                              src="/protocolcard/thena.png"
                              alt="Thena Fusion"
                              width={40}
                              height={40}
                              className="w-full h-full object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                            />
                          </div>
                          <div>
                            <h3 className="serif text-3xl sm:text-4xl text-[#f5f5f5] tracking-tight">
                              Thena
                            </h3>
                            <p className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest mt-0.5">
                              Algebra Modular Hooks
                            </p>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-8 font-light">
                          Upcoming integration targeting THENA V3&apos;s
                          hook-based modular architecture. The Agent is
                          currently evaluating dynamic fee structures and
                          IL-mitigation within custom ranges.
                        </p>
                      </div>

                      {/* Bottom Metric */}
                      <div className="border-t border-[#1f1f1f] pt-5 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Active Yield
                        </span>
                        <span className="text-[#8a8a8a] font-bold text-sm sm:text-base tracking-wide">
                          Evaluating Model
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </section>

              {/* STRATEGY VAULTS */}
              <section
                id="vaults"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="right"
              >
                <Reveal>
                  <div className="text-left mb-14 border-l-2 border-primary/40 pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
                      04 / Vault Architecture
                    </p>
                    <h2 className="serif text-3xl md:text-5xl text-[#f5f5f5] mb-5 leading-tight">
                      Risk-Adjusted Portfolios.
                      <br />
                      Compounded Daily.
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] max-w-2xl leading-relaxed">
                      Select a vault that matches your risk profile. The AI
                      Orchestrator isolates smart contract risk and actively
                      manages drawdowns while optimizing for maximum yield
                      generation.
                    </p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                    {/* THE YIELD FARM */}
                    <div className="group border border-[#1f1f1f] bg-[#121212]/90 rounded-2xl p-6 md:p-8 hover:border-[#333] transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[#8a8a8a] font-mono text-[10px] tracking-widest uppercase mb-1">
                            Base Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide text-base">
                            THE YIELD FARM
                          </h3>
                        </div>
                        <div className="border border-[#00ED64]/30 bg-[#00ED64]/10 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[#00ED64] font-bold">
                          Low Risk
                        </div>
                      </div>

                      <p className="text-xs text-[#8a8a8a] leading-relaxed mb-6 font-light">
                        Single-sided lending deposits in over-collateralized
                        money markets. Capital preservation with zero
                        impermanent loss risk.
                      </p>

                      {/* Metrik */}
                      <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[#1a1a1a]">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-[#f5f5f5] font-mono font-bold text-sm">
                            14.5%
                          </div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono font-bold text-sm">
                            &lt; 1.0%
                          </div>
                        </div>
                      </div>

                      {/* Composition Badge */}
                      <div className="text-[10px] font-mono text-[#8a8a8a] mb-6 flex items-center justify-between">
                        <span>Target Pool:</span>
                        <span className="text-[#c5c5c5]">
                          100% Venus Lending
                        </span>
                      </div>

                      {/* Mockup Equity Curve  */}
                      <div className="h-14 w-full mt-auto relative overflow-hidden rounded-b-xl border-b border-transparent">
                        <svg
                          viewBox="0 0 100 30"
                          className="w-full h-full preserve-3d opacity-50 group-hover:opacity-100 transition-opacity"
                        >
                          <path
                            d="M0,25 C10,24 20,20 30,22 C40,24 50,15 60,18 C70,21 80,10 100,5"
                            fill="none"
                            stroke="currentColor"
                            className="text-primary"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                      </div>
                    </div>

                    {/* BLUECHIP MOMENTUM (CORE STRATEGY) */}
                    <div className="group border border-primary/50 bg-[#121212]/95 rounded-2xl p-6 md:p-8 hover:border-primary hover:shadow-[0_12px_40px_rgba(139,92,246,0.18)] transition-all duration-300 cursor-pointer flex flex-col relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-90"></div>

                      <div className="flex justify-between items-start mb-6 mt-1">
                        <div>
                          <div className="text-primary font-mono text-[10px] tracking-widest uppercase mb-1 flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                            Core Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide text-base">
                            BLUECHIP MOMENTUM
                          </h3>
                        </div>
                        <div className="border border-[#ffd75f]/30 bg-[#ffd75f]/10 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[#ffd75f] font-bold">
                          Med Risk
                        </div>
                      </div>

                      <p className="text-xs text-[#8a8a8a] leading-relaxed mb-6 font-light">
                        Multi-asset portfolio actively rebalancing between Venus
                        lending, PancakeSwap V3 CLAMM, and Backed Finance
                        S&amp;P 500 RWA.
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[#1a1a1a]">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-primary font-mono font-bold text-sm">
                            22.4%
                          </div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono font-bold text-sm">
                            ~ 4.5%
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-[#8a8a8a] mb-6 flex items-center justify-between">
                        <span>Target Weights:</span>
                        <span className="text-primary font-semibold">
                          40% vUSDT | 30% WBNB | 30% SPYx
                        </span>
                      </div>

                      <div className="h-14 w-full mt-auto relative overflow-hidden rounded-b-xl border-b border-transparent">
                        <svg
                          viewBox="0 0 100 30"
                          className="w-full h-full preserve-3d opacity-70 group-hover:opacity-100 transition-opacity"
                        >
                          <path
                            d="M0,28 C15,22 25,26 35,18 C45,10 50,15 65,8 C75,3 85,10 100,2"
                            fill="none"
                            stroke="currentColor"
                            className="text-primary"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                      </div>
                    </div>

                    {/* DEGEN ACCUMULATOR */}
                    <div className="group border border-[#1f1f1f] bg-[#121212]/90 rounded-2xl p-6 md:p-8 hover:border-[#333] transition-all duration-500 cursor-pointer flex flex-col relative overflow-hidden shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[#8a8a8a] font-mono text-[10px] tracking-widest uppercase mb-1">
                            Alpha Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide text-base">
                            DEGEN ACCUMULATOR
                          </h3>
                        </div>
                        <div className="border border-[#ff5f5f]/30 bg-[#ff5f5f]/10 rounded-full px-3 py-1 text-[9px] font-mono uppercase tracking-widest text-[#ff5f5f] font-bold">
                          High Risk
                        </div>
                      </div>

                      <p className="text-xs text-[#8a8a8a] leading-relaxed mb-6 font-light">
                        Opportunistic high-beta farming across concentrated
                        liquidity ticks and volatile delta-neutral trading pairs
                        for maximum yield.
                      </p>

                      <div className="grid grid-cols-2 gap-4 mb-6 pt-4 border-t border-[#1a1a1a]">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-[#f5f5f5] font-mono font-bold text-sm">
                            38.2%
                          </div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono font-bold text-sm">
                            ~ 15.0%
                          </div>
                        </div>
                      </div>

                      <div className="text-[10px] font-mono text-[#8a8a8a] mb-6 flex items-center justify-between">
                        <span>Target Pool:</span>
                        <span className="text-[#c5c5c5]">
                          High-Beta AMM &amp; Hooks
                        </span>
                      </div>

                      <div className="h-14 w-full mt-auto relative overflow-hidden rounded-b-xl border-b border-transparent">
                        <svg
                          viewBox="0 0 100 30"
                          className="w-full h-full preserve-3d opacity-40 group-hover:opacity-100 transition-opacity"
                        >
                          <path
                            d="M0,28 C10,28 15,10 25,18 C35,26 40,5 50,15 C60,25 70,2 80,12 C90,22 95,0 100,5"
                            fill="none"
                            stroke="currentColor"
                            className="text-[#ff5f5f]"
                            strokeWidth="1.5"
                            vectorEffect="non-scaling-stroke"
                          />
                        </svg>
                        <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent"></div>
                      </div>
                    </div>
                  </div>
                </Reveal>

                {/* THE AUTONOMOUS REBALANCE SIMULATOR */}
                <Reveal>
                  <VaultRebalanceSimulator />
                </Reveal>
              </section>
              <Footer></Footer>
            </main>
          </motion.div>
        ) : (
          /* 
             VIEW 2: STYLE DASHBOARD OBSIDIAN */
          <motion.div
            key="app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.4 } }}
            exit={{ opacity: 0 }}
            className="relative flex flex-col h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-hidden font-sans"
          >
            <TopNav
              activePage={activePage}
              onNavigate={navigate}
              onBackToLanding={() => setView("landing")}
            />

            <main className="flex-1 overflow-y-auto px-4 sm:px-6 w-full max-w-[1600px] mx-auto">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePage}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="py-6 sm:py-8"
                >
                  {renderPage()}
                </motion.div>
              </AnimatePresence>
            </main>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
