// import { HumanMessage, SystemMessage } from "@langchain/core/messages";
// import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// import { AIDecision } from "./agent.js"; // Import interface dari agent.ts

// // Helper function untuk mengekstrak JSON dari output AI
// function extractJSON(rawText: string): any {
//   const jsonMatch = rawText.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
//   if (!jsonMatch) throw new Error("No JSON structure found in response.");
//   return JSON.parse(jsonMatch[0]);
// }

// /**
//  * FUNGSI 1: Sang Auditor (Evaluator)
//  * Mengaudit draf keputusan secara ketat. Tidak mengambil keputusan, hanya mengoreksi.
//  */
// async function evaluateDecision(
//   llm: ChatGoogleGenerativeAI,
//   draft: AIDecision,
//   marketData: any,
//   vaultState: any,
// ): Promise<{
//   status: "PASS" | "NEEDS_IMPROVEMENT" | "FAIL";
//   feedback: string;
// }> {
//   const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom DeFi Vault.
// Evaluate the proposed trading decision based on the following rules:
// 1. Risk Limit: amountPercentage MUST NOT exceed 30% per cycle to prevent high slippage.
// 2. Liquidity Check: If market volume is 0 or suspiciously low, trading is unsafe.
// 3. Rationality: The reasoning must logically support the action.

// You are evaluating only. DO NOT attempt to solve the task.
// Output ONLY a valid JSON object in the following format:
// {
//   "status": "PASS" | "NEEDS_IMPROVEMENT" | "FAIL",
//   "feedback": "Explain what needs improvement or why it passed/failed."
// }`;

//   const context = `
// CURRENT STATE:
// - Market Data: ${JSON.stringify(marketData)}
// - Vault Balances: ${JSON.stringify(vaultState)}

// PROPOSED DECISION TO EVALUATE:
// ${JSON.stringify(draft)}
//   `;

//   const response = await llm.invoke([
//     new SystemMessage(evaluatorPrompt),
//     new HumanMessage(context),
//   ]);

//   return extractJSON(response.content.toString());
// }

// /**
//  * FUNGSI 2: Sang Perbaik (Optimizer)
//  * Mengubah draf awal berdasarkan kritikan dari Evaluator.
//  */
// async function optimizeDecision(
//   llm: ChatGoogleGenerativeAI,
//   previousDraft: AIDecision,
//   feedback: string,
//   marketData: any,
// ): Promise<AIDecision> {
//   const optimizerPrompt = `You are the NeuroLoom Strategy Optimizer.
// Your previous trading decision was rejected by the Risk Evaluator.
// Read the feedback carefully and generate an IMPROVED decision.

// Output ONLY a valid JSON object matching this structure:
// {
//   "action": "BUY_WBNB" | "SELL_WBNB" | "HOLD",
//   "reasoning": "Explain how you fixed the issue based on the feedback",
//   "amountPercentage": <number>
// }`;

//   const context = `
// MARKET DATA: ${JSON.stringify(marketData)}
// PREVIOUS DRAFT: ${JSON.stringify(previousDraft)}
// EVALUATOR FEEDBACK: ${feedback}

// Please provide the corrected JSON output now.
//   `;

//   const response = await llm.invoke([
//     new SystemMessage(optimizerPrompt),
//     new HumanMessage(context),
//   ]);

//   return extractJSON(response.content.toString());
// }

// /**
//  * FUNGSI UTAMA: The Bounded Evaluator-Optimizer Loop
//  * Mengontrol perdebatan AI maksimal 3 putaran untuk mencegah API Rate Limit.
//  */
// export async function runEvaluatorLoop(
//   initialDecision: AIDecision,
//   marketData: any,
//   vaultState: any,
// ): Promise<AIDecision> {
//   // Inisialisasi LLM di dalam fungsi agar aman dari masalah dotenvx
//   const llm = new ChatGoogleGenerativeAI({
//     model: "gemini-1.5-flash",
//     maxOutputTokens: 512,
//     temperature: 0, // Suhu 0 agar evaluasi mutlak deterministik
//     apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY,
//   });

//   console.log("\n🛡️ [EVALUATOR] Initiating Risk Management Audit Loop...");

//   let currentDecision = initialDecision;
//   const MAX_ITERATIONS = 3;

//   for (let i = 1; i <= MAX_ITERATIONS; i++) {
//     console.log(`   -> [ITERATION ${i}] Auditing proposed decision...`);

//     try {
//       // 1. Audit draf saat ini
//       const evaluation = await evaluateDecision(
//         llm,
//         currentDecision,
//         marketData,
//         vaultState,
//       );

//       console.log(`      Status: ${evaluation.status}`);
//       console.log(`      Feedback: ${evaluation.feedback}`);

//       // 2. Jika lolos, hentikan loop dan kembalikan keputusan
//       if (evaluation.status === "PASS") {
//         console.log("✅ [EVALUATOR] Decision passed all safety checks!");
//         return currentDecision;
//       }

//       // 3. Jika gagal mutlak, paksa HOLD
//       if (evaluation.status === "FAIL") {
//         console.log("❌ [EVALUATOR] Fatal risk detected. Forcing HOLD action.");
//         return {
//           action: "HOLD",
//           amountPercentage: 0,
//           reasoning: `Safety override: ${evaluation.feedback}`,
//         };
//       }

//       // 4. Jika butuh perbaikan dan belum mencapai batas maksimum iterasi
//       if (i < MAX_ITERATIONS) {
//         console.log(
//           `   -> [OPTIMIZER] Correcting decision based on feedback...`,
//         );
//         currentDecision = await optimizeDecision(
//           llm,
//           currentDecision,
//           evaluation.feedback,
//           marketData,
//         );
//       }
//     } catch (error) {
//       console.error(
//         "⚠️ [EVALUATOR ERROR] Loop failed, defaulting to safety:",
//         error,
//       );
//       break;
//     }
//   }

//   // Jika mencapai iterasi maksimum tapi tidak pernah PASS
//   console.log(
//     "⚠️ [EVALUATOR] Max optimization iterations reached. Aborting trade.",
//   );
//   return {
//     action: "HOLD",
//     amountPercentage: 0,
//     reasoning:
//       "Failed to produce a strictly safe action within the iteration limit.",
//   };
// }
import { AIDecision } from "./agent.js";

/**
 * FUNGSI UTAMA: The Bounded Evaluator-Optimizer Loop
 * (VERSI MOCK/TIRUAN: Untuk menghindari Limit API Google sementara waktu)
 */
export async function runEvaluatorLoop(
  initialDecision: AIDecision,
  marketData: any,
  vaultState: any,
): Promise<AIDecision> {
  console.log("\n🛡️ [EVALUATOR] Initiating Risk Management Audit Loop...");
  console.log("⚠️ [MOCK] API Limit detected. Bypassing AI Brain...");
  console.log("🎯 [MOCK] Forcing BUY_WBNB signal to test Web3 Executor!");

  // Kita paksa return BUY_WBNB agar executor.js menyala!
  return {
    action: "BUY_WBNB",
    amountPercentage: 50,
    reasoning:
      "Bypass AI due to rate limit. Hardcoded signal for Executor test.",
  };
}
