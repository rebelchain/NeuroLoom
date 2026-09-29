import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { yieldStrategistTools } from "../tools/yieldTools.js";


export async function runYieldStrategist(
  taskDescription: string,
  marketContext: string,
): Promise<string> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-20b",
    maxTokens: 800,
    temperature: 0.1,
  });

  const llmWithTools = llm.bindTools(yieldStrategistTools);

  const messages: any[] = [
    new SystemMessage(`You are the Yield Strategist Worker for NeuroLoom. 
Your task is to analyze DeFi yields based on the market context provided.
You MUST use your tools to fetch real data for both Stablecoins (e.g., USDT) and Volatile assets (e.g., WBNB).

Orchestrator Instructions:
${taskDescription}

Provide a concise strategic report highlighting:
1. Best Stablecoin Yield
2. Best Volatile Yield
3. Strategic Recommendation`),
    new HumanMessage(`Market Context: ${marketContext}`),
  ];

  console.log(
    "\n[WORKER] Yield Strategist is thinking and planning tool execution...",
  );

  try {

    const aiMessage = await llmWithTools.invoke(messages);
    messages.push(aiMessage); 

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log(
        `[WORKER] Executing ${aiMessage.tool_calls.length} tools in parallel...`,
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

      console.log("[WORKER] Synthesizing tool results into final report...");

      const finalResponse = await llmWithTools.invoke(messages);
      return finalResponse.content.toString();
    }

    return aiMessage.content.toString();
  } catch (error) {
    console.error("[WORKER ERROR] Yield Strategist failed:", error);
    return "Yield analysis failed due to network or logic error.";
  }
}
