import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { generateDecision } from "./ai/agent.js";
import { evaluateDecision } from "./ai/evaluator.js";
import { runLiquidityRiskManager } from "./ai/liquidityWorker.js";
import { runOrchestrator } from "./ai/orchestrator.js";
import { runYieldStrategist } from "./ai/yieldWorker.js";
import { getVaultState } from "./chain/vault.js";
import { CONFIG } from "./config.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";
import { fetchQuantData } from "./data/taapi.js";

import { checkVaultPosition } from "./chain/positionSensor.js";
import {
  closeLiquidityV3,
  executePancakeSwap,
  executeVenusDeposit,
  provideLiquidityV3,
} from "./tools/defiTools.js";
import { calculateV3LpParams, simulateILRisk } from "./tools/lpMathTools.js";
import { calculateOptimalAllocation } from "./tools/quantTools.js";
import { isNetworkGasSafe } from "./utils/gasChecker.js";

const cycleMinutes = parseInt(process.env.CYCLE_INTERVAL_MINUTES || "30");
const CYCLE_INTERVAL_MS = cycleMinutes * 60 * 1000;
let isRunning = true;

const evaluatorLLM = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_2,
  model: "gemini-3-flash-preview",
  temperature: 0.1,
});

function getVaultIdFromAddress(address: string | undefined): string {
  if (!address) return "global";

  const addrLower = address.toLowerCase();
  if (addrLower === CONFIG.VAULTS.BLUECHIP.toLowerCase())
    return "bluechip-momentum";
  if (addrLower === CONFIG.VAULTS.DEGEN.toLowerCase())
    return "degen-accumulator";
  if (addrLower === CONFIG.VAULTS.YIELD_FARM.toLowerCase()) return "yield-farm";

  return "global";
}

