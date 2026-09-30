import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as fs from "fs";
import * as path from "path";

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";

// Membaca hasil kompilasi Hardhat
function getArtifact() {
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/MockChainlinkOracle.sol/MockChainlinkOracle.json",
  );
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function deployOracle() {
  console.log("🚀 Deploying Mock Chainlink Oracle...");

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("No private key found");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  const artifact = getArtifact();
  const DECIMALS = 8;
  const INITIAL_PRICE = 100000000n; // Setara $1.00 (dengan 8 desimal)

  try {
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as `0x${string}`,
      args: [DECIMALS, INITIAL_PRICE],
    });

    console.log(`⏳ Waiting for confirmation... (Tx: ${hash})`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`✅ Mock Oracle Deployed at: ${receipt.contractAddress}`);
    console.log(`📌 Catat alamat ini untuk dimasukkan ke setupVault.ts`);
  } catch (error: any) {
    console.error("❌ Deploy Failed:", error.shortMessage || error.message);
  }
}

deployOracle();
