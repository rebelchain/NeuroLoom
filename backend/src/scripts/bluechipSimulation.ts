import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
// Ubah express() menjadi express.Router()
import { Router } from "express";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";
import { pushLog } from "../utils/push-log.js";

const router = Router(); // <--- GANTI app dengan router

const BLUECHIP_VAULT = CONFIG.VAULTS.BLUECHIP;

// Constants
const PANCAKE_V3_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
const PANCAKE_V3_QUOTER = "0x78D16726Cb34e8b3503B8e7E758aAE2A1450Cb13";
const USDT_TESTNET = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";
const WBNB_TESTNET = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd";

// ABIs
const VAULT_ABI = [
  /* ... isian ABI biarkan sama ... */
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
];

const PANCAKE_V3_ROUTER_ABI = [
  /* ... isian ABI biarkan sama ... */
  {
    inputs: [
      {
        components: [
          { type: "address", name: "tokenIn" },
          { type: "address", name: "tokenOut" },
          { type: "uint24", name: "fee" },
          { type: "address", name: "recipient" },
          { type: "uint256", name: "deadline" },
          { type: "uint256", name: "amountIn" },
          { type: "uint256", name: "amountOutMinimum" },
          { type: "uint160", name: "sqrtPriceLimitX96" },
        ],
        name: "params",
        type: "tuple",
      },
    ],
    name: "exactInputSingle",
    outputs: [{ type: "uint256", name: "amountOut" }],
    stateMutability: "payable",
    type: "function",
  },
];

const QUOTER_ABI = [
  /* ... isian ABI biarkan sama ... */
  {
    inputs: [
      {
        components: [
          { internalType: "address", name: "tokenIn", type: "address" },
          { internalType: "address", name: "tokenOut", type: "address" },
          { internalType: "uint256", name: "amountIn", type: "uint256" },
          { internalType: "uint24", name: "fee", type: "uint24" },
          {
            internalType: "uint160",
            name: "sqrtPriceLimitX96",
            type: "uint160",
          },
        ],
        internalType: "struct IQuoterV2.QuoteExactInputSingleParams",
        name: "params",
        type: "tuple",
      },
    ],
    name: "quoteExactInputSingle",
    outputs: [
      { internalType: "uint256", name: "amountOut", type: "uint256" },
      { internalType: "uint160", name: "sqrtPriceX96After", type: "uint160" },
      {
        internalType: "uint32",
        name: "initializedTicksCrossed",
        type: "uint32",
      },
      { internalType: "uint256", name: "gasEstimate", type: "uint256" },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
];

const agentLLM = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY,
  model: "gemini-3-flash-preview",
  temperature: 0.1,
});

const evaluatorLLM = new ChatGoogleGenerativeAI({
  apiKey: process.env.GEMINI_API_KEY2 || process.env.GEMINI_API_KEY,
  model: "gemini-3-flash-preview",
  temperature: 0.1,
});

function extractXML(text: string, tag: string): string {
  const regex = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "i");
  const match = text.match(regex);
  return match ? match[1].trim() : "";
}

