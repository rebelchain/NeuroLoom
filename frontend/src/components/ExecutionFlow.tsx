"use client";

import { useEffect, useState } from "react";
import { Reveal } from "./Reveal";

const STEPS = [
  {
    id: "01",
    title: "Capital Ingestion & Verification",
    desc: "User deposits assets into the unified vault. The smart contract locks the capital via cryptography and awakens the AI agent from its idle state.",
    logs: [
      {
        delay: "100ms",
        time: "00:00:01",
        label: "SYSTEM",
        text: "Awaiting deposit signature...",
        color: "text-[#8a8a8a]",
      },
      {
        delay: "400ms",
        time: "00:00:03",
        label: "NETWORK",
        text: "TxHash: 0x8f4c...a12b confirmed on BSC",
        color: "text-[#f5f5f5]",
      },
      {
        delay: "800ms",
        time: "00:00:03",
        label: "CONTRACT",
        text: "5,000 USDT locked in NeuroLoom Vault",
        color: "text-primary",
      },
      {
        delay: "1200ms",
        time: "00:00:04",
        label: "ORCHESTRATOR",
        text: "Neural Engine awakened. Queueing allocation.",
        color: "text-primary",
      },
    ],
  },
  {
    id: "02",
    title: "Algorithmic Orchestration",
    desc: "The AI continuously indexes The Graph to monitor liquidity shifts, calculating volume profiles and impermanent loss simulations off-chain.",
    logs: [
      {
        delay: "100ms",
        time: "00:00:05",
        label: "INDEXER",
        text: "Querying The Graph v0.0.6 (BSC Testnet)...",
        color: "text-[#8a8a8a]",
      },
      {
        delay: "400ms",
        time: "00:00:08",
        label: "ANALYTICS",
        text: "Liquidity shift detected on PancakeSwap V3",
        color: "text-[#f5f5f5]",
      },
      {
        delay: "800ms",
        time: "00:00:08",
        label: "ORACLE",
        text: "Chainlink Data Feed verified. Spread optimal.",
        color: "text-[#00ED64]",
      },
      {
        delay: "1200ms",
        time: "00:00:09",
        label: "NEURAL_NET",
        text: "Projected APY: 24.1%. Formulating route...",
        color: "text-primary",
      },
    ],
  },
  {
    id: "03",
    title: "Cryptographic Settlement",
    desc: "Assets are dynamically routed to the optimal protocol with algorithmic slippage protection. The execution is permanently recorded on-chain.",
    logs: [
      {
        delay: "100ms",
        time: "00:00:10",
        label: "ROUTING",
        text: "Constructing multi-hop path: USDT -> WBNB",
        color: "text-[#8a8a8a]",
      },
      {
        delay: "400ms",
        time: "00:00:12",
        label: "EXECUTION",
        text: "Slippage tolerance locked at 0.15%",
        color: "text-[#f5f5f5]",
      },
      {
        delay: "800ms",
        time: "00:00:15",
        label: "SETTLEMENT",
        text: "Rebalance executed. Gas optimized.",
        color: "text-[#00ED64]",
      },
      {
        delay: "1200ms",
        time: "00:00:15",
        label: "SUCCESS",
        text: "Yield generation active. Capital deployed.",
        color: "text-primary",
      },
    ],
  },
];

export function ExecutionFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    if (!isAutoPlaying) return;
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % STEPS.length);
    }, 5000); 
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const handleStepClick = (index: number) => {
    setActiveStep(index);
    setIsAutoPlaying(false); 
  };

  return (
    <Reveal>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch mt-12">
        {/*  DAFTAR STEP */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {STEPS.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`relative border border-[#1f1f1f] p-6 cursor-pointer transition-all duration-500 overflow-hidden tick-frame ${
                  isActive
                    ? "bg-[#121212] border-primary/50"
                    : "bg-[#0a0a0a] opacity-50 hover:opacity-100"
                }`}
              >
                {/* Indikator Vertikal Aktif */}
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                )}

                <div className="text-[10px] font-mono text-primary mb-2 tracking-widest uppercase">
                  Step {step.id}
                </div>
                <h3 className="text-sm font-bold text-[#f5f5f5] mb-2 uppercase tracking-wide font-mono">
                  {step.title}
                </h3>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        {/*  TERMINAL AI LIVESYNC */}
        <div className="lg:col-span-7">
          <div className="border border-[#1f1f1f] bg-[#0a0a0a] flex flex-col h-full min-h-[340px] tick-frame relative shadow-2xl">
            {/* Header Terminal */}
            <div className="border-b border-[#1f1f1f] bg-[#121212]/80 px-5 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-mono text-[#8a8a8a] tracking-widest">
                  [ System_Terminal ]
                </span>
              </div>
              <div className="flex items-center gap-2 border border-primary/30 bg-primary/10 px-2 py-1">
                <span className="w-1.5 h-1.5 bg-primary animate-pulse"></span>
                <span className="text-[9px] uppercase font-mono text-primary tracking-widest">
                  Node: BSC-Testnet
                </span>
              </div>
            </div>

            {/* Body Terminal */}
            <div
              key={activeStep}
              className="p-6 font-mono text-[11px] md:text-xs flex flex-col gap-4 overflow-hidden flex-grow relative"
            >
              {STEPS[activeStep].logs.map((log, i) => (
                <div
                  key={i}
                  className="animate-fade-in-up flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
                  style={{
                    animationDelay: log.delay,
                    animationFillMode: "both",
                  }}
                >
                  <span className="text-[#8a8a8a] shrink-0 opacity-50">
                    [{log.time}]
                  </span>
                  <span
                    className={`${log.color} shrink-0 uppercase tracking-widest`}
                  >
                    [{log.label}]
                  </span>
                  <span className="text-[#c5c5c5] leading-relaxed">
                    {log.text}
                  </span>
                </div>
              ))}

              <div
                className="animate-fade-in-up flex items-center gap-2 mt-2"
                style={{ animationDelay: "1500ms", animationFillMode: "both" }}
              >
                <span className="text-[#8a8a8a] opacity-50">{">"}</span>
                <span className="w-2 h-3.5 bg-primary animate-pulse"></span>
              </div>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#1f1f1f] to-transparent"></div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
