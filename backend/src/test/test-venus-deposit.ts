import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { executeVenusDeposit } from "../tools/defiTools.js";

async function runVenusTest() {
  console.log("Unit Test: Venus Protocol Deposit\n");

  const testArgs = {
    vaultAddress: "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
    amountInWei: "1000000000000000000", // 1 USDT
  } as const;

  console.log("Executing executeVenusDeposit on BSC Testnet...");

  try {
    const result = await executeVenusDeposit.invoke(testArgs);

    console.log("\nVenus deposit successfully executed!");
    console.log(result);
  } catch (error) {
    console.error("\n❌ DEPOSIT FAILED:");
    console.error(error);
  }
}

runVenusTest();
