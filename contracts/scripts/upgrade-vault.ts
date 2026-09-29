import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultArtifact from "../artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json" with { type: "json" };

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";
const PROXY_ADDRESS =
  "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a" as `0x${string}`;

const uupsAbi = [
  {
    inputs: [
      { internalType: "address", name: "newImplementation", type: "address" },
      { internalType: "bytes", name: "data", type: "bytes" },
    ],
    name: "upgradeToAndCall",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
] as const;

async function upgradeVault() {
  console.log("starting uups upgrade");


  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("no private key");

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

  try {
    console.log("deploy new implementation contartc");
    const deployHash = await walletClient.deployContract({
      abi: VaultArtifact.abi,
      bytecode: VaultArtifact.bytecode as `0x${string}`,
      account,
    });

    console.log(` TxHash: ${deployHash}`);
    const deployReceipt = await publicClient.waitForTransactionReceipt({
      hash: deployHash,
    });
    const newImplementationAddress = deployReceipt.contractAddress;

    if (!newImplementationAddress)
      throw new Error("failed");
    console.log(
      `   new implementation contract:  ${newImplementationAddress}`,
    );

    console.log(
      `\npointing proxy (${PROXY_ADDRESS}) to new logic`,
    );
    const { request } = await publicClient.simulateContract({
      account,
      address: PROXY_ADDRESS,
      abi: uupsAbi,
      functionName: "upgradeToAndCall",
      args: [newImplementationAddress, "0x"],
    });

    const upgradeHash = await walletClient.writeContract(request);
    console.log(`   TxHash: ${upgradeHash}`);

    await publicClient.waitForTransactionReceipt({ hash: upgradeHash });
    console.log(
      `   vault success ti upgradeeee. ADDRESS: ${PROXY_ADDRESS}`,
    );
  } catch (error: any) {
    console.error("Upgrade failed:", error.shortMessage || error.message);
  }
}

upgradeVault();
