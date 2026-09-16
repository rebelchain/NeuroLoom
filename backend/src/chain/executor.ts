import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  publicActions,
  BaseError,
  ContractFunctionExecutionError,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };

// ABI untuk PancakeSwap V2 (Router standar testnet)
const PANCAKE_V2_ROUTER_ABI = [
  {
    type: "function",
    name: "swapExactTokensForTokens",
    stateMutability: "nonpayable",
    inputs: [
      { type: "uint256", name: "amountIn" },
      { type: "uint256", name: "amountOutMin" },
      { type: "address[]", name: "path" },
      { type: "address", name: "to" },
      { type: "uint256", name: "deadline" },
    ],
  },
];

export async function executeTradeOnChain(
  action: string,
  amountPercentage: number,
) {
  if (action === "HOLD" || amountPercentage === 0) return;

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("[ERROR] AI_PRIVATE_KEY not found.");

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

  console.log(`\n[ON-CHAIN EXECUTION] Preparing True Omnichain ${action}...`);

  try {
    // Kita paksakan kondisi SELL_WBNB agar sesuai dengan arah matematika Oracle di kontrak
    const tokenIn = CONFIG.TOKENS.WBNB;
    const tokenOut = CONFIG.TOKENS.USDT;

    const amountIn = parseUnits("0.01", 18); // Jual 0.01 WBNB

    // Estimasi minimum terima USDT (misal: 1 WBNB = $710, 0.01 = $7.1. Kita set 7.0 agar lolos slippage guard)
    const amountOutMin = parseUnits("7.0", 18);

    // ==========================================
    // TAHAP 1: MERAKIT PAYLOAD PANCAKESWAP V2
    // ==========================================
    const PANCAKE_V2_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 menit

    console.log(`[NETWORK] Encoding payload for PancakeSwap V2 Router...`);
    const dexCalldata = encodeFunctionData({
      abi: PANCAKE_V2_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        amountIn,
        amountOutMin,
        [tokenIn, tokenOut], // Rute swap WBNB -> USDT
        CONFIG.VAULT_PROXY as `0x${string}`, // Token kembali ke Vault
        deadline,
      ],
    });

    // ==========================================
    // TAHAP 2: EKSEKUSI OMNICHAIN KE VAULT
    // ==========================================
    console.log(`[NETWORK] Simulating Vault executeOmnichain...`);
    const { request } = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "executeOmnichain",
      args: [
        PANCAKE_V2_ROUTER, // targetProtocol (Sekarang variabelnya benar!)
        dexCalldata, // bytes calldata
        tokenIn, // tokenIn
        tokenOut, // tokenOut
        amountIn, // amountIn
        amountOutMin, // expectedAmountOutMin
      ],
      account,
    });

    console.log(
      `[NETWORK] Simulation passed! Vault accepted the omnichain payload.`,
    );
    const hash = await walletClient.writeContract(request);

    console.log(
      `[SUCCESS] Transaction broadcasted! Hash: https://testnet.bscscan.com/tx/${hash}`,
    );
  } catch (error) {
    console.error(
      "\n❌ [ERROR] Failed to execute on-chain transaction. Reason:",
    );
    if (error instanceof ContractFunctionExecutionError) {
      console.error("   [SMART CONTRACT REVERT]:", error.shortMessage);
    } else if (error instanceof BaseError) {
      console.error("   [VIEM ERROR]:", error.shortMessage || error.message);
    } else if (error instanceof Error) {
      console.error("   [SYSTEM ERROR]:", error.message);
    }
  }
}
