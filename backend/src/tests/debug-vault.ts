import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, formatUnits, http } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";
dotenvx.config();

// ABI Minimum untuk Diagnostik
const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const AGGREGATOR_ABI = [
  {
    type: "function",
    name: "latestRoundData",
    inputs: [],
    outputs: [
      { type: "uint80" },
      { type: "int256", name: "price" },
      { type: "uint256" },
      { type: "uint256", name: "updatedAt" },
      { type: "uint80" },
    ],
    stateMutability: "view",
  },
] as const;

async function runDiagnostics() {
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  console.log("==================================================");
  console.log("🕵️ MENGAMBIL DATA DIAGNOSTIK ON-CHAIN (BSC TESTNET)");
  console.log("==================================================");

  try {
    // 1. CEK SALDO VAULT (Apakah Vault punya dana untuk di-swap?)
    const balance = (await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    })) as bigint;

    console.log(`\n[DIAGNOSTIK 1: SALDO USDT DI VAULT]`);
    console.log(`Alamat Vault: ${CONFIG.VAULT_PROXY}`);
    console.log(`Saldo Saat Ini: ${formatUnits(balance, 18)} USDT`);

    if (balance === 0n) {
      console.log("❌ TERSANGKA DITEMUKAN: Vault memiliki saldo 0 USDT.");
      console.log(
        "   PancakeSwap me-revert transaksi karena Vault mencoba melakukan swap dengan dana kosong!",
      );
    } else {
      console.log("✅ Saldo Vault aman.");
    }

    // 2. CEK STATUS CHAINLINK ORACLE (Stale Data / Kadaluarsa)
    const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
    const roundData = await publicClient.readContract({
      address: CHAINLINK_BNB_USD as `0x${string}`,
      abi: AGGREGATOR_ABI,
      functionName: "latestRoundData",
    });

    const price = roundData[1];
    const updatedAt = roundData[3];

    console.log(`\n[DIAGNOSTIK 2: KESEHATAN CHAINLINK ORACLE]`);
    console.log(`Harga BNB: $${Number(price) / 1e8}`);

    const ageSeconds = Math.floor(Date.now() / 1000) - Number(updatedAt);
    console.log(
      `Umur Data Oracle (Terakhir Update): ${ageSeconds} detik yang lalu`,
    );

    if (ageSeconds > 3600) {
      console.log(
        "❌ TERSANGKA DITEMUKAN: Data Chainlink Testnet Stale (Kadaluarsa melebihi 1 jam)!",
      );
      console.log(
        "   Smart Contract-mu mematikan transaksi lewat 'revert StaleOracleData();'.",
      );
    } else {
      console.log("✅ Oracle sehat dan up-to-date.");
    }
  } catch (error: any) {
    console.error("Gagal menjalankan diagnostik:", error.message);
  }
}

runDiagnostics();
