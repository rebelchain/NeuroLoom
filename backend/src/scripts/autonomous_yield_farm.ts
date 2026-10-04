import * as dotenvx from "@dotenvx/dotenvx";
import { ChatGroq } from "@langchain/groq";
import fs from "fs";
import cron from "node-cron";
import path from "path";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  formatUnits,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

import { generateDecision } from "../ai/agent.js";
import { evaluateDecision } from "../ai/evaluator.js";
import { runLiquidityRiskManager } from "../ai/liquidityWorker.js";
import { runOrchestrator } from "../ai/orchestrator.js";
import { runYieldStrategist } from "../ai/yieldWorker.js";
import { fetchQuantData } from "../data/taapi.js";
import { clearLogs, pushLog } from "../utils/push-log.js";

dotenvx.config();
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  TOKENS: {
    USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c",
    vUSDT: "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A",
  },
  MOCKS: {
    WBNB: "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e",
    ROUTER: "0xf33c30a801720294eba818a143339e487cddf129",
  },
  ORACLES: { BNB_USD: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" },
  PROTOCOLS: { VENUS_VUSDT: "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" },
} as const;

const VAULT_ADDRESS = "0xf25297f1a2d83f738dc32fc5851bdff732c20141" as const;
const LOG_FILE = path.resolve(process.cwd(), "autonomous_ai_logs.json");

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

