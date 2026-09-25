import { network } from "hardhat";

async function main() {
  const proxyAddress = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";

  console.log(`\nUpgrade UUPS Proxy on BSC Testnet..`);
  console.log(`Proxy Target: ${proxyAddress}\n`);

  const { viem } = await network.create();

  const publicClient = await viem.getPublicClient();

  console.log("Deploying V2 Implementation to BSC Testnet...");
  const vaultV2Impl = await viem.deployContract("NeuroLoomVaultV2");
  console.log(
    `V2 Implementation success deployed on: ${vaultV2Impl.address}\n`,
  );
 
  console.log("⏳ Connected to Proxy Contract...");
 
  const proxy = await viem.getContractAt("NeuroLoomVaultV2", proxyAddress);
  
  console.log("⏳ Execute upgrade transaction (upgradeToAndCall)...");
  const txHash = await proxy.write.upgradeToAndCall([
    vaultV2Impl.address,
    "0x",
  ]);

  console.log(`🔗 Transaction Has: ${txHash}`);
  console.log("⏳ Waiting for confirmation from Binance Validator...");
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(
    "\n Upgrade successful! The proxy now officially utilizes V2 security logic (Chainlink + PancakeSwap V3)..",
  );
}

main().catch((error) => {
  console.error("\nUpgrade failed:", error);
  process.exitCode = 1;
});