export async function neuroLoomCycle(demoConfig?: {
  forceCrash?: boolean;
  stage?: number;
}) {
  const timestamp = new Date().toISOString();
  console.log(`\n[${timestamp}] NeuroLoom Orchestrator-Workflows`);

  try {
    const gasSafe = await isNetworkGasSafe();
    if (!gasSafe) {
      console.log(
        "[SYSTEM] Siklus dibatalkan. Biaya jaringan (Gas) terlalu tinggi saat ini.",
      );
      return;
    }

    const market = await fetchQuantData("BNB/USDT");
    const vaultData = await getVaultState();

    const realTestnetPrice = 792.5;
    market.price = realTestnetPrice;

    const wbnbAmount = 0.01;
    const usdtAmount = wbnbAmount * realTestnetPrice;
    const usdtAmountWei = BigInt(Math.floor(usdtAmount * 1e18)).toString();

    // DEMO DAY INJECTION
    if (demoConfig?.forceCrash) {
      console.log("\n🚨 [DEMO OVERRIDE] MENGINJEKSI KRISIS PASAR BUATAN...");
      market.price = market.price * 0.5;
      market.rsi = 15;
    }

    let bluechipHealth = await checkVaultPosition(
      CONFIG.VAULTS.BLUECHIP,
      market.price,
    );
    let degenHealth = await checkVaultPosition(
      CONFIG.VAULTS.DEGEN,
      market.price,
    );

    if (demoConfig?.forceCrash) {
      bluechipHealth = "OUT_OF_RANGE" as any;
      degenHealth = "OUT_OF_RANGE" as any;
      console.log("[DEMO OVERRIDE] SENSOR POSISI DIPAKSA: OUT_OF_RANGE");
    }

    const memories = await getRecentMemories(3);

    const marketString = JSON.stringify({
      ...market,
      POSITION_HEALTH_RADAR: {
        BLUECHIP_VAULT: bluechipHealth,
        DEGEN_VAULT: degenHealth,
      },
    });

    const tasks = await runOrchestrator(market);
    console.log(
      `[ORCHESTRATOR] Dynamically deploying ${tasks.length} workers:`,
    );

    const workerPromises = tasks.map(async (task) => {
      console.log(`  -> Dispatching ${task.type}: ${task.description}`);

      if (task.type === "YIELD_STRATEGIST") {
        return runYieldStrategist(task.description, marketString);
      }
      if (task.type === "LIQUIDITY_RISK") {
        return runLiquidityRiskManager(task.description, marketString);
      }
      return null;
    });

    const workerResults = await Promise.all(workerPromises);

    const combinedWorkerReports = workerResults
      .filter(Boolean)
      .join("\n\n====================\n\n");

    let feedbackContext = "";
    if (demoConfig?.stage === 1) {
      // 3. MASUKKAN ANGKA YANG TEPAT KE DALAM PROMPT AI
      feedbackContext = `CRITICAL DEMO DIRECTIVE: This is STAGE 1 (Planning). You MUST analyze the market and ONLY output 'calculate_v3_lp_params'.
IMPORTANT RULE: Our testnet WBNB balance is extremely low. You MUST output EXACTLY this JSON schema for your 'args':
{
  "vaultAddress": "${CONFIG.VAULTS.BLUECHIP}",
  "tokenA": "${CONFIG.TOKENS.WBNB}",
  "tokenB": "${CONFIG.TOKENS.USDT}",
  "currentPrice": ${realTestnetPrice},
  "atrVolatilityPercent": 5.0,
  "marketDirection": "BULLISH",
  "amountADesiredWei": "10000000000000000",
  "amountBDesiredWei": "${usdtAmountWei}"
}
Note: 10000000000000000 is 0.01 WBNB and ${usdtAmountWei} is ${usdtAmount} USDT.`;
    } else if (demoConfig?.stage === 2) {
      feedbackContext = `CRITICAL DEMO DIRECTIVE: This is STAGE 2 (Execution). Read the calculation from your MEMORIES. You MUST output 'provide_liquidity_v3'. 
IMPORTANT RULE: You MUST output EXACTLY this JSON schema for your 'args' (replace the values from your memory calculation):
{
  "vaultAddress": "${CONFIG.VAULTS.BLUECHIP}",
  "token0": "value_from_memory",
  "token1": "value_from_memory",
  "fee": 2500,
  "tickLower": 12345, 
  "tickUpper": 12345,
  "amount0DesiredWei": "value_from_memory",
  "amount1DesiredWei": "value_from_memory",
  "slippageBps": 10000
}`;
    } else if (demoConfig?.stage === 3) {
      feedbackContext = `CRITICAL DEMO DIRECTIVE: This is STAGE 3 (Emergency Rescue). The POSITION_HEALTH_RADAR indicates the pool is OUT_OF_RANGE due to a market crash. You MUST output 'close_liquidity_v3' to rescue the funds.
IMPORTANT RULE: You MUST output EXACTLY this JSON schema for your 'args':
{
  "vaultAddress": "${CONFIG.VAULTS.BLUECHIP}",
  "tokenId": "AUTO"
}`;
    }
    let currentDraft = null;
    let finalThoughts = "";
    let finalEvaluationStatus = "";
    let finalEvaluationFeedback = "";
    const MAX_ITERATIONS = 3;

    for (let attempt = 1; attempt <= MAX_ITERATIONS; attempt++) {
      console.log(
        `\n[AGENT] Iteration ${attempt}: Generating strategic thesis:`,
      );

      const { thoughts, draft } = await generateDecision(
        market,
        vaultData,
        memories,
        combinedWorkerReports,
        feedbackContext,
      );

      finalThoughts = thoughts;
      currentDraft = draft;

      console.log(`[AGENT THOUGHTS]:\n${thoughts}`);

      if (!draft) {
        console.log(
          "[SYSTEM] ⏸ The agent decided to HOLD. There is no execution draft.",
        );
        await logAIDecision(
          "global",
          "HOLD",
          market.price,
          market.rsi,
          "Agent decided to HOLD based on market conditions.",
        );
        return;
      }

      console.log(`\n[EVALUATOR] Reviewing the draft: ${draft.toolName}`);

      const evaluation = await evaluateDecision(
        evaluatorLLM,
        draft,
        market,
        vaultData.balances,
      );

      finalEvaluationStatus = evaluation.status;
      finalEvaluationFeedback = evaluation.feedback;

      console.log(`[EVALUATOR] Status: ${evaluation.status}`);
      console.log(`[EVALUATOR] Feedback: ${evaluation.feedback}`);

      if (evaluation.status === "PASS") {
        break;
      } else if (evaluation.status === "NEEDS_IMPROVEMENT") {
        if (attempt < MAX_ITERATIONS) {
          console.log(
            `[OPTIMIZER] Returning feedback to the agent for improvement`,
          );
          feedbackContext = evaluation.feedback;
        } else {
          console.log(
            "[SYSTEM] ❌ Iteration limit reached without a PASS. Aborting transaction.",
          );
          return;
        }
      } else {
        console.log(
          "[SYSTEM] ⛔ Transaction ABSOLUTELY REJECTED by the Risk Officer (FAIL).",
        );
        return;
      }
    }

    if (currentDraft) {
      try {
        let result: any;
        console.log(`[SYSTEM] ⚡ Executing Tool: ${currentDraft.toolName}...`);

        if (currentDraft.toolName === "execute_pancake_swap") {
          result = await executePancakeSwap.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "execute_venus_deposit") {
          result = await executeVenusDeposit.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "provide_liquidity_v3") {
          result = await provideLiquidityV3.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "close_liquidity_v3") {
          result = await closeLiquidityV3.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "calculate_optimal_allocation") {
          result = await calculateOptimalAllocation.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "calculate_v3_lp_params") {
          result = await calculateV3LpParams.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "simulate_il_risk") {
          result = await simulateILRisk.invoke(currentDraft.args);
        } else {
          throw new Error(`Unknown toolName: ${currentDraft.toolName}`);
        }

        const finalOutput =
          typeof result === "string"
            ? result
            : result?.content || JSON.stringify(result);

        console.log(
          `✅ ON-CHAIN SUCCESS / CALCULATION DONE: ${finalOutput.substring(0, 100)}...`,
        );

        const txHash = result?.hash || result || "0x_simulated_hash";
        const targetVaultAddress =
          currentDraft.args.vaultAddress || CONFIG.VAULTS.BLUECHIP;

        const dynamicVaultId = getVaultIdFromAddress(targetVaultAddress);

        let actionLabel = currentDraft.toolName.toUpperCase();
        if (currentDraft.toolName === "calculate_v3_lp_params")
          actionLabel = "MATHEMATICAL_PLANNING (STAGE 1)";
        if (currentDraft.toolName === "provide_liquidity_v3")
          actionLabel = "DEPLOY_LP (STAGE 2)";
        if (currentDraft.toolName === "close_liquidity_v3")
          actionLabel = "EMERGENCY_CLOSE_LP (STAGE 3)";

        await logAIDecision(
          dynamicVaultId,
          actionLabel,
          market.price,
          market.rsi,
          `${finalThoughts}\n\n[CRO]: ${finalEvaluationFeedback}`,
          typeof txHash === "string" && txHash.includes("0x") ? txHash : "",
          targetVaultAddress,
        );
        console.log(
          `[DATABASE] Execution log saved to journal_${dynamicVaultId}.json for PDF generation.`,
        );
      } catch (chainError: any) {
        console.error(
          `[EXECUTION ERROR] Smart contract / Tool failed:`,
          chainError,
        );
      }
    }
  } catch (error: any) {
    console.error(`[CRITICAL ERROR] AI cycle stalled:`, error);
  }
}

async function startAutonomousLoop() {
  console.log(
    "[SYSTEM] NeuroLoom Orchestrator-Workflow is ONLINE. (Ctrl+C to stop)",
  );
  while (isRunning) {
    const cycleStartTime = Date.now();
    await neuroLoomCycle();
    const cycleDuration = Date.now() - cycleStartTime;
    const timeToWait = Math.max(0, CYCLE_INTERVAL_MS - cycleDuration);
    console.log(
      `\n[SYSTEM] Waiting ${Math.round(timeToWait / 1000)} seconds until the next cycle...`,
    );
    if (isRunning)
      await new Promise((resolve) => setTimeout(resolve, timeToWait));
  }
  process.exit(0);
}
// process.on("SIGINT", () => {
//   isRunning = false;
// });
// process.on("SIGTERM", () => {
//   isRunning = false;
// });
// startAutonomousLoop();
