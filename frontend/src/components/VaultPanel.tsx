"use client";
import { useState } from "react";

export function VaultPanel() {
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  return (
    <aside className="bg-[#0b1120]/90 rounded-3xl border border-white/[0.05] p-6 flex flex-col gap-6 relative overflow-hidden backdrop-blur-2xl shadow-2xl">
      {/* Efek pendaran neon di latar belakang kartu */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Tabs (Adaptasi dari ticket-mode-tabs) */}
      <div className="flex gap-6 border-b border-white/[0.05] pb-3">
        <button
          onClick={() => setAction("deposit")}
          className={`font-semibold tracking-wide pb-2 border-b-2 transition-colors ${action === "deposit" ? "text-white border-primary" : "text-gray-500 border-transparent hover:text-gray-300"}`}
        >
          Deposit Asset
        </button>
        <button
          onClick={() => setAction("withdraw")}
          className={`font-semibold tracking-wide pb-2 border-b-2 transition-colors ${action === "withdraw" ? "text-white border-primary" : "text-gray-500 border-transparent hover:text-gray-300"}`}
        >
          Withdraw
        </button>
      </div>

      {/* Input Form (Adaptasi dari amount-field) */}
      <div className="flex flex-col gap-2 relative z-10">
        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          Amount
        </label>
        <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl p-3 focus-within:border-primary/50 transition-colors">
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="bg-transparent text-2xl text-white outline-none w-full font-mono placeholder:text-gray-700"
          />
          <span className="font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg text-sm">
            USDT
          </span>
        </div>
        <div className="text-right text-xs text-gray-500 font-mono mt-1">
          Available: 0.00 USDT
        </div>
      </div>

      {/* Route Info (Adaptasi dari ticket-detail-grid) */}
      <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05]">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">AI Strategy Pool</span>
          <span className="text-white font-mono">Dynamic Multi-Routing</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Simulated APY</span>
          <span className="text-success font-mono font-bold">~24.5%</span>
        </div>
      </div>

      <button className="w-full py-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold tracking-wide hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all hover:-translate-y-0.5">
        Execute {action === "deposit" ? "Deposit" : "Withdrawal"}
      </button>
    </aside>
  );
}
