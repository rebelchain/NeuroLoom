import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { withdrawVenusDeposit } from "../tools/defiTools.js";

async function runWithdrawTest() {
  console.log("Unit Tests: Venus Protocol Withdraw\n");

  const testArgs = {
    vaultAddress: "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
    amountInWei: "1000000000000000000",
  } as const;

  console.log("Executing withdrawVenusDeposit tool to the BSC Testnet...");

  try {
    const result = await withdrawVenusDeposit.invoke(testArgs);

    console.log("\nVENUS WITHDRAWAL SUCCESSFULLY EXECUTED");
    console.log(result);
  } catch (error) {
    console.error("\n❌ WITHDRAW FAILED:");
    console.error(error);
  }
}

runWithdrawTest();
