import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { getAIDecision } from "./ai/agent.js";
import { runEvaluatorLoop } from "./ai/evaluator.js";
import { executeTradeOnChain } from "./chain/executor.js";
import { getVaultState } from "./chain/vault.js";
import { fetchBinanceData } from "./data/binance.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";

const cycleMinutes = parseInt(process.env.CYCLE_INTERVAL_MINUTES || "30");
const CYCLE_INTERVAL_MS = cycleMinutes * 60 * 1000;
let isRunning = true; // Bendera untuk kontrol Graceful Shutdown

async function neuroLoomCycle() {
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`[${timestamp}] INITIALIZING NEUROLOOM AI CYCLE`);
  console.log(`======================================================`);

  try {
    const market = await fetchBinanceData("BNBUSDT");
    const vault = await getVaultState();
    const memories = await getRecentMemories(3);

    console.log("[AGENT] Analyzing market conditions and memory state...");

    const draftDecision = await getAIDecision(market, vault, memories);

    const finalDecision = await runEvaluatorLoop(draftDecision, market, vault);

    console.log(
      `[FINAL DECISION] Action: ${finalDecision.action} | Allocation: ${finalDecision.amountPercentage}%`,
    );
    console.log(`[REASONING] ${finalDecision.reasoning}`);

    await logAIDecision(
      finalDecision.action,
      finalDecision.amountPercentage,
      finalDecision.reasoning,
    );

    try {
      await executeTradeOnChain(
        finalDecision.action,
        finalDecision.amountPercentage,
      );
    } catch (chainError) {
      console.error(
        `[EXECUTION ERROR] Smart Contract execution failed, but AI memory is saved.`,
        chainError,
      );
    }
  } catch (error) {
    console.error(
      `[CRITICAL ERROR] AI Cycle aborted due to internal failure:`,
      error,
    );
  }
}

async function startAutonomousLoop() {
  console.log(
    "[SYSTEM] NeuroLoom Autonomous Agent is now ONLINE. Press Ctrl+C to stop safely.",
  );

  while (isRunning) {
    const cycleStartTime = Date.now();

    await neuroLoomCycle();

    const cycleDuration = Date.now() - cycleStartTime;
    const timeToWait = Math.max(0, CYCLE_INTERVAL_MS - cycleDuration);

    console.log(
      `[SYSTEM] Cycle completed. Awaiting ${Math.round(timeToWait / 1000)} seconds for the next iteration...`,
    );

    if (isRunning) {
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
    }
  }

  console.log("🛑 [SYSTEM] NeuroLoom has been safely shut down. Goodbye!");
  process.exit(0);
}

process.on("SIGINT", () => {
  console.log(
    "\n⚠️ [SYSTEM] Interruption signal received (Ctrl+C). Preparing to shutdown safely after current cycle...",
  );
  isRunning = false; 
});

process.on("SIGTERM", () => {
  console.log(
    "\n⚠️ [SYSTEM] Termination signal received. Preparing to shutdown safely...",
  );
  isRunning = false;
});

startAutonomousLoop();
