"use client";

import { TerminalSquare } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function AgentOrchestratorLog() {
  const [visibleLogs, setVisibleLogs] = useState<string[]>([]);
  const [wibTime, setWibTime] = useState<string>("");
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live WIB Clock
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const formattedTime = now.toLocaleTimeString("id-ID", {
        timeZone: "Asia/Jakarta",
        hour12: false,
      });
      setWibTime(`${formattedTime} WIB`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch AI Orchestrator Logs
  useEffect(() => {
    let isMounted = true;
    const fetchLogs = async () => {
      try {
        const response = await fetch("http://localhost:9000/api/ai-logs", {
          cache: "no-store",
        });

        // 1. Tangani HTTP Error (404, 500, dll) TANPA melempar exception keras
        if (!response.ok) {
          console.warn(
            `[Log Fetch] Server mengembalikan status ${response.status}. Menunggu pemulihan server...`,
          );
          return; // Hentikan eksekusi fungsi ini dengan aman (akan dicoba lagi oleh interval)
        }

        // 2. Tangani format respons yang salah (bukan JSON)
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          console.warn(
            `[Log Fetch] Menerima format non-JSON. Menunggu pemulihan server...`,
          );
          return; // Sama, hentikan eksekusi dengan aman
        }

        // 3. Jika aman, lakukan parsing JSON
        const data = await response.json();

        // 4. Update state jika komponen masih mount dan data valid
        if (isMounted && data && Array.isArray(data.logs)) {
          setVisibleLogs(data.logs);
        }
      } catch (error) {
        // Tangani masalah jaringan (Network Error, server mati total)
        console.error(
          "[Log Fetch] Gagal mengambil log AI. Pastikan server berjalan pada port 4000.",
          error,
        );
      }
    };

    void fetchLogs();
    const interval = setInterval(fetchLogs, 1000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // Auto-scroll on new log
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visibleLogs.length]);

  const clearLogs = async () => {
    try {
      const response = await fetch("http://localhost:9000/api/ai-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "clear" }),
      });

      // Pastikan respons valid sebelum mengosongkan state UI
      if (response.ok) {
        setVisibleLogs([]);
      } else {
        console.warn(
          "[Log Clear] Gagal mereset log di server. Status:",
          response.status,
        );
      }
    } catch (e) {
      console.error("[Log Clear] Gagal reset logs (Network Error):", e);
    }
  };

  return (
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#121212] overflow-hidden flex flex-col">
      {/* TERMINAL HEADER */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#1f1f1f] bg-[#161616]">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-[#262626] flex items-center justify-center">
            <TerminalSquare className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-[13px] font-mono font-bold text-[#f5f5f5] uppercase tracking-widest">
              Agent Orchestrator Log
            </h3>
            <span className="text-[10px] font-mono text-[#8a8a8a] tracking-wider">
              Autonomous Dual-LLM Pipeline (Groq + Gemini)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden sm:inline-block text-[10px] text-[#a0a0a0] font-mono tracking-widest uppercase border border-[#262626] bg-[#1a1a1a] rounded-md px-3 py-1.5">
            {wibTime || "SYNCING CLOCK..."}
          </span>
          <button
            onClick={clearLogs}
            className="text-[10px] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-[#222222] border border-transparent hover:border-[#333] rounded-md px-2.5 py-1.5 uppercase font-mono tracking-widest transition-colors cursor-pointer"
          >
            [ Reset ]
          </button>
          <span className="flex items-center gap-2 text-[10px] text-primary font-mono tracking-widest uppercase border border-primary/25 bg-primary/10 rounded-full px-3 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
            Active
          </span>
        </div>
      </header>

      {/* TERMINAL CONSOLE LOG BODY */}
      <div
        ref={scrollRef}
        className="h-[460px] md:h-[500px] p-6 font-mono text-[12px] bg-[#0c0c0c] text-[#c5c5c5] overflow-y-auto leading-relaxed scroll-smooth text-left border-t border-[#161616]"
      >
        {visibleLogs.length === 0 ? (
          <div className="text-[#666] italic flex items-center gap-2">
            <span>&gt;</span> _Awaiting trigger events from Market Oracle...
          </div>
        ) : (
          visibleLogs.map((log, index) => {
            if (!log) return null;
            return (
              <div
                key={index}
                className="mb-2 flex items-start gap-2.5 hover:bg-white/[0.02] -mx-2 px-2 py-0.5 rounded transition-colors"
              >
                <span className="text-[#555] select-none mt-0.5">&gt;</span>
                <span
                  className={
                    log.includes("WARNING") || log.includes("REJECTING")
                      ? "text-[#ff5f5f] font-semibold"
                      : log.includes("SUCCESS") ||
                          log.includes("EXECUTION") ||
                          log.includes("PASS")
                        ? "text-primary font-semibold"
                        : log.includes("NETWORK") || log.includes("ROUTING")
                          ? "text-[#f5f5f5]"
                          : "text-[#b5b5b5]"
                  }
                >
                  {log}
                </span>
              </div>
            );
          })
        )}
        <div className="mt-3 flex items-center gap-2.5 pl-1">
          <span className="text-[#555]">&gt;</span>
          <span className="w-2.5 h-3.5 bg-primary animate-pulse inline-block"></span>
        </div>
      </div>
    </div>
  );
}