const evaluatorLlm = new ChatGroq({
  apiKey: process.env.GROQ_API_KEY_1,
  model: "openai/gpt-oss-20b",
  temperature: 0.1,
  maxTokens: 500,
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
const vTokenAbi = [
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

const erc20Abi = [
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export async function runAutonomousCycle() {
  await clearLogs();
  await delay(1000);
  await pushLog(
    `\n[SYSTEM] Initiating AUTONOMOUS AI Cycle - ${new Date().toISOString()}`,
  );

  try {
    // DATA GATHERING
    await pushLog(`[DATA] Fetching live market conditions...`);
    const market = await fetchQuantData("BNB/USDT");
    const marketString = JSON.stringify(market);

    const [, priceInt] = await publicClient.readContract({
      address: CONFIG.ORACLES.BNB_USD,
      abi: oracleAbi,
      functionName: "latestRoundData",
    });
    const assetPrice = BigInt(priceInt);
    const displayPrice = (Number(assetPrice) / 1e8).toFixed(2);
    await pushLog(`[ORACLE] Live BNB/USD Price Verified: $${displayPrice}`);

    // QUERY BALANCE ON-CHAIN
    const vaultUsdtBalance = await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [VAULT_ADDRESS],
    });

    await pushLog(
      `[STATE] Live Vault USDT Balance: ${formatUnits(vaultUsdtBalance, 6)} USDT`,
    );

    if (vaultUsdtBalance < 10_000_000n) {
      await pushLog(
        `[FAIL] Vault balance too low for execution. Cycle Aborted.`,
      );
      return;
    }

    // ORCHESTRATOR & WORKERS PHASE
    await pushLog(`[ORCHESTRATOR] Planning strategy & deploying workers...`);
    const tasks = await runOrchestrator(market);
    await delay(2000);

    const workerPromises = tasks.map((task) => {
      if (task.type === "YIELD_STRATEGIST")
        return runYieldStrategist(task.description, marketString);
      if (task.type === "LIQUIDITY_RISK")
        return runLiquidityRiskManager(task.description, marketString);
      return null;
    });
    const combinedWorkerReports = (await Promise.all(workerPromises))
      .filter(Boolean)
      .join("\n\n");
    await delay(2000);

    // SYNTHESIZER
    await pushLog(`[AGENT] Synthesizing worker reports into action plan...`);
    const vaultState = { yieldFarm: vaultUsdtBalance, bluechip: 0n, degen: 0n };
    const recentMemories: any[] = [];
    const { thoughts, draft } = await generateDecision(
      market,
      vaultState,
      recentMemories,
      combinedWorkerReports,
      "",
    );
    await delay(2000);

    if (!draft) {
      await pushLog(
        `[FAIL] AI Agent failed to generate a valid JSON draft. Aborting cycle.`,
      );
      return;
    }

    // EVALUATOR (RISK OFFICER)
    await pushLog(`[EVALUATOR] Auditing AI Agent draft...`);
    const evaluation = await evaluateDecision(
      evaluatorLlm,
      draft,
      market,
      vaultState,
    );
    await pushLog(
      `[EVALUATOR VERDICT] ${evaluation.status}\nReasoning: ${evaluation.feedback}`,
    );

    if (evaluation.status === "FAIL") {
      await pushLog(`[FAIL] AI Execution aborted by Risk Evaluator.`);
      return;
    }

    // EXECUTOR
    const toolName = draft.toolName;
    const args = draft.args || {};
    await pushLog(`[EXECUTOR] AI Selected Tool: ${toolName}`);

    let txHash = "N/A";
    let finalStatus = "SUCCESS";

    if (toolName === "hold_position") {
      await pushLog(
        `[HOLD] Holding position. AI decided to wait for better conditions.`,
      );
      txHash = "NO_TX_REQUIRED";
      finalStatus = "HOLD";
    } else {
      const amountIn = vaultUsdtBalance / 100n;
      await pushLog(
        `[RISK CONTROL] Execution forced to 1% of vault balance: ${formatUnits(amountIn, 6)} USDT`,
      );

      let tokenIn: string,
        tokenOut: string,
        expectedAmountOut: bigint,
        targetProtocol: string,
        omnichainData: `0x${string}`;
      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

      if (
        toolName === "execute_pancake_swap" &&
        (args.action === "BUY_WBNB" || args.action === "SELL_WBNB")
      ) {
        targetProtocol = CONFIG.MOCKS.ROUTER;
        tokenIn = CONFIG.TOKENS.USDT;
        tokenOut = CONFIG.MOCKS.WBNB;

        expectedAmountOut = (amountIn * 10n ** 20n) / assetPrice;
        const minAmountOut = (expectedAmountOut * 9800n) / 10000n;
        omnichainData = encodeFunctionData({
          abi: mockRouterAbi,
          functionName: "swapExactTokensForTokens",
          args: [
            amountIn,
            minAmountOut,
            [tokenIn, tokenOut] as `0x${string}`[],
            VAULT_ADDRESS,
            deadline,
          ],
        });
      } else if (toolName === "execute_venus_deposit") {
        targetProtocol = CONFIG.PROTOCOLS.VENUS_VUSDT;
        tokenIn = CONFIG.TOKENS.USDT;
        tokenOut = CONFIG.TOKENS.vUSDT;

        expectedAmountOut = (amountIn * 10n ** 8n) / 10n ** 6n;
        omnichainData = encodeFunctionData({
          abi: vTokenAbi,
          functionName: "mint",
          args: [amountIn],
        });
      } else {
        await pushLog(`[ERROR] Unrecognized tool or action: ${toolName}`);
        return;
      }

      const minAmountOutFinal = (expectedAmountOut * 9800n) / 10000n;
      await pushLog(`[EXECUTION] Signing transaction for ${toolName}...`);

      const { request } = await publicClient.simulateContract({
        account,
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: "executeOmnichain",
        args: [
          targetProtocol as `0x${string}`,
          omnichainData,
          tokenIn as `0x${string}`,
          tokenOut as `0x${string}`,
          amountIn,
          minAmountOutFinal,
        ],
      });

      txHash = await walletClient.writeContract(request);
      await pushLog(`[NETWORK] Awaiting confirmation... TxHash: ${txHash}`);
      await publicClient.waitForTransactionReceipt({
        hash: txHash as `0x${string}`,
      });
      await pushLog(`[SUCCESS] Autonomous on-chain execution verified!`);
    }

    // LOGGING
    const logData = {
      timestamp: Date.now(),
      action: toolName,
      status: finalStatus,
      orchestratorTasks: tasks.map((t) => t.type).join(", "),
      reasoning: thoughts,
      evaluatorFeedback: evaluation.feedback, //
      hash: txHash,
    };
    let logs = [];
    if (fs.existsSync(LOG_FILE))
      logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    logs.push(logData);
    fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
    await pushLog(
      `[SYSTEM] Cycle completed. Logs securely stored to ${LOG_FILE}`,
    );
  } catch (error: any) {
    await pushLog(`[ERROR] AI Cycle failed: ${error.message}`);
  }
}

cron.schedule("0 0,12 * * *", () => {
  runAutonomousCycle();
});

console.log("[SYSTEM] NeuroLoom Autonomous Multi-Agent is ONLINE.");

// UNCOMMENT IF WANT TO EXECUTE DIRECTLY
// runAutonomousCycle();
