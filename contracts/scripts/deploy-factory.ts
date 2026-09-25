import { network } from "hardhat";
import { parseEventLogs } from "viem";

async function main() {
  console.log("🚀 Deploying NeuroLoom Core to BSC Testnet via Viem...");

  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deployer account:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  if (balance === 0n)
    throw new Error("BNB balance is zero, please use faucet!");


  console.log("\n[1] Deploying Master Vault Logic...");
  const masterVault = await viem.deployContract("NeuroLoomVault");
  console.log("Master Logic deployed at:", masterVault.address);


  console.log("\n[2] Deploying Vault Factory...");
  const factory = await viem.deployContract("NeuroLoomVaultFactory", [
    masterVault.address,
  ]);
  console.log("Factory deployed at:", factory.address);


  console.log("\n[3] Printing 3 AI Strategy Vaults...");
  const USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";
  const aiExecutorAddress = deployer.account.address;

  const vaultsToDeploy = [
    { name: "The Yield Farm", symbol: "nlYIELD" },
    { name: "Bluechip Momentum", symbol: "nlBLUE" },
    { name: "Degen Accumulator", symbol: "nlDEGEN" },
  ];

  const factoryAbi = (
    await viem.getContractAt("NeuroLoomVaultFactory", factory.address)
  ).abi;
  const deployedAddresses = [];

  for (const v of vaultsToDeploy) {
    console.log(`Deploying: ${v.name}...`);
    const txHash = await factory.write.createStrategyVault([
      USDT_TESTNET,
      v.name,
      v.symbol,
      aiExecutorAddress,
    ]);

    const receipt = await publicClient.waitForTransactionReceipt({
      hash: txHash,
    });
    const logs = parseEventLogs({
      abi: factoryAbi,
      eventName: "VaultCreated",
      logs: receipt.logs,
    });

    const newVaultAddress = (logs[0] as any)?.args?.vaultAddress;
    deployedAddresses.push(newVaultAddress);
    console.log(`✅ ${v.name} deployed at: ${newVaultAddress}`);
  }

  console.log("\n=== DEPLOYMENT SUMMARY ===");
  console.log("Master Logic :", masterVault.address);
  console.log("Factory      :", factory.address);
  console.log("Vault 1 (Yield Farm) :", deployedAddresses[0]);
  console.log("Vault 2 (Bluechip)   :", deployedAddresses[1]);
  console.log("Vault 3 (Degen)      :", deployedAddresses[2]);
  console.log("==========================");
  console.log("SIMPAN KETIGA ADDRESS VAULT INI UNTUK SUBGRAPH DAN FRONTEND!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to deploy:", error);
    process.exit(1);
  });
