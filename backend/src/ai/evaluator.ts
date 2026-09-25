import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { ToolDraft, extractXML } from "./agent.js";
import { formatEther } from "viem";
import { CONFIG } from "../config.js";

export async function evaluateDecision(
  llm: ChatGroq,
  draft: ToolDraft,
  marketData: any,
  vaultBalances: { yieldFarm: bigint; bluechip: bigint; degen: bigint },
): Promise<{
  status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
  feedback: string;
}> {
  const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom.
Evaluate the proposed Tool Call draft based on the DEFI STATE.

STRICT RULES:
1. "execute_venus_deposit": MUST NOT deposit 100%. Maximum allowed is 80% to leave a 20% liquidity buffer.
2. "execute_pancake_swap": The action (BUY/SELL) MUST logically align with the TAAPI market structure (e.g., don't BUY_WBNB if EMA200 is bearish and RSI is overbought).
3. Vault Targeting: Ensure the draft uses the correct vaultAddress for its strategy.
4. The amountInWei MUST NOT exceed the available balance of the TARGETED vault.

Output your evaluation concisely in the following XML format:
<evaluation>PASS, NEEDS_IMPROVEMENT, or FAIL</evaluation>
<feedback>
What needs improvement and why. If PASS, briefly state why it is safe.
</feedback>`;


const context = `DEFI STATE: ${JSON.stringify(marketData)}
AVAILABLE BALANCES (USDT) & ADDRESS MAPPING:
- Yield Farm (${CONFIG.VAULTS.YIELD_FARM}): ${formatEther(vaultBalances.yieldFarm)}
- Bluechip (${CONFIG.VAULTS.BLUECHIP}): ${formatEther(vaultBalances.bluechip)}
- Degen (${CONFIG.VAULTS.DEGEN}): ${formatEther(vaultBalances.degen)}
PROPOSED TOOL CALL: ${JSON.stringify(draft)}`;

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
