import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js"; 
dotenvx.config();


import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };

async function configureVenusOracle() {
  console.log("Menghubungkan Chainlink Oracle ke Yield Farm Vault...");

  const pk = process.env.AI_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("AI_PRIVATE_KEY not found in   .env");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  try {
    console.log(`Mendaftarkan arah (USDT -> vUSDT)....`);
    const { request: req1 } = await publicClient.simulateContract({
      address: CONFIG.VAULTS.YIELD_FARM as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "setPairPriceFeed",
      args: [
        CONFIG.TOKENS.USDT,
        CONFIG.PROTOCOLS.VENUS_VUSDT,
        CONFIG.ORACLES.BNB_USD,
      ],
      account,
    });
    const hash1 = await walletClient.writeContract(req1);
    await publicClient.waitForTransactionReceipt({ hash: hash1 });
    console.log(` SUCCESS ✅ USDT -> vUSDT is registered! Hash: ${hash1}`);

    console.log(`Mendaftarkan arah sebaliknya (vUSDT -> USDT)...`);
    const { request: req2 } = await publicClient.simulateContract({
      address: CONFIG.VAULTS.YIELD_FARM as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "setPairPriceFeed",
      args: [
        CONFIG.PROTOCOLS.VENUS_VUSDT,
        CONFIG.TOKENS.USDT,
        CONFIG.ORACLES.BNB_USD,
      ],
      account,
    });
    const hash2 = await walletClient.writeContract(req2);
    await publicClient.waitForTransactionReceipt({ hash: hash2 });
    console.log(` SUCCESS ✅ vUSDT -> USDT is registered! Hash: ${hash2}`);
  } catch (error: any) {
    console.error(
      " Oracle configuration failed:",
      error.shortMessage || error.message,
    );
  }
}

configureVenusOracle();
