import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { ChatGroq } from "@langchain/groq";
import { generateDecision } from "./ai/agent.js";
import { evaluateDecision } from "./ai/evaluator.js";
import { getVaultState } from "./chain/vault.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";
import { fetchQuantData } from "./data/taapi.js";
import { executePancakeSwap, executeVenusDeposit } from "./tools/defiTools.js";

const cycleMinutes = parseInt(process.env.CYCLE_INTERVAL_MINUTES || "30");
const CYCLE_INTERVAL_MS = cycleMinutes * 60 * 1000;
let isRunning = true;

const evaluatorLLM = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-safeguard-20b",
  temperature: 0,
});

async function neuroLoomCycle() {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] Initializing NeuroLoom Orchestrator-Workflows`);

  try {
    const market = await fetchQuantData("BNB/USDT");
    const vaultData = await getVaultState();
    const memories = await getRecentMemories(3);

    let feedbackContext = "";
    let currentDraft = null;
    let finalThoughts = "";
    const MAX_ITERATIONS = 3;

    for (let attempt = 1; attempt <= MAX_ITERATIONS; attempt++) {
      console.log(
        `\n[AGENT] Iteration ${attempt}: Generating strategic thesis...`,
      );

      const { thoughts, draft } = await generateDecision(
        market,
        vaultData,
        memories,
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
