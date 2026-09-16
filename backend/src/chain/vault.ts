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
    // Membaca saldo WBNB di dalam kontrak Vault
    const wbnbRaw = await publicClient.readContract({
      address: CONFIG.TOKENS.WBNB,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY],
    });

    // Membaca saldo USDT di dalam kontrak Vault
    const usdtRaw = await publicClient.readContract({
      address: CONFIG.TOKENS.USDT,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY],
    });

    // return {
    //   wbnbBalance: formatUnits(wbnbRaw, 18),
    //   usdtBalance: formatUnits(usdtRaw, 18),
    // };

    // [MOCK UNTUK TESTING]: Seolah-olah kita punya 10,000 USDT dan 0 WBNB
    return {
      wbnbBalance: "0.0",
      usdtBalance: "10000.0",
    };
  } catch (error) {
    console.error("❌ Gagal membaca state on-chain Vault:", error);
    throw error;
  }
}
