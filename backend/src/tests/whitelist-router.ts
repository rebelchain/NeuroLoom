import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };
import { CONFIG } from "../config.js";
dotenvx.config();

async function whitelistPancakeRouter() {
  console.log("Sending Whitelist Transactions to the Vault");

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("AI PRIVATE KEY not found");

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

  // const DEX_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
  const VENUS_VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A";

  // try {
  //   console.log(
  //     `Checking Whitelist status for the router: ${DEX_ROUTER}...`,
  //   );
  //   const isApproved = await publicClient.readContract({
  //     address: CONFIG.VAULT_PROXY as `0x${string}`,
  //     abi: VaultABI.abi,
  //     functionName: "approvedProtocols",
  //     args: [DEX_ROUTER],
  //   });

  //   if (isApproved) {
  //     console.log(
  //       "router is ALREADY whitelisted.",
  //     );
  //     return;
  //   }

  //   console.log(`Adding Router to Whitelist (Requires BNB Gas)...`);
  //   const { request } = await publicClient.simulateContract({
  //     address: CONFIG.VAULT_PROXY as `0x${string}`,
  //     abi: VaultABI.abi,
  //     functionName: "setApprovedProtocol",
  //     args: [DEX_ROUTER, true],
  //     account,
  //   });

  //   const hash = await walletClient.writeContract(request);
  //   console.log(
  //     `Transaction sent! Hash: https://testnet.bscscan.com/tx/${hash}`,
  //   );

  //   await publicClient.waitForTransactionReceipt({ hash });
  //   console.log(
  //     " SUCCESS ✅ PancakeSwap V3 router successfully whitelisted in the Vault!",
  //   );
  // }
  try {
    console.log(`Checking Whitelist status for Venus vUSDT: ${VENUS_VUSDT}...`);
    const isApproved = await publicClient.readContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "approvedProtocols",
      args: [VENUS_VUSDT],
    });

    if (isApproved) {
      console.log("Venus vUSDT is ALREADY whitelisted.");
      return;
    }

    console.log(`Adding Venus vUSDT to Whitelist (Requires BNB Gas)...`);
    const { request } = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "setApprovedProtocol",
      args: [VENUS_VUSDT, true],
      account,
    });

    const hash = await walletClient.writeContract(request);
    console.log(
      `Transaction sent! Hash: https://testnet.bscscan.com/tx/${hash}`,
    );

    await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      " SUCCESS ✅ Venus vUSDT successfully whitelisted in the Vault!",
    );
  } catch (error: any) {
    console.error(
      "❌ Failed to whitelist:",
      error.shortMessage || error.message,
    );
  }
}

whitelistPancakeRouter();
