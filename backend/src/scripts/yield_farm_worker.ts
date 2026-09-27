import * as dotenvx from "@dotenvx/dotenvx";
import { ChatGroq } from "@langchain/groq";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
dotenvx.config();
console.log(
  "CEK PRIVATE KEY:",
  process.env.AI_PRIVATE_KEY ? "TERBACA" : "KOSONG!",
);

import { clearLogs, pushLog } from "../utils/push-log.js";

const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  VAULT: "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a",
  TOKENS: {
    USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c",
    vUSDT: "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A",
  },
  MOCKS: {
    WBNB: "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e",
    ROUTER: "0xf33c30a801720294eba818a143339e487cddf129",
  },
  PROTOCOLS: {
    VENUS_VUSDT: "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A",
  },
  ORACLES: { BNB_USD: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
};

const LOG_FILE = path.resolve(process.cwd(), "yield_farm_logs.json");

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

const llm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY,
  model: "openai/gpt-oss-safeguard-20b",
  temperature: 0.2,
});

// ABIs
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
const routerABI = [
  {
    inputs: [
      { internalType: "uint256", name: "amountIn" },
      { internalType: "uint256", name: "amountOutMin" },
      { internalType: "address[]", name: "path" },
      { internalType: "address", name: "to" },
      { internalType: "uint256", name: "deadline" },
    ],
    name: "swapExactTokensForTokens",
    outputs: [{ internalType: "uint256[]", name: "amounts" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
const vTokenABI = [
  {
    inputs: [{ internalType: "uint256", name: "mintAmount", type: "uint256" }],
    name: "mint",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "redeemTokens", type: "uint256" },
    ],
    name: "redeem",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
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

//  DETERMINISTIC PHASES
const PHASES = [
  {
    type: "EXECUTE",
    action: "ACCUMULATE_WBNB",
    mockData:
      "BNB price dropped by -5%, RSI at 28 (Oversold). Daily volume spiked. The protocol must convert USDT to WBNB for portfolio rebalancing.",
  },
  {
    type: "HOLD",
    action: "MARKET_OBSERVATION",
    mockData:
      "Extreme market volatility detected. FED interest rate decision in 2 hours. Trend direction is unclear. The most logical decision is to HOLD and suspend on-chain activity.",
  },
  {
    type: "EXECUTE",
    action: "VENUS_YIELD_DEPOSIT",
    mockData:
      "Market is ranging with low volatility. Venus Protocol offers 12% APY for vUSDT. The protocol must secure idle USDT into Venus to maximize yield generation.",
  },
  {
    type: "FAIL",
    action: "SLIPPAGE_PROTECTION",
    mockData:
      "Flash-crash detected in target liquidity pool. Slippage simulation shows a potential 5.5% loss. Execution is too risky; Risk Evaluator aborted the transaction.",
  },
  {
    type: "EXECUTE",
    action: "TAKE_PROFIT_WBNB",
    mockData:
      "WBNB price surged +8% hitting a strong resistance level. RSI is at 75 (Overbought). The protocol must secure profits (unwind) by selling WBNB back to USDT.",
  },
  {
    type: "EXECUTE",
    action: "VENUS_UNWIND",
    mockData:
      "Macro signals indicate a breakout opportunity in altcoins. The protocol requires instant USDT liquidity. Redeem funds from Venus Protocol back to the Vault.",
  },
];

function getLogs() {
  if (!fs.existsSync(LOG_FILE)) return [];
  return JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
}

function saveLog(log: any) {
  const logs = getLogs();
  logs.push(log);
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

async function runDeterminisitcCycle() {
  await clearLogs();
  await pushLog(
    `\n[SYSTEM] Initiating Yield Farm AI Cycle - ${new Date().toISOString()}`,
  );

  const logs = getLogs();
  const nextPhaseIndex = logs.length % PHASES.length;
  const currentPhase = PHASES[nextPhaseIndex];

  await pushLog(
    `[ORCHESTRATOR] Selected Phase: ${currentPhase.action} (${currentPhase.type})`,
  );

  await pushLog(`[AGENT] Generating analytical reasoning...`);

  const prompt = `You are the NeuroLoom AI Agent managing the 'Yield Farm' Strategy Vault.
Current market data: "${currentPhase.mockData}"

Based on the data above, write exactly two short, professional, and convincing paragraphs explaining why the AI engine made the decision to execute "${currentPhase.action}".
Use analytical, institutional DeFi language. No fluff, get straight to the reasoning.`;

  let aiReasoning = "";
  try {
    const response = await llm.invoke(prompt);
    aiReasoning = response.content.toString();
    await pushLog(`[AGENT REASONING]\n${aiReasoning}\n`);
  } catch (error) {
    console.error("[AGENT ERROR] Groq failed:", error);
    aiReasoning =
      "Error: AI reasoning generation timed out. Fallback to default security protocol.";
    await pushLog(`[ERROR] AI Engine failed to generate reasoning.`);
  }

  let txHash = "N/A";
  let finalStatus = currentPhase.type;

  try {
    if (currentPhase.type === "EXECUTE") {
      const [, priceInt] = await publicClient.readContract({
        address: CONFIG.ORACLES.BNB_USD as `0x${string}`,
        abi: oracleAbi,
        functionName: "latestRoundData",
      });
      const assetPrice = BigInt(priceInt);

      let targetProtocol = "",
        omnichainData = "",
        tokenIn = "",
        tokenOut = "";
      let amountIn = 0n,
        expectedAmountOut = 0n;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

      if (currentPhase.action === "ACCUMULATE_WBNB") {
        targetProtocol = CONFIG.MOCKS.ROUTER;
        amountIn = 200n;
        tokenIn = CONFIG.TOKENS.USDT;
        tokenOut = CONFIG.MOCKS.WBNB;
        expectedAmountOut =
          (amountIn * assetPrice * 10n ** 18n) / (10n ** 6n * 10n ** 8n);

        const path = [tokenIn, tokenOut];
        const minAmountOut = (expectedAmountOut * 9800n) / 10000n;
        omnichainData = encodeFunctionData({
          abi: routerABI,
          functionName: "swapExactTokensForTokens",
          args: [
            amountIn,
            minAmountOut,
            path as `0x${string}`[],
            CONFIG.VAULT as `0x${string}`,
            deadline,
          ],
        });
      } else if (currentPhase.action === "VENUS_YIELD_DEPOSIT") {
        targetProtocol = CONFIG.PROTOCOLS.VENUS_VUSDT;
        amountIn = 10000000n; // 10 USDT
        tokenIn = CONFIG.TOKENS.USDT;
        tokenOut = CONFIG.TOKENS.vUSDT;
        expectedAmountOut = (amountIn * 10n ** 8n) / 10n ** 6n;
        omnichainData = encodeFunctionData({
          abi: vTokenABI,
          functionName: "mint",
          args: [amountIn],
        });
      } else if (currentPhase.action === "TAKE_PROFIT_WBNB") {
        targetProtocol = CONFIG.MOCKS.ROUTER;
        amountIn = 100n;
        tokenIn = CONFIG.MOCKS.WBNB;
        tokenOut = CONFIG.TOKENS.USDT;
        expectedAmountOut =
          (amountIn * assetPrice * 10n ** 18n) / (10n ** 18n * 10n ** 8n);

        const path = [tokenIn, tokenOut];
        const minAmountOut = (expectedAmountOut * 9800n) / 10000n;
        omnichainData = encodeFunctionData({
          abi: routerABI,
          functionName: "swapExactTokensForTokens",
          args: [
            amountIn,
            minAmountOut,
            path as `0x${string}`[],
            CONFIG.VAULT as `0x${string}`,
            deadline,
          ],
        });
      } else if (currentPhase.action === "VENUS_UNWIND") {
        targetProtocol = CONFIG.PROTOCOLS.VENUS_VUSDT;
        amountIn = 1000000000n; // 10 vUSDT
        tokenIn = CONFIG.TOKENS.vUSDT;
        tokenOut = CONFIG.TOKENS.USDT;
        expectedAmountOut = (amountIn * 10n ** 6n) / 10n ** 8n;
        omnichainData = encodeFunctionData({
          abi: vTokenABI,
          functionName: "redeem",
          args: [amountIn],
        });
      }
      const minAmountOutFinal = (expectedAmountOut * 9800n) / 10000n;

      if (
        !targetProtocol ||
        !tokenIn ||
        !tokenOut ||
        !omnichainData ||
        !CONFIG.VAULT
      ) {
        throw new Error("MISSING CONFIG VARIABLES!");
      }

      await pushLog(
        `[EXECUTION] Signing transaction for ${currentPhase.action}...`,
      );
      const { request } = await publicClient.simulateContract({
        account,
        address: CONFIG.VAULT as `0x${string}`,
        abi: vaultABI,
        functionName: "executeOmnichain",
        args: [
          targetProtocol as `0x${string}`,
          omnichainData as `0x${string}`,
          tokenIn as `0x${string}`,
          tokenOut as `0x${string}`,
          amountIn,
          minAmountOutFinal,
        ],
      });

      txHash = await walletClient.writeContract(request);
      await pushLog(
        `[NETWORK] Awaiting BSC Testnet confirmation... TxHash: ${txHash}`,
      );
      await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      await pushLog(`[SUCCESS] On-chain execution verified.`);
    } else if (currentPhase.type === "HOLD") {
      await pushLog(
        `[HOLD] AI Agent holding position. No on-chain execution required.`,
      );
      txHash = "NO_TX_REQUIRED";
    } else if (currentPhase.type === "FAIL") {
      await pushLog(
        `[FAIL] Execution aborted due to high risk (Slippage/Liquidity).`,
      );
      txHash = "REJECTED_BY_RISK_EVALUATOR";
    }
  } catch (error: any) {
    const errorMsg = error.shortMessage || error.message;
    await pushLog(`[EXECUTION FAILED] Smart contract reverted: ${errorMsg}`);
    finalStatus = "FAILED_ON_CHAIN";
    txHash = "REVERTED";
  }

  saveLog({
    timestamp: Date.now(),
    action: currentPhase.action,
    type: currentPhase.type,
    status: finalStatus,
    reasoning: aiReasoning,
    hash: txHash,
  });

  await pushLog(`[SYSTEM] Cycle completed. Logs securely stored.`);
}

// Cron
cron.schedule("0 */3 * * *", () => {
  runDeterminisitcCycle();
});

cron.schedule("59 23 * * 0", () => {
  console.log("[SYSTEM] Resetting yield_farm_logs.json for the new week...");
  fs.writeFileSync(LOG_FILE, JSON.stringify([], null, 2));
});

console.log("[SYSTEM] Yield Farm Deterministic Worker is ONLINE via Cron.");

runDeterminisitcCycle();
