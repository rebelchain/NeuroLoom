import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";

function getArtifact() {
  const artifactPath = path.join(
    process.cwd(),
    "artifacts/contracts/MockOracle.sol/MockOracle.json",
  );
  return JSON.parse(fs.readFileSync(artifactPath, "utf8"));
}

async function deployOracle() {
  console.log(" Deploying Mock Chainlink Oracle.");

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
  const INITIAL_PRICE = 2000000n;

  try {
    const hash = await walletClient.deployContract({
      abi: artifact.abi,
      bytecode: artifact.bytecode as `0x${string}`,
      args: [INITIAL_PRICE, DECIMALS],
      account,
    });

    console.log(`aiting for confirmation... (Tx: ${hash})`);
    const receipt = await publicClient.waitForTransactionReceipt({ hash });

    console.log(`Mock Oracle Deployed at: ${receipt.contractAddress}`);
  } catch (error: any) {
    console.error("❌ Deploy Failed:", error.shortMessage || error.message);
  }
}

deployOracle();
