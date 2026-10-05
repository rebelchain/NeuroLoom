"use client";

import {
  Activity,
  BarChart4,
  BrainCircuit,
  Cpu,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

// Struktur data obrolan yang sudah di-parsing
interface ChatMessage {
  id: number;
  sender:
    | "Orchestrator"
    | "Yield Strategist"
    | "Liquidity Manager"
    | "Quant Agent"
    | "Risk Officer";
  content: string;
  isError?: boolean;
}

export function AiTeamChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isTyping, setIsTyping] = useState<string | null>(null);

  // 1. PINDAHKAN FUNGSI INI KE ATAS (Sebelum useEffect yang memanggilnya)
  // Atau gunakan syntax "function" biasa seperti ini agar kena hoisting:
  const parseLogsToChat = (rawLogs: string[]) => {
    const newMessages: ChatMessage[] = [];
    let currentTyping: string | null = null;
    let isFinished = false; // FLAG BARU

    rawLogs.forEach((log, index) => {
      // 1. Tangkap Analisis Orchestrator
      if (log.includes("[ORCHESTRATOR ANALYSIS]:")) {
        const text = log
          .split("[ORCHESTRATOR ANALYSIS]:")[1]
          ?.replace(/"/g, "")
          .trim();
        if (text)
          newMessages.push({
            id: index,
            sender: "Orchestrator",
            content: text,
          });
      }
      // 2. Tangkap Pikiran / Laporan Worker
      else if (
        log.includes("[YIELD STRATEGIST REASONING]:") ||
        log.includes("[YIELD STRATEGIST REPORT]:")
      ) {
        const text = log.split(/]:/)[1]?.replace(/"/g, "").trim();
        if (text)
          newMessages.push({
            id: index,
            sender: "Yield Strategist",
            content: text,
          });
      } else if (
        log.includes("[LIQUIDITY MANAGER REASONING]:") ||
        log.includes("[LIQUIDITY MANAGER REPORT]:")
      ) {
        const text = log.split(/]:/)[1]?.replace(/"/g, "").trim();
        if (text)
          newMessages.push({
            id: index,
            sender: "Liquidity Manager",
            content: text,
          });
      }
      // 3. Tangkap Pikiran Quant Agent
      else if (log.includes("[AGENT THOUGHTS]:")) {
        const text = log
          .split("[AGENT THOUGHTS]:")[1]
          ?.replace(/"/g, "")
          .trim();
        if (text)
          newMessages.push({ id: index, sender: "Quant Agent", content: text });
      }
      // 4. Tangkap Evaluasi Risk Officer
      else if (log.includes("[EVALUATOR FEEDBACK]:")) {
        const text = log
          .split("[EVALUATOR FEEDBACK]:")[1]
          ?.replace(/"/g, "")
          .trim();
        const isRejected =
          log.includes("NEEDS_IMPROVEMENT") ||
          text.includes("exceeds") ||
          text.includes("requires");
        if (text)
          newMessages.push({
            id: index,
            sender: "Risk Officer",
            content: text,
            isError: isRejected,
          });
      }
      // 5. Tangkap Indikator Mengetik (Hanya visual)
      else if (
        log.includes("is analyzing the market...") ||
        log.includes("Evaluating threats")
      ) {
        currentTyping = "Worker Modules";
      } else if (
        log.includes("Typing reasoning") ||
        log.includes("Formulating strategy")
      ) {
        currentTyping = "Quant Agent";
      } else if (log.includes("Risk Officer is reviewing")) {
        currentTyping = "Risk Officer";
      }

      // 🚨 TANGKAP INDIKATOR SELESAI 🚨
      if (
        log.includes("[DATABASE]") ||
        log.includes("[PDF]") ||
        log.includes("Transaction confirmed successfully") ||
        log.includes("APPROVED the transaction") // Opsional jika ingin berhenti lebih cepat
      ) {
        isFinished = true;
      }
    });

    // Jika sudah ada flag selesai, matikan paksa indikator typing!
    if (isFinished) {
      currentTyping = null;
    }

    setMessages(newMessages);
    setIsTyping(currentTyping);
  };

  // 2. USE EFFECT SEKARANG BISA MEMANGGILNYA DENGAN AMAN
  useEffect(() => {
    let isMounted = true;
    let lastLogCount = 0;

    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:9000/api/ai-logs", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) return;

        const data = await response.json();

        if (isMounted && data && Array.isArray(data.logs)) {
          // Hanya memproses jika ada log baru
          if (data.logs.length !== lastLogCount) {
            lastLogCount = data.logs.length;
            parseLogsToChat(data.logs); // Tidak akan error lagi
          }
        }
      } catch (error) {
        // Abaikan error fetch diam-diam
      }
    };

    void fetchLogs();
    const interval = setInterval(fetchLogs, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length, isTyping]);

  // UI Helpers
  const getAvatar = (sender: ChatMessage["sender"]) => {
    switch (sender) {
      case "Orchestrator":
        return <BrainCircuit className="w-4 h-4 text-purple-400" />;
      case "Yield Strategist":
        return <Activity className="w-4 h-4 text-blue-400" />;
      case "Liquidity Manager":
        return <BarChart4 className="w-4 h-4 text-amber-400" />;
      case "Quant Agent":
        return <Cpu className="w-4 h-4 text-emerald-400" />;
      case "Risk Officer":
        return <ShieldAlert className="w-4 h-4 text-rose-400" />;
    }
  };

  const getBubbleColor = (sender: ChatMessage["sender"], isError?: boolean) => {
    if (isError) return "bg-rose-500/10 border-rose-500/20 text-rose-200";
    switch (sender) {
      case "Orchestrator":
        return "bg-purple-500/10 border-purple-500/20 text-purple-100";
      case "Quant Agent":
        return "bg-emerald-500/10 border-emerald-500/20 text-emerald-100";
      case "Risk Officer":
        return "bg-[#1f1f1f] border-[#2a2a2a] text-[#f5f5f5]";
      default:
        return "bg-[#1a1a1a] border-[#222] text-[#d0d0d0]";
    }
  };

  return (
    <div className="flex flex-col h-[500px] rounded-2xl border border-[#1f1f1f] bg-[#0e0e0e] overflow-hidden shadow-2xl">
      {/* HEADER */}
      <div className="px-5 py-3 border-b border-[#1f1f1f] bg-[#121212] flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-[#f5f5f5]">
            NeuroLoom AI Control Room
          </h3>
          <p className="text-[10px] text-[#8a8a8a] tracking-wider uppercase">
            Live Multi-Agent Consensus
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
        </div>
      </div>

      {/* CHAT AREA */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-[#555] text-xs italic">
            Awaiting market trigger to wake AI agents...
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300"
            >
              <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161616] border border-[#2a2a2a]">
                {getAvatar(msg.sender)}
              </div>
              <div className="flex flex-col gap-1 max-w-[85%]">
                <span className="text-[11px] font-medium text-[#8a8a8a]">
                  {msg.sender}
                </span>
                <div
                  className={`rounded-2xl rounded-tl-sm px-4 py-3 text-[13px] leading-relaxed border ${getBubbleColor(msg.sender, msg.isError)}`}
                >
                  {msg.content}
                </div>
              </div>
            </div>
          ))
        )}

        {/* TYPING INDICATOR */}
        {isTyping && (
          <div className="flex gap-3 items-end animate-in fade-in duration-300">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#161616] border border-[#2a2a2a]">
              <div className="w-1.5 h-1.5 bg-[#8a8a8a] rounded-full animate-bounce"></div>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-medium text-[#8a8a8a]">
                {isTyping} is typing...
              </span>
              <div className="rounded-2xl rounded-tl-sm px-4 py-3 bg-[#1a1a1a] border border-[#222] w-16 flex items-center justify-center gap-1">
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></span>
                <span
                  className="w-1.5 h-1.5 rounded-full bg-[#555] animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
