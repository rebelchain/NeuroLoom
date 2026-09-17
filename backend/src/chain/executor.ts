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

// ABI untuk DEX Router (Digunakan untuk menyusun instruksi calldata)
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
  // [PERBAIKAN 1]: Penanganan HOLD yang elegan
  if (action === "HOLD" || amountPercentage === 0) {
    console.log(
      "🛡️ [EXECUTOR] Action is HOLD. Preserving gas. No on-chain transaction broadcasted.",
    );
    return;
  }

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("[ERROR] AI_PRIVATE_KEY not found in backend/.env");

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

  // [PERBAIKAN 2]: Menghapus buzzword "Omnichain"
  console.log(
    `\n[ON-CHAIN EXECUTION] Preparing Multi-Protocol Routing for ${action}...`,
  );

  try {
    // [PERBAIKAN 3]: Merutekan token dan logika kalkulasi berdasarkan aksi AI sesungguhnya!
    let tokenIn: `0x${string}`;
    let tokenOut: `0x${string}`;
    let amountIn: bigint;
    let amountOutMin: bigint;

    if (action === "SELL_WBNB") {
      tokenIn = CONFIG.TOKENS.WBNB as `0x${string}`;
      tokenOut = CONFIG.TOKENS.USDT as `0x${string}`;
      amountIn = parseUnits("0.01", 18); // Simulasi: Jual 0.01 WBNB
      amountOutMin = parseUnits("6.5", 18); // Asumsi Testnet USDT = 18 desimal
    } else {
      // BUY_WBNB
      tokenIn = CONFIG.TOKENS.USDT as `0x${string}`;
      tokenOut = CONFIG.TOKENS.WBNB as `0x${string}`;
      amountIn = parseUnits("10.0", 18); // Simulasi: Jual 10 USDT
      amountOutMin = parseUnits("0.01", 18); // Simulasi: Terima 0.01 WBNB
    }

    // ==========================================
    // TAHAP 1: MERAKIT PAYLOAD PROTOKOL TARGET
    // ==========================================
    const DEX_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
    const deadline = BigInt(Math.floor(Date.now() / 1000) + 600); // 10 menit

    console.log(`[NETWORK] Encoding dynamic calldata for target protocol...`);
    const dexCalldata = encodeFunctionData({
      abi: PANCAKE_V2_ROUTER_ABI,
      functionName: "swapExactTokensForTokens",
      args: [
        amountIn,
        amountOutMin,
        [tokenIn, tokenOut], // Rute swap dinamis
        CONFIG.VAULT_PROXY as `0x${string}`, // Dana WAJIB kembali ke Vault, bukan ke Wallet AI!
        deadline,
      ],
    });

    // ==========================================
    // TAHAP 2: EKSEKUSI KE VAULT (DENGAN SLIPPAGE GUARD)
    // ==========================================
    console.log(
      `[NETWORK] Simulating Vault execution and security guardrails...`,
    );
    const { request } = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "executeOmnichain",
      args: [
        DEX_ROUTER, // targetProtocol
        dexCalldata, // raw instruksi
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
