import { network } from "hardhat";

async function main() {
  const proxyAddress = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";

  console.log(`\n🚀 Memulai Proses Upgrade UUPS Proxy di BSC Testnet...`);
  console.log(`🎯 Target Proxy: ${proxyAddress}\n`);

  // [DOKUMENTASI v3]: "Everything below hangs off the connection returned by network.create()"
  const { viem } = await network.create();

  // Mengambil Public Client untuk menunggu transaksi
  const publicClient = await viem.getPublicClient();

  // 1. Deploy Implementation (Otak) V2 yang baru
  console.log("⏳ Deploying V2 Implementation to BSC Testnet...");
  // [DOKUMENTASI v3]: "Deploy a contract, returns a fully typed instance"
  const vaultV2Impl = await viem.deployContract("NeuroLoomVaultV2");
  console.log(
    `V2 Implementation success deployed on: ${vaultV2Impl.address}\n`,
  );

  // 2. Hubungkan ke Proxy menggunakan ABI V2
  console.log("⏳ Connected to Proxy Contract...");
  // [DOKUMENTASI v3]: "Attach to an already-deployed contract"
  const proxy = await viem.getContractAt("NeuroLoomVaultV2", proxyAddress);

  // 3. Eksekusi Upgrade via fungsi upgradeToAndCall
  console.log("⏳ Execute upgrade transaction (upgradeToAndCall)...");
  // [DOKUMENTASI v3]: "Write transactions."
  const txHash = await proxy.write.upgradeToAndCall([
    vaultV2Impl.address,
    "0x",
  ]);

  console.log(`🔗 Transaction Has: ${txHash}`);
  console.log("⏳ Waiting for confirmation from Binance Validator...");

  // 4. Tunggu transaksi masuk ke dalam blok (Finality)
  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log(
    "\n UPGRADE BERHASIL! Proxy sekarang resmi menggunakan logika keamanan V2 (Chainlink + PancakeSwap V3).",
  );
}

main().catch((error) => {
  console.error("\n❌ Gagal melakukan upgrade:", error);
  process.exitCode = 1;
});
