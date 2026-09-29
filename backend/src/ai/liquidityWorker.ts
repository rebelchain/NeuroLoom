import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { liquidityRiskTools } from "../tools/liquidityTools.js";

export async function runLiquidityRiskManager(
  taskDescription: string,
  marketContext: string,
): Promise<string> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-20b",
    maxTokens: 800,
    temperature: 0,
  });

  const llmWithTools = llm.bindTools(liquidityRiskTools);

  const messages: any[] = [
    new SystemMessage(`You are the Liquidity Risk Manager Worker for NeuroLoom. 
Your sole responsibility is to evaluate slippage, liquidity depth, and impermanent loss risk.
Do not recommend yields. Only report on capital safety and execution risks.
You MUST use your tools to check real liquidity depth and simulate slippage.

Orchestrator Instructions: ${taskDescription}`),
    new HumanMessage(`Market Context: ${marketContext}`),
  ];

  console.log("\n[WORKER] 🛡️ Liquidity Risk Manager is evaluating threats...");

  try {
    const aiMessage = await llmWithTools.invoke(messages);
    messages.push(aiMessage);

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      console.log(
        `[WORKER] 🛠️ Executing ${aiMessage.tool_calls.length} liquidity tools in parallel...`,
      );

      const toolPromises = aiMessage.tool_calls.map(async (toolCall) => {
        const selectedTool = liquidityRiskTools.find(
          (t) => t.name === toolCall.name,
        );
        if (!selectedTool) return null;

        const toolResult = await (selectedTool as any).invoke(toolCall.args);

        return new ToolMessage({
          tool_call_id: toolCall.id!,
          content: toolResult,
        });
      });

      const toolMessages = (await Promise.all(toolPromises)).filter(Boolean);
      messages.push(...toolMessages);

      console.log("[WORKER] ✍️ Formulating risk clearance report...");
      const finalResponse = await llmWithTools.invoke(messages);
      return `[LIQUIDITY RISK REPORT]\n${finalResponse.content.toString()}`;
    }

    return `[LIQUIDITY RISK REPORT]\n${aiMessage.content.toString()}`;
  } catch (error) {
    console.error("[WORKER ERROR] Liquidity Risk Manager failed:", error);
    return "[LIQUIDITY RISK REPORT]\nWARNING: Unable to verify on-chain liquidity. Proceed with extreme caution.";
  }
}
