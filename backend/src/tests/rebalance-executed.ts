import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();
import { executeTradeOnChain } from "../chain/executor.js";

async function runManualTrigger() {
  console.log("MANUAL OVERRIDE: TRIGGERING ON-CHAIN EXECUTION");

  // Memastikan sistem membaca skenario demo agar pelindung mikro-transaksi aktif
  const currentScenario = process.env.MOCK_SCENARIO || "PRODUCTION";
  console.log(`[SYSTEM] Current Scenario Config: ${currentScenario}`);

  try {
    // Mengeksekusi instruksi secara manual tanpa melalui LLM Qwen
    // Parameter: "BUY_WBNB" dengan alokasi 20%
    console.log(
      "[SYSTEM] Injecting manual parameters: Action = BUY_WBNB, Amount = 20%",
    );
    await executeTradeOnChain("BUY_WBNB", 20);

    console.log("\n✅ [SUCCESS] Manual trigger completed!");
    console.log(
      "⏳ Buka browser-mu sekarang. Tabel The Graph akan tersinkronisasi dalam 10-15 detik.",
    );
  } catch (error) {
    console.error("❌ [ERROR] Manual trigger failed:", error);
  }
}

runManualTrigger();
