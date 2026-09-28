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
        {/* DAFTAR STEP */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {STEPS.map((step, index) => {
            const isActive = activeStep === index;
            return (
              <div
                key={step.id}
                onClick={() => handleStepClick(index)}
                className={`relative border p-6 cursor-pointer rounded-2xl transition-all duration-500 overflow-hidden ${
                  isActive
                    ? "bg-[#0a0a0a] border-primary/50 shadow-[0_10px_30px_rgba(0,0,0,0.5)]"
                    : "bg-[#0a0a0a] border-[#1f1f1f] opacity-60 hover:opacity-100 hover:border-[#333]"
                }`}
              >
                {/* Indikator Vertikal Aktif  */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-r-md bg-primary shadow-[0_0_15px_rgba(139,92,246,0.6)]" />
                )}

                <div className="text-[10px] font-mono text-primary mb-2.5 tracking-widest uppercase font-bold">
                  Step {step.id}
                </div>
                <h3 className="text-[15px] font-bold text-[#f5f5f5] mb-2.5 uppercase tracking-wide font-mono">
                  {step.title}
                </h3>
                <p className="text-xs text-[#8a8a8a] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="lg:col-span-7">
          <div className="border border-[#1f1f1f] bg-[#0a0a0a] rounded-2xl flex flex-col h-full min-h-[340px] relative shadow-[0_24px_48px_rgba(0,0,0,0.4)] overflow-hidden">
            {/* Header Terminal */}
            <div className="border-b border-[#1f1f1f] bg-[#121212] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-[10.5px] uppercase font-mono text-[#8a8a8a] tracking-widest">
                  [ System_Terminal ]
                </span>
              </div>
              {/* Badge Jaringan */}
              <div className="flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]"></span>
                <span className="text-[9.5px] uppercase font-mono text-primary tracking-widest font-bold">
                  Node: BSC-Testnet
                </span>
              </div>
            </div>

            {/* Body Terminal */}
            <div
              key={activeStep}
              className="p-6 md:p-8 font-mono text-[11.5px] md:text-[12.5px] flex flex-col gap-4 overflow-hidden flex-grow relative"
            >
              {STEPS[activeStep].logs.map((log, i) => (
                <div
                  key={i}
                  className="animate-fade-in-up flex flex-col sm:flex-row sm:items-start gap-1.5 sm:gap-4"
                  style={{
                    animationDelay: log.delay,
                    animationFillMode: "both",
                  }}
                >
                  <span className="text-[#6a6a6a] shrink-0">[{log.time}]</span>
                  <span
                    className={`${log.color} shrink-0 uppercase tracking-widest font-semibold`}
                  >
                    [{log.label}]
                  </span>
                  <span className="text-[#c5c5c5] leading-relaxed">
                    {log.text}
                  </span>
                </div>
              ))}

              {/* Blinking Cursor */}
              <div
                className="animate-fade-in-up flex items-center gap-2.5 mt-2"
                style={{ animationDelay: "1500ms", animationFillMode: "both" }}
              >
                <span className="text-[#6a6a6a]">{">"}</span>
                <span className="w-2.5 h-3.5 bg-primary animate-pulse rounded-[1px] shadow-[0_0_8px_var(--color-primary)]"></span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Reveal>
  );
}
