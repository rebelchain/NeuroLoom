import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { ChatGroq } from "@langchain/groq";
import { generateDecision } from "./ai/agent.js";
import { evaluateDecision } from "./ai/evaluator.js";
import { runLiquidityRiskManager } from "./ai/liquidityWorker.js";
import { runOrchestrator } from "./ai/orchestrator.js";
import { runYieldStrategist } from "./ai/yieldWorker.js";
import { getVaultState } from "./chain/vault.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";
import { fetchQuantData } from "./data/taapi.js";
import { executePancakeSwap, executeVenusDeposit } from "./tools/defiTools.js";

const cycleMinutes = parseInt(process.env.CYCLE_INTERVAL_MINUTES || "30");
const CYCLE_INTERVAL_MS = cycleMinutes * 60 * 1000;
let isRunning = true;

const evaluatorLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-20b",
  maxTokens: 800,
  temperature: 0,
});

async function neuroLoomCycle() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Initializing NeuroLoom Orchestrator-Workflows`);

  try {
    const market = await fetchQuantData("BNB/USDT");
    const vaultData = await getVaultState();
    const memories = await getRecentMemories(3);
    const marketString = JSON.stringify(market);

    const tasks = await runOrchestrator(market);
    console.log(
      `[ORCHESTRATOR] Dynamically deploying ${tasks.length} workers...`,
    );

    const workerPromises = tasks.map((task) => {
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
    let currentDraft = null;
    let finalThoughts = "";
    const MAX_ITERATIONS = 1;

    for (let attempt = 1; attempt <= MAX_ITERATIONS; attempt++) {
      console.log(
        `\n[AGENT] Iteration ${attempt}: Generating strategic thesis...`,
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
          "[SYSTEM] The agent decided to HOLD. There is no execution draft.",
        );
        await logAIDecision(
          "N/A",
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
            "[SYSTEM] Iteration limit reached without a PASS. Aborting transaction.",
          );
          await logAIDecision(
            draft.toolName,
            "FAIL",
            market.price,
            market.rsi,
            `Max iterations reached. Last feedback: ${evaluation.feedback}`,
            "FAIL",
          );
          return;
        }
      } else {
        console.log(
          "[SYSTEM] Transaction ABSOLUTELY REJECTED by the Risk Officer (FAIL).",
        );
        await logAIDecision(
          draft.toolName,
          "FAIL",
          market.price,
          market.rsi,
          `Rejected by Evaluator: ${evaluation.feedback}`,
          "FAIL",
        );
        return;
      }
    }

    if (currentDraft) {
      try {
        let result: any;
        if (currentDraft.toolName === "execute_pancake_swap") {
          result = await executePancakeSwap.invoke(currentDraft.args);
        } else if (currentDraft.toolName === "execute_venus_deposit") {
          result = await executeVenusDeposit.invoke(currentDraft.args);
        } else {
          throw new Error(`Unknown toolName: ${currentDraft.toolName}`);
        }

        const finalOutput =
          typeof result === "string"
            ? result
            : result?.content || JSON.stringify(result);

        console.log(`ON-CHAIN SUCCESS: ${finalOutput}`);

        const txHash = result?.hash || result || "0x_simulated_hash";

        const targetVault = currentDraft.args.vaultAddress || "Unknown Vault";

        await logAIDecision(
          currentDraft.toolName,
          currentDraft.args.action || "DEPOSIT",
          market.price,
          market.rsi,
          finalThoughts,
          "SUCCESS",
          txHash,
          targetVault,
        );
      } catch (chainError) {
        console.error(`[EXECUTION ERROR]Smart contract failed:`, chainError);
        await logAIDecision(
          currentDraft.toolName,
          "REVERTED",
          market.price,
          market.rsi,
          "Transaction reverted on-chain",
          "FAILED",
        );
      }
    }
  } catch (error) {
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
  console.log(" [SYSTEM] NeuroLoom is shutting down safely.");
  process.exit(0);
}

process.on("SIGINT", () => {
  isRunning = false;
});
process.on("SIGTERM", () => {
  isRunning = false;
});

startAutonomousLoop();
