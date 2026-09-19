import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(CONFIG.RPC_URL),
});

export interface VaultState {
  wbnbBalance: string;
  usdtBalance: string;
}

export async function getVaultState(): Promise<VaultState> {
  try {
    const scenario = process.env.MOCK_SCENARIO || "PRODUCTION";

    if (scenario === "HIGH_YIELD_ENTRY" || scenario === "LIQUIDITY_VACUUM") {
      return { wbnbBalance: "0.0", usdtBalance: "10000.0" };
    }

    if (scenario === "IL_MITIGATION_EXIT") {
      return { wbnbBalance: "15.0", usdtBalance: "0.0" };
    }

    // Production Mode (Real On-Chain)
    const wbnbRaw = await publicClient.readContract({
      address: CONFIG.TOKENS.WBNB as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    });
    const usdtRaw = await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    });

    return {
      wbnbBalance: formatUnits(wbnbRaw, 18),
      usdtBalance: formatUnits(usdtRaw, 18),
    };
  } catch (error) {
    console.error("❌ Gagal membaca state on-chain Vault:", error);
    throw error;
  }
}
