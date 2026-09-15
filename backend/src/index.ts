import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { getAIDecision } from "./ai/agent.js";
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

    console.log(
      `[MARKET DATA] WBNB: $${market.price} (24H: ${market.priceChangePercent}%)`,
    );
    console.log(
      `[VAULT STATE] Balance: ${vault.wbnbBalance} WBNB | ${vault.usdtBalance} USDT`,
    );

    console.log("[AGENT] Analyzing market conditions and memory state...");
    const decision = await getAIDecision(market, vault, memories);

    console.log(
      `[DECISION] Action: ${decision.action} | Allocation: ${decision.amountPercentage}%`,
    );
    console.log(`[REASONING] ${decision.reasoning}`);

    await executeTradeOnChain(decision.action, decision.amountPercentage);

    await logAIDecision(
      decision.action,
      decision.amountPercentage,
      decision.reasoning,
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
