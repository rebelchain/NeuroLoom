import * as dotenvx from "@dotenvx/dotenvx";
// import { executeTradeOnChain } from "../chain/executor.js";
import { pushLog } from "../utils/push-log.js";
dotenvx.config();

async function runUnwind() {
  await pushLog("MANUAL UNWIND: Convert WBNB position back to USDT");

  const currentScenario = process.env.MOCK_SCENARIO || "PRODUCTION";
  await pushLog(`[SYSTEM] -> Current Scenario Config: ${currentScenario}`);

  try {
    await pushLog(
      "[SYSTEM] Injecting manual parameters: Action = SELL_WBNB, Amount = 100%",
    );
    // await executeTradeOnChain("SELL_WBNB", 100);

    await pushLog(
      "\nSUCCESS ✅  Unwind complete — funds returned to USDT in the vault!",
    );
    await pushLog(
      "Users should now be able to perform a full `withdraw()` from the dashboard.",
    );
  } catch (error) {
    console.error("ERROR: Unwind failed:", error);
    await pushLog(`ERROR: Unwind failed: ${error}`);
  }
}

runUnwind();
