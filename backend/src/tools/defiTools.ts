import {
  ContractFunctionExecutionError,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { tool } from "@langchain/core/tools";
import { z } from "zod";

import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };
import { CONFIG } from "../config.js";
import { pushLog } from "../utils/push-log.js";

// CONSTANTS & ABI
const PANCAKE_V3_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
const VENUS_VUSDT = "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A";
const BTCB_TESTNET = "0x6ce8dA28E2f864420840cF74474eFf5fD80E65B8";

const PANCAKE_V3_ROUTER_ABI = [
  {
    type: "function",
    name: "exactInputSingle",
    stateMutability: "payable",
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
        type: "tuple",
        name: "params",
      },
    ],
    outputs: [{ type: "uint256", name: "amountOut" }],
  },
];

const VENUS_VUSDT_ABI = [
  {
    constant: false,
    inputs: [{ name: "mintAmount", type: "uint256" }],
    name: "mint",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

// CORE DISPATCHER ENGINE 
async function dispatchToVault(
  vaultAddress: `0x${string}`,
  targetProtocol: `0x${string}`,
  calldata: `0x${string}`,
  tokenIn: `0x${string}`,
  tokenOut: `0x${string}`,
  amountIn: bigint,
  amountOutMin: bigint,
): Promise<string> {
  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("AI_PRIVATE_KEY not found in backend/.env");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  await pushLog(`[NETWORK] Simulating execution via Vault ${vaultAddress}...`);

  try {
    const { request } = await publicClient.simulateContract({
      address: vaultAddress,
      abi: VaultABI.abi,
      functionName: "executeOmnichain",
      args: [
        targetProtocol,
        calldata,
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
      ],
      account,
    });

    const hash = await walletClient.writeContract(request);
    await pushLog(
      `[NETWORK] ⏳ TX Broadcasted: https://testnet.bscscan.com/tx/${hash}`,
    );

    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });
    if (receipt.status === "success") {
      return `Success: TX Confirmed in Block ${receipt.blockNumber}. Hash: ${hash}`;
    }
    throw new Error("On-chain execution reverted");
  } catch (error: any) {
    if (error instanceof ContractFunctionExecutionError) {
      const errorMsg = `Failed (Revert): ${error.shortMessage}`;
      await pushLog(`[ERROR] ${errorMsg}`);
      return errorMsg;
    }
    throw error;
  }
}

//  PANCAKESWAP
export const executePancakeSwap = tool(
  async ({ vaultAddress, action, amountInWei, currentPriceStr }) => {
    let tokenIn, tokenOut;

    if (action === "BUY_WBNB") {
      tokenIn = CONFIG.TOKENS.USDT;
      tokenOut = CONFIG.TOKENS.WBNB;
    } else if (action === "SELL_WBNB") {
      tokenIn = CONFIG.TOKENS.WBNB;
      tokenOut = CONFIG.TOKENS.USDT;
    } else if (action === "BUY_BTCB") {
      tokenIn = CONFIG.TOKENS.USDT;
      tokenOut = BTCB_TESTNET;
    } else if (action === "SELL_BTCB") {
      tokenIn = BTCB_TESTNET;
      tokenOut = CONFIG.TOKENS.USDT;
    } else {
      return "Failed: Invalid action provided.";
    }

    const amountIn = BigInt(amountInWei);
    const currentPrice = BigInt(currentPriceStr); 

   
    let expectedAmountOut;
    if (action.startsWith("BUY_")) {
      expectedAmountOut = (amountIn * 100000000n) / currentPrice; 
    } else {
      expectedAmountOut = (amountIn * currentPrice) / 100000000n;
    }
    const amountOutMin = (expectedAmountOut * 9800n) / 10000n;

    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

  
    const calldata = encodeFunctionData({
      abi: PANCAKE_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: tokenIn as `0x${string}`,
          tokenOut: tokenOut as `0x${string}`,
          fee: 500,
          recipient: vaultAddress as `0x${string}`,
          deadline,
          amountIn,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    await pushLog(
      `[TOOL] AI Executing PancakeSwap Swap (${action}) in Vault ${vaultAddress}`,
    );

    return await dispatchToVault(
      vaultAddress as `0x${string}`,
      PANCAKE_V3_ROUTER as `0x${string}`,
      calldata,
      tokenIn as `0x${string}`,
      tokenOut as `0x${string}`,
      amountIn,
      amountOutMin,
    );
  },
  {
    name: "execute_pancake_swap",
    description:
      "Executes a tactical token swap on PancakeSwap V3 to dynamically reposition assets in the vault.",
    schema: z.object({
      vaultAddress: z
        .string()
        .describe(
          "The proxy address of the specific strategy vault executing the swap",
        ),
      action: z
        .enum(["BUY_WBNB", "SELL_WBNB", "BUY_BTCB", "SELL_BTCB"])
        .describe("The specific swap route direction"),
      amountInWei: z
        .string()
        .describe(
          "Amount of tokenIn in Wei as a string (e.g. '1000000000000000000')",
        ),
      currentPriceStr: z
        .string()
        .describe("Current Oracle price as a string for slippage calculation"),
    }),
  },
);

//  VENUS PROTOCOL 
export const executeVenusDeposit = tool(
  async ({ vaultAddress, amountInWei }) => {
    const amountIn = BigInt(amountInWei);

    const amountOutMin = (amountIn * 9900n) / 10000n;

   
    const calldata = encodeFunctionData({
      abi: VENUS_VUSDT_ABI,
      functionName: "mint",
      args: [amountIn],
    });

    await pushLog(
      `[TOOL] AI Executing Venus Deposit (Mint vUSDT) in Vault ${vaultAddress}`,
    );

    return await dispatchToVault(
      vaultAddress as `0x${string}`,
      VENUS_VUSDT as `0x${string}`,
      calldata,
      CONFIG.TOKENS.USDT as `0x${string}`, 
      VENUS_VUSDT as `0x${string}`, 
      amountIn,
      amountOutMin,
    );
  },
  {
    name: "execute_venus_deposit",
    description:
      "Deposits USDT into the Venus Protocol to generate passive yield, receiving vUSDT in return.",
    schema: z.object({
      vaultAddress: z
        .string()
        .describe(
          "The proxy address of the specific strategy vault executing the deposit",
        ),
      amountInWei: z
        .string()
        .describe("Amount of USDT to deposit in Wei as a string"),
    }),
  },
);
