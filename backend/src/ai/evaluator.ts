import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { ToolDraft, extractXML } from "./agent.js";
import { formatUnits } from "viem";
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
1. "execute_pancake_swap": The action (BUY/SELL) MUST logically align with the TAAPI market structure.
2. Vault Targeting: Ensure the draft uses the correct vaultAddress for its strategy.
3. Ignore exact amount limitations, the execution engine will forcibly allocate exactly 1% of the vault balance. Focus on verifying the STRATEGIC DIRECTION.

Output your evaluation concisely in the following XML format:
<evaluation>PASS, NEEDS_IMPROVEMENT, or FAIL</evaluation>
<feedback>
What needs improvement and why. If PASS, briefly state why it is safe.
</feedback>`;

  const context = `DEFI STATE: ${JSON.stringify(marketData)}
AVAILABLE BALANCES (USDT) & ADDRESS MAPPING:
- Yield Farm (${CONFIG.VAULTS.YIELD_FARM}): ${formatUnits(vaultBalances.yieldFarm, 6)}
- Bluechip (${CONFIG.VAULTS.BLUECHIP}): ${formatUnits(vaultBalances.bluechip, 6)}
- Degen (${CONFIG.VAULTS.DEGEN}): ${formatUnits(vaultBalances.degen, 6)}
PROPOSED TOOL CALL: ${JSON.stringify(draft)}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(evaluatorPrompt),
      new HumanMessage(context),
    ]);
    const rawContent = response.content.toString();
    const evaluation = extractXML(rawContent, "evaluation").toUpperCase();
    const feedback = extractXML(rawContent, "feedback");

    if (["PASS", "NEEDS_IMPROVEMENT", "FAIL"].includes(evaluation))
      return { status: evaluation as any, feedback };
    return {
      status: "FAIL",
      feedback: "Evaluator returned invalid status format.",
    };
  } catch (error) {
    return {
      status: "FAIL",
      feedback: "Internal LLM Error during evaluation.",
    };
  }
}
