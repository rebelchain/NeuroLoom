import { network } from "hardhat";
import { parseEventLogs } from "viem";

async function main() {
  console.log(" deploy to BSC Testnet via Viem...");

  const { viem } = await network.create();


  const publicClient = await viem.getPublicClient();
  const [deployer] = await viem.getWalletClients();

  console.log("Deploying with account:", deployer.account.address);

  const balance = await publicClient.getBalance({
    address: deployer.account.address,
  });
  console.log(` BNB balance: ${Number(balance) / 1e18}`);

  if (balance === 0n) {
    throw new Error("BNB balance is zero, brooo");
  }

  console.log("\nDemploy master vault");

  const masterVault = await viem.deployContract("NeuroLoomVault");
  console.log("master vault success deployed on:", masterVault.address);


  console.log("\nDeploying NeuroLoomVaultFactory");


  const factory = await viem.deployContract("NeuroLoomVaultFactory", [
    masterVault.address,
  ]);
  console.log("Factory success deployed on:", factory.address);

  console.log("\nPrinting new vault with Factory");

  const USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";


  const txHash = await factory.write.createStrategyVault([
    USDT_TESTNET,
    "NeuroLoom Stable Yield", 
    "nlUSDT-YIELD", 
    deployer.account.address, 
  ]);

  console.log("Waiting transaction Vault");
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });


  const factoryAbi = (
    await viem.getContractAt("NeuroLoomVaultFactory", factory.address)
  ).abi;
  const logs = parseEventLogs({
    abi: factoryAbi,
    eventName: "VaultCreated",
    logs: receipt.logs,
  });

  const newVaultAddress =
    (logs[0] as any)?.args?.vaultAddress || "Tidak ditemukan";

  console.log(
    "Vault strategy success printed in:",
    newVaultAddress,
  );

  console.log("Master Logic :", masterVault.address);
  console.log("Factory      :", factory.address);
  console.log("Vault ke-1   :", newVaultAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Failed to deploy:", error);
    process.exit(1);
  });
