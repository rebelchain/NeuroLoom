import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";

export interface AIDecision {
  action: "BUY_WBNB" | "SELL_WBNB" | "HOLD";
  reasoning: string;
  amountPercentage: number;
}
// Tambahkan argumen ketiga: recentMemories
export async function getAIDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
): Promise<AIDecision> {
  const llm = new ChatGoogleGenerativeAI({
    model: "gemini-3.6-flash",
    maxOutputTokens: 512,
    temperature: 0.1,
    apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
  });

  const systemPrompt = `You are NeuroLoom AI, an autonomous DeFi Yield Optimizer on the BSC Network.
Your goal is to maximize portfolio value by trading between WBNB and USDT based on market momentum.

STRICT RULES:
1. You MUST output ONLY a valid JSON object. No pre-text, no post-text, no conversational words.
2. If WBNB price drops significantly (-2% or more) and we have USDT, action is "BUY_WBNB".
3. If WBNB price rises significantly (+2% or more) and we have WBNB, action is "SELL_WBNB".
4. If market is flat, OR if we don't have enough balance to execute the desired action, action is "HOLD".
5. CRITICAL: Review your "Recent Memories". Do NOT repeat the exact same BUY or SELL action if it is already in the recent memories.
6. amountPercentage must be a number between 0 and 100.

JSON FORMAT EXPECTED:
{
  "action": "BUY_WBNB" | "SELL_WBNB" | "HOLD",
  "reasoning": "Explain your logic in one sentence",
  "amountPercentage": 50
}`;

  // [PERBAIKAN]: Menyuntikkan ingatan ke dalam prompt
  const userPrompt = `CURRENT STATE:
- Market Data: ${JSON.stringify(marketData)}
- Vault Balances: ${JSON.stringify(vaultState)}
- Recent Memories (Last Decisions): ${JSON.stringify(recentMemories)}

Analyze the state and return your decision in JSON.`;

  try {
    const response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userPrompt),
    ]);

    const rawContent = response.content.toString();

    // [PERBAIKAN]: Kita log raw output ke terminal agar kita tahu persis apa yang Gemini bicarakan
    console.log("\n[DEBUG] Raw AI Output:\n", rawContent);

    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error(
        "Failed to find the JSON structure in the AI ​​response.",
      );
    }

    const decision: AIDecision = JSON.parse(jsonMatch[0]);
    return decision;
  } catch (error) {
    console.error("AI Brain failed to process data:", error);
    return {
      action: "HOLD",
      reasoning: "System error or API failure, defaulting to safe hold.",
      amountPercentage: 0,
    };
  }
}
