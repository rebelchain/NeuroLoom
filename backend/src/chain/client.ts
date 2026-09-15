import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

// Inisialisasi klien publik (Read-only) untuk membaca data dari blockchain
export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http("https://bsc-testnet.rpc.sentio.xyz"),
});

// Fungsi tes untuk memastikan koneksi ke node BSC Testnet sehat
async function testConnection() {
  try {
    console.log("⏳ Menghubungkan ke BSC Testnet...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Berhasil! Node aktif pada Blok Saat Ini: ${blockNumber}`);
  } catch (error) {
    console.error("❌ Gagal terhubung ke RPC:", error);
  }
}

// Jalankan fungsi jika file ini dieksekusi secara langsung
testConnection();
