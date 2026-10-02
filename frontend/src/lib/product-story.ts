export interface StoryChapter {
  id: string;
  name: string;
  scope: string;
  title: string;
  body: string;
  proof: string;
  detail: string;
  navLabel?: string;
  tagline?: string;
  heading?: string;
  paragraph?: string;
}

const chapters: StoryChapter[] = [
  {
    id: "orchestrate",
    name: "Orchestrate",
    navLabel: "01 Orchestrate",
    tagline: "STEP 01 / 04 | SENSORS & ORCHESTRATION",
    heading: "Multi-Agent synchronization.",
    paragraph:
      "The cycle begins. Groq Orchestrator ingests TAAPI market indicators (RSI, MACD) and Viem contract balances, then deploys parallel Yield and Liquidity workers to analyze depths and IL risks.",
    scope: "STEP 01 / 04 | SENSORS & ORCHESTRATION",
    title: "Multi-Agent synchronization.",
    body: "The cycle begins. Groq Orchestrator ingests TAAPI market indicators (RSI, MACD) and Viem contract balances, then deploys parallel Yield and Liquidity workers to analyze depths and IL risks.",
    proof: "Groq LPU-powered parallel worker dispatch",
    detail:
      "Data ingestion completes in milliseconds, providing the foundational state for the Quant Agent.",
  },
  {
    id: "strategize",
    name: "Strategize",
    navLabel: "02 Strategize",
    tagline: "STEP 02 / 04 | QUANT AGENT & SELF-HEALING",
    heading: "Precision drafting. JSON Self-Healing.",
    paragraph:
      "Gemini Quant Agent synthesizes worker reports into actionable calldata. Powered by a JSON Self-Healing mechanism, any formatting hallucination is aggressively caught and auto-corrected before submission.",
    scope: "STEP 02 / 04 | QUANT AGENT & SELF-HEALING",
    title: "Precision drafting. JSON Self-Healing.",
    body: "Gemini Quant Agent synthesizes worker reports into actionable calldata. Powered by a JSON Self-Healing mechanism, any formatting hallucination is aggressively caught and auto-corrected before submission.",
    proof: "Gemini reasoning with forced JSON schema validation",
    detail:
      "The Quant Agent structures the mathematical parameters for pre-trade evaluation.",
  },
  {
    id: "evaluate",
    name: "Evaluate",
    navLabel: "03 Evaluate",
    tagline: "STEP 03 / 04 | RISK OFFICER CLEARANCE",
    heading: "3x Auto-Retry Evaluator Loop.",
    paragraph:
      "The Gemini Risk Officer evaluates the draft. If it breaches the 20% Velocity Guard or slippage limits, it returns NEEDS_IMPROVEMENT with mathematical reasons, triggering up to 3 auto-retry iterations until PASS.",
    scope: "STEP 03 / 04 | RISK OFFICER CLEARANCE",
    title: "3x Auto-Retry Evaluator Loop.",
    body: "The Gemini Risk Officer evaluates the draft. If it breaches the 20% Velocity Guard or slippage limits, it returns NEEDS_IMPROVEMENT with mathematical reasons, triggering up to 3 auto-retry iterations until PASS.",
    proof: "Agentic Gatekeeper with deterministic boundaries",
    detail:
      "Transactions are cryptographically blocked from executing if the Risk Officer evaluates a FAIL state.",
  },
  {
    id: "execute",
    name: "Execute",
    navLabel: "04 Execute",
    tagline: "STEP 04 / 04 | EXECUTION & MEMORY",
    heading: "On-chain settlement & Memory loop.",
    paragraph:
      "Cleared strategies are executed on the BSC Testnet. The resulting TxHash and LP Ticks are logged into the Database Memory, forming the historical baseline for the next 5-minute autonomous cycle.",
    scope: "STEP 04 / 04 | EXECUTION & MEMORY",
    title: "On-chain settlement & Memory loop.",
    body: "Cleared strategies are executed on the BSC Testnet. The resulting TxHash and LP Ticks are logged into the Database Memory, forming the historical baseline for the next 5-minute autonomous cycle.",
    proof: "BSC Testnet broadcast & Memory DB integration",
    detail:
      "The cycle concludes by seeding the Memory Database, giving agents historical context for the next epoch.",
  },
];

export const STORY = Object.assign([...chapters], {
  eyebrow: "02 / THE EXECUTION PIPELINE",
  title: ["Autonomous Intelligence.", "Zero Human Bottleneck."],
  intro:
    "The Orchestrator Workflow handles the entire yield optimization lifecycle in four cryptographic steps. No manual bridges, no complex staking.",
  example: "NEUROLOOM OMNI-VAULT PIPELINE",
  pause: "Pause walkthrough",
  resume: "Resume walkthrough",
  auto: "Auto-playing",
  nav: "Execution pipeline chapters",
  footer:
    "Deterministic smart contract execution powered by ERC-4626 vault infrastructure.",
  source: "View System Flow ↗",
  sourceUrl: "https://pitchdeck-neuroloom.vercel.app/newdemo",
  chapters,
});
