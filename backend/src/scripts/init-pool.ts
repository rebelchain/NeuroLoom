import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

dotenvx.config();

const PANCAKE_V3_MANAGER = "0x427bF5b37357632377eCbEC9de3626C71A5396c1";

async function initPool() {
  console.log("🛠️ Membuat dan Menginisialisasi Pool V3: WBNB / mUSDT...");

  let rawPrivateKey = process.env.AI_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!rawPrivateKey?.startsWith("0x")) rawPrivateKey = `0x${rawPrivateKey}`;
  const account = privateKeyToAccount(rawPrivateKey as `0x${string}`);

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  let token0: string = CONFIG.TOKENS.WBNB;
  let token1: string = CONFIG.TOKENS.USDT;
  let price = 590;

  if (token0.toLowerCase() > token1.toLowerCase()) {
    console.log("🔄 Menukar posisi token agar sesuai aturan V3...");
    token0 = CONFIG.TOKENS.USDT;
    token1 = CONFIG.TOKENS.WBNB;
    price = 1 / 590;
  }

  const sqrtPrice = Math.sqrt(price);
  const sqrtPriceX96 = BigInt(Math.floor(sqrtPrice * 2 ** 96));

  const managerAbi = parseAbi([
    "function createAndInitializePoolIfNecessary(address token0, address token1, uint24 fee, uint160 sqrtPriceX96) external payable returns (address pool)",
  ]);

  try {
    const { request } = await publicClient.simulateContract({
      account,
      address: PANCAKE_V3_MANAGER,
      abi: managerAbi,
      functionName: "createAndInitializePoolIfNecessary",
      args: [
        token0 as `0x${string}`,
        token1 as `0x${string}`,
        2500,
        sqrtPriceX96,
      ],
    });

    const txHash = await walletClient.writeContract(request);
    console.log(`\n✅ Pool Berhasil Diinisialisasi! TxHash: ${txHash}`);
    console.log("Sekarang Brankasmu sudah punya wadah untuk menaruh LP!");
  } catch (error) {
    console.error("❌ Gagal membuat Pool:", error);
  }
}

initPool();
