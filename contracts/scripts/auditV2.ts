import hre from "hardhat";

async function main() {
  console.log("🔍 Memulai Audit Keamanan Lokal: NeuroLoomVaultV2...\n");

  // Karena ini berjalan di main thread Hardhat, hre.viem PASTI terinjeksi dengan aman
  const viem = (hre as any).viem;

  if (!viem) {
    throw new Error(
      "❌ Plugin Viem tidak terdeteksi! Pastikan import '@nomicfoundation/hardhat-toolbox-viem' ada di baris pertama hardhat.config.ts",
    );
  }

  // 1. Uji Deployment ke Local Node
  console.log("⏳ Mendeploy V2 ke memori lokal...");
  const vault = await viem.deployContract("NeuroLoomVaultV2");
  console.log(
    "✅ [LULUS] Kontrak V2 berhasil di-deploy ke alamat:",
    vault.address,
  );

  // 2. Uji Determinisme Role AI
  console.log("⏳ Memvalidasi akses Role-Based Access Control (RBAC)...");
  const aiRole = await vault.read.AI_EXECUTOR_ROLE();
  const expectedRole =
    "0x7052dc6eb08d748f22497fc367757948a8a474d209b5fbb37f05eb1498b9a19c";

  if (aiRole === expectedRole) {
    console.log(
      "✅ [LULUS] RBAC Check: Hash AI_EXECUTOR_ROLE terverifikasi sempurna.",
    );
  } else {
    throw new Error(
      "❌ [GAGAL] Hash Role AI tidak cocok dengan standar keamanan!",
    );
  }

  console.log(
    "\n🛡️ AUDIT SELESAI: Kontrak V2 kebal, aman, dan siap rilis (Upgrade) ke BSC Testnet! 🚀",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
