import { createPublicClient, http, erc20Abi, formatUnits } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(CONFIG.RPC_URL),
});


export interface MultiVaultState {
  yieldFarm: bigint;
  bluechip: bigint;
  degen: bigint;
}

export async function getVaultState(): Promise<{
  balances: MultiVaultState;
  formatted: any;
}> {
  try {
    const scenario = process.env.MOCK_SCENARIO || "PRODUCTION";

    if (scenario !== "PRODUCTION") {
      return {
        balances: {
          yieldFarm: 10000000000000000000000n, 
          bluechip: 5000000000000000000000n, 
          degen: 2000000000000000000000n, 
        },
        formatted: {
          yieldFarm: "10000.0",
          bluechip: "5000.0",
          degen: "2000.0",
        },
      };
    }

    const yfRaw = (await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULTS.YIELD_FARM as `0x${string}`],
    })) as bigint;

    const bcRaw = (await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULTS.BLUECHIP as `0x${string}`],
    })) as bigint;

    const dgRaw = (await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [CONFIG.VAULTS.DEGEN as `0x${string}`],
    })) as bigint;

    return {
      balances: { yieldFarm: yfRaw, bluechip: bcRaw, degen: dgRaw },
      formatted: {
        yieldFarm: formatUnits(yfRaw, 18),
        bluechip: formatUnits(bcRaw, 18),
        degen: formatUnits(dgRaw, 18),
      },
    };
  } catch (error) {
    console.error("❌ Gagal membaca state on-chain Vault:", error);
    throw error;
  }
}
