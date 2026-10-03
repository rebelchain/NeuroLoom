import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";


import VAULT_ARTIFACT from "../artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json" with { type: "json" };

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";

// Tiga alamat PROXY Vault-mu
const VAULT_ADDRESSES = [
  "0x9BA37554D997a7c4d536Ac94180C47f89BCEF0DD" as `0x${string}`, // Yield Farm
  "0x2Df494B6A330b1f08F5b720caD47756f251378f9" as `0x${string}`, // Bluechip Momentum
  "0xbC82a09c1d5DfD82367515e51Ee3937ccC4c5D88" as `0x${string}`, // Degen Accumulator
];

async function runMassUpgrade() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("No private key found in .env");

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

  console.log("Upgrade UUPS untuk 3 Vault\n");

  console.log("[1/2] Deploying Implementasi NeuroLoomVault V2 (Master)..");
  const implTx = await walletClient.deployContract({
    abi: VAULT_ARTIFACT.abi,
    bytecode: VAULT_ARTIFACT.bytecode as `0x${string}`,
    account,
  });
  const implReceipt = await publicClient.waitForTransactionReceipt({
    hash: implTx,
  });
  const newImplementationAddress = implReceipt.contractAddress!;
  console.log(
    `Implementasi Master Baru Deployed di: ${newImplementationAddress}\n`,
  );

  // 2. Perintahkan setiap Proxy untuk Upgrade
  console.log(
    "⏳ [2/2] Menginstruksikan ketiga Proxy untuk berpindah ke otak baru.\n",
  );

  for (let i = 0; i < VAULT_ADDRESSES.length; i++) {
    const vault = VAULT_ADDRESSES[i];
    console.log(`   -> Upgrading Vault ${i + 1}/3: ${vault}`);

    try {
      const upgradeTx = await walletClient.writeContract({
        address: vault,
        abi: VAULT_ARTIFACT.abi,
        functionName: "upgradeToAndCall",
        args: [newImplementationAddress, "0x"], 
        account,
      });
      await publicClient.waitForTransactionReceipt({ hash: upgradeTx });
      console.log(`      Sukses di-upgrade!`);
    } catch (error: any) {
      console.error(
        `       Gagal upgrade Vault ${vault}:`,
        error.shortMessage || error.message,
      );
    }
  }

}

runMassUpgrade().catch(console.error);
