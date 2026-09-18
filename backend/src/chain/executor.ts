import {
  BaseError,
  ContractFunctionExecutionError,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseUnits,
  publicActions,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };
import { CONFIG } from "../config.js";

// [PERBAIKAN 1]: Menggunakan ABI PancakeSwap V3 yang benar
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

// ABI Standar ERC20 untuk mengecek saldo riil Vault
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

  // Mengecek apakah kita sedang mode perekaman Video Demo
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

  console.log(
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

    console.log(`[NETWORK] Fetching live balance from Vault...`);
    const vaultBalance = (await publicClient.readContract({
      address: tokenIn,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    })) as bigint;

    console.log(`[NETWORK] Fetching live price from Chainlink Oracle...`);
    const roundData = await publicClient.readContract({
      address: CHAINLINK_BNB_USD as `0x${string}`,
      abi: AGGREGATOR_ABI,
      functionName: "latestRoundData",
    });

    const currentPrice = BigInt(roundData[1]); // Harga Chainlink (8 decimals)

    let amountIn: bigint;
    let amountOutMin: bigint;

    if (isMockMode) {
      console.log(
        `⚠️ [MOCK MODE] Micro-transactions to trigger The Graph events.`,
      );
      amountIn = parseUnits("0.0001", 18); // Menggunakan 0.0001 USDT
    } else {
      amountIn = (vaultBalance * BigInt(Math.floor(amountPercentage))) / 100n;
      if (amountIn === 0n) {
        console.log("❌ [EXECUTOR] Vault balance 0. Aborting.");
        return;
      }
    }

    // ==========================================
    // [KALKULASI SLIPPAGE OFF-CHAIN]
    // Meniru logika matematika Smart Contract agar sinkron persis
    // ==========================================
    if (action === "BUY_WBNB") {
      // Skenario: USDT ➔ WBNB (Membeli koin mahal)
      // expectedAmountOut = (amountIn * 1e8) / currentPrice
      const expectedAmountOut = (amountIn * 100000000n) / currentPrice;

      // Menerapkan toleransi slippage 2% (Sama dengan MAX_SLIPPAGE_BPS = 200 di kontrak)
      amountOutMin = (expectedAmountOut * 9800n) / 10000n;

      console.log(
        `[MATH] Minimum WBNB Target (2% Slippage): ${amountOutMin} wei`,
      );
    } else {
      // Skenario: WBNB ➔ USDT (Menjual koin mahal)
      const expectedAmountOut = (amountIn * currentPrice) / 100000000n;
      amountOutMin = (expectedAmountOut * 9800n) / 10000n;
      console.log(
        `[MATH] Minimum USDT Target (2% Slippage): ${amountOutMin} wei`,
      );
    }

    // ==========================================
    // TAHAP 1: MERAKIT PAYLOAD PROTOKOL TARGET (V3)
    // ==========================================
    const DEX_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14"; // Ganti dengan Router V3 Testnet-mu
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 menit

    console.log(
      `[NETWORK] Encoding dynamic calldata for target protocol (V3)...`,
    );
    const dexCalldata = encodeFunctionData({
      abi: PANCAKE_V3_ROUTER_ABI,
      functionName: "exactInputSingle",
      args: [
        {
          tokenIn: tokenIn,
          tokenOut: tokenOut,
          fee: 500, // Standar Tier Fee 0.05%
          recipient: CONFIG.VAULT_PROXY as `0x${string}`,
          deadline: deadline,
          amountIn: amountIn,
          amountOutMinimum: amountOutMin,
          sqrtPriceLimitX96: 0n,
        },
      ],
    });

    // ==========================================
    // TAHAP 2: EKSEKUSI KE VAULT
    // ==========================================
    console.log(
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

    console.log(
      `[NETWORK] Simulation passed! Strict Oracle and Protocol Whitelist checks cleared.`,
    );
    const hash = await walletClient.writeContract(request);

    console.log(
      `[SUCCESS] Transaction broadcasted! Hash: https://testnet.bscscan.com/tx/${hash}`,
    );
  } catch (error: any) {
    console.error(
      "\n❌ [ERROR] Failed to execute on-chain transaction. Reason:",
    );
    if (error instanceof ContractFunctionExecutionError) {
      console.error("   [SMART CONTRACT REVERT]:", error.shortMessage);
    } else if (error instanceof BaseError) {
      console.error("   [VIEM ERROR]:", error.shortMessage || error.message);
    } else {
      console.error("   [SYSTEM ERROR]:", error.message);
    }
  }
}
