import {
  createWalletClient,
  createPublicClient,
  http,
  parseUnits,
  erc20Abi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as dotenv from "dotenv";

dotenv.config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";
let rawPrivateKey = process.env.PRIVATE_KEY;
if (!rawPrivateKey?.startsWith("0x")) rawPrivateKey = `0x${rawPrivateKey}`;
const account = privateKeyToAccount(rawPrivateKey as `0x${string}`);

const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http(RPC_URL),
});
const walletClient = createWalletClient({
  account,
  chain: bscTestnet,
  transport: http(RPC_URL),
});


const MOCK_WBNB_ADDRESS = "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e";
const ROUTER_V2_ADDRESS = "0xf33c30a801720294eba818a143339e487cddf129";
const USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";

const mockTokenAbi = [
  {
    name: "mint",
    type: "function",
    stateMutability: "nonpayable",
    inputs: [
      { type: "address", name: "to" },
      { type: "uint256", name: "amount" },
    ],
    outputs: [],
  },
] as const;

async function main() {
  console.log(`[+] Inject token to Router V2`);
  console.log(`    Router Target: ${ROUTER_V2_ADDRESS}`);

 
  console.log(`\n[>] Printing 100 Mock WBNB directyly to Router...`);
  const mintHash = await walletClient.writeContract({
    address: MOCK_WBNB_ADDRESS as `0x${string}`,
    abi: mockTokenAbi,
    functionName: "mint",
    args: [ROUTER_V2_ADDRESS as `0x${string}`, parseUnits("100", 18)], 
  });
  await publicClient.waitForTransactionReceipt({ hash: mintHash });
  console.log(`    [SUCCESS] Mock WBNB injected! Tx: ${mintHash}`);

  console.log(`\n[>] Transfer 10000 USDT Testnet to Router...`);
  const transferHash = await walletClient.writeContract({
    address: USDT_TESTNET as `0x${string}`,
    abi: erc20Abi,
    functionName: "transfer",
    args: [ROUTER_V2_ADDRESS as `0x${string}`, parseUnits("1000", 6)], 
  });
  await publicClient.waitForTransactionReceipt({ hash: transferHash });
  console.log(`    [SUCCESS] USDT Inejcted! Tx: ${transferHash}`);

}

main().catch(console.error);
