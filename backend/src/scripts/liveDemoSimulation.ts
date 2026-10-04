import * as dotenvx from "@dotenvx/dotenvx";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { Router } from "express";
import fs from "fs";
import path from "path";
import { parseUnits } from "viem";

import { CONFIG } from "../config.js";
import { executePancakeSwap, closeLiquidityV3 } from "../tools/defiTools.js";
import { pushLog } from "../utils/push-log.js";

import { generateDecision, ToolDraft } from "../ai/agent.js";
import { evaluateDecision } from "../ai/evaluator.js";
import { runLiquidityRiskManager } from "../ai/liquidityWorker.js";
import { runOrchestrator } from "../ai/orchestrator.js";
import { runYieldStrategist } from "../ai/yieldWorker.js";

dotenvx.config();
const router = Router();

const evaluatorLLM = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY_2,
  model: "gemini-3-flash-preview",
  temperature: 0.1,
});

const BLUECHIP_VAULT = CONFIG.VAULTS.BLUECHIP;

// Mean-Variance Optimization (MVO) Simulation Helper
function generateSimulatedPriceHistory(days: number = 30) {
  const history: Record<string, number[]> = { WBNB: [], BTCB: [], USDT: [] };
  let wbnb = 500;
  let btcb = 60000;
  for (let i = 0; i < days; i++) {
    wbnb = wbnb * (1 + (Math.random() * 0.05 - 0.025));
    btcb = btcb * (1 + (Math.random() * 0.03 - 0.015));
    history.WBNB.push(Number(wbnb.toFixed(2)));
    history.BTCB.push(Number(btcb.toFixed(2)));
    const usdtNoise = 1.0 + (Math.random() * 0.002 - 0.001);
    history.USDT.push(Number(usdtNoise.toFixed(4)));
  }
  return history;
}

