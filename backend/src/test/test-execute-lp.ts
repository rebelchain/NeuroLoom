import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { CONFIG } from "../config.js";
import { provideLiquidityV3 } from "../tools/defiTools.js";

async function runManualTest() {
  console.log("Unit Testing: PancakeSwap V3 .\n");

  const testArgs = {
    vaultAddress: "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
    token0: CONFIG.TOKENS.WBNB,
    token1: CONFIG.TOKENS.USDT,
    fee: 2500,
    tickLower: 63300,
    tickUpper: 64300,
    amount0DesiredWei: "100000000000000",
    amount1DesiredWei: "50000000000000000",
    slippageBps: 10000,
  };

  console.log("Structured Execution Parameters:");
  console.dir(testArgs, { depth: null, colors: true });
  console.log("\nFiring the provideLiquidityV3 tool at BSC Testnet");

  try {
    const result = await provideLiquidityV3.invoke(testArgs);

    console.log("\nTransaction successfully executed!");
    console.log(result);
  } catch (error) {
    console.error(
      "\n❌ TRANSACTION FAILED! An error occurred with the Smart Contract/Viem:",
    );
    console.error(error);
  }
}

runManualTest();
