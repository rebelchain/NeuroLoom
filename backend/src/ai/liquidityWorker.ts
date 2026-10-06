import * as dotenvx from "@dotenvx/dotenvx";
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { liquidityRiskTools } from "../tools/liquidityTools.js";
import { pushLog } from "../utils/push-log.js";

dotenvx.config();

export async function runLiquidityRiskManager(
  taskDescription: string,
  marketContext: string,
): Promise<string> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY_1,
    model: "openai/gpt-oss-20b",
    maxTokens: 800,
    temperature: 0,
  });

  const llmWithTools = llm.bindTools(liquidityRiskTools);

  const messages: any[] = [
    new SystemMessage(`You are the Liquidity Risk Manager Worker for NeuroLoom. 
Evaluate slippage, liquidity depth, and impermanent loss risk using your tools.

Orchestrator Instructions: ${taskDescription}

CRITICAL: Before calling any tools, provide a brief reasoning of what risks you are looking for based on the current context.

You MUST output your final report with this specific quantitative metric:
1. Market Volatility Estimate (decimal): Based on current conditions, estimate the volatility (e.g., if you expect a 4.5% price swing, write 0.045).
2. Capital Safety & Slippage Threat Level.`),
    new HumanMessage(`Market Context: ${marketContext}`),
  ];

  await pushLog(
    "\n[WORKER] 🛡️ Liquidity Risk Manager is evaluating threats...",
  );

  try {
    const aiMessage = await llmWithTools.invoke(messages);
    messages.push(aiMessage);

    const initialThoughts = aiMessage.content?.toString().trim();
    if (initialThoughts) {
      await pushLog(` [LIQUIDITY MANAGER REASONING]:\n"${initialThoughts}"`);
    } else {
      await pushLog(
        `[LIQUIDITY MANAGER REASONING]:\n"I must verify on-chain liquidity depth and slippage parameters using my tools before making a risk assessment."`,
      );
    }

    if (aiMessage.tool_calls && aiMessage.tool_calls.length > 0) {
      await pushLog(
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

      await pushLog("[WORKER] ✍️ Formulating risk clearance report...");

      messages.push(
        new HumanMessage(
          "Now that you have the tool data, generate your final risk clearance report based ONLY on the data fetched.",
        ),
      );

      const finalResponse = await llmWithTools.invoke(messages);
      const report =
        finalResponse.content?.toString().trim() ||
        "Liquidity Risk Manager could not formulate a clear risk report based on tool output.";

      await pushLog(`📄 [LIQUIDITY MANAGER REPORT]:\n"${report}"`);
      return `[LIQUIDITY RISK REPORT]\n${report}`;
    }

    const report =
      initialThoughts || "Liquidity Risk Manager found no threats.";
    await pushLog(`📄 [LIQUIDITY MANAGER REPORT]:\n"${report}"`);
    return `[LIQUIDITY RISK REPORT]\n${report}`;
  } catch (error) {
    console.error("[WORKER ERROR] Liquidity Risk Manager failed:", error);
    return "[LIQUIDITY RISK REPORT]\nWARNING: Unable to verify on-chain liquidity. Proceed with extreme caution.";
  }
}
