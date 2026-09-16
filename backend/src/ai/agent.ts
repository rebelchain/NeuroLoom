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
 * Helper function untuk mengekstrak JSON dari output Gemini
 */
function extractJSON(rawText: string): any {
  const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error("No JSON structure found in response.");
  return JSON.parse(jsonMatch[0]);
}

/**
 * FUNGSI UTAMA: The Orchestrator-Workers Workflow
 */
export async function getAIDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
): Promise<AIDecision> {
  // Inisialisasi LLM secara global untuk efisiensi memori (gunakan 3.6-flash yang super cepat)
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    maxOutputTokens: 1024,
    temperature: 0.1, // Suhu rendah agar logis dan deterministik
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
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

    const orchestratorPrompt = `You are the Lead Orchestrator for NeuroLoom DeFi Optimizer.
Analyze the current state and delegate exactly 2 analytical tasks to specialized workers to get different perspectives before making a final trade decision. 
For example, one worker could analyze price momentum, while another evaluates portfolio risk or memory repetition.

Return ONLY a valid JSON object matching this structure:
{
  "analysis": "Brief explanation of what approaches are needed.",
  "tasks": [
    { "type": "MOMENTUM_ANALYST", "description": "Specific instruction for this worker" },
    { "type": "RISK_MANAGER", "description": "Specific instruction for this worker" }
  ]
}`;

    const orchestratorResponse = await llm.invoke([
      new SystemMessage(orchestratorPrompt),
      new HumanMessage(stateContext),
    ]);

    const plan = extractJSON(orchestratorResponse.content.toString());
    console.log(
      `[ORCHESTRATOR] Delegating ${plan.tasks.length} specialized approaches.`,
    );

    // ==========================================
    // PHASE 2: WORKERS (PARALLEL EXECUTION)
    // ==========================================
    console.log("[WORKERS] Generating specialized analysis concurrently...");

    // Menjalankan semua worker secara paralel menggunakan Promise.all
    const workerPromises = plan.tasks.map(async (task: WorkerTask) => {
      const workerSystemPrompt = `You are a specialized Web3 AI Worker. 
Role: ${task.type}. 
Your Assignment: ${task.description}.

Analyze the provided state strictly from your role's perspective. 
Return ONLY a valid JSON object matching this structure:
{
  "perspective": "${task.type}",
  "findings": "Your specific analysis and calculation",
  "recommendation": "BUY_WBNB | SELL_WBNB | HOLD"
}`;

      const response = await llm.invoke([
        new SystemMessage(workerSystemPrompt),
        new HumanMessage(stateContext),
      ]);

      return extractJSON(response.content.toString());
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

    const synthesizerPrompt = `You are the NeuroLoom Supreme Synthesizer.
Review the CURRENT STATE and the WORKER REPORTS below.
Make the final optimal trading decision.

STRICT RULES:
1. Output ONLY a valid JSON object.
2. If WBNB drops significantly and we have USDT, consider BUY_WBNB.
3. If WBNB rises significantly and we have WBNB, consider SELL_WBNB.
4. Do NOT repeat the exact same action from Recent Memories to prevent infinite loops.
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

    const decision: AIDecision = extractJSON(finalResponse.content.toString());
    return decision;
  } catch (error) {
    console.error(
      "[CRITICAL] AI Workflow failed, triggering circuit breaker:",
      error,
    );
    // Fallback yang aman jika terjadi rate-limit atau kegagalan parsing
    return {
      action: "HOLD",
      reasoning:
        "System error or API failure, defaulting to safe hold to protect TVL.",
      amountPercentage: 0,
    };
  }
}
