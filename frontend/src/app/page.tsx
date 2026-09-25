"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BrainCircuit, Network, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// Komponen 
import { IdentityGateModal } from "@/components/IdentityGateModal";
import { AITerminalView } from "../components/AITerminalView";
import { BenefitRow } from "../components/BenefitRow";
import { DashboardView } from "../components/DashboardView";
import { ExecutionFlow } from "../components/ExecutionFlow";
import { FeatureCard } from "../components/FeatureCard";
import { Header } from "../components/Header";
import { HeroWordmark } from "../components/HeroWordmark";
import { HistoryView } from "../components/HistoryView";
import { LiveTicker } from "../components/LiveTicker";
import ParticleCore from "../components/ParticleCore"; 
import { Reveal } from "../components/Reveal";
import { Sidebar, type PageId } from "../components/Sidebar";
import { SmartVaultsView } from "../components/SmartVaultsView";
import { Footer } from "../components/Footer";

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
            <div className="fixed inset-0 z-0">
              <ParticleCore />
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
              <section className="flex flex-col items-center justify-center text-center px-6 min-h-[84vh] relative pointer-events-none">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 mb-8 border border-[#1f1f1f] bg-[#1a1a1a] text-[#8a8a8a] text-[10px] uppercase tracking-widest tick-frame pointer-events-auto">
                  <Image
                    src="/bnbcoin.png"
                    alt="BNB Chain"
                    width={14}
                    height={14}
                    className="w-3.5 h-3.5 object-contain"
                  />
                  BSC Testnet Live
                </div>

                <HeroWordmark />

                <p className="mt-6 text-[clamp(0.62rem,1.2vw,0.82rem)] tracking-[0.3em] uppercase text-[#f5f5f5] mix-blend-difference font-mono">
                  Single deposit · Zero human bottleneck · Dynamic Routing
                </p>

                <p className="mt-6 text-sm md:text-base text-[#f5f5f5] max-w-2xl mx-auto mix-blend-difference leading-relaxed">
                  Autonomous AI-Driven Yield Optimizer dynamically rebalance
                  your portfolio across The Binance Smart Chain
                </p>

                <div className="mt-16 pointer-events-auto relative z-20">
                  <button
                    onClick={() => setShowGate(true)}
                    className="px-8 py-3 bg-primary text-[#0a0a0a] border border-primary font-mono text-sm font-bold uppercase tracking-widest hover:bg-transparent hover:text-primary transition-all duration-300 shadow-[0_0_15px_rgba(139,92,246,0.2)] hover:shadow-[0_0_25px_rgba(139,92,246,0.4)]"
                  >
                    Launch Dashboard
                  </button>
                </div>
              </section>

              <LiveTicker />

              <div aria-hidden="true" style={{ height: "40vh" }} />

              {/* THE PROBLEM & FEATURES */}
              <section
                id="features"
                className=" mx-auto w-full max-w-6xl px-8 py-[10vh]"
                data-figure="left"
              >
                <Reveal>
                  <div className="text-left mb-14 border-l-2 border-[#1f1f1f] pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase">
                      01 / The Problem
                    </p>
                    <h2 className="serif text-3xl md:text-5xl text-[#f5f5f5] mb-5 leading-tight">
                      Static Strategies in a Dynamic Market.
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] max-w-2xl leading-relaxed">
                      DeFi yields fluctuate by the minute. Traditional vaults
                      lock your assets into rigid strategies. By the time a
                      human manually rebalances a position, the alpha is gone,
                      and gas fees eat the profits.
                    </p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch mt-12">
                    <div className="lg:col-span-3 flex flex-col gap-6">
                      <div className="border border-[#1f1f1f] bg-[#121212] p-6 md:p-8 flex-1 tick-frame">
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-mono mb-5">
                          [ Human Execution Bottleneck ]
                        </div>
                        <div className="flex flex-col gap-2.5 font-mono text-xs">
                          <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
                            <span className="text-[#8a8a8a]">
                              {" "}
                              Market Shift Detected
                            </span>
                            <span className="text-[#c5c5c5]">
                              Human sleeping (T+4 hrs)
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-b border-[#1f1f1f] py-3">
                            <span className="text-[#8a8a8a]">
                              {" "}
                              Manual Withdraw & Swap
                            </span>
                            <span className="text-[#ffd75f]">
                              WARN: High Gas / Slippage
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-3">
                            <span className="text-[#8a8a8a]">
                              {" "}
                              Resulting Yield
                            </span>
                            <span className="text-[#ff5f5f]">
                              FAIL: Sub-optimal APY
                            </span>
                          </div>
                        </div>
                        <p className="mt-5 text-[11px] font-mono text-[#8a8a8a] leading-relaxed">
                          In a market that operates 24/7 at the speed of code,
                          human execution is the ultimate bottleneck.
                        </p>
                      </div>

                      <figure className="border-l-2 border-primary pl-6 py-4">
                        <blockquote className="text-lg md:text-2xl font-light text-[#f5f5f5] serif leading-snug">
                          &quot;The biggest risk in modern DeFi isn&apos;t smart
                          contract failure, it&apos;s inefficient capital
                          allocation.&quot;
                        </blockquote>
                      </figure>
                    </div>

                    <div className="lg:col-span-2 flex flex-col gap-6">
                      <FeatureCard
                        featured
                        icon={
                          <BrainCircuit
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.5}
                          />
                        }
                        title="Real-Time AMM Liquidity Analysis"
                        desc="Powered by an Agentic Workflow, our system constantly analyzes concentrated liquidity depth and lending pool utilization rates across DeFi protocols. The Orchestrator LLM dynamically calculates the optimal multi-protocol route, while an Evaluator-Optimizer loop refines the execution to secure maximum APY before the market shifts."
                        delay="0ms"
                      />
                      <BenefitRow
                        icon={
                          <Network
                            className="w-5 h-5 text-primary"
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
                            className="w-5 h-5 text-primary"
                            strokeWidth={1.5}
                          />
                        }
                        title="Immutable Audit Trail"
                        desc="Every execution and rebalance is cryptographically verified and recorded permanently on the BSC network."
                        delay="200ms"
                      />
                    </div>
                  </div>
                </Reveal>
              </section>

              {/*  EXECUTION FLOW */}
              <section
                id="how-it-works"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="right"
              >
                <Reveal>
                  <div className="text-left mb-4 border-l-2 border-[#1f1f1f] pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase">
                      02 / The Execution Pipeline
                    </p>
                    <h2 className="serif text-3xl md:text-5xl text-[#f5f5f5] mb-5 leading-tight">
                      Autonomous Intelligence.
                      <br />
                      Zero Human Bottleneck.
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] max-w-2xl leading-relaxed">
                      The Orchestrator Workflow handles the entire yield
                      optimization lifecycle in three cryptographic steps. No
                      manual bridges, no complex staking.
                    </p>
                  </div>
                </Reveal>

                <ExecutionFlow />
              </section>
              {/* THE LIQUIDITY MATRIX */}
              <section
                id="protocols"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="left"
              >
                <Reveal>
                  <div className="text-left mb-14 border-l-2 border-[#1f1f1f] pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase">
                      03 / The Liquidity Matrix
                    </p>
                    <h2 className="serif text-3xl md:text-5xl text-[#f5f5f5] mb-5 leading-tight">
                      Institutional Yield.
                      <br />
                      Deep Liquidity.
                    </h2>
                    <p className="text-lg font-light text-[#c5c5c5] max-w-2xl leading-relaxed">
                      NeuroLoom’s AI does not just hold assets. It actively
                      routes capital across the deepest and most secure
                      protocols on the BNB Chain to capture fleeting market
                      inefficiencies and generate compound yield.
                    </p>
                  </div>
                </Reveal>

                <Reveal>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                    {/* VENUS PROTOCOL */}
                    <div className="group border border-[#1f1f1f] bg-[#121212] p-6 transition-all duration-500 hover:border-primary/50 flex flex-col justify-between tick-frame">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image
                                src="/protocolcard/venus.jpg"
                                alt="Venus"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="text-[#f5f5f5] font-bold uppercase tracking-wide font-mono">
                                Venus Protocol
                              </h3>
                              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest font-mono">
                                Core Lending Market
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-2 py-1">
                            <span className="w-1.5 h-1.5 bg-primary animate-pulse"></span>
                            <span className="text-[9px] uppercase font-mono text-primary tracking-widest">
                              Active
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#c5c5c5] leading-relaxed mb-6">
                          Acts as the baseline yield generator. The Orchestrator
                          deposits single-sided stablecoins (vUSDT) to secure
                          low-risk, over-collateralized base APY.
                        </p>
                      </div>
                      <div className="border-t border-[#1f1f1f] pt-4 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Yield
                        </span>
                        <span className="text-primary font-bold">
                          7.5% - 14.5% APY
                        </span>
                      </div>
                    </div>

                    {/* PANCAKESWAP */}
                    <div className="group border border-[#1f1f1f] bg-[#121212] p-6 transition-all duration-500 hover:border-primary/50 flex flex-col justify-between tick-frame">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image
                                src="/protocolcard/pancakeswap.jpg"
                                alt="PancakeSwap"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="text-[#f5f5f5] font-bold uppercase tracking-wide font-mono">
                                PancakeSwap V3
                              </h3>
                              <p className="text-[#8a8a8a] text-[10px] uppercase tracking-widest font-mono">
                                Concentrated AMM
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-2 py-1">
                            <span className="w-1.5 h-1.5 bg-primary animate-pulse"></span>
                            <span className="text-[9px] uppercase font-mono text-primary tracking-widest">
                              Active
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#c5c5c5] leading-relaxed mb-6">
                          The AI routes capital here during high-volume market
                          shifts, providing concentrated liquidity to WBNB pools
                          for maximum fee capture.
                        </p>
                      </div>
                      <div className="border-t border-[#1f1f1f] pt-4 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#8a8a8a] uppercase tracking-widest">
                          Target Yield
                        </span>
                        <span className="text-primary font-bold">
                          12.0% - 38.0% APY
                        </span>
                      </div>
                    </div>

                    {/* RADIANT CAPITAL */}
                    <div className="group border border-[#1f1f1f] bg-[#0a0a0a] p-6 transition-all duration-500 opacity-60 hover:opacity-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image
                                src="/protocolcard/radiant.jpg"
                                alt="Radiant"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="text-[#8a8a8a] font-bold uppercase tracking-wide font-mono">
                                Radiant Capital
                              </h3>
                              <p className="text-[#444] text-[10px] uppercase tracking-widest font-mono">
                                Omni-Chain Market
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-[#1f1f1f] bg-[#1a1a1a] px-2 py-1">
                            <span className="w-1.5 h-1.5 bg-[#444]"></span>
                            <span className="text-[9px] uppercase font-mono text-[#8a8a8a] tracking-widest">
                              In Queue
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-6">
                          Upcoming cross-chain liquidity routing integration.
                          Will expand the AI&apos;s execution reach to Arbitrum
                          and Ethereum mainnets.
                        </p>
                      </div>
                      <div className="border-t border-[#1f1f1f] pt-4 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#444] uppercase tracking-widest">
                          Target Yield
                        </span>
                        <span className="text-[#8a8a8a] font-bold">
                          Evaluating Model
                        </span>
                      </div>
                    </div>

                    {/* KINZA FINANCE */}
                    <div className="group border border-[#1f1f1f] bg-[#0a0a0a] p-6 transition-all duration-500 opacity-60 hover:opacity-100 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center overflow-hidden grayscale group-hover:grayscale-0 transition-all duration-500">
                              <Image
                                src="/protocolcard/kinza.jpg"
                                alt="Kinza"
                                width={48}
                                height={48}
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div>
                              <h3 className="text-[#8a8a8a] font-bold uppercase tracking-wide font-mono">
                                Kinza Finance
                              </h3>
                              <p className="text-[#444] text-[10px] uppercase tracking-widest font-mono">
                                ve-Tokenomics
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 border border-[#1f1f1f] bg-[#1a1a1a] px-2 py-1">
                            <span className="w-1.5 h-1.5 bg-[#444]"></span>
                            <span className="text-[9px] uppercase font-mono text-[#8a8a8a] tracking-widest">
                              In Queue
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-[#8a8a8a] leading-relaxed mb-6">
                          Next-generation lending protocol integration. Targeted
                          for high-yield farming loops and governance token
                          accumulation strategies.
                        </p>
                      </div>
                      <div className="border-t border-[#1f1f1f] pt-4 flex items-center justify-between font-mono">
                        <span className="text-xs text-[#444] uppercase tracking-widest">
                          Target Yield
                        </span>
                        <span className="text-[#8a8a8a] font-bold">
                          Evaluating Model
                        </span>
                      </div>
                    </div>
                  </div>
                </Reveal>
              </section>

              {/*  STRATEGY VAULTS  */}
              <section
                id="vaults"
                className="mx-auto w-full max-w-6xl px-8 py-[10vh] border-t border-[#1f1f1f]"
                data-figure="right"
              >
                <Reveal>
                  <div className="text-left mb-14 border-l-2 border-[#1f1f1f] pl-6">
                    <p className="font-mono text-[#8a8a8a] mb-2 tracking-widest text-[10px] uppercase">
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
                    {/* VAULT 1: THE YIELD FARM */}
                    <div className="group border border-[#1f1f1f] bg-[#121212] p-6 hover:border-primary/50 transition-all duration-500 cursor-pointer tick-frame flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[#8a8a8a] font-mono text-[10px] tracking-widest uppercase mb-1">
                            Base Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide">
                            THE YIELD FARM
                          </h3>
                        </div>
                        <div className="border border-[#1f1f1f] bg-[#0a0a0a] px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-[#00ED64]">
                          Low Risk
                        </div>
                      </div>

                      {/* Metrik */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-[#f5f5f5] font-mono">14.5%</div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono">
                            &lt; 1.0%
                          </div>
                        </div>
                      </div>

                      {/* Mockup Equity Curve  */}
                      <div className="h-16 w-full mt-auto relative overflow-hidden border-b border-[#1f1f1f]">
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

                    {/* BLUECHIP MOMENTUM */}
                    <div className="group border border-primary/30 bg-[#121212] p-6 hover:border-primary transition-all duration-500 cursor-pointer tick-frame flex flex-col relative overflow-hidden">
                      <div className="absolute top-0 left-0 w-full h-1 bg-primary"></div>
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-primary font-mono text-[10px] tracking-widest uppercase mb-1">
                            Core Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide">
                            BLUECHIP MOMENTUM
                          </h3>
                        </div>
                        <div className="border border-[#1f1f1f] bg-[#0a0a0a] px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-[#ffd75f]">
                          Med Risk
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-primary font-mono font-bold">
                            22.4%
                          </div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono">~ 4.5%</div>
                        </div>
                      </div>

                      <div className="h-16 w-full mt-auto relative overflow-hidden border-b border-[#1f1f1f]">
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

                    {/* VAULT 3: DEGEN ACCUMULATOR */}
                    <div className="group border border-[#1f1f1f] bg-[#0a0a0a] p-6 hover:border-primary/50 transition-all duration-500 cursor-pointer tick-frame flex flex-col">
                      <div className="flex justify-between items-start mb-6">
                        <div>
                          <div className="text-[#8a8a8a] font-mono text-[10px] tracking-widest uppercase mb-1">
                            Alpha Strategy
                          </div>
                          <h3 className="text-[#f5f5f5] font-bold font-mono tracking-wide">
                            DEGEN ACCUMULATOR
                          </h3>
                        </div>
                        <div className="border border-[#1f1f1f] bg-[#0a0a0a] px-2 py-1 text-[9px] font-mono uppercase tracking-widest text-[#ff5f5f]">
                          High Risk
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Target APY
                          </div>
                          <div className="text-[#f5f5f5] font-mono">38.2%</div>
                        </div>
                        <div>
                          <div className="text-[#8a8a8a] text-[10px] uppercase font-mono tracking-widest mb-1">
                            Max Drawdown
                          </div>
                          <div className="text-[#f5f5f5] font-mono">
                            ~ 15.0%
                          </div>
                        </div>
                      </div>

                      <div className="h-16 w-full mt-auto relative overflow-hidden border-b border-[#1f1f1f]">
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
                        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent"></div>
                      </div>
                    </div>
                  </div>
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
            className="relative flex h-screen bg-[#0a0a0a] text-[#f5f5f5] overflow-hidden font-sans"
          >
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
