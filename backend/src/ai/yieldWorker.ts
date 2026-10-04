import * as dotenvx from "@dotenvx/dotenvx";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { yieldStrategistTools } from "../tools/yieldTools.js";
import { pushLog } from "../utils/push-log.js";

dotenvx.config();

export async function runYieldStrategist(
  taskDescription: string,
  marketContext: string,
): Promise<string> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY_2,
    model: "openai/gpt-oss-20b",
    maxTokens: 800,
    temperature: 0.1,
  });

  const llmWithTools = llm.bindTools(yieldStrategistTools);

  const messages: any[] = [
    new SystemMessage(`You are the Yield Strategist Worker for NeuroLoom. 
Your task is to analyze DeFi yields based on the market context provided.

Orchestrator Instructions:
${taskDescription}

CRITICAL: Before using any tools, briefly explain your reasoning and what specific data you need to fetch based on the Orchestrator's instructions.

Provide a concise strategic report highlighting EXACT NUMBERS in decimals:
1. Risk-Free Rate (e.g., Venus stablecoin APY. If 5%, write 0.05)
2. Expected Volatile Yield (e.g., DEX APR. If 22%, write 0.22)
3. Strategic Recommendation`),
    new HumanMessage(`Market Context: ${marketContext}`),
  ];

  await pushLog("\n[WORKER] Yield Strategist is analyzing the market...");

  try {
    const aiMessage = await llmWithTools.invoke(messages);
    messages.push(aiMessage);

    // TANGKAP REASONING AWAL (Bahkan jika kosong, kita berikan fallback)
    const initialThoughts = aiMessage.content?.toString().trim();
    if (initialThoughts) {
      await pushLog(` [YIELD STRATEGIST REASONING]:\n"${initialThoughts}"`);
    } else {
      await pushLog(
        `[YIELD STRATEGIST REASONING]:\n"I need to fetch live data using my tools first before providing a report."`,
      );
    }

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      await pushLog(
        `[WORKER] Executing ${aiMessage.tool_calls.length} yield tools in parallel...`,
      );

      const toolPromises = aiMessage.tool_calls.map(async (toolCall) => {
        const selectedTool = yieldStrategistTools.find(
          (t) => t.name === toolCall.name,
        );

        if (!selectedTool) return null;

        const toolResult = await (selectedTool as any).invoke(toolCall.args);

        return new ToolMessage({
          tool_call_id: toolCall.id!,
          content: toolResult,
        });
      });

      const results = await Promise.allSettled(toolPromises);
      const toolMessages = results
        .filter((r) => r.status === "fulfilled" && r.value)
        .map((r) => (r as PromiseFulfilledResult<any>).value);

      messages.push(...toolMessages);

      await pushLog("[WORKER] Synthesizing yield data into final report...");

      // PAKSA LLM UNTUK MENJAWAB SETELAH TOOLS
      messages.push(
        new HumanMessage(
          "Now that you have the tool data, generate your final strategic report based ONLY on the data fetched.",
        ),
      );

      const finalResponse = await llmWithTools.invoke(messages);
      const report =
        finalResponse.content?.toString().trim() ||
        "Yield Strategist determined no clear action based on current data.";

      await pushLog(`📄 [YIELD STRATEGIST REPORT]:\n"${report}"`);
      return report;
    }

    const report =
      initialThoughts || "Yield Strategist found no relevant data.";
    await pushLog(`📄 [YIELD STRATEGIST REPORT]:\n"${report}"`);
    return report;
  } catch (error) {
    console.error("[WORKER ERROR] Yield Strategist failed:", error);
    return "Yield analysis failed due to network or logic error.";
  }
}
