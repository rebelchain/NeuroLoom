import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { executePancakeSwap } from "../tools/defiTools.js";

async function runSwapTest() {
  console.log("Swap USDT to WBNB");

  const swapArgs = {
    vaultAddress: "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
    action: "BUY_WBNB",
    amountInWei: "10000000000000000",
    currentPriceStr: "60000000000",
    slippageBps: 200,
  } as const;

  try {
    const result = await executePancakeSwap.invoke(swapArgs);
    console.log("\n✅ SWAP SUCCESSFUL!");
    console.log(result);
  } catch (error) {
    console.error("\n❌ SWAP FAILED:", error);
  }
}

runSwapTest();
