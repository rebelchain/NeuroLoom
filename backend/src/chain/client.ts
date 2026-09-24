import { createPublicClient, http } from "viem";
import { bscTestnet } from "viem/chains";

export const publicClient = createPublicClient({
  chain: bscTestnet,
  transport: http("https://bsc-testnet.rpc.sentio.xyz"),
});

async function testConnection() {
  try {
    console.log("Connected to BSC Tesnet");
    const blockNumber = await publicClient.getBlockNumber();
    console.log(`Success: ${blockNumber}`);
  } catch (error) {
    console.error("❌ Failed to connect RPC:", error);
  }
}

testConnection();