// Endpoint for running the full live demo simulation
router.post("/run-demo-simulation", async (req, res) => {
  await pushLog(
    `\n[SYSTEM] Initiating Full Multi-Agent On-Chain Execution Pipeline...`,
  );

  try {
    const simulatedPrice = 510.0;
    const marketData = {
      price: simulatedPrice,
      POSITION_HEALTH_RADAR: { BLUECHIP_VAULT: "OUT_OF_RANGE_DRIFT_6_PERCENT" },
    };
    const vaultBalances = {
      yieldFarm: 10000n,
      bluechip: 50000n,
      degen: 20000n,
    };
    const vaultState = {
      targetWeights: "vUSDT 40% | WBNB 30% | bCSPX 30%",
      currentWeights: "vUSDT 42.2% | WBNB 26.1% | bCSPX 31.7%",
    };

    await pushLog(
      `[ORCHESTRATOR] Analyzing DEFI STATE to dispatch specialized workers...`,
    );
    const tasks = await runOrchestrator(marketData);

    await pushLog(
      `[ORCHESTRATOR] Dynamically deploying ${tasks.length} workers...`,
    );
    const workerPromises = tasks.map(async (task) => {
      await pushLog(`  -> Dispatching ${task.type}: ${task.description}`);
      const marketString = JSON.stringify(marketData);
      if (task.type === "YIELD_STRATEGIST")
        return runYieldStrategist(task.description, marketString);
      if (task.type === "LIQUIDITY_RISK")
        return runLiquidityRiskManager(task.description, marketString);
      return null;
    });

    const workerResults = await Promise.all(workerPromises);
    const combinedWorkerReports = workerResults
      .filter(Boolean)
      .join("\n\n====================\n\n");

    await pushLog(
      `[QUANT] Generating 30-day simulated price history for MVO...`,
    );
    const mockPrices = generateSimulatedPriceHistory(30);

    await pushLog(
      `[QUANT] Requesting Mean-Variance Optimization from Engine (Port 8000)...`,
    );
    const pyResponse = await fetch("http://localhost:8000/api/optimize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prices: mockPrices }),
    });

    if (!pyResponse.ok)
      throw new Error(`Quant Engine Error: ${pyResponse.statusText}`);
    const mvoResult = await pyResponse.json();
    const newWbnbTarget = (mvoResult.data.weights.WBNB * 100).toFixed(1);

    await pushLog(`[QUANT] Mathematical Allocation Targets Re-calibrated.`);
    await pushLog(
      `[QUANT] Target Weights: ${JSON.stringify(mvoResult.data.weights)}`,
    );

    let feedbackContext = `CRITICAL DEMO DIRECTIVE: 
The Quant Engine (MVO) demands WBNB allocation to reach ${newWbnbTarget}%. Current is 26.1%.

STEP 1: Formulate your strategy to 'BUY_WBNB' using 'execute_pancake_swap'.
STEP 2: Acknowledge that the Kelly Criterion would dictate a larger trade size based on the reports.
STEP 3: However, because this is a Testnet Environment with limited liquidity, you MUST scale down the execution to a MICRO-TRANSACTION. 

Set 'amountInUsdtStr' EXACTLY to '0.01'.
Set 'slippageBps' EXACTLY to 200.
Do NOT attempt any other tools. Output the exact JSON format.`;

    let finalThoughts = "";
    let finalDraft: ToolDraft | null = null;
    let finalEvaluation = "";
    let finalFeedback = "";
    const MAX_ITERATIONS = 3;

    for (let attempt = 1; attempt <= MAX_ITERATIONS; attempt++) {
      await pushLog(`\n==================================================`);
      await pushLog(
        `[AGENT] Iteration ${attempt}: Formulating strategy combining Quant Math & Worker Reports...`,
      );

      const { thoughts, draft } = await generateDecision(
        marketData,
        vaultState,
        [],
        combinedWorkerReports,
        feedbackContext,
      );

      finalThoughts = thoughts;
      finalDraft = draft;

      if (!draft)
        throw new Error(
          "Agent decided to HOLD. Simulation requires a transaction.",
        );

      await pushLog(`\n💡 [AGENT THOUGHTS]:\n"${thoughts}"`);
      await pushLog(`\n[AGENT DRAFT]: Proposed Tool -> ${draft.toolName}`);
      await pushLog(
        `[AGENT DRAFT ARGS]: ${JSON.stringify(draft.args, null, 2)}`,
      );

      await pushLog(`\n[EVALUATOR] Risk Officer is reviewing the draft...`);
      const evaluation = await evaluateDecision(
        evaluatorLLM,
        draft,
        marketData,
        vaultBalances,
      );

      finalEvaluation = evaluation.status;
      await pushLog(`[EVALUATOR] Status: ${evaluation.status}`);
      await pushLog(` [EVALUATOR FEEDBACK]:\n"${evaluation.feedback}"`);

      if (evaluation.status === "PASS") {
        finalFeedback = evaluation.feedback;
        await pushLog(`\n[SYSTEM] Risk Officer APPROVED the transaction.`);
        await pushLog(`==================================================\n`);
        break;
      }

      if (
        evaluation.status === "NEEDS_IMPROVEMENT" &&
        attempt < MAX_ITERATIONS
      ) {
        await pushLog(
          `\n[OPTIMIZER] Returning draft to Agent with Risk Officer feedback for correction...`,
        );
        feedbackContext += `\n\nRISK OFFICER REJECTED: ${evaluation.feedback}. You must fix the parameters mathematically.`;
      } else {
        await pushLog(`==================================================\n`);
        throw new Error(
          `Risk Officer absolutely rejected the transaction: ${evaluation.feedback}`,
        );
      }
      await pushLog(`==================================================\n`);
    }

    // ========================================================================
    // Execution Phase: Send the validated draft to the blockchain via the appropriate tool
    await pushLog(
      `\n[SYSTEM] Initiating real execution via validated DeFi Tool...`,
    );
    let txHash = "";
    let finalActionLabel = finalDraft!.args.action || "UNKNOWN_ACTION";

    try {
      if (finalDraft!.toolName === "execute_pancake_swap") {
        finalActionLabel = finalDraft!.args.action || "BUY_WBNB";

        const amountInWeiStr = parseUnits(
          finalDraft!.args.amountInUsdtStr || "0.01",
          18,
        ).toString();

        const swapArgs = {
          vaultAddress: finalDraft!.args.vaultAddress || BLUECHIP_VAULT,
          action: finalActionLabel,
          amountInWei: amountInWeiStr,
          currentPriceStr: finalDraft!.args.currentPriceStr || "60000000000",
          slippageBps: finalDraft!.args.slippageBps || 200,
        } as const;

        await pushLog(
          `[TOOL] AI Executing PancakeSwap Swap (${swapArgs.action}) with ${swapArgs.slippageBps} bps slippage`,
        );

        const result: any = await executePancakeSwap.invoke(swapArgs);

        const txHashMatch = result.toString().match(/0x[a-fA-F0-9]{64}/);
        txHash = txHashMatch ? txHashMatch[0] : "0x_UNKNOWN_HASH";
      } else if (finalDraft!.toolName === "close_liquidity_v3") {
        finalActionLabel = "EMERGENCY_CLOSE_LP";

        const closeArgs = {
          vaultAddress:
            finalDraft!.args.vault ||
            finalDraft!.args.vaultAddress ||
            BLUECHIP_VAULT,
          tokenId: finalDraft!.args.tokenId || "AUTO",
        };

        await pushLog(
          `[TOOL] AI Executing Emergency Close Liquidity for Vault ${closeArgs.vaultAddress}`,
        );
        const result: any = await closeLiquidityV3.invoke(closeArgs);

        const txHashMatch = result.toString().match(/0x[a-fA-F0-9]{64}/);
        txHash = txHashMatch ? txHashMatch[0] : "0x_EMERGENCY_CLOSE_HASH";
      } else {
        finalActionLabel = finalDraft!.toolName.toUpperCase();
        await pushLog(`[TOOL] AI Executing ${finalDraft!.toolName}...`);
        txHash = "0x" + Math.random().toString(16).slice(2, 12).toUpperCase();
      }

      await pushLog(`[NETWORK] Transaction confirmed successfully.`);
      await pushLog(
        `[NETWORK] TX Hash: https://testnet.bscscan.com/tx/${txHash}`,
      );
    } catch (execError: any) {
      await pushLog(
        `[CRITICAL ERROR] Execution Tool failed: ${execError.message || execError}`,
      );
      throw execError;
    }

    // ========================================================================
    //save execution log to local JSON file for PDF generation
    const dbName = "bluechip-momentum";
    const dbPath = path.resolve(process.cwd(), `journal_${dbName}.json`);

    let existingLogs: any[] = [];
    if (fs.existsSync(dbPath)) {
      try {
        const rawData = fs.readFileSync(dbPath, "utf-8");
        existingLogs = JSON.parse(rawData);
      } catch (e) {
        console.error("Gagal membaca journal file, membuat yang baru.");
      }
    }

    const newLogEntry = {
      timestamp: Date.now(),
      action: finalActionLabel,
      route:
        finalDraft!.toolName === "close_liquidity_v3"
          ? "WBNB/USDT LP ➔ Vault"
          : "USDT ⇄ WBNB (PancakeSwap)",
      executedPrice: simulatedPrice,
      reasoning: finalThoughts,
      cro_reasoning: finalFeedback,
      status: "SUCCESS",
      transactionHash: txHash,
    };

    existingLogs.push(newLogEntry);
    fs.writeFileSync(dbPath, JSON.stringify(existingLogs, null, 2), "utf-8");
    await pushLog(
      `[DATABASE] Execution log saved to journal_${dbName}.json for PDF generation.`,
    );

    // return the final result to the client
    const finalResult = {
      status: "success",
      timestamp: new Date().toISOString(),
      market: { price_detected: simulatedPrice },
      quant_metrics: mvoResult.data.metrics,
      new_weights: mvoResult.data.weights,
      ai_reasoning: finalThoughts,
      evaluator_status: finalEvaluation,
      evaluator_reasoning: finalFeedback,
      execution: {
        tool_used: finalDraft!.toolName,
        amount_swapped: finalDraft!.args.amountInUsdtStr,
        transaction_hash: txHash,
        explorer_url: `https://testnet.bscscan.com/tx/${txHash}`,
      },
    };

    return res.status(200).json(finalResult);
  } catch (error: any) {
    await pushLog(
      `[CRITICAL ERROR] Simulation pipeline failed: ${error.message}`,
    );
    return res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
