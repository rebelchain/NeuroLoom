"use client";

// Add type definition for window.ethereum
declare global {
  interface Window {
    ethereum?: {
      request: (args: {
        method: string;
        params?: unknown[];
      }) => Promise<unknown>;
    };
  }
}

import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { useState } from "react";

interface AgentOutput {
  analysis: string;
  action: string;
  reasoning: string;
  confidenceScore: number;
}

interface AgentResponse {
  success: boolean;
  timestamp: string;
  agentOutput: AgentOutput;
  error?: string;
}

export default function Home() {
  const [marketCondition, setMarketCondition] = useState<string>(
    "Bullish momentum with high liquidity",
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [agentResult, setAgentResult] = useState<AgentOutput | null>(null);
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [userAddress, setUserAddress] = useState<string>("");

  // Simulasi koneksi wallet
  const connectWallet = async () => {
    if (typeof window !== "undefined" && window.ethereum) {
      try {
        const accounts = (await window.ethereum.request({
          method: "eth_requestAccounts",
        })) as string[];
        if (accounts.length > 0) {
          setUserAddress(accounts[0]);
        }
      } catch (err) {
        console.error("User rejected connection", err);
      }
    } else {
      alert(
        "MetaMask tidak terdeteksi! Silakan gunakan browser ber-extension Web3.",
      );
    }
  };

  const triggerAIAgent = async () => {
    setLoading(true);
    setAgentResult(null);

    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ marketCondition }),
      });

      const data: AgentResponse = await res.json();
      if (data.success) {
        setAgentResult(data.agentOutput);
      } else {
        alert(`Error: ${data.error}`);
      }
    } catch (err) {
      console.error("Failed to run AI Agent:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-base-300 text-base-content p-4 md:p-8">
      {/* Header / Navbar */}
      <header className="navbar bg-base-100 rounded-box shadow-xl mb-8 px-6">
        <div className="flex-1">
          <span className="text-2xl font-extrabold tracking-wider text-primary">
            NEURO<span className="text-accent">LOOM</span>
          </span>
          <span className="badge badge-neutral ml-3 hidden sm:inline-flex">
            BNB Chain Testnet
          </span>
        </div>
        <div className="flex-none gap-2">
          {userAddress ? (
            <div className="badge badge-success gap-2 py-3 px-4 font-mono">
              <span className="w-2 h-2 rounded-full bg-base-100 animate-pulse"></span>
              {userAddress.substring(0, 6)}...
              {userAddress.substring(userAddress.length - 4)}
            </div>
          ) : (
            <button
              onClick={connectWallet}
              className="btn btn-primary btn-sm md:btn-md"
            >
              Connect Wallet
            </button>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto space-y-8">
        {/* Top Stats Overview */}
        <div className="stats shadow w-full grid grid-cols-1 md:grid-cols-4 bg-base-100">
          <div className="stat">
            <div className="stat-title">Total Value Locked (TVL)</div>
            <div className="stat-value text-primary">$124,500 USDT</div>
            <div className="stat-desc">BNB Testnet Vault Pool</div>
          </div>

          <div className="stat">
            <div className="stat-title">Estimated APY</div>
            <div className="stat-value text-accent">18.4%</div>
            <div className="stat-desc text-accent">↗︎ AI-Optimized Strategy</div>
          </div>

          <div className="stat">
            <div className="stat-title">AI Agent Mode</div>
            <div className="stat-value text-secondary text-2xl flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-secondary"></span>
              </span>
              Autonomous
            </div>
            <div className="stat-desc">Gemini 2.0 Engine Active</div>
          </div>

          <div className="stat">
            <div className="stat-title">Vault Address</div>
            <div className="stat-value text-sm truncate max-w-[180px] font-mono">
              {CONTRACT_ADDRESSES.neuroLoom}
            </div>
            <div className="stat-desc">
              <a
                href={`https://testnet.bscscan.com/address/${CONTRACT_ADDRESSES.neuroLoom}`}
                target="_blank"
                rel="noreferrer"
                className="link link-hover text-info text-xs"
              >
                View on BSCScan ↗
              </a>
            </div>
          </div>
        </div>

        {/* Main Grid Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: AI Reasoning Console (2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-xl text-primary flex items-center justify-between">
                  🤖 AI Agent Operations Console
                  <span className="badge badge-outline text-xs">
                    Gemini 2.0 Flash
                  </span>
                </h2>
                <p className="text-sm opacity-80">
                  Masukkan persepsi kondisi pasar terkini untuk memicu analisis
                  kognitif dan keputusan rebalancing secara otonom dari AI
                  Agent.
                </p>

                <div className="form-control mt-4 space-y-2">
                  <label className="label">
                    <span className="label-text font-semibold">
                      Prompt Simulator Pasar
                    </span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={marketCondition}
                      onChange={(e) => setMarketCondition(e.target.value)}
                      placeholder="misal: BNB breakout dengan volume tinggi..."
                      className="input input-bordered w-full"
                    />
                    <button
                      onClick={triggerAIAgent}
                      disabled={loading}
                      className="btn btn-accent px-6"
                    >
                      {loading ? (
                        <span className="loading loading-spinner"></span>
                      ) : (
                        "Evaluate Market"
                      )}
                    </button>
                  </div>
                </div>

                {/* AI Reasoning Result Box */}
                {agentResult && (
                  <div className="mt-6 p-5 bg-base-200 rounded-box border border-accent/20 space-y-4 animate-fade-in">
                    <div className="flex justify-between items-center border-b border-base-300 pb-3">
                      <span className="font-bold text-sm tracking-wide uppercase text-accent">
                        Strategi Terpilih: {agentResult.action}
                      </span>
                      <span className="badge badge-accent badge-sm font-semibold">
                        Confidence:{" "}
                        {(agentResult.confidenceScore * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-base-content/60 uppercase">
                        Analisis Pasar
                      </h4>
                      <p className="text-sm mt-1">{agentResult.analysis}</p>
                    </div>

                    <div>
                      <h4 className="text-xs font-semibold text-base-content/60 uppercase">
                        Reasoning AI Agent
                      </h4>
                      <p className="text-sm mt-1 font-mono text-secondary">
                        {agentResult.reasoning}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Vault Interactivity Panel */}
          <div className="space-y-6">
            <div className="card bg-base-100 shadow-xl border border-base-200">
              <div className="card-body">
                <h2 className="card-title text-lg text-secondary">
                  Vault Actions
                </h2>
                <p className="text-xs text-base-content/70">
                  Setor Mock USDT untuk menerima share token{" "}
                  <code className="text-primary font-bold">nlUSDT</code>.
                </p>

                <div className="form-control mt-4 space-y-3">
                  <label className="label">
                    <span className="label-text">Jumlah Deposit (mUSDT)</span>
                  </label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="100.0"
                    className="input input-bordered w-full"
                  />

                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <button className="btn btn-outline btn-info">
                      Approve USDT
                    </button>
                    <button className="btn btn-primary">
                      Deposit to Vault
                    </button>
                  </div>
                </div>

                <div className="divider text-xs">Smart Contracts Info</div>

                <div className="space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="opacity-60">MockUSDT:</span>
                    <span className="text-accent truncate max-w-[120px]">
                      {CONTRACT_ADDRESSES.mockUSDT}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="opacity-60">Vault Share:</span>
                    <span className="text-primary font-bold">nlUSDT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
