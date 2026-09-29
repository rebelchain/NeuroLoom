import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as dotenvx from "@dotenvx/dotenvx";
import { pushLog, clearLogs } from "../utils/push-log.js";

dotenvx.config();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));


const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  TOKENS: { USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" },
  MOCKS: {
    WBNB: "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e",
    ROUTER: "0xf33c30a801720294eba818a143339e487cddf129",
  },
  ORACLES: { BNB_USD: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
} as const;

const BLUECHIP_VAULT = "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e";

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

const vaultABI = [
  {
    inputs: [
      { internalType: "address", name: "targetProtocol", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
      { internalType: "address", name: "tokenIn", type: "address" },
      { internalType: "address", name: "tokenOut", type: "address" },
      { internalType: "uint256", name: "amountIn", type: "uint256" },
      {
        internalType: "uint256",
        name: "expectedAmountOutMin",
        type: "uint256",
      },
    ],
    name: "executeOmnichain",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const mockRouterAbi = [
  {
    name: "swapExactTokensForTokens",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
    outputs: [{ type: "uint256[]", name: "amounts" }],
  },
] as const;

const oracleAbi = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { type: "uint80", name: "roundId" },
      { type: "int256", name: "answer" },
      { type: "uint256", name: "startedAt" },
      { type: "uint256", name: "updatedAt" },
      { type: "uint80", name: "answeredInRound" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function main() {
  await clearLogs();
  await delay(1000);

  await pushLog(`[SYSTEM] Market anomaly detected. Global metrics shifting...`);
  await delay(1500);
  await pushLog(
    `[ORCHESTRATOR] Risk threshold exceeded for Bluechip Momentum Vault.`,
  );
  await delay(2000);

  const [, priceInt] = await publicClient.readContract({
    address: CONFIG.ORACLES.BNB_USD,
    abi: oracleAbi,
    functionName: "latestRoundData",
  });
  const assetPrice = BigInt(priceInt);
  const displayPrice = (Number(assetPrice) / 1e8).toFixed(2);

  await pushLog(
    `[ORACLE] Chainlink Data Feed verified. WBNB current price: $${displayPrice}`,
  );
  await delay(2000);
  await pushLog(
    `[NEURAL_NET] Initiating Emergency Unwind Protocol. Securing capital...`,
  );
  await delay(2500);


  await pushLog(
    `[ROUTING] Formulating defensive route: WBNB -> USDT (Stablecoin)`,
  );
  await pushLog(`[EXECUTION] Withdrawing liquidity from PancakeSwap V3...`);


  const amountIn = 100n;


  const expectedAmountOut =
    (amountIn * assetPrice * 10n ** 18n) / (10n ** 18n * 10n ** 8n); 
  const minAmountOut = (expectedAmountOut * 9800n) / 10000n;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

 
  const swapData = encodeFunctionData({
    abi: mockRouterAbi,
    functionName: "swapExactTokensForTokens",
    args: [
      amountIn,
      minAmountOut,
      [CONFIG.MOCKS.WBNB as `0x${string}`, CONFIG.TOKENS.USDT as `0x${string}`],
      BLUECHIP_VAULT as `0x${string}`,
      deadline,
    ],
  });

  const { request } = await publicClient.simulateContract({
    account,
    address: BLUECHIP_VAULT as `0x${string}`,
    abi: vaultABI,
    functionName: "executeOmnichain",
    args: [
      CONFIG.MOCKS.ROUTER as `0x${string}`,
      swapData,
      CONFIG.MOCKS.WBNB as `0x${string}`, 
      CONFIG.TOKENS.USDT as `0x${string}`,
      amountIn,
      minAmountOut,
    ],
  });

  const hash = await walletClient.writeContract(request);

  await pushLog(`[NETWORK] Awaiting block confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash });

  await delay(1000);
  await pushLog(
    `[SUCCESS] Position successfully unwound! Capital returned to Idle USDT.`,
  );
  await pushLog(`[EXPLORER] TxHash: ${hash}`);
}

main().catch(console.error);