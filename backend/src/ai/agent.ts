import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { CONFIG } from "../config.js";
import { getActiveGeminiKey, rotateGeminiKey } from "../utils/apiRotator.js";
import { getAdaptiveContext } from "../utils/memoryMiddleware.js";
import { pushLog } from "../utils/push-log.js"; 

export function extractXML(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

export interface ToolDraft {
  toolName: string;
  args: any;
}


async function invokeGeminiWithRetry(
  messages: BaseMessage[],
  maxRetries = 2,
): Promise<any> {
  let attempt = 0;

  while (attempt <= maxRetries) {
    try {
      const llm = new ChatGoogleGenerativeAI({
        apiKey: getActiveGeminiKey(),
        model: "gemini-3-flash-preview",
        temperature: 0.1,
      });

      return await llm.invoke(messages);
    } catch (error: any) {
      const isQuotaError =
        error.message?.includes("429") ||
        error.message?.toLowerCase().includes("rate limit") ||
        error.message?.toLowerCase().includes("quota");

      if (isQuotaError && attempt < maxRetries) {
        console.warn(
          `\n[WARNING] Gemini API Limit habis. Mengeksekusi rotasi...`,
        );
        rotateGeminiKey();
        attempt++;
      } else {
        throw error;
      }
    }
  }
}

export async function generateDecision(
  marketData: any,
  vaultState: any,
  recentMemories: any[],
  yieldReport: string,
  feedbackContext: string = "",
): Promise<{ thoughts: string; draft: ToolDraft | null }> {
  const VAULT_STRATEGIES = `
Available Vaults & Primary Objectives:
1. "The Yield Farm" (${CONFIG.VAULTS.YIELD_FARM}): Low Risk. Prefers Lending Protocols (e.g., execute_venus_deposit, withdraw_venus_deposit).
2. "Bluechip Momentum" (${CONFIG.VAULTS.BLUECHIP}): Med Risk. Balanced exposure via Swaps (execute_pancake_swap) or LP (provide_liquidity_v3).
3. "Degen Accumulator" (${CONFIG.VAULTS.DEGEN}): High Risk. Prefers aggressive Swaps or tight LP ranges.

UNIVERSAL EXECUTION RULES:
1. READ THE RADAR: Always check the POSITION_HEALTH_RADAR first. If a vault indicates a critical threat (e.g., OUT_OF_RANGE or EXTREME_VOLATILITY), prioritize capital preservation (e.g., close_liquidity_v3 or withdraw_venus_deposit).
2. MATHEMATICAL RIGOR: If your chosen action requires pre-calculation (e.g., calculating LP ticks with calculate_v3_lp_params or evaluating Kelly sizing with calculate_optimal_allocation), you MUST select those mathematical tools FIRST before executing the actual on-chain transaction.
3. OBEY DEMO DIRECTIVES: If a "CRITICAL DEMO DIRECTIVE" is provided, you MUST prioritize it over standard mathematical logic to satisfy the simulation requirements.
  `;

  const adaptiveMemoryWarning = await getAdaptiveContext();

  const systemPrompt = `You are the NeuroLoom Quant Agent. 
Your goal is to synthesize data from the Orchestrator, Worker Reports, and Quant Engine (MVO) to output ONE final execution tool call.
${adaptiveMemoryWarning}

${VAULT_STRATEGIES}

You MUST output your decision STRICTLY in the exact XML format below. Do not add markdown blocks like \`\`\`xml.

<thoughts>
Write your strategic reasoning here. Explain WHY you are choosing this specific tool, how it solves the current market state, and what arguments you are passing to it.
</thoughts>
<response>
{"toolName": "tool_name_here", "args": {"arg1": "value1"}}
</response>

Example for HOLDING:
<thoughts>Market is too risky and yields are low. Capital preservation is priority. I will hold the position.</thoughts>
<response>{"toolName": "hold_position", "args": {}}</response>
`;

  const replacer = (key: string, value: any) =>
    typeof value === "bigint" ? value.toString() : value;

  let userContext = `DEFI STATE: ${JSON.stringify(marketData)}\nVAULT BALANCE: ${JSON.stringify(vaultState, replacer)}\nMEMORIES: ${JSON.stringify(recentMemories)}\nYIELD REPORT:\n${yieldReport}`;

  if (feedbackContext) {
    userContext += `\n\nFEEDBACK FROM RISK OFFICER:\n${feedbackContext}\nYou MUST fix your previous draft.`;
  }

  try {
    await pushLog(
      "[AGENT] Typing reasoning and calculating math based on context...",
    );

    let combinedHumanText = `${userContext}\n\nCRITICAL INSTRUCTION: You MUST output raw text. Do not use native tool calls. Begin your response exactly with the <thoughts> tag.`;

    let response = await invokeGeminiWithRetry([
      new SystemMessage(systemPrompt),
      new HumanMessage(combinedHumanText),
    ]);
    let rawContent = "";
    if (typeof response.content === "string") {
      rawContent = response.content.trim();
    } else if (Array.isArray(response.content)) {
      rawContent = response.content
        .map((c: any) => c.text || JSON.stringify(c))
        .join(" ")
        .trim();
    } else {
      rawContent = JSON.stringify(response.content).trim();
    }

    if (!rawContent) {
      console.log(
        "[AGENT WARNING] AI mengalami Brain Freeze (Empty String). Memaksa eksekusi ulang...",
      );
      let retryHumanText1 = `${userContext}\n\nYour previous response was completely empty. Wake up! You MUST write your reasoning inside <thoughts> and your JSON inside <response>. Start typing now: \n<thoughts>`;

      response = await invokeGeminiWithRetry([
        new SystemMessage(systemPrompt),
        new HumanMessage(retryHumanText1),
      ]);
      rawContent = response.content?.toString().trim() || "";
    }

    let thoughts = extractXML(rawContent, "thoughts");
    const responseJsonString = extractXML(rawContent, "response");

    if (thoughts) {
      await pushLog(`[AGENT THOUGHTS]:\n"${thoughts}"`);
    }

    if (!responseJsonString) {
      const isHolding =
        rawContent.toLowerCase().includes("hold") ||
        rawContent.toLowerCase().includes("preserve");

      if (isHolding) {
        return { thoughts: thoughts || rawContent, draft: null };
      }

      console.log(
        `\n[WARNING] LLM format parsing failed. RAW OUTPUT from Agent:\n${rawContent}\n`,
      );
      return { thoughts: thoughts || rawContent, draft: null };
    }

    const cleanJson = responseJsonString.replace(/```json|```/g, "").trim();
    let draft: ToolDraft | null = null;

    try {
      if (cleanJson) {
        draft = JSON.parse(cleanJson);
      } else {
        throw new Error("Empty JSON string");
      }
    } catch (parseError) {
      await pushLog(
        `[AGENT WARNING] JSON Syntax Error. Initiating Self-Healing Mechanism...`,
      );

      let retryHumanText2 = `${userContext}\n\nCRITICAL ERROR: Your last <response> contained invalid JSON syntax ("${cleanJson}"). You MUST output a valid JSON object. 
Example: {"toolName": "execute_venus_deposit", "args": {"amountInWei": "10000"}}
Fix your JSON and output it again.`;

      const retryResponse = await invokeGeminiWithRetry([
        new SystemMessage(systemPrompt),
        new HumanMessage(retryHumanText2),
      ]);

      const retryRaw = retryResponse.content?.toString().trim() || "";
      const retryThoughts = extractXML(retryRaw, "thoughts");
      if (retryThoughts) {
        thoughts = retryThoughts;
        await pushLog(`[AGENT REVISED THOUGHTS]:\n"${thoughts}"`);
      }

      const retryJsonString = extractXML(retryRaw, "response")
        .replace(/```json|```/g, "")
        .trim();

      draft = JSON.parse(retryJsonString);
    }

    return { thoughts, draft };
  } catch (error) {
    console.error("[AGENT ERROR]", error);
    return { thoughts: "Internal Error Parsing JSON/XML", draft: null };
  }
}
