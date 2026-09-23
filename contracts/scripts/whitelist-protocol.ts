import { network } from "hardhat";

async function main() {
  console.log("Initializing Admin Wallet for Whitelist Protocol...");

 
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  const [adminWallet] = await viem.getWalletClients();
  console.log("👤 Executing as Admin:", adminWallet.account.address);

  const VAULT_PROXY_ADDRESS = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";
  const TARGET_PROTOCOL = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";

  console.log("Connecting to the NeuroLoomVaultV2 contract.");
  const vault = await viem.getContractAt(
    "NeuroLoomVaultV2",
    VAULT_PROXY_ADDRESS,
  );

  console.log(`Sending whitelist transaction for route: ${TARGET_PROTOCOL}`);

  const txHash = await vault.write.setApprovedProtocol(
    [TARGET_PROTOCOL, true],
    { account: adminWallet.account },
  );

  console.log(`Transaction broadcast! Waiting for block confirmation.`);
  console.log(`Check BscScan: https://testnet.bscscan.com/tx/${txHash}`);

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(
    "Success! The PancakeSwap Router has been officially whitelisted by the admin.",
  );
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exitCode = 1;
});
