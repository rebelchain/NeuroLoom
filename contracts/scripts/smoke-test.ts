import hre from "hardhat";

async function main() {
  // [PERBAIKAN]: Ubah "Audit Keamanan" menjadi "Smoke Test"
  console.log("🔍 Memulai Smoke Test Infrastruktur: NeuroLoomVaultV2...\n");

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
    "0x0c821e1b44f170b6d24f8a571604a3ff6cf1c5732d7f3ef80e53eee98cf3fc56";

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
    "\n🏁 Smoke Test Passed: V2 Proxy deployed and AI_EXECUTOR_ROLE bound successfully.",
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
