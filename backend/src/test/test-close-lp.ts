import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { closeLiquidityV3 } from "../tools/defiTools.js";

async function runCloseLPTest() {
  console.log("Uji Coba Unit: PancakeSwap V3 Close LP\n");

  const testArgs = {
    vaultAddress: "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
    tokenId: "AUTO",
  } as const;

  console.log(" Parameter Eksekusi:");
  console.dir(testArgs, { depth: null, colors: true });
  console.log("\n⚡ Menembakkan alat closeLiquidityV3 ke BSC Testnet...");

  try {
    const result = await closeLiquidityV3.invoke(testArgs);

    console.log("\n✅ PENUTUPAN LP BERHASIL DIEKSEKUSI!");
    console.log("==========================================");
    console.log(result);
    console.log("==========================================");
  } catch (error) {
    console.error(
      "\n❌ PENUTUPAN LP GAGAL! Terjadi penolakan dari Smart Contract/Viem:",
    );
    console.error(error);
  }
}

runCloseLPTest();
