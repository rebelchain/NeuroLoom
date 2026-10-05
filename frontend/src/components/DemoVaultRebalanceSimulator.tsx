"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

/* ─────────────────────────────────────────────────────────────
   1. SYNTHETIC DATA LAYER & RIGOROUS MATH LOGIC
   ───────────────────────────────────────────────────────────── */

const DUR = 1500; // 25 minutes in seconds

interface Point {
  t: number;
  bnbPrice: number;
}

interface SimEvent {
  key: string;
  t: number;
  kind:
    | "equilibrium"
    | "decline"
    | "alert"
    | "rebalance"
    | "recovery"
    | "complete";
  label: string;
}

export interface SimulationResult {
  status: string;
  timestamp?: string;
  market?: {
    price_detected: number;
  };
  ai_reasoning?: string;
  evaluator_status?: string;
  execution?: {
    tool_used: string;
    amount_swapped: string;
    transaction_hash: string;
    explorer_url: string;
  };
  message?: string; // Jika terjadi error dari API
}

const EVENTS: SimEvent[] = [
  {
    key: "e0",
    t: 0,
    kind: "equilibrium",
    label: "Equilibrium: 40/30/30 target set",
  },
  { key: "e1", t: 300, kind: "decline", label: "BNB starts declining rapidly" },
  {
    key: "e2",
    t: 510,
    kind: "alert",
    label: "Drift > 5% — Agent Alert (Block #38291410)",
  },
  {
    key: "e3",
    t: 630,
    kind: "rebalance",
    label: "Groq LPU Processing & Tx Generation",
  },
  {
    key: "e4",
    t: 660,
    kind: "rebalance",
    label: "On-Chain Rebalance: Buy WBNB Dip",
  },
  {
    key: "e5",
    t: 720,
    kind: "complete",
    label: "Rebalance settled: 40/30/30 restored",
  },
  { key: "e6", t: 900, kind: "recovery", label: "BNB starts partial recovery" },
];

/** Generate synthetic BNB/USDT price curve: $620 → crash to ~$510 → recover to ~$545 */
function generatePriceData(): Point[] {
  const pts: Point[] = [];
  for (let t = 0; t <= DUR; t += 15) {
    let price: number;
    if (t <= 240) {
      price = 620 + Math.sin(t * 0.02) * 2;
    } else if (t <= 540) {
      const progress = (t - 240) / 300;
      const eased = progress * progress;
      price = 620 - eased * 110 + Math.sin(t * 0.05) * 3;
    } else if (t <= 720) {
      const wobble = Math.sin(t * 0.04) * 4;
      price = 510 + wobble;
    } else {
      const progress = Math.min((t - 720) / 780, 1);
      const eased = 1 - (1 - progress) * (1 - progress);
      price = 510 + eased * 35 + Math.sin(t * 0.03) * 2;
    }
    pts.push({ t, bnbPrice: Math.round(price * 100) / 100 });
  }
  return pts;
}

const PRICE_DATA = generatePriceData();

function priceAt(t: number): number {
  if (t <= 0) return PRICE_DATA[0]!.bnbPrice;
  for (let i = 1; i < PRICE_DATA.length; i++) {
    const a = PRICE_DATA[i - 1]!;
    const b = PRICE_DATA[i]!;
    if (t <= b.t) {
      const frac = (t - a.t) / (b.t - a.t);
      return a.bnbPrice + frac * (b.bnbPrice - a.bnbPrice);
    }
  }
  return PRICE_DATA[PRICE_DATA.length - 1]!.bnbPrice;
}

// Linear interpolation helper
function lerp(start: number, end: number, t: number) {
  return start * (1 - t) + end * t;
}

interface PortfolioState {
  portfolioValue: number;
  vusdtAmt: number;
  vusdtPct: number;
  wbnbAmt: number;
  wbnbPct: number;
  bcspxAmt: number;
  bcspxPct: number;
  drift: number;
}

