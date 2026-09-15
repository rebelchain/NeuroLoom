import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { getAIDecision } from "./ai/agent.js";
import { executeTradeOnChain } from "./chain/executor.js";
import { getVaultState } from "./chain/vault.js";
import { fetchBinanceData } from "./data/binance.js";
import { getRecentMemories, logAIDecision } from "./data/db.js";

async function run() {
  console.log("🔍 Mengumpulkan Data Makro, Mikro & Ingatan...");

  const market = await fetchBinanceData("BNBUSDT");
  const vault = await getVaultState();
  const memories = await getRecentMemories(3); // Ambil 3 ingatan terakhir

  console.log(
    "\n📊 [Kondisi Pasar] WBNB: $" +
      market.price +
      " (24J: " +
      market.priceChangePercent +
      "%)",
  );
  console.log(
    "💼 [Isi Brankas] WBNB: " +
      vault.wbnbBalance +
      " | USDT: " +
      vault.usdtBalance,
  );
  console.log(
    "💾 [Ingatan Masa Lalu] Ditemukan " + memories.length + " rekaman log.",
  );

  console.log("\n🧠 Menyerahkan data ke Otak AI (Gemini)...");

  // Kirim data beserta ingatan ke AI
  const decision = await getAIDecision(market, vault, memories);

  console.log("\n🤖 [KEPUTUSAN NEUROLOOM AI]");
  console.log(`Tindakan   : ${decision.action}`);
  console.log(`Alokasi    : ${decision.amountPercentage}%`);
  console.log(`Alasan     : ${decision.reasoning}`);

  // Catat keputusan ini ke dalam database untuk siklus berikutnya!
  await logAIDecision(
    decision.action,
    decision.amountPercentage,
    decision.reasoning,
  );

  await executeTradeOnChain(decision.action, decision.amountPercentage);

  console.log(
    "✅ Keputusan telah dicatat ke dalam database memori (neuro_memory.sqlite).",
  );
}

run();
