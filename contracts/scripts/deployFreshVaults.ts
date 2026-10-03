import { config } from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";


import VAULT_ARTIFACT from "../artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json" with { type: "json" };
import PROXY_ARTIFACT from "../artifacts/contracts/NeuroLoomProxy.sol/NeuroLoomProxy.json" with { type: "json" };

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";
const MUSDT_TESTNET = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";

async function deployFresh() {
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

  console.log(
    "🚀 [CLEAN DEPLOY] Memulai Deployment Ekosistem NeuroLoom Baru...\n",
  );

  // 1. Deploy Implementation (Otak)
  console.log("⏳ [1/4] Deploying Logic Implementation...");
  const implTx = await walletClient.deployContract({
    abi: VAULT_ARTIFACT.abi,
    bytecode: VAULT_ARTIFACT.bytecode as `0x${string}`,
    account,
  });
  const implReceipt = await publicClient.waitForTransactionReceipt({
    hash: implTx,
  });
  const implAddress = implReceipt.contractAddress!;
  console.log(`✅ Logic Deployed di: ${implAddress}\n`);

  // 2. Data Inisialisasi untuk 3 Vault
  const vaultConfigs = [
    { name: "The Yield Farm", symbol: "yUSDT" },
    { name: "Bluechip Momentum", symbol: "bUSDT" },
    { name: "Degen Accumulator", symbol: "dUSDT" },
  ];

  const newVaultAddresses: string[] = [];

  // 3. Deploy 3 Proxy Baru menggunakan NeuroLoomProxy
  for (let i = 0; i < vaultConfigs.length; i++) {
    const config = vaultConfigs[i];
    console.log(
      `⏳ [${i + 2}/4] Deploying NeuroLoomProxy untuk ${config.name}...`,
    );

    // Siapkan data untuk fungsi initialize() di Implementation
    const initData = encodeFunctionData({
      abi: VAULT_ARTIFACT.abi,
      functionName: "initialize",
      args: [
        MUSDT_TESTNET,
        config.name,
        config.symbol,
        account.address,
        account.address,
      ],
    });

    // Deploy Proxy Custom milikmu (menerima 2 parameter di constructor: _logic, _data)
    const proxyTx = await walletClient.deployContract({
      abi: PROXY_ARTIFACT.abi,
      bytecode: PROXY_ARTIFACT.bytecode as `0x${string}`,
      args: [implAddress, initData],
      account,
    });

    const proxyReceipt = await publicClient.waitForTransactionReceipt({
      hash: proxyTx,
    });
    console.log(
      `✅ ${config.name} Proxy Deployed di: ${proxyReceipt.contractAddress}`,
    );
    newVaultAddresses.push(proxyReceipt.contractAddress!);
  }

  console.log("\n🎉 [SUCCESS] EKOSISTEM BARU SIAP!");
  console.log(
    "Silakan salin 3 alamat baru ini ke dalam file config/addresses.ts dan setupAllVaults_2.ts Anda:",
  );
  console.log(newVaultAddresses);
}

deployFresh().catch(console.error);
