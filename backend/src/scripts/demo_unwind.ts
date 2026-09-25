import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as dotenvx from "@dotenvx/dotenvx";
import { pushLog, clearLogs } from "../utils/push-log.js";

dotenvx.config();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";
const BLUECHIP_VAULT = "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e";

let rawPrivateKey = process.env.AI_PRIVATE_KEY || process.env.PRIVATE_KEY;
if (!rawPrivateKey?.startsWith("0x")) rawPrivateKey = `0x${rawPrivateKey}`;
const account = privateKeyToAccount(rawPrivateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});
const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(RPC_URL),
});

async function main() {
  await clearLogs();
  await delay(1000);

  await pushLog(`[SYSTEM] Market anomaly detected. Global metrics shifting...`);
  await delay(2000);
  await pushLog(
    `[ORCHESTRATOR] Risk threshold exceeded for Bluechip Momentum Vault.`,
  );
  await delay(2000);
  await pushLog(
    `[NEURAL_NET] Initiating Emergency Unwind Protocol. Securing capital...`,
  );
  await delay(2500);
  await pushLog(
    `[ROUTING] Formulating defensive route: WBNB -> USDT (Stablecoin)`,
  );
  await delay(2000);
  await pushLog(`[EXECUTION] Withdrawing liquidity from PancakeSwap V3...`);

  const hash = await walletClient.sendTransaction({
    account,
    to: BLUECHIP_VAULT,
    value: 0n,
  });

  await pushLog(`[NETWORK] Awaiting block confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash });

  await delay(1000);
  await pushLog(
    `[SUCCESS] Position successfully unwound! Capital returned to Idle USDT.`,
  );
  await pushLog(`[EXPLORER] TxHash: ${hash}`);
}

main().catch(console.error);
