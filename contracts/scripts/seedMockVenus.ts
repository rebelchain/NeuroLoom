import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import {
  createPublicClient,
  createWalletClient,
  http,
  parseAbi,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";

// Ini adalah alamat Mock USDT dan Mock Venus yang kamu gunakan di setupAllVaults_2.ts
const MUSDT_TESTNET =
  "0xFa45Fd644B34606cABFb7c8acc546E770e248b83" as `0x${string}`;
const VENUS_VUSDT =
  "0x5ee89D4357d71368cF54a0407c64E36500dbc475" as `0x${string}`;

// Kita akan menyuntikkan 100 USDT (dengan 18 desimal)
const SEED_AMOUNT = parseUnits("100", 18);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

const mockVTokenAbi = parseAbi([
  "function seedLiquidity(uint256 amount) external",
]);

async function seedMockVenus() {
  console.log("💉 Memulai Injeksi Modal (Seed Liquidity) ke Mock Venus...");

  // Menggunakan Private Key dari .env (Sama seperti setupAllVaults)
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Private key tidak ditemukan di .env");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  try {
    // Langkah 1: Berikan Izin (Approve) USDT ke Mock Venus
    console.log("⏳ 1. Memberikan izin (Approve) 100 USDT ke Mock Venus...");
    const { request: approveReq } = await publicClient.simulateContract({
      account,
      address: MUSDT_TESTNET,
      abi: erc20Abi,
      functionName: "approve",
      args: [VENUS_VUSDT, SEED_AMOUNT],
    });
    const approveHash = await walletClient.writeContract(approveReq);
    console.log(`   📡 Tx Dikirim: ${approveHash}`);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log("   ✅ Approve Berhasil!\n");

    // Langkah 2: Eksekusi seedLiquidity
    console.log("⏳ 2. Menyuntikkan 100 USDT ke brankas Mock Venus...");
    const { request: seedReq } = await publicClient.simulateContract({
      account,
      address: VENUS_VUSDT,
      abi: mockVTokenAbi,
      functionName: "seedLiquidity",
      args: [SEED_AMOUNT],
    });
    const seedHash = await walletClient.writeContract(seedReq);
    console.log(`   📡 Tx Dikirim: ${seedHash}`);
    await publicClient.waitForTransactionReceipt({ hash: seedHash });
    console.log("   ✅ Suntik Modal Berhasil!");

    console.log("\n🎉 SEKARANG MOCK VENUS SUDAH PUNYA UANG KEMBALIAN!");
    console.log("👉 Silakan jalankan 'test-venus-withdraw.ts' sekarang.");
  } catch (error: any) {
    console.error("❌ GAGAL:", error.shortMessage || error.message);
  }
}

seedMockVenus();
