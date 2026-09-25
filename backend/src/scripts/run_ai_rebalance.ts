import {
  createWalletClient,
  createPublicClient,
  http,
  encodeFunctionData,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as dotenvx from "@dotenvx/dotenvx";

dotenvx.config();

const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  TOKENS: { USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c" },
  MOCKS: {
    WBNB: "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e",
    BTCB: "0x18ecc91ea38ec9c5cd29f2d1e1686d0a63f49960",
    ROUTER: "0xbb1a7bb79166dde24767cd17338ed045159893e4",
  },
  ORACLES: {
    BNB_USD: "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526",
    BTC_USD: "0x5741306c21795FdCBb9b265Ea0255F499DFe515C",
  },
} as const;

const STRATEGIES = [
  {
    name: "Yield Farm",
    vault: "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a",
    tokenOut: CONFIG.MOCKS.WBNB,
    oracle: CONFIG.ORACLES.BNB_USD,
  },
  {
    name: "Bluechip Momentum",
    vault: "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e",
    tokenOut: CONFIG.MOCKS.WBNB,
    oracle: CONFIG.ORACLES.BNB_USD,
  },
  {
    name: "Degen Accumulator",
    vault: "0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55",
    tokenOut: CONFIG.MOCKS.BTCB,
    oracle: CONFIG.ORACLES.BTC_USD,
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

async function main() {
  console.log(`[+] AI Agent Aktif: ${account.address}`);
  console.log(`[+] Mode: Mock Ecosystem (Hacked Slippage Bypass)\n`);

  for (const strategy of STRATEGIES) {
    console.log(`[>] Menganalisis Vault: ${strategy.name}`);

    try {
      const [, priceInt] = await publicClient.readContract({
        address: strategy.oracle,
        abi: oracleAbi,
        functionName: "latestRoundData",
      });
      const assetPrice = BigInt(priceInt);
      console.log(`    - Harga Aset Saat Ini: $${Number(assetPrice) / 1e8}`);

  
     const amountIn = 200n;

      const expectedAmountOut =
        (amountIn * assetPrice * 10n ** 18n) / (10n ** 6n * 10n ** 8n);
      const minAmountOut = (expectedAmountOut * 9800n) / 10000n; 

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 1200);

      const swapData = encodeFunctionData({
        abi: mockRouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          amountIn,
          minAmountOut,
          [
            CONFIG.TOKENS.USDT as `0x${string}`,
            strategy.tokenOut as `0x${string}`,
          ],
          strategy.vault as `0x${string}`,
          deadline,
        ],
      });

      console.log(`    - Mengeksekusi Rebalance (Bypass Slippage Matrix)...`);

      const { request } = await publicClient.simulateContract({
        account,
        address: strategy.vault as `0x${string}`,
        abi: vaultABI,
        functionName: "executeOmnichain",
        args: [
          CONFIG.MOCKS.ROUTER as `0x${string}`,
          swapData,
          CONFIG.TOKENS.USDT as `0x${string}`,
          strategy.tokenOut as `0x${string}`,
          amountIn,
          minAmountOut,
        ],
      });

      const hash = await walletClient.writeContract(request);
      console.log(`      [WAIT] Menambang Transaksi: ${hash}`);
      await publicClient.waitForTransactionReceipt({ hash });
      console.log(`      [SUCCESS] AI berhasil mengalokasikan aset!\n`);
    } catch (error: any) {
      console.error(`      [FAIL] Eksekusi ditolak oleh Smart Contract.`);
      console.error(`      Detail: ${error.shortMessage || error.message}\n`);
    }
  }
}

main().catch(console.error);
