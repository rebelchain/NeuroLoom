import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { ToolDraft, extractXML } from "./agent.js";
import { formatEther } from "viem";

export async function evaluateDecision(
  llm: ChatGroq,
  draft: ToolDraft,
  marketData: any,
  vaultBalanceWei: bigint,
): Promise<{
  status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
  feedback: string;
}> {
  const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom.
Evaluate the proposed Tool Call draft based on the DEFI STATE.

STRICT RULES:
1. "execute_venus_deposit": MUST NOT deposit 100%. Maximum allowed is 80% to leave a 20% liquidity buffer.
2. "execute_pancake_swap": The action (BUY/SELL) MUST logically align with the TAAPI market structure (e.g., don't BUY_WBNB if EMA200 is bearish and RSI is overbought).
3. The amountInWei MUST NOT exceed the available vault balance.

Output your evaluation concisely in the following XML format:
<evaluation>PASS, NEEDS_IMPROVEMENT, or FAIL</evaluation>
<feedback>
What needs improvement and why. If PASS, briefly state why it is safe.
</feedback>`;


  const balanceEther = formatEther(vaultBalanceWei);
  const context = `DEFI STATE: ${JSON.stringify(marketData)}\nAVAILABLE BALANCE (USDT): ${balanceEther}\nPROPOSED TOOL CALL: ${JSON.stringify(draft)}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(evaluatorPrompt),
      new HumanMessage(context),
    ]);

    const rawContent = response.content.toString();
    const evaluation = extractXML(rawContent, "evaluation").toUpperCase();
    const feedback = extractXML(rawContent, "feedback");

    if (["PASS", "NEEDS_IMPROVEMENT", "FAIL"].includes(evaluation)) {
      return { status: evaluation as any, feedback };
    }

    return {
      status: "FAIL",
      feedback: "Evaluator returned invalid status format.",
    };
  } catch (error) {
    console.error("[EVALUATOR ERROR]", error);
    return {
      status: "FAIL",
      feedback: "Internal LLM Error during evaluation.",
    };
  }
}