// GANTI app.post menjadi router.post, dan HAPUS '/api' dari URL (karena sudah di-mount di server.ts)
router.post("/live-simulation", async (req, res) => {
  await pushLog(
    `\n[SYSTEM] Initiating on-chain rebalance simulation pipeline...`,
  );

  try {
    const simulatedPrice = 510.0;
    const marketData = {
      price: simulatedPrice,
      POSITION_HEALTH_RADAR: {
        BLUECHIP_VAULT: "OUT_OF_RANGE_DRIFT_6_PERCENT",
      },
    };

    const vaultState = {
      targetWeights: "vUSDT 40% | WBNB 30% | bCSPX 30%",
      currentWeights: "vUSDT 42.2% | WBNB 26.1% | bCSPX 31.7%",
    };

    await pushLog(
      `[AGENT] Formulating strategic response based on injected market context...`,
    );

    const systemPrompt = `You are the NeuroLoom Quant Agent.
Your goal is to restore the vault's target weights. WBNB is underweight (26.1%).

CRITICAL DIRECTIVE:
You MUST perform a 'Buy The Dip' rebalance to restore WBNB to 30%.
Since this is a live testnet simulation to prove on-chain execution capability without draining funds, you MUST execute a MICRO-TRANSACTION.
Set "amountInUsdtStr" exactly to "0.01".

IMPORTANT ON-CHAIN RULE:
The NeuroLoomVault smart contract strictly enforces a maximum slippage of 2% (200 BPS) via its Oracle Guardrail.
You MUST set "slippageBps" exactly to 200 to pass the _validateSlippageAgainstOracle check.

Output strictly in XML:
<thoughts>
Write your reasoning here. Mention the need to Buy the Dip with a micro-transaction, and the strict adherence to the 200 BPS slippage guardrail.
</thoughts>
<response>
{"toolName": "execute_pancake_swap", "args": {"vaultAddress": "${BLUECHIP_VAULT}", "action": "BUY_WBNB", "amountInUsdtStr": "0.01", "slippageBps": 200}}
</response>`;

    const userContext = `DEFI STATE: ${JSON.stringify(marketData)}\nVAULT STATE: ${JSON.stringify(vaultState)}`;

    const agentResponse = await agentLLM.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(userContext),
    ]);

    const rawContent = agentResponse.content?.toString() || "";
    const thoughts = extractXML(rawContent, "thoughts");
    const responseJsonString = extractXML(rawContent, "response")
      .replace(/```json|```/g, "")
      .trim();

    if (!responseJsonString) {
      throw new Error("Agent failed to generate a valid JSON output format.");
    }

    const draft = JSON.parse(responseJsonString);

    await pushLog(`[AGENT] Strategy formulated.`);
    // Tetap gunakan ini agar muncul di frontend log
    await pushLog(`[AGENT REASONING] ${thoughts}`);

    await pushLog(
      `[EVALUATOR] Validating transaction and slippage parameters...`,
    );

    const evaluatorPrompt = `You are the Chief Risk Officer for NeuroLoom.
Evaluate the proposed Tool Call draft.
Check if 'amountInUsdtStr' is exactly "0.01" (Micro-transaction safety limit).
Check if 'slippageBps' is EXACTLY 200 to satisfy the Smart Contract Oracle Guardrail.

Output XML:
<evaluation>PASS or FAIL</evaluation>
<feedback>State if the micro-transaction and slippage parameters are verified.</feedback>`;

    const evalResponse = await evaluatorLLM.invoke([
      new SystemMessage(evaluatorPrompt),
      new HumanMessage(`DRAFT: ${JSON.stringify(draft)}`),
    ]);

    const evalRaw = evalResponse.content.toString();
    const evaluation = extractXML(evalRaw, "evaluation").toUpperCase();
    const feedback = extractXML(evalRaw, "feedback");

    if (evaluation !== "PASS" && !evaluation.includes("PASS")) {
      await pushLog(`[EVALUATOR REJECTED] Reason: ${feedback}`);
      throw new Error(`Evaluator rejected the transaction: ${feedback}`);
    }

    await pushLog(`[EVALUATOR APPROVED] ${feedback}`);
    await pushLog(`[SYSTEM] Initiating Viem execution pipeline...`);

    const pk = process.env.AI_PRIVATE_KEY;
    if (!pk) throw new Error("AI_PRIVATE_KEY not found in .env file.");

    const account = privateKeyToAccount(
      (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
    );

    const publicClient = createPublicClient({
      chain: bscTestnet,
      transport: http("https://data-seed-prebsc-2-s2.bnbchain.org:8545/"),
    });

    const walletClient = createWalletClient({
      account,
      chain: bscTestnet,
      transport: http("https://data-seed-prebsc-2-s2.bnbchain.org:8545/"),
    });

    const amountIn = parseUnits(draft.args.amountInUsdtStr, 18);

    await pushLog(
      `[QUOTER] Executing price discovery for 0.01 USDT on PancakeSwap V3...`,
    );

    let expectedAmountOut = 0n;
    let selectedFee = 500;
    const feeTiersToTry = [500, 2500, 3000, 10000];

    for (const fee of feeTiersToTry) {
      try {
        const { result } = await publicClient.simulateContract({
          address: PANCAKE_V3_QUOTER as `0x${string}`,
          abi: QUOTER_ABI,
          functionName: "quoteExactInputSingle",
          args: [
            {
              tokenIn: USDT_TESTNET,
              tokenOut: WBNB_TESTNET,
              amountIn: amountIn,
              fee: fee,
              sqrtPriceLimitX96: 0n,
            },
          ],
        });
        expectedAmountOut = result[0] as bigint;
        selectedFee = fee;
        await pushLog(
          `[QUOTER] Route established at fee tier ${fee}. Expected output: ${expectedAmountOut.toString()} Wei.`,
        );
        break;
      } catch (e: any) {
        // Abaikan dan coba fee tier berikutnya
      }
    }

    if (expectedAmountOut === 0n) {
      await pushLog(
        `[CRITICAL] Liquidity pool unavailable for quoting. Falling back to deterministic estimation.`,
      );
      expectedAmountOut = parseUnits("0.000016", 18);
      selectedFee = 2500;
      await pushLog(
        `[FALLBACK] Estimated output set to: ${expectedAmountOut.toString()} Wei WBNB.`,
      );
    }

    const slippageBps = BigInt(draft.args.slippageBps || 200);
    const slippageMultiplier = 10000n - slippageBps;

    const amountOutMin = (expectedAmountOut * slippageMultiplier) / 10000n;
    await pushLog(
      `[SYSTEM] Slippage guardrail applied (2%). Minimum output constrained to: ${amountOutMin.toString()} Wei.`,
    );

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

    const calldata = encodeFunctionData({
      abi: PANCAKE_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: USDT_TESTNET,
          tokenOut: WBNB_TESTNET,
          fee: selectedFee,
          recipient: BLUECHIP_VAULT as `0x${string}`,
          deadline,
          amountIn,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    await pushLog(
      `[NETWORK] Broadcasting executeOmnichain to target vault: ${BLUECHIP_VAULT}...`,
    );

    const nonce = await publicClient.getTransactionCount({
      address: account.address,
      blockTag: "pending",
    });

    await pushLog(`[SYSTEM] Using Nonce: ${nonce} for transaction.`);

    const { request } = await publicClient.simulateContract({
      address: BLUECHIP_VAULT as `0x${string}`,
      abi: VAULT_ABI,
      functionName: "executeOmnichain",
      args: [
        PANCAKE_V3_ROUTER as `0x${string}`,
        calldata,
        USDT_TESTNET as `0x${string}`,
        WBNB_TESTNET as `0x${string}`,
        amountIn,
        amountOutMin,
      ],
      account,
      nonce: nonce,
    });

    const txHash = await walletClient.writeContract(request);
    await pushLog(
      `[NETWORK] Transaction broadcasted. Hash: https://testnet.bscscan.com/tx/${txHash}`,
    );

    await publicClient.waitForTransactionReceipt({
      hash: txHash,
      confirmations: 1,
    });

    await pushLog(`[NETWORK] Transaction confirmed successfully.`);
    await pushLog(`[SYSTEM] On-chain simulation pipeline completed.\n`);

    const finalResult = {
      status: "success",
      timestamp: new Date().toISOString(),
      market: { price_detected: simulatedPrice },
      ai_reasoning: thoughts,
      evaluator_status: evaluation,
      execution: {
        tool_used: draft.toolName,
        amount_swapped: draft.args.amountInUsdtStr,
        transaction_hash: txHash,
        explorer_url: `https://testnet.bscscan.com/tx/${txHash}`,
      },
    };

    return res.status(200).json(finalResult);
  } catch (error: any) {
    await pushLog(
      `[CRITICAL ERROR] Simulation pipeline failed: ${error.message}`,
    );
    return res.status(500).json({ status: "error", message: error.message });
  }
});

export default router;