function portfolioAt(t: number, withAI: boolean): PortfolioState {
  const currentPrice = priceAt(t);
  const initialPrice = 620;

  // Track units of WBNB instead of just fiat value
  const wbnbInitialUnits = 3000 / initialPrice; // ~4.8387 WBNB

  // 1. Calculate MANUAL values (Without AI)
  const vusdtBase = 4000 + (t / DUR) * 50; // Base stablecoin + small yield
  const wbnbBaseValue = wbnbInitialUnits * currentPrice;
  const bcspxBase = 3000;

  if (!withAI) {
    const total = vusdtBase + wbnbBaseValue + bcspxBase;
    const vusdtPct = (vusdtBase / total) * 100;
    const wbnbPct = (wbnbBaseValue / total) * 100;
    const bcspxPct = (bcspxBase / total) * 100;
    const drift =
      Math.abs(vusdtPct - 40) +
      Math.abs(wbnbPct - 30) +
      Math.abs(bcspxPct - 30);

    return {
      portfolioValue: total,
      vusdtAmt: vusdtBase,
      vusdtPct,
      wbnbAmt: wbnbBaseValue,
      wbnbPct,
      bcspxAmt: bcspxBase,
      bcspxPct,
      drift: drift / 2,
    };
  }

  // 2. Calculate AI REBALANCE Logic
  const REBALANCE_START = 630;
  const REBALANCE_END = 720;
  const REBALANCE_MID = 660; // Execution tick

  // State exactly at execution point
  const priceAtRebalance = priceAt(REBALANCE_MID);
  const vusdtAtRebalance = 4000 + (REBALANCE_MID / DUR) * 50;
  const wbnbValueAtRebalance = wbnbInitialUnits * priceAtRebalance;
  const bcspxAtRebalance = 3000;
  const totalAtRebalance =
    vusdtAtRebalance + wbnbValueAtRebalance + bcspxAtRebalance;

  // AI calculates strict 40/30/30 targets from the depleted total
  const targetVusdt = totalAtRebalance * 0.4;
  const targetWbnbValue = totalAtRebalance * 0.3;
  const targetBcspx = totalAtRebalance * 0.3;

  // The magic: AI accumulates more WBNB units at the discounted price!
  const wbnbNewUnits = targetWbnbValue / priceAtRebalance; // e.g. goes from 4.83 to 5.58

  if (t < REBALANCE_START) {
    // Before AI acts
    const total = vusdtBase + wbnbBaseValue + bcspxBase;
    const vusdtPct = (vusdtBase / total) * 100;
    const wbnbPct = (wbnbBaseValue / total) * 100;
    const bcspxPct = (bcspxBase / total) * 100;
    const drift =
      Math.abs(vusdtPct - 40) +
      Math.abs(wbnbPct - 30) +
      Math.abs(bcspxPct - 30);

    return {
      portfolioValue: total,
      vusdtAmt: vusdtBase,
      vusdtPct,
      wbnbAmt: wbnbBaseValue,
      wbnbPct,
      bcspxAmt: bcspxBase,
      bcspxPct,
      drift: drift / 2,
    };
  }

  if (t <= REBALANCE_END) {
    // Transition period (Smooth visual interpolation for the UI)
    const progress = (t - REBALANCE_START) / (REBALANCE_END - REBALANCE_START);
    const eased = progress * progress * (3 - 2 * progress); // smoothstep

    const currentVusdt = lerp(
      vusdtBase,
      targetVusdt + ((t - REBALANCE_MID) / DUR) * 50,
      eased,
    );
    const currentWbnbUnits = lerp(wbnbInitialUnits, wbnbNewUnits, eased);
    const currentBcspx = lerp(bcspxBase, targetBcspx, eased);

    const wbnbValue = currentWbnbUnits * currentPrice;
    const total = currentVusdt + wbnbValue + currentBcspx;

    const vusdtPct = (currentVusdt / total) * 100;
    const wbnbPct = (wbnbValue / total) * 100;
    const bcspxPct = (currentBcspx / total) * 100;
    const drift =
      Math.abs(vusdtPct - 40) +
      Math.abs(wbnbPct - 30) +
      Math.abs(bcspxPct - 30);

    return {
      portfolioValue: total,
      vusdtAmt: currentVusdt,
      vusdtPct,
      wbnbAmt: wbnbValue,
      wbnbPct,
      bcspxAmt: currentBcspx,
      bcspxPct,
      drift: drift / 2,
    };
  }

  // 3. After Rebalance is fully complete
  const finalVusdt = targetVusdt + ((t - REBALANCE_MID) / DUR) * 50;
  const finalWbnbValue = wbnbNewUnits * currentPrice;
  const finalBcspx = targetBcspx;

  const total = finalVusdt + finalWbnbValue + finalBcspx;
  const drift =
    Math.abs((finalVusdt / total) * 100 - 40) +
    Math.abs((finalWbnbValue / total) * 100 - 30) +
    Math.abs((finalBcspx / total) * 100 - 30);

  return {
    portfolioValue: total,
    vusdtAmt: finalVusdt,
    vusdtPct: (finalVusdt / total) * 100,
    wbnbAmt: finalWbnbValue,
    wbnbPct: (finalWbnbValue / total) * 100,
    bcspxAmt: finalBcspx,
    bcspxPct: (finalBcspx / total) * 100,
    drift: drift / 2,
  };
}

