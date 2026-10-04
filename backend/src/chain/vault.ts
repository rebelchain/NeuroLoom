import { createPublicClient, formatUnits, http } from "viem";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };
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
      address: CONFIG.VAULTS.YIELD_FARM as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "totalAssets",
    })) as bigint;

    const bcRaw = (await publicClient.readContract({
      address: CONFIG.VAULTS.BLUECHIP as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "totalAssets",
    })) as bigint;

    const dgRaw = (await publicClient.readContract({
      address: CONFIG.VAULTS.DEGEN as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "totalAssets",
    })) as bigint;

    return {
      balances: { yieldFarm: yfRaw, bluechip: bcRaw, degen: dgRaw },
      formatted: {
        yieldFarm: formatUnits(yfRaw, 18),
        bluechip: formatUnits(bcRaw, 18),
        degen: formatUnits(dgRaw, 18),
      },
    };
  } catch (error: any) {
    console.error("❌ [CRITICAL DEFI ERROR] Gagal Membaca Vault!");
    console.error("➡ Function      : totalAssets()");
    console.error("➡ Short Message :", error.shortMessage || error.message);
    console.error(
      "➡ Details       :",
      error.details || "Tidak ada detail revert dari RPC",
    );

    process.exit(1);
  }
}
