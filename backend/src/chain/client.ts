import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http("https://bsc-testnet.rpc.sentio.xyz"),
});

async function testConnection() {
  try {
    console.log("⏳ Menghubungkan ke BSC Testnet...");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`✅ Berhasil! Node aktif pada Blok Saat Ini: ${blockNumber}`);
  } catch (error) {
    console.error("❌ Gagal terhubung ke RPC:", error);
  }
}

testConnection();
