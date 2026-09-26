import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as fs from "fs";
import * as path from "path";
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

async function main() {
  console.log(`[+] Deploying NeuroMockRouterV2...`);


  const artifactPath = path.join(
    process.cwd(),
    `artifacts/contracts/MockRouterV2.sol/NeuroMockRouterV2.json`,
  );
  const file = fs.readFileSync(artifactPath, "utf8");
  const artifact = JSON.parse(file);

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
  });

  console.log(`    Menunggu konfirmasi... (${hash})`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });

  console.log(
    `\n[SUCCESS] Router V2 ter-deploy di: ${receipt.contractAddress}`,
  );
  console.log(`\n!!! TUGAS SELANJUTNYA !!!`);
  console.log(`1. Buka Metamask / Dompetmu`);
  console.log(`2. Kirim 1000 USDT Testnet ke  alamat Router di atas`);
  console.log(`3. Kirim 10 Mock WBNB ke alamat Router di atas`);
  console.log(
    `4. Ganti CONFIG.MOCKS.ROUTER di script demo-mu dengan alamat ini!`,
  );
}

main().catch(console.error);
