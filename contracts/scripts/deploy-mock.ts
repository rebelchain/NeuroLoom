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


function getArtifact(contractName: string) {
  const artifactPath = path.join(
    process.cwd(),
    `artifacts/contracts/MockEcosystem.sol/${contractName}.json`,
  );
  const file = fs.readFileSync(artifactPath, "utf8");
  return JSON.parse(file);
}

async function deployMock(contractName: string, args: any[] = []) {
  const artifact = getArtifact(contractName);

  const hash = await walletClient.deployContract({
    abi: artifact.abi,
    bytecode: artifact.bytecode as `0x${string}`,
    args: args,
  });

  console.log(`      [WAIT] Menunggu deploy ${contractName}... (${hash})`);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  console.log(
    `      [SUCCESS] ${contractName} ter-deploy di: ${receipt.contractAddress}`,
  );

  return receipt.contractAddress;
}

async function main() {
  console.log(`[+] Memulai Deploy Ekosistem Mock (Pure Viem)...`);
  console.log(`    Deployer: ${account.address}`);

  console.log(`\n[>] Deploying Mock WBNB...`);
  const wbnbAddress = await deployMock("MockToken", ["Mock WBNB", "mWBNB"]);

  console.log(`\n[>] Deploying Mock BTCB...`);
  const btcbAddress = await deployMock("MockToken", ["Mock BTCB", "mBTCB"]);

  console.log(`\n[>] Deploying NeuroMockRouter...`);
  const routerAddress = await deployMock("NeuroMockRouter");

  console.log(`\n[+] DEPLOY SELESAI! Copas alamat ini ke config.ts Anda:`);
  console.log(`    WBNB: "${wbnbAddress}"`);
  console.log(`    BTCB: "${btcbAddress}"`);
  console.log(`    PANCAKE_ROUTER: "${routerAddress}"`);
}

main().catch(console.error);
