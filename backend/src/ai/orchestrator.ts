import * as dotenvx from "@dotenvx/dotenvx";
import { ChatGroq } from "@langchain/groq";
import { getActiveGroqKey, rotateGroqKey } from "../utils/apiRotator.js";
import { pushLog } from "../utils/push-log.js";
dotenvx.config();

export interface OrchestratorTask {
  type: string;
  description: string;
}

async function invokeGroqWithRetry(
  messages: any[],
  maxRetries = 2,
): Promise<any> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const llm = new ChatGroq({
        apiKey: getActiveGroqKey(),
        model: "openai/gpt-oss-20b",
        maxTokens: 800,
        temperature: 0.1,
      });

      return await llm.invoke(messages);
    } catch (error: any) {
      const isQuotaError =
        error.message?.includes("429") ||
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("quota");

      if (isQuotaError && attempt < maxRetries) {
        console.warn(
          `\n⚠️ [WARNING] Groq API Limit habis. Mengeksekusi rotasi...`,
        );
        rotateGroqKey();
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

export async function runOrchestrator(
  marketData: any,
): Promise<OrchestratorTask[]> {
  const prompt = `You are the NeuroLoom Orchestrator. 
Analyze the current DEFI STATE and determine which specialized workers need to be deployed to formulate the best strategy.

Available Workers:
- YIELD_STRATEGIST: Analyzes APY and yield opportunities.
- LIQUIDITY_RISK: Analyzes slippage, liquidity depth, and impermanent loss risk.

Based on the volatility and conditions in the DEFI STATE, you can call one or both workers. 
Return your response STRICTLY in this XML format:

<analysis>
Briefly explain your reasoning for choosing these specific workers based on the current market.
</analysis>

<tasks>
  <task>
    <type>WORKER_TYPE</type>
    <description>Specific instructions for what this worker should analyze</description>
  </task>
</tasks>

DEFI STATE: ${JSON.stringify(marketData)}`;

  console.log("[ORCHESTRATOR] Analyzing market and planning tasks.");
  const response = await invokeGroqWithRetry([
    { role: "user", content: prompt },
  ]);
  const content = response.content.toString();

  const tasks: OrchestratorTask[] = [];
  const taskMatches = content.match(/<task>([\s\S]*?)<\/task>/g) || [];

  for (const taskStr of taskMatches) {
    const typeMatch = taskStr.match(/<type>(.*?)<\/type>/);
    const descMatch = taskStr.match(/<description>(.*?)<\/description>/);

    if (typeMatch && descMatch) {
      tasks.push({
        type: typeMatch[1].trim(),
        description: descMatch[1].trim(),
      });
    }
  }

  const analysisMatch = content.match(/<analysis>([\s\S]*?)<\/analysis>/);
  if (analysisMatch) {
    await pushLog(`\n[ORCHESTRATOR ANALYSIS]:\n"${analysisMatch[1].trim()}"\n`);
  }

  return tasks;
}
