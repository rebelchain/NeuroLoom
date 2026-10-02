import { config } from "dotenv";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import * as fs from "fs";

config();

const RPC_URL = "https://data-seed-prebsc-1-s1.bnbchain.org:8545/";

// Path ke file JSON hasil compile
const VAULT_JSON_PATH =
  "./artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json";
const FACTORY_JSON_PATH =
  "./artifacts/contracts/NeuroLoomVaultFactory.sol/NeuroLoomVaultFactory.json";

// Alamat mUSDT Testnet aslimu
const MUSDT_ADDRESS = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";

async function deployWithFactory() {
  console.log("🚀 Memulai Deployment NeuroLoom menggunakan Factory...\n");

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Private key tidak ditemukan di .env");
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

  const vaultArtifact = JSON.parse(fs.readFileSync(VAULT_JSON_PATH, "utf-8"));
  const factoryArtifact = JSON.parse(
    fs.readFileSync(FACTORY_JSON_PATH, "utf-8"),
  );

  // 1. Deploy Master Logic
  console.log("1️⃣ Mendeploy Master Logic (NeuroLoomVault)...");
  const logicTx = await walletClient.deployContract({
    abi: vaultArtifact.abi,
    bytecode: vaultArtifact.bytecode.object || vaultArtifact.bytecode,
  });
  const logicReceipt = await publicClient.waitForTransactionReceipt({
    hash: logicTx,
  });
  const masterLogic = logicReceipt.contractAddress;
  console.log(`✅ Master Logic: ${masterLogic}\n`);

  // 2. Deploy Factory
  console.log("2️⃣ Mendeploy Pabrik (NeuroLoomVaultFactory)...");
  const factoryTx = await walletClient.deployContract({
    abi: factoryArtifact.abi,
    bytecode: factoryArtifact.bytecode.object || factoryArtifact.bytecode,
    args: [masterLogic], // Factory butuh alamat Master Logic di constructor-nya
  });
  const factoryReceipt = await publicClient.waitForTransactionReceipt({
    hash: factoryTx,
  });
  const factoryAddress = factoryReceipt.contractAddress;
  console.log(`✅ Factory mendarat di: ${factoryAddress}\n`);

  // 3. Fungsi Helper untuk menyuruh Pabrik mencetak brankas
  async function createVault(name: string, symbol: string) {
    console.log(`Menyuruh pabrik mencetak: ${name}...`);
    const { request } = await publicClient.simulateContract({
      account,
      address: factoryAddress as `0x${string}`,
      abi: factoryArtifact.abi,
      functionName: "createStrategyVault",
      // Parameter: _asset, _name, _symbol, _aiExecutor
      args: [MUSDT_ADDRESS, name, symbol, account.address],
    });
    const txHash = await walletClient.writeContract(request);
    await publicClient.waitForTransactionReceipt({ hash: txHash });
  }

  // 4. Perintahkan Pabrik mencetak 3 Brankas
  console.log("3️⃣ Memproduksi 3 Brankas Proxy...");
  await createVault("NeuroLoom Yield Farm", "nlYF");
  await createVault("NeuroLoom Bluechip", "nlBC");
  await createVault("NeuroLoom Degen", "nlDG");

  // 5. Ambil alamat brankas yang baru jadi dari Array allVaults di Factory
  const vault1 = await publicClient.readContract({
    address: factoryAddress as `0x${string}`,
    abi: factoryArtifact.abi,
    functionName: "allVaults",
    args: [0n],
  });
  const vault2 = await publicClient.readContract({
    address: factoryAddress as `0x${string}`,
    abi: factoryArtifact.abi,
    functionName: "allVaults",
    args: [1n],
  });
  const vault3 = await publicClient.readContract({
    address: factoryAddress as `0x${string}`,
    abi: factoryArtifact.abi,
    functionName: "allVaults",
    args: [2n],
  });

  console.log("\n=== DEPLOYMENT SUMMARY (BSC TESTNET) ===");
  console.log(`Factory      : ${factoryAddress}`);
  console.log(`Yield Farm   : ${vault1}`);
  console.log(`Bluechip     : ${vault2}`);
  console.log(`Degen        : ${vault3}`);
  console.log("========================================\n");
  console.log(
    "✅ SELESAI! Salin ketiga alamat brankas di atas ke backend config.ts & setupAllVaults.ts",
  );
}

deployWithFactory().catch(console.error);
