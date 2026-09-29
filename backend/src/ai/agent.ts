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
  yieldReport: string,
  feedbackContext: string = "",
): Promise<{ thoughts: string; draft: ToolDraft | null }> {
  const llm = new ChatGroq({
    apiKey: process.env.GROQ_API_KEY,
    model: "openai/gpt-oss-20b",
    maxTokens: 800,
    temperature: 0.1,
  });

const VAULT_STRATEGIES = `
1. "The Yield Farm" (Address: ${CONFIG.VAULTS.YIELD_FARM}): execute_venus_deposit. 
2. "Bluechip Momentum" (Address: ${CONFIG.VAULTS.BLUECHIP}): execute_pancake_swap (BUY_WBNB / SELL_WBNB).
3. "Degen Accumulator" (Address: ${CONFIG.VAULTS.DEGEN}): execute_pancake_swap (BUY_BTCB / SELL_BTCB).
4. "Capital Preservation" : hold_position. Rule: If market is highly volatile, uncertain, or risking impermanent loss, do nothing.

CRITICAL RULE FOR amountInWei: 
The execution engine will forcibly allocate exactly 1% of the vault's live balance. 
You do NOT need to calculate wei. Simply output "AUTO" for the amountInWei field.
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

  let userContext = `DEFI STATE: ${JSON.stringify(marketData)}
VAULT BALANCE: ${JSON.stringify(vaultState, replacer)}
MEMORIES: ${JSON.stringify(recentMemories)}

YIELD STRATEGIST REPORT:
${yieldReport}`;

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
