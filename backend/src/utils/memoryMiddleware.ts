import { getRecentMemories } from "../data/db.js";

export async function getAdaptiveContext(): Promise<string> {
  const memories = await getRecentMemories(10);
  let slippageFails = 0;

  for (const mem of memories) {
    if (
      mem.status === "FAIL" &&
      (mem.reasoning.includes("Slippage") ||
        mem.reasoning.includes("amountOutMin"))
    ) {
      slippageFails++;
    }
  }

  if (slippageFails >= 2) {
    return "CRITICAL SYSTEM WARNING: High market volatility detected in recent executions. You MUST set slippageBps to at least 200 (2.0%) or higher in your next execution tool call to prevent further reverts.";
  } else if (slippageFails === 1) {
    return "SYSTEM NOTICE: Minor slippage issues detected recently. Consider slightly increasing slippageBps (e.g., 100-150) for safety.";
  }
  return "SYSTEM STATUS: Market execution environment is stable. Standard slippage is acceptable.";
}
