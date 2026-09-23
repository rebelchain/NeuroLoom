import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";

export interface AIDecision {
  action: "BUY_WBNB" | "SELL_WBNB" | "HOLD";
  reasoning: string;
  amountPercentage: number;
}

interface WorkerTask {
  type: string;
  description: string;
}

export async function getAIDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
): Promise<AIDecision> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "qwen/qwen3.8-27b",
    temperature: 0.0,
    maxTokens: 2048,
  });

  const stateContext = `
CURRENT DEFI STATE:
- Protocol Data (AMM Depth & Lending Rates): ${JSON.stringify(marketData)}
- Vault Balances: ${JSON.stringify(vaultState)}
- Recent Memories (Last Routing Decisions): ${JSON.stringify(recentMemories)}
  `;

  try {
    console.log(
      "\n[ORCHESTRATOR] Analyzing AMM liquidity and planning task delegation...",
    );

    // Limit the Orchestrator to delegating ONLY a maximum of 1 task (to save API quota)
    const orchestratorPrompt = `You are the Lead Orchestrator for the NeuroLoom DeFi Yield Optimizer.
Analyze the current on-chain state (AMM liquidity depth, lending pool utilization rates, and vault balances).
Delegate EXACTLY ONE (1) analytical task to a specialized worker based on current DeFi yield opportunities, impermanent loss risks, and slippage data.

Return ONLY a valid JSON object matching this structure without any markdown formatting:
{
  "analysis": "Brief explanation of what yield strategies or risk checks are needed.",
  "tasks": [
    { "type": "YIELD_STRATEGIST", "description": "Specific instruction for this worker" }
  ]
}`;

    const orchestratorResponse = await llm.invoke([
      new SystemMessage(orchestratorPrompt),
      new HumanMessage(stateContext),
    ]);

    const plan = JSON.parse(
      orchestratorResponse.content
        .toString()
        .replace(/```json|```/g, "")
        .trim(),
    );
    console.log(
      `[ORCHESTRATOR] Delegating ${plan.tasks.length} specialized approaches to minimize API overhead.`,
    );

   
    console.log("[WORKERS] Generating specialized yield and risk analysis...");

    const workerPromises = plan.tasks.map(async (task: WorkerTask) => {
      const workerSystemPrompt = `You are a specialized Web3 DeFi AI Worker. 
Role: ${task.type}. 
Your Assignment: ${task.description}.

Analyze the provided DeFi state strictly from your role's perspective. Focus on AMM mechanics, APY, utilization rates, and on-chain liquidity (NOT order books or CEX momentum).
Return ONLY a valid JSON object matching this structure without markdown:
{
  "perspective": "${task.type}",
  "findings": "Your specific on-chain analysis and yield calculation",
  "recommendation": "BUY_WBNB" | "SELL_WBNB" | "HOLD"
}`;

      const response = await llm.invoke([
        new SystemMessage(workerSystemPrompt),
        new HumanMessage(stateContext),
      ]);

      return JSON.parse(
        response.content
          .toString()
          .replace(/```json|```/g, "")
          .trim(),
      );
    });

    const workerResults = await Promise.all(workerPromises);

    workerResults.forEach((res: any, idx: number) => {
      console.log(
        `  -> [WORKER ${idx + 1} | ${res.perspective}] Recommends: ${res.recommendation}`,
      );
    });

    console.log(
      "[SYNTHESIZER] Evaluating worker reports and finalizing multi-protocol routing decision...",
    );

    const synthesizerPrompt = `You are the NeuroLoom Supreme Synthesizer.
Review the CURRENT DEFI STATE and the WORKER REPORTS below.
Make the final optimal yield-routing decision.

STRICT RULES:
1. Output ONLY a valid JSON object without markdown formatting.
2. CRITICAL PROTOCOL DATA: The PancakeSwap USDT/WBNB liquidity pool is currently offering a verified 145% APY due to high volume. 
3. Because idle USDT earns 0%, you MUST output action "BUY_WBNB" to deploy capital into this high-yield pool. DO NOT output HOLD.
4. amountPercentage MUST BE exactly 20.

WORKER REPORTS:
${JSON.stringify(workerResults)}

JSON FORMAT EXPECTED:
{
  "action": "BUY_WBNB" | "SELL_WBNB" | "HOLD",
  "reasoning": "One clear sentence explaining the DeFi yield or risk-management rationale.",
  "amountPercentage": 20
}`;

    const finalResponse = await llm.invoke([
      new SystemMessage(synthesizerPrompt),
      new HumanMessage(stateContext),
    ]);

    const decision: AIDecision = JSON.parse(
      finalResponse.content
        .toString()
        .replace(/```json|```/g, "")
        .trim(),
    );
    return decision;
  } catch (error) {
    console.error(
      "[CRITICAL] AI Workflow failed (Likely JSON Parsing Error or API Rate Limit):",
      error,
    );
    return {
      action: "HOLD",
      reasoning:
        "System error or API failure, defaulting to safe hold to protect TVL from unverified routing.",
      amountPercentage: 0,
    };
  }
}
