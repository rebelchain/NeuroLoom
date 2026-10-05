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
Evaluate the proposed Tool Call draft for mathematical safety and logic.

STRICT RISK FRAMEWORK:
1. TESTNET SLIPPAGE LIMIT: Ensure the "slippageBps" parameter is set conservatively (e.g., 200 to 500 bps) to pass the Smart Contract's internal Oracle bounds. Do NOT use 10000 bps.
   -> EXCEPTION: If a CRITICAL DEMO DIRECTIVE explicitly overrides this (e.g., asking for 200 bps), you MUST ALLOW IT and output PASS.
2. SIZING LIMIT (VELOCITY GUARD): If the draft contains amount parameters in WEI (e.g., amountInWei, amount0DesiredWei), mentally divide by 10^18 to get standard units. The standard unit MUST NEVER exceed 20% of the target vault's TVL.
   -> EXCEPTION: If the tool is "close_liquidity_v3" or "withdraw_venus_deposit", there is no sizing limit (allow full withdrawal).
3. LP RANGE CHECK: If the tool relates to LP provision, ensure tickLower < tickUpper.

If the draft violates safety limits, output NEEDS_IMPROVEMENT and provide the exact mathematical correction.
If the draft aligns with instructions and safety limits, output PASS.

Output format:
<evaluation>PASS, NEEDS_IMPROVEMENT, or FAIL</evaluation>
<feedback>Your concise reasoning.</feedback>`;

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
