import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../config.js";
import { getAdaptiveContext } from "../utils/memoryMiddleware.js";

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
  const llm = new ChatGoogleGenerativeAI({
    apiKey: process.env.GEMINI_API_KEY,
    model: "gemini-3-flash-preview",
    temperature: 0.1,
  });

  const VAULT_STRATEGIES = `
1. "The Yield Farm" (${CONFIG.VAULTS.YIELD_FARM}) -> Target Tool: "execute_venus_deposit"
   - args: {"amountInWei": "string"}
2. "Bluechip Momentum" (${CONFIG.VAULTS.BLUECHIP}) -> Target Tool: "execute_pancake_swap" OR "provide_liquidity_v3"
3. "Degen Accumulator" (${CONFIG.VAULTS.DEGEN}) -> Target Tool: "execute_pancake_swap" OR "provide_liquidity_v3"
4. "IL Defense / Capital Preservation" -> Target Tool: "close_liquidity_v3" OR "hold_position"

CRITICAL WORKFLOW:
1. EMERGENCY CHECK: Read the POSITION_HEALTH_RADAR from the DEFI STATE. If any vault reports "OUT_OF_RANGE", your IMMEDIATE action MUST be to output "close_liquidity_v3".
2. PRE-TRADE MATH: Before executing any new LP position, you MUST call "calculate_v3_lp_params".
   -> REQUIRED ARGS for calculate_v3_lp_params:
      {
        "tokenA": "${CONFIG.TOKENS.WBNB}",
        "tokenB": "${CONFIG.TOKENS.USDT}",
        "currentPrice": (current price from DEFI STATE, number),
        "atrVolatilityPercent": (estimate from Liquidity Risk Report, e.g., 5.0, number),
        "marketDirection": ("SIDEWAYS", "BULLISH", or "BEARISH"),
        "amountADesiredWei": (WBNB amount in WEI, string),
        "amountBDesiredWei": (USDT amount in WEI, string)
      }
3. PRE-FLIGHT DEFENSE: After getting the ticks from memory, you MUST call "simulate_il_risk".
4. LP EXECUTION RULE: When calling "provide_liquidity_v3", you MUST set "slippageBps": 10000 to prevent testnet revert.
5. SIZING LIMIT: To pass the Risk Officer, NEVER allocate more than 20% of the vault's total balance in a single execution. (CRITICAL REMINDER: Your vault balances are in USDT. If you want to allocate WBNB, you must calculate its equivalent USDT value first based on the currentPrice!).
6. If simulated IL risk > expected fees, pivot to Venus deposit or hold.
  `;

  const adaptiveMemoryWarning = await getAdaptiveContext();

  const systemPrompt = `You are the NeuroLoom Quant Agent. 
Your goal is to complete the execution task based on the DEFI STATE. 
${adaptiveMemoryWarning}

AVAILABLE STRATEGIES:
${VAULT_STRATEGIES}

You MUST output your decision STRICTLY in the exact XML format below. Do not add markdown blocks like \`\`\`xml.

<thoughts>
Write your mathematical reasoning, Volatility assessment, IL defense logic, and strategy selection here.
</thoughts>
<response>
{"toolName": "tool_name_here", "args": {"arg1": "value1"}}
</response>

Example for HOLDING:
<thoughts>Market is too risky and yields are low. Capital preservation is priority.</thoughts>
<response>{"toolName": "hold_position", "args": {}}</response>
`;

  const replacer = (key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;

  let userContext = `DEFI STATE: ${JSON.stringify(marketData)}\nVAULT BALANCE: ${JSON.stringify(vaultState, replacer)}\nMEMORIES: ${JSON.stringify(recentMemories)}\nYIELD REPORT:\n${yieldReport}`;

  if (feedbackContext) {
    userContext += `\n\nFEEDBACK FROM RISK OFFICER:\n${feedbackContext}\nYou MUST fix your previous draft.`;
  }

  try {
    // Panggilan pertama dengan instruksi pemaksaan teks
    let response = await llm.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContext),
      new HumanMessage(
        "CRITICAL INSTRUCTION: You MUST output raw text. Do not use native tool calls. Begin your response exactly with the <thoughts> tag.",
      ),
    ]);

    let rawContent = response.content?.toString().trim() || "";

    // [ANTI BRAIN-FREEZE] Jika AI membalas dengan string kosong, paksa bangun dan ulangi!
    if (!rawContent) {
      console.log(
        "⚠️ [AGENT WARNING] AI mengalami Brain Freeze (Empty String). Memaksa eksekusi ulang...",
      );

      response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userContext),
        new HumanMessage(
          "Your previous response was completely empty. Wake up! You MUST write your reasoning inside <thoughts> and your JSON inside <response>. Start typing now: \n<thoughts>",
        ),
      ]);

      rawContent = response.content?.toString().trim() || "";
    }
    let thoughts = extractXML(rawContent, "thoughts");
    const responseJsonString = extractXML(rawContent, "response");

    // Jika AI tidak memberikan tag <response>
    if (!responseJsonString) {
      // Cek apakah AI memang berniat HOLD dari kata-katanya
      const isHolding =
        rawContent.toLowerCase().includes("hold") ||
        rawContent.toLowerCase().includes("preserve");

      if (isHolding) {
        return { thoughts: thoughts || rawContent, draft: null }; // Silent HOLD, tanpa warning
      }

      // Jika bukan HOLD tapi format hancur, baru cetak warning
      console.log(
        `\n[WARNING] LLM format parsing failed. RAW OUTPUT from Agent:\n${rawContent}\n`,
      );
      return { thoughts: thoughts || rawContent, draft: null };
    }

    const cleanJson = responseJsonString.replace(/```json|```/g, "").trim();
    let draft: ToolDraft | null = null;

    // [EXPERT SYSTEM: JSON Self-Healing Mechanism]
    try {
      if (cleanJson) {
        draft = JSON.parse(cleanJson);
      } else {
        throw new Error("Empty JSON string");
      }
    } catch (parseError) {
      console.log(
        `⚠️ [AGENT WARNING] JSON Syntax Error. AI outputted: "${cleanJson}". Memaksa perbaikan otomatis (Self-Healing)...`,
      );

      const retryResponse = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userContext),
        new HumanMessage(`CRITICAL ERROR: Your last <response> contained invalid JSON syntax ("${cleanJson}"). You MUST output a valid JSON object. 
Example: {"toolName": "execute_venus_deposit", "args": {"amountInWei": "10000"}}
Fix your JSON and output it again.`),
      ]);

      const retryRaw = retryResponse.content?.toString().trim() || "";
      const retryThoughts = extractXML(retryRaw, "thoughts");
      if (retryThoughts) thoughts = retryThoughts; // Update pemikiran jika ada revisi

      const retryJsonString = extractXML(retryRaw, "response")
        .replace(/```json|```/g, "")
        .trim();

      // Jika kali ini masih gagal, biarkan outer catch() mengubahnya menjadi HOLD
      draft = JSON.parse(retryJsonString);
    }

    return { thoughts, draft };
  } catch (error) {
    console.error("[AGENT ERROR]", error);
    return { thoughts: "Internal Error Parsing JSON/XML", draft: null };
  }
}
