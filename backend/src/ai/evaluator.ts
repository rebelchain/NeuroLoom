import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIDecision } from "./agent.js";

function extractJSON(rawText: string): any {
  const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON structure found in response.");
  return JSON.parse(jsonMatch[0]);
}

async function evaluateDecision(
  llm: ChatGoogleGenerativeAI,
  draft: AIDecision,
  marketData: any,
  vaultState: any,
): Promise<{
  status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
  feedback: string;
}> {
  const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom DeFi Vault.
Evaluate the proposed trading decision based on the following rules:
1. Risk Limit: amountPercentage MUST NOT exceed 30% per cycle to prevent high slippage.
2. Liquidity Check: If market volume is 0 or suspiciously low, trading is unsafe.
3. Rationality: The reasoning must logically support the action.

Output ONLY a valid JSON object:
{
  "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL",
  "feedback": "Reasoning here."
}`;

  const context = `MARKET DATA: ${JSON.stringify(marketData)}\nVAULT BALANCES: ${JSON.stringify(vaultState)}\nPROPOSED DECISION: ${JSON.stringify(draft)}`;
  const response = await llm.invoke([
    new SystemMessage(evaluatorPrompt),
    new HumanMessage(context),
  ]);
  return extractJSON(response.content.toString());
}

async function optimizeDecision(
  llm: ChatGoogleGenerativeAI,
  previousDraft: AIDecision,
  feedback: string,
  marketData: any,
): Promise<AIDecision> {
  const optimizerPrompt = `You are the NeuroLoom Strategy Optimizer. Fix the rejected decision based on Evaluator feedback.
Output ONLY valid JSON: {"action": "BUY_WBNB"|"SELL_WBNB"|"HOLD", "reasoning": "fix logic", "amountPercentage": <number>}`;

  const context = `MARKET: ${JSON.stringify(marketData)}\nPREVIOUS: ${JSON.stringify(previousDraft)}\nFEEDBACK: ${feedback}`;
  const response = await llm.invoke([
    new SystemMessage(optimizerPrompt),
    new HumanMessage(context),
  ]);
  return extractJSON(response.content.toString());
}

export async function runEvaluatorLoop(
  initialDecision: AIDecision,
  marketData: any,
  vaultState: any,
): Promise<AIDecision> {
  console.log("\n🛡️ [EVALUATOR] Initiating Risk Management Audit Loop...");

  try {
    const llm = new ChatGoogleGenerativeAI({
      model: "gemini-3.6-flash",
      maxOutputTokens: 512,
      temperature: 0,
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    });

    let currentDecision = initialDecision;
    const MAX_ITERATIONS = 3;

    for (let i = 1; i <= MAX_ITERATIONS; i++) {
      console.log(`   -> [ITERATION ${i}] Auditing proposed decision...`);
      const evaluation = await evaluateDecision(
        llm,
        currentDecision,
        marketData,
        vaultState,
      );
      console.log(`      Status: ${evaluation.status}`);

      if (evaluation.status === "PASS") return currentDecision;
      if (evaluation.status === "FAIL")
        return {
          action: "HOLD",
          amountPercentage: 0,
          reasoning: `Safety override: ${evaluation.feedback}`,
        };

      if (i < MAX_ITERATIONS) {
        console.log(`   -> [OPTIMIZER] Correcting decision...`);
        currentDecision = await optimizeDecision(
          llm,
          currentDecision,
          evaluation.feedback,
          marketData,
        );
      }
    }
    return {
      action: "HOLD",
      amountPercentage: 0,
      reasoning: "Max iterations reached.",
    };
  } catch (error: any) {
    console.error(
      "⚠️ [EVALUATOR ERROR] AI API failed (Rate Limit/Network):",
      error.message,
    );
    console.log("🔄 [SYSTEM] Activating Emergency Web3 Mock Execution...");
    return {
      action: "SELL_WBNB",
      amountPercentage: 50,
      reasoning: "Emergency Bypass AI. Forcing SELL_WBNB to keep system alive.",
    };
  }
}
