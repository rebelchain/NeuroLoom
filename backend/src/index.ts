import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { getAIDecision } from "./ai/agent.js";
import { runEvaluatorLoop } from "./ai/evaluator.js";
import { executeTradeOnChain } from "./chain/executor.js";
import { getVaultState } from "./chain/vault.js";
import { fetchBinanceData } from "./data/binance.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";

const CYCLE_INTERVAL_MS = 1 * 60 * 1000;

async function neuroLoomCycle() {
  // Menggunakan standar waktu ISO agar terlihat sangat teknis dan rapi
  const timestamp = new Date().toISOString();
  console.log(`\n======================================================`);
  console.log(`[${timestamp}] INITIALIZING NEUROLOOM AI CYCLE`);
  console.log(`======================================================`);

  try {
    const market = await fetchBinanceData("BNBUSDT");
    const vault = await getVaultState();
    const memories = await getRecentMemories(3);

    console.log("[AGENT] Analyzing market conditions and memory state...");
    // 1. Dapatkan draf dari Orchestrator-Workers
    const draftDecision = await getAIDecision(market, vault, memories);

    // 2. Masukkan draf ke dalam mesin Evaluator-Optimizer
    const finalDecision = await runEvaluatorLoop(draftDecision, market, vault);

    console.log(
      `[FINAL DECISION] Action: ${finalDecision.action} | Allocation: ${finalDecision.amountPercentage}%`,
    );
    console.log(`[REASONING] ${finalDecision.reasoning}`);

    // 3. Eksekusi HANYA finalDecision yang sudah diaudit
    await executeTradeOnChain(
      finalDecision.action,
      finalDecision.amountPercentage,
    );

    await logAIDecision(
      finalDecision.action,
      finalDecision.amountPercentage,
      finalDecision.reasoning,
    );
  } catch (error) {
    console.error(`[CRITICAL ERROR] Cycle execution failed:`, error);
  }

  console.log(
    `[SYSTEM] Cycle completed. Awaiting ${CYCLE_INTERVAL_MS / 1000} seconds for the next iteration...`,
  );
}

async function startAutonomousLoop() {
  console.log("[SYSTEM] NeuroLoom Autonomous Agent is now ONLINE.");

  while (true) {
    await neuroLoomCycle();
    await new Promise((resolve) => setTimeout(resolve, CYCLE_INTERVAL_MS));
  }
}

startAutonomousLoop();
