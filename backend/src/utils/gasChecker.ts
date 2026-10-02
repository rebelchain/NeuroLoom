import { createPublicClient, http, formatEther } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

export async function isNetworkGasSafe(): Promise<boolean> {
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  const gasPriceWei = await publicClient.getGasPrice();
  const maxSafeGasPriceWei = 15000000000n; // 15 Gwei

  if (gasPriceWei > maxSafeGasPriceWei) {
    console.warn(
      `[GAS CHECK] Network is highly congested! Current Gas Price: ${formatEther(gasPriceWei)} BNB. Skipping AI cycle to save costs.`,
    );
    return false;
  }
  console.log(
    `[GAS CHECK] Network gas is affordable. Proceeding with AI cycle.`,
  );
  return true;
}