const fmtUsd = (v: number) =>
  `$${v.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

/* ─────────────────────────────────────────────────────────────
   2. SVG PRICE CHART (from PriceChart.tsx)
   ───────────────────────────────────────────────────────────── */

const CW = 520;
const CH = 200;
const CM = { top: 10, right: 14, bottom: 24, left: 48 };
const Y_MIN = 500;
const Y_MAX = 630;

const cx = (t: number) => CM.left + (t / DUR) * (CW - CM.left - CM.right);
const cy = (price: number) =>
  CM.top + ((Y_MAX - price) / (Y_MAX - Y_MIN)) * (CH - CM.top - CM.bottom);

function stepPath(until: number): string {
  let d = "";
  let last: number | null = null;
  for (const p of PRICE_DATA) {
    if (p.t > until) break;
    const px = cx(p.t);
    const py = cy(p.bnbPrice);
    if (!d) {
      d = `M${px.toFixed(1)},${py.toFixed(1)}`;
    } else {
      d += `L${px.toFixed(1)},${cy(last!).toFixed(1)}L${px.toFixed(1)},${py.toFixed(1)}`;
    }
    last = p.bnbPrice;
  }
  if (last !== null) d += `L${cx(until).toFixed(1)},${cy(last).toFixed(1)}`;
  return d;
}

function BnbPriceChart({ t, withAI }: { t: number; withAI: boolean }) {
  const ref = useRef<SVGSVGElement>(null);
  const [hover, setHover] = useState<number | null>(null);

  const yTicks = [510, 530, 550, 570, 590, 610];
  const xTicks = useMemo(
    () => Array.from({ length: 6 }, (_, i) => i * 300),
    [],
  );
  const currentPrice = priceAt(Math.min(t, DUR));
  const rebalanceEvents = withAI
    ? EVENTS.filter((e) => e.kind === "rebalance" && e.t <= t)
    : [];

  const driftThreshold = 570;

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const box = ref.current!.getBoundingClientRect();
    const px = ((e.clientX - box.left) / box.width) * CW;
    const tt = ((px - CM.left) / (CW - CM.left - CM.right)) * DUR;
    setHover(tt >= 0 && tt <= Math.min(t, DUR) ? tt : null);
  }

  return (
    <div className="relative">
      <svg
        ref={ref}
        viewBox={`0 0 ${CW} ${CH}`}
        className="w-full h-auto"
        role="img"
        aria-label="BNB/USDT price chart"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
        style={{ cursor: "crosshair" }}
      >
        {yTicks.map((v) => (
          <g key={v}>
            <line
              x1={CM.left}
              x2={CW - CM.right}
              y1={cy(v)}
              y2={cy(v)}
              stroke="#1f1f1f"
              strokeWidth={1}
            />
            <text
              x={CM.left - 6}
              y={cy(v) + 3.5}
              textAnchor="end"
              fill="#555"
              fontSize={9}
              fontFamily="var(--font-mono)"
            >
              ${v}
            </text>
          </g>
        ))}
        {xTicks.map((s) => (
          <text
            key={s}
            x={cx(s)}
            y={CH - 6}
            textAnchor="middle"
            fill="#555"
            fontSize={9}
            fontFamily="var(--font-mono)"
          >
            {s / 60} min
          </text>
        ))}
        <line
          x1={CM.left}
          x2={CW - CM.right}
          y1={cy(driftThreshold)}
          y2={cy(driftThreshold)}
          stroke="#ff5f5f"
          strokeWidth={1.2}
          strokeDasharray="5 4"
          opacity={0.6}
        />
        <text
          x={CW - CM.right}
          y={cy(driftThreshold) - 5}
          textAnchor="end"
          fill="#ff9a9a"
          fontSize={8}
          fontFamily="var(--font-mono)"
        >
          drift threshold ~$570
        </text>
        <path
          d={stepPath(Math.min(t, DUR))}
          fill="none"
          stroke="#4a84e6"
          strokeWidth={2}
          strokeLinejoin="round"
        />
        {rebalanceEvents.map((ev) => (
          <rect
            key={ev.key}
            x={cx(ev.t) - 4}
            y={cy(priceAt(ev.t)) - 4}
            width={8}
            height={8}
            transform={`rotate(45 ${cx(ev.t)} ${cy(priceAt(ev.t))})`}
            fill="#10b981"
            stroke="#0e0e0e"
            strokeWidth={2}
          />
        ))}
        {t < DUR && (
          <line
            x1={cx(t)}
            x2={cx(t)}
            y1={CM.top}
            y2={CH - CM.bottom}
            stroke="#8a8a8a"
            strokeWidth={1}
            opacity={0.4}
          />
        )}
        <circle
          cx={cx(Math.min(t, DUR))}
          cy={cy(currentPrice)}
          r={4.5}
          fill="#4a84e6"
          stroke="#0e0e0e"
          strokeWidth={2}
        />
        {hover !== null && (
          <line
            x1={cx(hover)}
            x2={cx(hover)}
            y1={CM.top}
            y2={CH - CM.bottom}
            stroke="#666"
            strokeWidth={1}
          />
        )}
      </svg>
      {hover !== null && (
        <div
          className="absolute top-2 px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] text-[11px] font-mono pointer-events-none z-10 shadow-lg"
          style={{ left: `${Math.min(75, (cx(hover) / CW) * 100)}%` }}
        >
          <div className="text-[#8a8a8a] mb-1">
            +{(hover / 60).toFixed(1)} min
          </div>
          <div className="flex items-center gap-2 text-[#f5f5f5]">
            <span className="w-2 h-0.5 bg-[#4a84e6] inline-block rounded" />
            BNB:{" "}
            <span className="font-semibold">${priceAt(hover).toFixed(2)}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   3. COUNTER & SIDE PANEL
   ───────────────────────────────────────────────────────────── */

function Counter({
  value,
  label,
  isAiWin,
}: {
  value: number;
  label: string;
  isAiWin?: boolean;
}) {
  const [shown, setShown] = useState(value);
  const prevRef = useRef(value);

  useEffect(() => {
    const prev = prevRef.current;
    prevRef.current = value;
    if (Math.abs(value - prev) < 1) {
      setShown(value);
      return;
    }
    let frame = 0;
    const start = performance.now();
    const dur = 350;
    const tick = (now: number) => {
      const progress = Math.min((now - start) / dur, 1);
      const eased = progress * (2 - progress);
      setShown(prev + (value - prev) * eased);
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return (
    <div className="text-right">
      <div
        className={`text-2xl sm:text-3xl font-mono font-bold tracking-tight ${isAiWin ? "text-[#10b981]" : "text-[#ff5f5f]"}`}
      >
        {fmtUsd(Math.round(shown))}
      </div>
      <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-wider mt-0.5">
        {label}
      </div>
    </div>
  );
}

function Side({
  withAI,
  t,
  manualTotal,
  txResult,
}: {
  withAI: boolean;
  t: number;
  manualTotal: number;
  txResult?: SimulationResult | null;
}) {
  const state = portfolioAt(t, withAI);
  const isAiWin = withAI && state.portfolioValue > manualTotal + 10;

  let aiActionLabel = "Awaiting Market Trigger...";
  if (t > 630) {
    if (txResult?.execution?.tool_used === "close_liquidity_v3") {
      aiActionLabel = "Agent Executed Emergency LP Close 🚨";
    } else if (txResult?.execution?.tool_used === "execute_pancake_swap") {
      aiActionLabel = "Agent tactically buys the dip 📈";
    } else if (txResult) {
      aiActionLabel = `Agent Executed ${txResult.execution?.tool_used}`;
    } else {
      aiActionLabel = "AI Agents are debating strategy...";
    }
  }

  return (
    <section className="rounded-2xl bg-[#121212] border border-[#1f1f1f] p-5 sm:p-6 flex flex-col gap-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-mono tracking-widest uppercase text-[#8a8a8a]">
            {withAI ? "With NeuroLoom AI" : "Without autonomous rebalancing"}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                withAI
                  ? t > 630 && !txResult
                    ? "animate-ping bg-emerald-400"
                    : "bg-[#8b5cf6]"
                  : "bg-[#8a8a8a]"
              }`}
            />
            <span className="text-sm sm:text-base font-medium text-[#f5f5f5]">
              {/* GUNAKAN LABEL DINAMIS DI SINI */}
              {withAI ? aiActionLabel : "Manual portfolio, no action"}
            </span>
          </div>
        </div>
        <Counter
          value={state.portfolioValue}
          label="portfolio value now"
          isAiWin={isAiWin}
        />
      </div>

      <BnbPriceChart t={t} withAI={withAI} />

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-[#8a8a8a]">Portfolio Drift</span>
          <span
            className={
              state.drift > 5
                ? "text-[#ff5f5f] font-semibold"
                : state.drift > 2
                  ? "text-[#ffd75f]"
                  : "text-[#10b981]"
            }
          >
            {state.drift.toFixed(1)}%{state.drift > 5 ? " — BREACH" : ""}
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-[#1a1a1a] border border-[#222] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.min(state.drift * 10, 100)}%`,
              background:
                state.drift > 5
                  ? "#ff5f5f"
                  : state.drift > 2
                    ? "#ffd75f"
                    : "#10b981",
            }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-[11px] font-mono mb-1.5">
          <span className="text-[#8a8a8a]">3 asset positions tracked</span>
          <span
            className={
              state.drift > 5
                ? "text-[#ff5f5f] font-semibold"
                : "text-[#8a8a8a]"
            }
          >
            {state.drift > 5 ? `${Math.round(state.drift)}% drift` : "Nominal"}
          </span>
        </div>
        <div className="h-3 w-full rounded-full bg-[#1a1a1a] border border-[#222] overflow-hidden flex">
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${state.vusdtPct}%`, background: "#4a84e6" }}
            title={`vUSDT ${state.vusdtPct.toFixed(0)}%`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${state.wbnbPct}%`, background: "#ffd75f" }}
            title={`WBNB ${state.wbnbPct.toFixed(0)}%`}
          />
          <div
            className="h-full transition-all duration-300"
            style={{ width: `${state.bcspxPct}%`, background: "#8b5cf6" }}
            title={`bCSPX ${state.bcspxPct.toFixed(0)}%`}
          />
        </div>
        <div className="flex items-center gap-4 mt-2 text-[10px] font-mono text-[#8a8a8a]">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#4a84e6]" />
            vUSDT {state.vusdtPct.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#ffd75f]" />
            WBNB {state.wbnbPct.toFixed(0)}%
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-sm bg-[#8b5cf6]" />
            bCSPX {state.bcspxPct.toFixed(0)}%
          </span>
        </div>
      </div>
    </section>
  );
}

