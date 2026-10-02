// scripts/setupRwa.ts
import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

// IMPORT LANGSUNG DARI ARTIFACTS HARDHAT (Tidak perlu MockData.ts!)
import MOCK_ERC20_DATA from "../artifacts/contracts/MockBCSPX.sol/MockBCSPX.json" with { type: "json" };
import MOCK_ORACLE_DATA from "../artifacts/contracts/MockChainlinkOracle.sol/MockChainlinkOracle.json" with { type: "json" };
import VAULT_DATA from "../artifacts/contracts/NeuroLoomVault.sol/NeuroLoomVault.json" with { type: "json" };

const VAULT_ADDRESS = "0x2Df494B6A330b1f08F5b720caD47756f251378f9";
const USDT_TESTNET = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";
const PANCAKE_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";

async function runSetup() {
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("Private Key tidak ditemukan di .env");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );
  const transport = http("https://data-seed-prebsc-2-s2.bnbchain.org:8545/");
  const publicClient = createPublicClient({ chain: bscTestnet, transport });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport,
  });

  console.log("🚀 [SETUP] Memulai On-Chain Automation...\n");

  // ==========================================
  // 1. DEPLOY MOCK bCSPX (MockERC20)
  // ==========================================
  console.log("⏳ [1/5] Deploying Mock bCSPX Token...");
  const bcspxTx = await walletClient.deployContract({
    abi: MOCK_ERC20_DATA.abi,
    bytecode: MOCK_ERC20_DATA.bytecode as `0x${string}`,
    account,
    gas: 3000000n, // <-- TAMBAHKAN BARIS INI (Memaksa limit gas manual)
  });
  const bcspxReceipt = await publicClient.waitForTransactionReceipt({
    hash: bcspxTx,
  });
  const bCspxAddress = bcspxReceipt.contractAddress!;
  console.log(`✅ Mock bCSPX Deployed at: ${bCspxAddress}`);

  // ==========================================
  // 2. DEPLOY MOCK ORACLE ($500)
  // ==========================================
  console.log("⏳ [2/5] Deploying Mock Chainlink Oracle ($500)...");
  const oracleTx = await walletClient.deployContract({
    abi: MOCK_ORACLE_DATA.abi,
    bytecode: MOCK_ORACLE_DATA.bytecode as `0x${string}`,
    account,
    args: [8, 50000000000n],
    gas: 3000000n, // <-- TAMBAHKAN BARIS INI JUGA
  });
  const oracleReceipt = await publicClient.waitForTransactionReceipt({
    hash: oracleTx,
  });
  const oracleAddress = oracleReceipt.contractAddress!;
  console.log(`✅ Mock Oracle Deployed at: ${oracleAddress}`);

  // ==========================================
  // 3. DAFTARKAN ORACLE KE VAULT (USDT -> bCSPX)
  // ==========================================
  console.log("⏳ [3/5] Mendaftarkan Oracle Feed (USDT -> bCSPX)...");
  const feedTx1 = await walletClient.writeContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_DATA.abi,
    functionName: "setPairPriceFeed",
    args: [USDT_TESTNET, bCspxAddress, oracleAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: feedTx1 });
  console.log(`✅ Oracle Feed (USDT->bCSPX) Teregistrasi!`);

  // ==========================================
  // 4. DAFTARKAN ORACLE KE VAULT (bCSPX -> USDT)
  // ==========================================
  console.log("⏳ [4/5] Mendaftarkan Oracle Feed (bCSPX -> USDT)...");
  const feedTx2 = await walletClient.writeContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_DATA.abi,
    functionName: "setPairPriceFeed",
    args: [bCspxAddress, USDT_TESTNET, oracleAddress],
  });
  await publicClient.waitForTransactionReceipt({ hash: feedTx2 });
  console.log(`✅ Oracle Feed (bCSPX->USDT) Teregistrasi!`);

  // ==========================================
  // 5. WHITELIST PANCAKESWAP
  // ==========================================
  console.log("⏳ [5/5] Melakukan Whitelisting PancakeSwap Router...");
  const whitelistTx = await walletClient.writeContract({
    address: VAULT_ADDRESS as `0x${string}`,
    abi: VAULT_DATA.abi,
    functionName: "setApprovedProtocol",
    args: [PANCAKE_ROUTER, true],
  });
  await publicClient.waitForTransactionReceipt({ hash: whitelistTx });
  console.log(`✅ PancakeSwap V3 Router berhasil di-whitelist!`);

  console.log("\n🎉 [SUCCESS] SELURUH INFRASTRUKTUR RWA SIAP!");
  console.log(
    `👉 Buka file config.ts dan update token bCSPX dengan address: ${bCspxAddress}`,
  );
}

runSetup().catch(console.error);
