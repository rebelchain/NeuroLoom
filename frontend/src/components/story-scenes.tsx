"use client";

import s from "@/app/technical.module.css";
import type { CSSProperties } from "react";

function Pipe() {
  return (
    <div className={s.pipe} aria-hidden="true">
      <i />
      <i />
      <i />
    </div>
  );
}

export function StoryScene({ index }: { index: number }) {
  // SCENE 0: ORCHESTRATE (Groq Orchestrator)
  if (index === 0) {
    return (
      <div className={s.capture}>
        <div className={s.agentWindow}>
          <div className={s.windowTop}>
            <span className={s.agentAsterisk} aria-hidden="true">
              ✳
            </span>
            <span>GROQ ORCHESTRATOR</span>
            <span aria-hidden="true">•••</span>
          </div>
          <div className={s.agentPrompt}>
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="#10b981"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-10 h-10 shrink-0"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
              <path d="M12 12 2.1 7.1" />
              <path d="M12 12l9.9 4.9" />
            </svg>
            <div>
              <strong>Model: gpt-oss-20b</strong>
              <code>Multi-Agent Dispatcher</code>
            </div>
          </div>
          <div className={s.signalLines}>
            <p style={{ "--i": 0 } as CSSProperties}>
              <i aria-hidden="true" /> TAAPI.io Sensors (RSI, MACD)
              <span aria-hidden="true">INGESTED</span>
            </p>
            <p style={{ "--i": 1 } as CSSProperties}>
              <i aria-hidden="true" /> Smart Contract Balances (Viem)
              <span aria-hidden="true">SYNCED</span>
            </p>
            <p style={{ "--i": 2 } as CSSProperties}>
              <i aria-hidden="true" /> Previous Cycle Memory
              <span aria-hidden="true">LOADED</span>
            </p>
          </div>
        </div>
        <Pipe />
        <div className={s.hook}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-9 h-9 shrink-0"
            aria-hidden="true"
          >
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <div>
            <strong>Parallel Yield & Liquidity Workers</strong>
            <span
              style={{
                color: "#10b981",
                fontFamily: "var(--font-geist-mono)",
                fontWeight: 600,
              }}
            >
              [ STATUS: DEPLOYED ]
            </span>
          </div>
          <span className={s.check} aria-hidden="true">
            ✓
          </span>
        </div>
        <small className={s.localBadge}>Millisecond LPU Execution</small>
      </div>
    );
  }

  // SCENE 1: STRATEGIZE (Gemini Quant Agent)
  if (index === 1) {
    return (
      <div className={s.allocation}>
        <div className={s.budgetCoin}>
          <span>GEMINI QUANT AGENT</span>
          <strong
            style={{ fontSize: "36px", marginTop: "8px", lineHeight: "1.1" }}
          >
            JSON
            <br />
            <small style={{ marginLeft: 0 }}>SELF-HEALING</small>
          </strong>
          <p>Dynamic Calldata Generation & Schema Validation</p>
        </div>
        <Pipe />
        <div className={s.scoreLedger}>
          <div
            className={s.scoreRow}
            style={{ "--i": 0, "--share": "15%" } as CSSProperties}
          >
            <div>
              <span style={{ color: "#ef4444" }}>
                Draft: &#123; action: calc_lp...
              </span>
              <small>Parsing Error</small>
              <strong style={{ color: "#ef4444" }}>FAILED</strong>
            </div>
            <div className={s.scoreTrack}>
              <i style={{ background: "#ef4444" }} />
            </div>
          </div>
          <div
            className={s.scoreRow}
            style={{ "--i": 1, "--share": "55%" } as CSSProperties}
          >
            <div>
              <span style={{ color: "var(--mint)" }}>
                Self-Healing Triggered
              </span>
              <small>Auto-Correction</small>
              <strong style={{ color: "var(--mint)" }}>FIXING</strong>
            </div>
            <div className={s.scoreTrack}>
              <i style={{ background: "var(--mint)" }} />
            </div>
          </div>
          <div
            className={s.scoreRow}
            style={{ "--i": 2, "--share": "100%" } as CSSProperties}
          >
            <div>
              <span>Schema Validated</span>
              <small>Ready for Review</small>
              <strong>PASS</strong>
            </div>
            <div className={s.scoreTrack}>
              <i style={{ background: "#10b981" }} />
            </div>
          </div>
          <footer>
            <span>Agentic Reasoning Cycle</span>
            <span style={{ color: "#10b981", fontWeight: 600 }}>
              100% RELIABLE ✓
            </span>
          </footer>
        </div>
        <small className={s.sceneFoot}>
          Target route formulated securely without hallucinatory data.
        </small>
      </div>
    );
  }

  // SCENE 2: EVALUATE (Gemini Risk Officer)
  if (index === 2) {
    return (
      <div className={s.screenScene}>
        <div className={s.walletChip}>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-7 h-7 shrink-0"
            aria-hidden="true"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
          </svg>
          <div>
            <span>GEMINI RISK OFFICER</span>
            <code>EVALUATOR LOOP ACTIVE</code>
          </div>
        </div>
        <Pipe />
        <div className={s.scanner}>
          <div className={s.scannerTop}>
            <strong>Security Clearances</strong>
            <span
              style={{
                fontSize: "11px",
                color: "var(--mint)",
                fontFamily: "var(--font-geist-mono)",
                fontWeight: 600,
              }}
            >
              ● LIVE GUARDRAILS
            </span>
          </div>
          <div className={s.scanBeam} aria-hidden="true" />
          <p style={{ "--i": 0 } as CSSProperties}>
            <span>Velocity Guard &lt; 20% TVL</span>
            <span className={s.check} aria-hidden="true">
              PASS
            </span>
          </p>
          <p style={{ "--i": 1 } as CSSProperties}>
            <span>Impermanent Loss Risk</span>
            <span className={s.check} aria-hidden="true">
              SAFE
            </span>
          </p>
          <p style={{ "--i": 2 } as CSSProperties}>
            <span>Iteration Loop (1/3)</span>
            <span
              style={{
                color: "#f59e0b",
                fontWeight: "bold",
                fontSize: "10px",
                marginTop: "4px",
              }}
              aria-hidden="true"
            >
              NEEDS_IMPROVEMENT
            </span>
          </p>
          <p style={{ "--i": 3 } as CSSProperties}>
            <span>Iteration Loop (2/3)</span>
            <span className={s.check} aria-hidden="true">
              PASS
            </span>
          </p>
        </div>
        <div className={s.signatureGate}>
          <i aria-hidden="true">▣</i>
          <span>Evaluator Loop Cleared · Calldata Approved</span>
        </div>
        <small className={s.sceneFoot}>
          3x Auto-Retry Loop ensures deterministic safety boundaries.
        </small>
      </div>
    );
  }

  // SCENE 3: EXECUTE (BSC Testnet Settlement)
  return (
    <div className={s.receiptScene}>
      <div className={s.eventSource}>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--mint)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5 shrink-0"
          aria-hidden="true"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
        <span>BSC TESTNET SETTLEMENT</span>
        <i aria-hidden="true" />
      </div>
      <Pipe />
      <div className={s.finalReceipt}>
        <header>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="var(--mint)"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-9 h-9 shrink-0"
            aria-hidden="true"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
          </svg>
          <div>
            <span>ON-CHAIN BROADCAST</span>
            <h4>Transaction Confirmed</h4>
          </div>
        </header>
        <div className={s.receiptTable}>
          <div>
            <small>METRIC</small>
            <small>STATUS</small>
            <small>VALUE</small>
          </div>
          <div style={{ "--i": 0 } as CSSProperties}>
            <strong>Execution</strong>
            <span>Confirmed</span>
            <small>Smart Contract Call</small>
          </div>
          <div style={{ "--i": 1 } as CSSProperties}>
            <strong>TxHash</strong>
            <span>BSC Scan</span>
            <small>0x8f4...a12b</small>
          </div>
          <div style={{ "--i": 2 } as CSSProperties}>
            <strong>LP Ticks</strong>
            <span style={{ color: "#10b981", fontWeight: "bold" }}>
              Recorded
            </span>
            <small>Concentrated Range</small>
          </div>
          <div style={{ "--i": 3 } as CSSProperties}>
            <strong>Database</strong>
            <span style={{ color: "var(--mint)", fontWeight: "bold" }}>
              Saved
            </span>
            <small>Memory Synced</small>
          </div>
        </div>
        <div
          style={{
            marginTop: "16px",
            padding: "10px 14px",
            background: "var(--mint)",
            color: "#ffffff",
            borderRadius: "8px",
            fontFamily: "var(--font-geist-mono)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "8px",
            boxShadow: "0 0 20px rgba(139, 92, 246, 0.4)",
          }}
        >
          <span></span> CYCLE COMPLETE. MEMORY SEEDED.
        </div>
        <p>
          Historical baseline recorded for the next 5-minute autonomous cycle.
        </p>
      </div>
    </div>
  );
}
