import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

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
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    maxOutputTokens: 1024,
    temperature: 0.1, // Suhu rendah agar logis dan deterministik
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
    // [UPGRADE 1]: Memaksa Gemini merespons dengan JSON murni!
    // modelKwargs: { response_mime_type: "application/json" } // Opsional: Buka komen ini jika Langchain terbarumu mendukungnya
  });

  const stateContext = `
CURRENT STATE:
- Market Data: ${JSON.stringify(marketData)}
- Vault Balances: ${JSON.stringify(vaultState)}
- Recent Memories (Last Decisions): ${JSON.stringify(recentMemories)}
  `;

  try {
    // ==========================================
    // PHASE 1: ORCHESTRATOR (ANALYSIS & PLANNING)
    // ==========================================
    console.log(
      "[ORCHESTRATOR] Analyzing state and planning task delegation...",
    );

    // [UPGRADE 2]: Dynamic Worker Count (1 to 3 tasks)
    const orchestratorPrompt = `You are the Lead Orchestrator for NeuroLoom DeFi Optimizer.
Analyze the current state and delegate between 1 to 3 analytical tasks to specialized workers based on the current market volatility and data complexity. 

Return ONLY a valid JSON object matching this structure without any markdown formatting:
{
  "analysis": "Brief explanation of what approaches are needed.",
  "tasks": [
    { "type": "MOMENTUM_ANALYST", "description": "Specific instruction for this worker" }
  ]
}`;

    const orchestratorResponse = await llm.invoke([
      new SystemMessage(orchestratorPrompt),
      new HumanMessage(stateContext),
    ]);

    // Berkat Gemini 3.6 Flash, kita bisa langsung parse tanpa regex aneh
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
    console.log("[WORKERS] Generating specialized analysis concurrently...");

    const workerPromises = plan.tasks.map(async (task: WorkerTask) => {
      const workerSystemPrompt = `You are a specialized Web3 AI Worker. 
Role: ${task.type}. 
Your Assignment: ${task.description}.

Analyze the provided state strictly from your role's perspective. 
Return ONLY a valid JSON object matching this structure without markdown:
{
  "perspective": "${task.type}",
  "findings": "Your specific analysis and calculation",
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
      "[SYNTHESIZER] Evaluating worker reports and finalizing decision...",
    );

    // [UPGRADE 3]: Relaxed Rule #4 untuk membolehkan Compounding/DCA
    const synthesizerPrompt = `You are the NeuroLoom Supreme Synthesizer.
Review the CURRENT STATE and the WORKER REPORTS below.
Make the final optimal trading decision.

STRICT RULES:
1. Output ONLY a valid JSON object without markdown formatting.
2. If WBNB drops significantly and we have USDT, consider BUY_WBNB.
3. If WBNB rises significantly and we have WBNB, consider SELL_WBNB.
4. Avoid repeating the exact same action from Recent Memories UNLESS market conditions strongly justify compounding the position (DCA).
5. amountPercentage must be between 0 and 100.

WORKER REPORTS:
${JSON.stringify(workerResults)}

JSON FORMAT EXPECTED:
{
  "action": "BUY_WBNB" | "SELL_WBNB" | "HOLD",
  "reasoning": "One clear sentence explaining why this final decision was made over others.",
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
        "System error or API failure, defaulting to safe hold to protect TVL.",
      amountPercentage: 0,
    };
  }
}
