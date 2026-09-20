import * as dotenvx from "@dotenvx/dotenvx";
import { executeTradeOnChain } from "../chain/executor.js";
import {pushLog} from "../utils/push-log.js"
dotenvx.config();

async function runManualTrigger() {
  await pushLog("MANUAL OVERRIDE: TRIGGERING ON-CHAIN EXECUTION");

  const currentScenario = process.env.MOCK_SCENARIO || "PRODUCTION";
  console.log(`[SYSTEM] -> Current Scenario Config: ${currentScenario}`);

  try {
    await pushLog(
      "[SYSTEM] -> Injecting manual parameters: Action = BUY_WBNB, Amount = 80%",
    );
    await executeTradeOnChain("BUY_WBNB", 0.5);

    await pushLog("\nSUCCESS ✅ -> Manual trigger completed!");
  } catch (error) {
    console.error("ERROR: Manual trigger failed:", error);
    await pushLog(`ERROR: Manual trigger failed: ${error}`);
  }
}

runManualTrigger();
