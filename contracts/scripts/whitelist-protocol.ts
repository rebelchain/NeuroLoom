import { network } from "hardhat";

async function main() {
  console.log("🔒 Menginisialisasi Admin Wallet untuk Whitelist Protocol...");

  // [PERBAIKAN]: Mengekstrak objek viem secara native menggunakan API Hardhat v3
  const { viem } = await network.create();
  const publicClient = await viem.getPublicClient();

  // Mengambil dompet dari private key yang ada di contracts/.env (Admin Wallet)
  const [adminWallet] = await viem.getWalletClients();
  console.log("👤 Executing as Admin:", adminWallet.account.address);

  // Alamat Proxy Vault di BSC Testnet
  const VAULT_PROXY_ADDRESS = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";
  const TARGET_PROTOCOL = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"; // PancakeSwap V2 Router Testnet

  console.log("⏳ Menghubungkan ke kontrak NeuroLoomVaultV2...");
  const vault = await viem.getContractAt(
    "NeuroLoomVaultV2",
    VAULT_PROXY_ADDRESS,
  );

  console.log(`⏳ Mengirim transaksi whitelist untuk rute: ${TARGET_PROTOCOL}`);

  // Memanggil fungsi setApprovedProtocol secara eksplisit menggunakan akun Admin
  const txHash = await vault.write.setApprovedProtocol(
    [TARGET_PROTOCOL, true],
    { account: adminWallet.account },
  );

  console.log(`✅ Transaksi broadcasted! Menunggu konfirmasi blok...`);
  console.log(`🔗 Cek BscScan: https://testnet.bscscan.com/tx/${txHash}`);

  await publicClient.waitForTransactionReceipt({ hash: txHash });

  console.log("🎉 BERHASIL! PancakeSwap Router resmi di-whitelist oleh Admin.");
}

main().catch((error) => {
  console.error("❌ ERROR:", error);
  process.exitCode = 1;
});
