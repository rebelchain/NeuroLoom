import { createWalletClient, createPublicClient, http, parseUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as dotenvx from "@dotenvx/dotenvx";

dotenvx.config();

const CONFIG = {
  RPC_URL: "https://data-seed-prebsc-2-s2.bnbchain.org:8545/",
  VAULTS: {
    YIELD_FARM: "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a",
    BLUECHIP: "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e",
    DEGEN: "0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55",
  },
  TOKENS: {
    USDT: "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c",
  },
} as const;

let rawPrivateKey = process.env.AI_PRIVATE_KEY;
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

const erc20ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const vaultABI = [
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
      { name: "owner", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

async function main() {
  console.log(`[+] Simulasi Kas Dimulai: ${account.address}`);
  const VAULTS_ARRAY = [
    CONFIG.VAULTS.YIELD_FARM,
    CONFIG.VAULTS.BLUECHIP,
    CONFIG.VAULTS.DEGEN,
  ] as const;

  for (const vaultAddress of VAULTS_ARRAY) {
    console.log(`\n[>] Vault: ${vaultAddress}`);

   
    console.log(`    - Approve USDT...`);
    const { request: approveReq } = await publicClient.simulateContract({
      account,
      address: CONFIG.TOKENS.USDT,
      abi: erc20ABI,
      functionName: "approve",
      args: [vaultAddress, parseUnits("1000", 6)],
    });
    const approveHash = await walletClient.writeContract(approveReq);
    await publicClient.waitForTransactionReceipt({ hash: approveHash });

   
    console.log(`    - Deposit 50 USDT...`);
    const { request: depReq } = await publicClient.simulateContract({
      account,
      address: vaultAddress,
      abi: vaultABI,
      functionName: "deposit",
      args: [parseUnits("50", 6), account.address],
    });
    const depHash = await walletClient.writeContract(depReq);
    await publicClient.waitForTransactionReceipt({ hash: depHash });
    await new Promise((r) => setTimeout(r, 5000));

  
    console.log(`    - Withdraw 20 USDT...`);
    const { request: wdReq } = await publicClient.simulateContract({
      account,
      address: vaultAddress,
      abi: vaultABI,
      functionName: "withdraw",
      args: [parseUnits("20", 6), account.address, account.address],
    });
    const wdHash = await walletClient.writeContract(wdReq);
    await publicClient.waitForTransactionReceipt({ hash: wdHash });
    await new Promise((r) => setTimeout(r, 5000));

    console.log(`      [SUCCESS] Log Arus Kas Tercipta!`);
  }
}
main().catch(console.error);
