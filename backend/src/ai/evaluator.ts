import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { formatUnits } from "viem";
import { ToolDraft, extractXML } from "./agent.js";

export async function evaluateDecision(
  llm: any,
  draft: ToolDraft,
  marketData: any,
  vaultBalances: { yieldFarm: bigint; bluechip: bigint; degen: bigint },
): Promise<{
  status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
  feedback: string;
}> {
  const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom.
Evaluate the proposed Tool Call draft.

STRICT RULES:
Slippage Check: If the tool is 'provide_liquidity_v3' or 'execute_pancake_swap', slippageBps MUST be set to 10000 for the testnet environment. Do NOT enforce or ask for slippageBps if the tool is 'close_liquidity_v3'.
2. Sizing Limit (CRITICAL MATH): The amounts in the draft (like amount0DesiredWei and amount1DesiredWei) are in WEI (10^18 format). You MUST mentally remove 18 zeros (divide by 10^18) to get the standard unit. For example, 5900000000000000000 Wei is ONLY 5.9 units! The standard unit amount MUST NEVER exceed 20% of the target vault's TVL (Velocity Guard limit).
3. LP Range Check: If tool is "provide_liquidity_v3", the tickLower and tickUpper must encase the current market price reasonably.

If any of the rules above are violated (especially SIZING), you MUST output NEEDS_IMPROVEMENT and explain exactly how they should fix the math.
ONLY output FAIL if the action is completely malicious.
Output PASS if everything is mathematically safe.

Output your evaluation concisely in the following XML format:
<evaluation>PASS, NEEDS_IMPROVEMENT, or FAIL</evaluation>
<feedback>
State specifically what math or parameter is wrong, and provide the correct calculation.
</feedback>`;

  const context = `DEFI STATE: ${JSON.stringify(marketData)}\nBALANCES: 
Yield Farm: ${formatUnits(vaultBalances.yieldFarm, 18)} 
Bluechip: ${formatUnits(vaultBalances.bluechip, 18)} 
Degen: ${formatUnits(vaultBalances.degen, 18)}
PROPOSED DRAFT: ${JSON.stringify(draft)}`;

  try {
    const response = await llm.invoke([
      new SystemMessage(evaluatorPrompt),
      new HumanMessage(context),
    ]);
    const rawContent = response.content.toString();

    let evaluation = extractXML(rawContent, "evaluation").toUpperCase();
    let feedback = extractXML(rawContent, "feedback");

    if (!evaluation || !feedback) {
      console.log(
        `\n[WARNING] Evaluator format parsing failed. RAW OUTPUT:\n${rawContent}\n`,
      );
      if (rawContent.toUpperCase().includes("PASS")) evaluation = "PASS";
      else if (rawContent.toUpperCase().includes("NEEDS_IMPROVEMENT"))
        evaluation = "NEEDS_IMPROVEMENT";
      else evaluation = "FAIL";
      feedback = feedback || rawContent.trim();
    }

    if (["PASS", "NEEDS_IMPROVEMENT", "FAIL"].includes(evaluation))
      return { status: evaluation as any, feedback };

    return { status: "FAIL", feedback: "Evaluator returned invalid format." };
  } catch (error) {
    console.error("[EVALUATOR ERROR]", error);
    return { status: "FAIL", feedback: "Internal LLM Error." };
  }
}
