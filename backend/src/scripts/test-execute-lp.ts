import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();


import { CONFIG } from "../config.js";
import { provideLiquidityV3 } from "../tools/defiTools.js";

async function runManualTest() {
  console.log(
    "🧪 Memulai Uji Coba Unit: PancakeSwap V3 (Manual Tanpa AI)...\n",
  );


  const testArgs = {
    vaultAddress: "0x2Df494B6A330b1f08F5b720caD47756f251378f9",
    token0: CONFIG.TOKENS.WBNB,
    token1: CONFIG.TOKENS.USDT,
    fee: 2500,
    tickLower: 63300,
    tickUpper: 64300,
    amount0DesiredWei: "10000000000000000",
    amount1DesiredWei: "5900000000000000000",
    slippageBps: 10000,
  };

  console.log("📦 Parameter Eksekusi Tersusun:");
  console.dir(testArgs, { depth: null, colors: true });
  console.log("\n⚡ Menembakkan alat provideLiquidityV3 ke BSC Testnet...");

  try {
    const result = await provideLiquidityV3.invoke(testArgs);

    console.log("\n✅ TRANSAKSI BERHASIL DIEKSEKUSI!");
    console.log("==========================================");
    console.log(result);
    console.log("==========================================");
    console.log("Cari TxHash di atas dan periksa di testnet.bscscan.com");
  } catch (error) {
    console.error(
      "\n❌ TRANSAKSI GAGAL! Terjadi penolakan dari Smart Contract/Viem:",
    );
    console.error(error);
  }
}

runManualTest();
