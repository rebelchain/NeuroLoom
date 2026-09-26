import * as dotenvx from "@dotenvx/dotenvx";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { clearLogs, pushLog } from "../utils/push-log.js";

dotenvx.config();

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
const randomDelay = (min: number, max: number) =>
  delay(Math.floor(Math.random() * (max - min + 1) + min) * 1000);

const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  TOKENS: { USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" },
  MOCKS: {
    WBNB: "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e",
    ROUTER: "0xf33c30a801720294eba818a143339e487cddf129",
  },
  ORACLES: { BNB_USD: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
} as const;

const VAULTS = [
  { name: "Yield Farm", address: "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a" },
  {
    name: "Bluechip Momentum",
    address: "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e",
  },
  {
    name: "Degen Accumulator",
    address: "0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55",
  },
];

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

// ABI Definition
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

async function executeRandomTrade(tradeIndex: number) {
  const vault = VAULTS[Math.floor(Math.random() * VAULTS.length)];
  const action = Math.random() > 0.5 ? "REBALANCE" : "UNWIND";

  await pushLog(`\n[SYSTEM] INITIATING ORCHESTRATOR #${tradeIndex} `);
  await delay(1500);
  await pushLog(
    `[ORCHESTRATOR] Analyzing metrics for ${vault.name} (${vault.address.substring(0, 6)}...)`,
  );
  await delay(1500);

  const [, priceInt] = await publicClient.readContract({
    address: CONFIG.ORACLES.BNB_USD,
    abi: oracleAbi,
    functionName: "latestRoundData",
  });
  const assetPrice = BigInt(priceInt);
  const displayPrice = (Number(assetPrice) / 1e8).toFixed(2);

  await pushLog(`[ORACLE] BNB/USD Price Verified: $${displayPrice}`);
  await delay(1500);

  let amountIn, tokenIn, tokenOut, expectedAmountOut, path;
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

  if (action === "REBALANCE") {
    await pushLog(
      `[NEURAL_NET] Volatility optimal. Executing REBALANCE (USDT -> WBNB)`,
    );
    amountIn = 200n;
    tokenIn = CONFIG.TOKENS.USDT;
    tokenOut = CONFIG.MOCKS.WBNB;
    path = [tokenIn, tokenOut];
    expectedAmountOut =
      (amountIn * assetPrice * 10n ** 18n) / (10n ** 6n * 10n ** 8n);
  } else {
    await pushLog(
      `[NEURAL_NET] Risk detected. Executing Emergency UNWIND (WBNB -> USDT)`,
    );
    amountIn = 100n;
    tokenIn = CONFIG.MOCKS.WBNB;
    tokenOut = CONFIG.TOKENS.USDT;
    path = [tokenIn, tokenOut];
    expectedAmountOut =
      (amountIn * assetPrice * 10n ** 18n) / (10n ** 18n * 10n ** 8n);
  }

  const minAmountOut = (expectedAmountOut * 9800n) / 10000n;

  const swapData = encodeFunctionData({
    abi: mockRouterAbi,
    functionName: "swapExactTokensForTokens",
    args: [
      amountIn,
      minAmountOut,
      path as `0x${string}`[],
      vault.address as `0x${string}`,
      deadline,
    ],
  });

  await pushLog(`[EXECUTION] Signing transaction for ${vault.name}...`);

  const { request } = await publicClient.simulateContract({
    account,
    address: vault.address as `0x${string}`,
    abi: vaultABI,
    functionName: "executeOmnichain",
    args: [
      CONFIG.MOCKS.ROUTER as `0x${string}`,
      swapData,
      tokenIn as `0x${string}`,
      tokenOut as `0x${string}`,
      amountIn,
      minAmountOut,
    ],
  });

  const hash = await walletClient.writeContract(request);
  await pushLog(`[NETWORK] Awaiting BSC Testnet confirmation...`);
  await publicClient.waitForTransactionReceipt({ hash });

  await pushLog(`[SUCCESS] ${action} Executed successfully on ${vault.name}!`);
  await pushLog(`[EXPLORER] TxHash: ${hash}`);
}

async function main() {
  await clearLogs();
  await pushLog("[SYSTEM] NeuroLoom Market Simulator Engine Online.");
  await pushLog(
    "[SYSTEM] Commencing 9 random execution cycles across all Vaults...",
  );

  for (let i = 1; i <= 9; i++) {
    try {
      await executeRandomTrade(i);
    } catch (error: any) {
      await pushLog(
        `[ERROR] Cycle #${i} failed: ${error.shortMessage || error.message}`,
      );
    }

    if (i < 9) {
      const minSeconds = 3 * 60;
      const maxSeconds = 60 * 60;
      // const minSeconds = 15; // for testing ai event log
      // const maxSeconds = 60; // for testing AI Event log

      const waitTimeSeconds = Math.floor(
        Math.random() * (maxSeconds - minSeconds + 1) + minSeconds,
      );

      const minutes = Math.floor(waitTimeSeconds / 60);
      const seconds = waitTimeSeconds % 60;

      await pushLog(
        `[SYSTEM] Sleeping for ${minutes} minutes ${seconds} seconds before next cycle...`,
      );
      await delay(waitTimeSeconds * 1000);
    }
  }

  await pushLog("\n[SYSTEM]  ALL SIMULATION CYCLES COMPLETED ");
}

main().catch(console.error);
