import {
  BaseError,
  ContractFunctionExecutionError,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  publicActions,
  parseUnits,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };
import { CONFIG } from "../config.js";
import { pushLog } from "../utils/push-log.js";


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
  {
    constant: false,
    inputs: [{ name: "redeemAmount", type: "uint256" }],
    name: "redeemUnderlying",
    outputs: [{ name: "", type: "uint256" }],
    payable: false,
    stateMutability: "nonpayable",
    type: "function",
  },
];

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256", name: "" }],
    stateMutability: "view",
  },
] as const;

const AGGREGATOR_ABI = [
  {
    type: "function",
    name: "latestRoundData",
    inputs: [],
    outputs: [
      { type: "uint80" },
      { type: "int256", name: "price" },
      { type: "uint256" },
      { type: "uint256", name: "updatedAt" },
      { type: "uint80" },
    ],
    stateMutability: "view",
  },
] as const;
const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";

export async function executeTradeOnChain(
  action: string,
  amountPercentage: number,
) {
  if (action === "HOLD" || amountPercentage === 0) {
    console.log(
      "🛡️ [EXECUTOR] Action is HOLD. Preserving gas. No on-chain transaction broadcasted.",
    );
    return;
  }

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("[ERROR] AI_PRIVATE_KEY not found in backend/.env");

  // DEMO or Production
  const scenario = process.env.MOCK_SCENARIO || "PRODUCTION";
  const isMockMode = scenario !== "PRODUCTION";

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
  }).extend(publicActions);

  await pushLog(
    `\n[ON-CHAIN EXECUTION] Preparing V3 Multi-Protocol Routing for ${action}...`,
  );

  try {
    let tokenIn: `0x${string}`;
    let tokenOut: `0x${string}`;

    if (action === "SELL_WBNB") {
      tokenIn = CONFIG.TOKENS.WBNB as `0x${string}`;
      tokenOut = CONFIG.TOKENS.USDT as `0x${string}`;
    } else {
      tokenIn = CONFIG.TOKENS.USDT as `0x${string}`;
      tokenOut = CONFIG.TOKENS.WBNB as `0x${string}`;
    }

    await pushLog(`[NETWORK] Fetching live balance from Vault...`);
    const vaultBalance = (await publicClient.readContract({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    })) as bigint;

    await pushLog(`[NETWORK] Fetching live price from Chainlink Oracle...`);
    const roundData = await publicClient.readContract({
      address: CHAINLINK_BNB_USD as `0x${string}`,
      abi: AGGREGATOR_ABI,
      functionName: "latestRoundData",
    });

    const currentPrice = BigInt(roundData[1]);

    let amountIn: bigint;
    let amountOutMin: bigint;

    if (isMockMode) {
      await pushLog(
        `⚠️ [MOCK MODE] Micro-transactions to trigger The Graph events.`,
      );
      amountIn = parseUnits("0.0001", 18);

    } else {
      amountIn = (vaultBalance * BigInt(Math.floor(amountPercentage))) / 100n;
      if (amountIn === 0n) {
        await pushLog("❌ [EXECUTOR] Vault balance 0. Aborting.");
        return;
      }
    }

    // Slippage Offchain calculation
    if (action === "BUY_WBNB") {
      const expectedAmountOut = (amountIn * 100000000n) / currentPrice;

      amountOutMin = (expectedAmountOut * 9800n) / 10000n;

      await pushLog(
        `[MATH] Minimum WBNB Target (2% Slippage): ${amountOutMin} wei`,
      );
    } else {
      // Skenario: WBNB ➔ USDT
      const expectedAmountOut = (amountIn * currentPrice) / 100000000n;
      amountOutMin = (expectedAmountOut * 9800n) / 10000n;

      await pushLog(
        `[MATH] ⚠️ MOCK BYPASS: Minimum USDT Target forced to 0 wei to avoid Testnet AMM Revert`,
      );
    }

   
    const DEX_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600);

    await pushLog(
      `[NETWORK] Encoding dynamic calldata for target protocol: PancakeSwap SwapRouter v3...`,
    );
    const dexCalldata = encodeFunctionData({
      abi: PANCAKE_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: 500,
          recipient: CONFIG.VAULT_PROXY as `0x${string}`,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    // VENUS DEPOSIT
    // const amountToInvest = 1000000000000000000n; 

    // const mintCalldata = encodeFunctionData({
    //   abi: VENUS_VUSDT_ABI,
    //   functionName: "mint",
    //   args: [amountToInvest],
    // });

    // VENUS WITHDRAW
    // const redeemCalldata = encodeFunctionData({
    //   abi: VENUS_VUSDT_ABI,
    //   functionName: "redeemUnderlying",
    //   args: [amountToInvest],
    // });

   
    await pushLog(
      `[NETWORK] Simulating Vault execution and security guardrails...`,
    );

    const { request } = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "executeOmnichain",
      args: [
        DEX_ROUTER,
        dexCalldata,
        tokenIn,
        tokenOut,
        amountIn,
        amountOutMin,
      ],
      account,
    });

    await pushLog(
      `[NETWORK] Simulation passed! Strict Oracle and Protocol Whitelist checks cleared.`,
    );
    const hash = await walletClient.writeContract(request);
    await pushLog(
      `[NETWORK] ⏳ Transaction broadcasted to Mempool. Waiting for block confirmation...`,
    );

   
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1, 
    });


    if (receipt.status === "success") {
      await pushLog(
        `SUCCESS ✅ -> Rebalance Confirmed in Block ${receipt.blockNumber}!`,
      );
      await pushLog(`🔗 Link: https://testnet.bscscan.com/tx/${hash}`);
    } else {
      await pushLog(`❌ ERROR -> Transaction REVERTED on-chain!`);
      await pushLog(
        `🔗 Check the revert reason at: https://testnet.bscscan.com/tx/${hash}`,
      );
      throw new Error("On-chain execution reverted");
    }
  } catch (error: any) {
    console.error("\nERROR: Failed to execute on-chain transaction. Reason:");
    if (error instanceof ContractFunctionExecutionError) {
      console.error("   [SMART CONTRACT REVERT]:", error.shortMessage);
    } else if (error instanceof BaseError) {
      console.error("   [VIEM ERROR]:", error.shortMessage || error.message);
    } else {
      console.error("   [SYSTEM ERROR]:", error.message);
    }
    throw error;
  }
}
