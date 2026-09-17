import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

export interface AIDecision {
  action: "BUY_WBNB" | "SELL_WBNB" | "HOLD";
  reasoning: string;
  amountPercentage: number;
}

interface WorkerTask {
  type: string;
  description: string;
}

/**
 * FUNGSI UTAMA: The Orchestrator-Workers Workflow
 */
export async function getAIDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
): Promise<AIDecision> {
  // Inisialisasi LLM secara global untuk efisiensi memori
  const llm = new ChatOpenAI({
    modelName: "google/gemma-4-26b-a4b-it:free",
    temperature: 0.1,
    maxTokens: 4096,
    openAIApiKey: process.env.OPENAI_API_KEY,
    configuration: {
      baseURL: "https://openrouter.ai/api/v1",
      defaultHeaders: {
        "HTTP-Referer": "https://neuroloom.app",
        "X-Title": "NeuroLoom",
      },
    },
  });

  // [PERBAIKAN]: Konteks diubah dari "Market Data" murni menjadi "DeFi State"
  const stateContext = `
CURRENT DEFI STATE:
- Protocol Data (AMM Depth & Lending Rates): ${JSON.stringify(marketData)}
- Vault Balances: ${JSON.stringify(vaultState)}
- Recent Memories (Last Routing Decisions): ${JSON.stringify(recentMemories)}
  `;

  try {
    // ==========================================
    // PHASE 1: ORCHESTRATOR (ANALYSIS & PLANNING)
    // ==========================================
    console.log(
      "[ORCHESTRATOR] Analyzing AMM liquidity and planning task delegation...",
    );

    // [PERBAIKAN]: Mengarahkan Orchestrator untuk memikirkan Yield, Impermanent Loss, dan Slippage (Bukan Volatility)
    const orchestratorPrompt = `You are the Lead Orchestrator for the NeuroLoom DeFi Yield Optimizer.
Analyze the current on-chain state (AMM liquidity depth, lending pool utilization rates, and vault balances).
Delegate between 1 to 3 analytical tasks to specialized workers based on current DeFi yield opportunities, impermanent loss risks, and slippage data.

Return ONLY a valid JSON object matching this structure without any markdown formatting:
{
  "analysis": "Brief explanation of what yield strategies or risk checks are needed.",
  "tasks": [
    { "type": "YIELD_STRATEGIST", "description": "Specific instruction for this worker" },
    { "type": "LIQUIDITY_RISK_MANAGER", "description": "Specific instruction for this worker" }
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
      `[ORCHESTRATOR] Delegating ${plan.tasks.length} specialized approaches.`,
    );

    // ==========================================
    // PHASE 2: WORKERS (PARALLEL EXECUTION)
    // ==========================================
    console.log(
      "[WORKERS] Generating specialized yield and risk analysis concurrently...",
    );

    const workerPromises = plan.tasks.map(async (task: WorkerTask) => {
      // [PERBAIKAN]: Melarang worker menggunakan istilah Order Book atau CEX
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

    // ==========================================
    // PHASE 3: SYNTHESIZER (FINAL DECISION)
    // ==========================================
    console.log(
      "[SYNTHESIZER] Evaluating worker reports and finalizing multi-protocol routing decision...",
    );

    // [PERBAIKAN]: Merombak Aturan Keputusan (Rules 2 & 3) menjadi bahasa DeFi Yield Routing
    const synthesizerPrompt = `You are the NeuroLoom Supreme Synthesizer.
Review the CURRENT DEFI STATE and the WORKER REPORTS below.
Make the final optimal yield-routing decision.

STRICT RULES:
1. Output ONLY a valid JSON object without markdown formatting.
2. If PancakeSwap AMM liquidity offers optimal depth and WBNB yields outpace holding USDT, consider BUY_WBNB (Swap USDT to WBNB for yield pairing).
3. If Venus lending rates for USDT spike, or WBNB faces impermanent loss/price degradation risks, consider SELL_WBNB (Swap WBNB to USDT to lock in stable yield).
4. Avoid repeating the exact same action from Recent Memories UNLESS market conditions strongly justify compounding the position.
5. amountPercentage must be between 0 and 100.

WORKER REPORTS:
${JSON.stringify(workerResults)}

JSON FORMAT EXPECTED:
{
  "action": "BUY_WBNB" | "SELL_WBNB" | "HOLD",
  "reasoning": "One clear sentence explaining the DeFi yield or risk-management rationale.",
  "amountPercentage": 50
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
      "[CRITICAL] AI Workflow failed, triggering circuit breaker:",
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
