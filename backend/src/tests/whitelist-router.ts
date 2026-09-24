import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };
import { CONFIG } from "../config.js";

dotenvx.config();

async function setupVaultMultiStrategy() {
  console.log("🚀 Memulai Konfigurasi Multi-Strategy Vault...");

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE KEY not found");

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

  const VAULT_ADDRESS = CONFIG.VAULT_PROXY as `0x${string}`;
  console.log(`Target Vault: ${VAULT_ADDRESS}`);

// token address
  const PANCAKE_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
  const VENUS_VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A";

  // Base Assets
  const USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";
  const WBNB_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";
  const BTCB_TESTNET = "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8"; 

  // Chainlink Data Feeds (BSC Testnet)
  const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
  const CHAINLINK_BTC_USD = "0x5741306c21795FdCBb9b265Ea0255F499DFe515C";

  const protocols = [
    { name: "PancakeSwap V3", address: PANCAKE_ROUTER },
    { name: "Venus vUSDT", address: VENUS_VUSDT },
  ];

  const oraclePairs = [
    {
      tokenIn: USDT_TESTNET,
      tokenOut: WBNB_TESTNET,
      oracle: CHAINLINK_BNB_USD,
      name: "USDT -> WBNB",
    },
    {
      tokenIn: WBNB_TESTNET,
      tokenOut: USDT_TESTNET,
      oracle: CHAINLINK_BNB_USD,
      name: "WBNB -> USDT",
    },
    {
      tokenIn: USDT_TESTNET,
      tokenOut: BTCB_TESTNET,
      oracle: CHAINLINK_BTC_USD,
      name: "USDT -> BTCB",
    },
  ];

  try {
    console.log("\n=== 1. KONFIGURASI PROTOKOL (WHITELIST) ===");
    for (const p of protocols) {
      const isApproved = await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VaultABI.abi,
        functionName: "approvedProtocols",
        args: [p.address],
      });

      if (isApproved) {
        console.log(`✅ [SKIP] ${p.name} sudah di-whitelist.`);
      } else {
        console.log(`[EXEC] Menambahkan ${p.name}...`);
        const { request } = await publicClient.simulateContract({
          address: VAULT_ADDRESS,
          abi: VaultABI.abi,
          functionName: "setApprovedProtocol",
          args: [p.address, true],
          account,
        });
        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ [OK] ${p.name} berhasil di-whitelist.`);
      }
    }

    console.log("\n=== 2. KONFIGURASI ORACLE (MEV PROTECTION) ===");
    for (const pair of oraclePairs) {
      const currentOracle = await publicClient.readContract({
        address: VAULT_ADDRESS,
        abi: VaultABI.abi,
        functionName: "pairPriceFeeds",
        args: [pair.tokenIn, pair.tokenOut],
      });

      if (
        (currentOracle as string).toLowerCase() === pair.oracle.toLowerCase()
      ) {
        console.log(`✅ [SKIP] Oracle ${pair.name} sudah terhubung.`);
      } else {
        console.log(`[EXEC] Mengonfigurasi Oracle untuk ${pair.name}...`);
        const { request } = await publicClient.simulateContract({
          address: VAULT_ADDRESS,
          abi: VaultABI.abi,
          functionName: "setPairPriceFeed",
          args: [pair.tokenIn, pair.tokenOut, pair.oracle],
          account,
        });
        const hash = await walletClient.writeContract(request);
        await publicClient.waitForTransactionReceipt({ hash });
        console.log(`✅ [OK] Oracle ${pair.name} berhasil terhubung.`);
      }
    }

    console.log("\n🎉 SELURUH KONFIGURASI VAULT SELESAI!");
  } catch (error: any) {
    console.error(
      "❌ Gagal melakukan konfigurasi:",
      error.shortMessage || error.message,
    );
  }
}

setupVaultMultiStrategy();
