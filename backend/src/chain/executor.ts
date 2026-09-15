import {
  createWalletClient,
  http,
  parseUnits,
  publicActions,
  BaseError,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

// [PERBAIKAN 1]: Menggunakan 'with' sesuai standar TypeScript 5.3+
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };

export async function executeTradeOnChain(
  action: string,
  amountPercentage: number,
) {
  if (action === "HOLD" || amountPercentage === 0) {
    console.log(
      "[EXECUTION] Action is HOLD. Preserving gas. No transaction broadcasted.",
    );
    return;
  }

  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk)
    throw new Error(
      "[ERROR] AI_PRIVATE_KEY not found in environment variables.",
    );

  const privateKey = (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`;
  const account = privateKeyToAccount(privateKey);

  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  }).extend(publicActions);

  console.log(`\n[ON-CHAIN EXECUTION] Preparing ${action} transaction...`);
  console.log(`[EXECUTOR IDENTITY] Address: ${account.address}`);

  try {
    const isBuy = action === "BUY_WBNB";
    const tokenIn = isBuy ? CONFIG.TOKENS.USDT : CONFIG.TOKENS.WBNB;
    const tokenOut = isBuy ? CONFIG.TOKENS.WBNB : CONFIG.TOKENS.USDT;

    const amountIn = parseUnits("0.01", 18);
    const amountOutMin = 0n;
    const poolFee = 2500;

    console.log(
      `[NETWORK] Simulating executeRebalanceV3 call to the Vault contract...`,
    );

    const { request } = await walletClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "executeRebalanceV3",
      args: [tokenIn, tokenOut, poolFee, amountIn, amountOutMin],
      account,
    });

    const hash = await walletClient.writeContract(request);

    console.log(`[SUCCESS] Transaction ${action} broadcasted successfully.`);
    console.log(
      `[BLOCK EXPLORER] Transaction Hash: https://testnet.bscscan.com/tx/${hash}`,
    );
  } catch (error) {
    console.error("[ERROR] Failed to execute on-chain transaction. Reason:");

    // [PERBAIKAN 2]: Mengecek tipe BaseError dari Viem secara spesifik
    if (error instanceof BaseError) {
      console.error(error.shortMessage || error.message);
    } else if (error instanceof Error) {
      console.error(error.message);
    }
  }
}