const tickColor = (kind: SimEvent["kind"]) => {
  switch (kind) {
    case "equilibrium":
      return "#8b5cf6";
    case "decline":
      return "#ffd75f";
    case "alert":
      return "#ff5f5f";
    case "rebalance":
      return "#10b981";
    case "recovery":
      return "#ffd75f";
    case "complete":
      return "#10b981";
  }
};

/* ─────────────────────────────────────────────────────────────
   4. MAIN EXPORT
   ───────────────────────────────────────────────────────────── */

const SPEEDS = [30, 60, 120] as const;

export function DemoVaultRebalanceSimulator() {
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(60);

  const [isAiExecuting, setIsAiExecuting] = useState(false);
  const [txResult, setTxResult] = useState<SimulationResult | null>(null);
  const [hasTriggeredApi, setHasTriggeredApi] = useState(false);
  const apiLockRef = useRef(false);

  const togglePlay = useCallback(() => {
    if (t >= DUR) setT(0);
    setPlaying((p) => !p);
  }, [t]);

  const triggerLiveSimulation = async () => {
    setIsAiExecuting(true);
    setTxResult(null);

    try {
      console.log("Memicu Live Simulation API...");
      const response = await fetch(
        "http://localhost:9000/api/run-demo-simulation",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ trigger: "UI_SIMULATOR" }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `Server merespons dengan status ${response.status}: ${errorText.substring(0, 100)}...`,
        );
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        throw new Error(
          `Menerima format non-JSON. Server merespons: ${text.substring(0, 100)}...`,
        );
      }

      const data = await response.json();

      if (data.status === "success") {
        setTxResult(data);

        // ⏱️ SYNCHRONIZATION MAGIC (BULLET-TIME EFFECT) ⏱️
        // 1. Beri jeda 2 detik agar komponen AiTeamChat selesai memunculkan log "Transaction Confirmed"
        setTimeout(() => {
          // 2. Turunkan kecepatan animasi menjadi 15x (Slow Motion) agar visual rebalance terlihat jelas!
          setSpeed(15);
          // 3. Lanjutkan animasi garis
          setPlaying(true);
        }, 2000);
      } else {
        console.error("Simulation Error:", data);
        alert(`AI Execution Failed: ${data.message}`);
      }
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        console.warn("Backend mati. Mode simulasi dibatalkan.");
        setPlaying(false);
      } else {
        console.error("Gagal menghubungi backend:", error);
      }
    } finally {
      setIsAiExecuting(false);
    }
  };

  const restart = useCallback(() => {
    setT(0);
    setPlaying(true);
    setSpeed(60);
    apiLockRef.current = false;
    setHasTriggeredApi(false);
    setTxResult(null);
  }, []);

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;

      setT((prev) => {
        const next = prev + dt * speed;

        // --- LOGIKA TRIGGER API BARU ---
        if (next >= 630 && !apiLockRef.current && !isAiExecuting) {
          apiLockRef.current = true;
          setHasTriggeredApi(true);
          setPlaying(false);
          triggerLiveSimulation();
        }

        // ⏱️ SYNCHRONIZATION MAGIC BARU (DI DALAM LOOP ANIMASI) ⏱️
        // Jika animasi sudah melewati fase rebalance (t > 720)
        // dan kecepatan masih dalam status Slow-Motion (15x),
        // kembalikan kecepatannya ke normal secara sinkron tanpa useEffect eksternal.
        if (next > 720 && speed === 15) {
          // Menggunakan setTimeout 0 untuk mengantri perubahan state (Menghindari "update during render" warning)
          setTimeout(() => setSpeed(60), 0);
        }
        // -------------------------------------------------------------

        if (next >= DUR) {
          setPlaying(false);
          return DUR;
        }
        return next;
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, speed, hasTriggeredApi, isAiExecuting]);

  // Calculate manual portfolio value to pass down for comparison
  const manualTotal = portfolioAt(t, false).portfolioValue;

  return (
    <div className="w-full mt-12 flex flex-col gap-4">
      <div className="rounded-2xl bg-[#121212] border border-[#1f1f1f] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="relative flex h-3 w-3 mt-1 shrink-0">
            <span className="absolute inline-flex h-full w-full rounded-full bg-primary opacity-75 animate-ping" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
          </span>
          <div>
            <div className="text-sm font-medium text-[#f5f5f5]">
              Agentic Backtest: -18% Flash Crash Simulation
            </div>
            <div className="text-xs text-[#8a8a8a] mt-0.5 font-light">
              deterministic demonstration of how the NeuroLoom Agent handles
              high volatility with built-in latency allowances.
            </div>
          </div>
        </div>
        <span className="text-[9px] font-mono uppercase tracking-widest px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary font-bold whitespace-nowrap self-start sm:self-center">
          Rebalance Engine
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Side withAI={false} t={t} manualTotal={manualTotal} />
        <Side
          withAI={true}
          t={t}
          manualTotal={manualTotal}
          txResult={txResult}
        />
      </div>

      <section className="rounded-2xl bg-[#121212] border border-[#1f1f1f] px-5 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="px-4 py-1.5 rounded-full bg-primary text-white text-xs font-mono font-medium hover:bg-primary/90 transition-colors cursor-pointer"
            >
              {playing ? "❚❚ Pause" : t >= DUR ? "↻ Replay" : "▶ Play"}
            </button>
            <button
              onClick={restart}
              className="px-4 py-1.5 rounded-full bg-[#1a1a1a] border border-[#2a2a2a] text-[#f5f5f5] text-xs font-mono hover:border-[#444] transition-colors cursor-pointer"
            >
              Restart
            </button>
            <div className="flex items-center rounded-full border border-[#2a2a2a] overflow-hidden ml-1">
              {SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSpeed(s)}
                  className={`px-3 py-1.5 text-xs font-mono transition-colors cursor-pointer ${s === speed ? "bg-[#f5f5f5] text-[#0a0a0a] font-bold" : "bg-transparent text-[#8a8a8a] hover:text-[#f5f5f5]"}`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs font-mono text-[#8a8a8a]">
            +{(t / 60).toFixed(1)} min
          </span>
        </div>

        <div className="relative">
          <div className="absolute inset-x-0 top-0 bottom-0 pointer-events-none z-10">
            {EVENTS.map((ev) => (
              <span
                key={ev.key}
                className="absolute top-1 w-1 h-3 rounded-full"
                style={{
                  left: `${(100 * ev.t) / DUR}%`,
                  background: tickColor(ev.kind),
                  opacity: ev.t <= t ? 1 : 0.3,
                }}
              />
            ))}
          </div>
          <input
            type="range"
            min={0}
            max={DUR}
            step={1}
            value={Math.round(t)}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value));
            }}
            className="w-full h-5 appearance-none bg-transparent cursor-pointer relative z-20 [&::-webkit-slider-runnable-track]:h-1.5 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-[#1a1a1a] [&::-webkit-slider-runnable-track]:border [&::-webkit-slider-runnable-track]:border-[#222] [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-[#0e0e0e] [&::-webkit-slider-thumb]:-mt-[5px] [&::-webkit-slider-thumb]:shadow-[0_0_8px_rgba(139,92,246,0.4)]"
          />
        </div>
      </section>

      {/* --- PANEL LIVE EXECUTION STATUS --- */}
      {(isAiExecuting || txResult) && (
        <div className="mt-4 p-5 rounded-2xl border border-primary/30 bg-primary/5 shadow-[0_0_20px_rgba(139,92,246,0.1)] flex flex-col gap-3 animate-fade-in-up">
          <div className="flex items-center gap-3">
            {isAiExecuting ? (
              <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
            ) : (
              <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
            )}
            <h3 className="text-sm font-mono font-bold uppercase tracking-widest text-[#f5f5f5]">
              {isAiExecuting
                ? "Live AI Execution in Progress..."
                : "On-Chain Rebalance Executed"}
            </h3>
          </div>

          {isAiExecuting && (
            <p className="text-xs text-[#8a8a8a] font-mono ml-5">
              &gt; Waking up AI Agent...
              <br />
              &gt; Evaluating Kelly Criterion limits...
              <br />
              &gt; Broadcasting tx to BSC Testnet...
            </p>
          )}

          {txResult && (
            <div className="ml-5 mt-2 flex flex-col gap-2 text-xs font-mono">
              <div className="text-[#10b981]">
                &gt; Evaluator Status: {txResult.evaluator_status}
              </div>
              <div className="text-[#8a8a8a]">
                &gt; Action: {txResult.execution?.tool_used} (
                {txResult.execution?.amount_swapped} USDT)
              </div>
              <a
                href={txResult.execution?.explorer_url}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline border border-primary/20 bg-primary/10 px-3 py-1.5 rounded-md w-fit mt-1 flex items-center gap-2"
              >
                View on BSCScan ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
