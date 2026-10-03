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

const MUSDT_TESTNET =
  "0xFa45Fd644B34606cABFb7c8acc546E770e248b83" as `0x${string}`;
const VENUS_VUSDT =
  "0x5ee89D4357d71368cF54a0407c64E36500dbc475" as `0x${string}`;

const SEED_AMOUNT = parseUnits("100", 18);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

const mockVTokenAbi = parseAbi([
  "function seedLiquidity(uint256 amount) external",
]);

async function seedMockVenus() {
  console.log("💉 Memulai Injeksi Modal (Seed Liquidity) ke Mock Venus...");

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
    console.log("Granting approval (Approve) for 100 USDT to Mock Venus");
    const { request: approveReq } = await publicClient.simulateContract({
      account,
      address: MUSDT_TESTNET,
      abi: erc20Abi,
      functionName: "approve",
      args: [VENUS_VUSDT, SEED_AMOUNT],
    });
    const approveHash = await walletClient.writeContract(approveReq);
    console.log(`   Tx Sent: ${approveHash}`);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });
    console.log(" Approve Success!\n");

    console.log("Injecting 100 USDT into the Mock Venus vault...");
    const { request: seedReq } = await publicClient.simulateContract({
      account,
      address: VENUS_VUSDT,
      abi: mockVTokenAbi,
      functionName: "seedLiquidity",
      args: [SEED_AMOUNT],
    });
    const seedHash = await walletClient.writeContract(seedReq);
    console.log(`   📡 Tx Sent: ${seedHash}`);
    await publicClient.waitForTransactionReceipt({ hash: seedHash });
    console.log("  Capital Injection Successful!");
  } catch (error: any) {
    console.error("Failed:", error.shortMessage || error.message);
  }
}

seedMockVenus();
