import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGroq } from "@langchain/groq";
import { CONFIG } from "../config.js";

// regex xml tags
export function extractXML(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export interface ToolDraft {
  toolName: string;
  args: any;
}

export async function generateDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
  feedbackContext: string = "",
): Promise<{ thoughts: string; draft: ToolDraft | null }> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-safeguard-20b",
    temperature: 0.1,
  });

  const VAULT_STRATEGIES = `
1. "The Yield Farm" (Address: ${CONFIG.VAULTS.YIELD_FARM}): execute_venus_deposit. Rule: Max 80% allocation (leave 20% buffer).
2. "Bluechip Momentum" (Address: ${CONFIG.VAULTS.BLUECHIP}): execute_pancake_swap (BUY_WBNB / SELL_WBNB). Rule: Requires clear reversal Market Structure.
3. "Degen Accumulator" (Address: ${CONFIG.VAULTS.DEGEN}): execute_pancake_swap (BUY_BTCB / SELL_BTCB). Rule: High volatility strategy.

CRITICAL RULE FOR amountInWei: 
amountInWei represents the amount of INPUT tokens you are spending, NOT the output you want. 
If action is BUY_WBNB, you are spending USDT. Therefore, if you want to spend 4,000 USDT, amountInWei MUST be "4000000000000000000000" (4000 * 10^18). Do NOT convert it to WBNB amounts!
`;

  const systemPrompt = `You are the NeuroLoom Quant Agent. 
Your goal is to complete the execution task based on the DEFI STATE. 
If there is feedback from your previous generations, you must reflect on it to improve your solution.

AVAILABLE STRATEGIES:
${VAULT_STRATEGIES}

Output strictly in this XML format:
<thoughts>
[Your understanding of the TAAPI market structure, Risk/Reward calculation, and which specific Vault Strategy to use]
</thoughts>

<response>
[A valid JSON object representing your execution plan. Example: {"toolName": "execute_pancake_swap", "args": {"vaultAddress": "${CONFIG.VAULTS.BLUECHIP}", "action": "BUY_WBNB", "amountInWei": "5000000000000000000", "currentPriceStr": "590"}}]
</response>
`;

  const replacer = (key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;
  let userContext = `DEFI STATE: ${JSON.stringify(marketData)}\nVAULT BALANCE: ${JSON.stringify(vaultState, replacer)}\nMEMORIES: ${JSON.stringify(recentMemories)}`;

  if (feedbackContext) {
    userContext += `\n\nFEEDBACK FROM RISK OFFICER:\n${feedbackContext}\nYou MUST fix your previous draft based on this feedback.`;
  }

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContext),
    ]);

    const rawContent = response.content.toString();
    const thoughts = extractXML(rawContent, "thoughts");
    const responseJsonString = extractXML(rawContent, "response");

    if (!responseJsonString) return { thoughts, draft: null };

    const cleanJson = responseJsonString.replace(/```json|```/g, "").trim();
    const draft: ToolDraft = JSON.parse(cleanJson);

    return { thoughts, draft };
  } catch (error) {
    console.error(
      "[AGENT ERROR] Failed to assemble the XML/JSON structure:",
      error,
    );
    return { thoughts: "Internal API Error", draft: null };
  }
}
