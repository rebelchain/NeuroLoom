import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { AIDecision } from "./agent.js";

function extractJSON(rawText: string): any {
  const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON structure found in response.");
  return JSON.parse(jsonMatch[0]);
}

async function evaluateDecision(
  llm: ChatOpenAI,
  draft: AIDecision,
  marketData: any,
  vaultState: any,
): Promise<{
  status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
  feedback: string;
}> {
  // [PERBAIKAN 1]: Mengubah mindset Evaluator dari "Trading" menjadi "DeFi Routing & Liquidity"
  const evaluatorPrompt = `You are the Chief Risk Officer for the NeuroLoom DeFi Vault.
Evaluate the proposed yield routing decision based on the following strict rules:
1. Risk Limit: amountPercentage MUST NOT exceed 30% per cycle to prevent catastrophic slippage.
2. Liquidity Check: If AMM liquidity depth is 0 or lending utilization is suspiciously low, routing is unsafe.
3. Rationality: The reasoning must logically support the action based on APY opportunities or impermanent loss mitigation.

Output ONLY a valid JSON object:
{
  "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL",
  "feedback": "Reasoning here."
}`;

  const context = `DEFI STATE: ${JSON.stringify(marketData)}\nVAULT BALANCES: ${JSON.stringify(vaultState)}\nPROPOSED DECISION: ${JSON.stringify(draft)}`;
  const response = await llm.invoke([
    new SystemMessage(evaluatorPrompt),
    new HumanMessage(context),
  ]);
  return extractJSON(response.content.toString());
}

async function optimizeDecision(
  llm: ChatOpenAI,
  previousDraft: AIDecision,
  feedback: string,
  marketData: any,
): Promise<AIDecision> {
  const optimizerPrompt = `You are the NeuroLoom Strategy Optimizer. Fix the rejected routing decision based on the Risk Officer's feedback.
Output ONLY valid JSON: {"action": "BUY_WBNB"|"SELL_WBNB"|"HOLD", "reasoning": "fix logic", "amountPercentage": <number>}`;

  const context = `DEFI STATE: ${JSON.stringify(marketData)}\nPREVIOUS: ${JSON.stringify(previousDraft)}\nFEEDBACK: ${feedback}`;
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
    const llm = new ChatOpenAI({
      modelName: "google/gemma-4-26b-a4b-it:free",
      temperature: 0,
      maxTokens: 512,
      // [PERBAIKAN 2]: Memastikan kompatibilitas dengan .env milikmu
      openAIApiKey:
        process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY,
      configuration: {
        baseURL: "https://openrouter.ai/api/v1",
        defaultHeaders: {
          "HTTP-Referer": "https://neuroloom.app",
          "X-Title": "NeuroLoom",
        },
      },
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
      reasoning: "Max iterations reached without passing risk audit.",
    };
  } catch (error: any) {
    console.error(
      "⚠️ [EVALUATOR ERROR] AI API failed (Rate Limit/Network):",
      error.message,
    );
    // [PERBAIKAN 3]: Mengubah mode darurat menjadi HOLD absolut demi keamanan dana
    console.log("🔄 [SYSTEM] Activating Emergency Circuit Breaker (HOLD)...");
    return {
      action: "HOLD",
      amountPercentage: 0,
      reasoning:
        "Emergency Bypass AI triggered due to API failure. Halting execution to protect TVL.",
    };
  }
}
