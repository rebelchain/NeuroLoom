import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();
import {
  createPublicClient,
  http,
  parseUnits,
  BaseError,
  ContractFunctionRevertedError,
} from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };

async function simulateWithdraw() {
  console.log("==========================================");
  console.log("🔬 SIMULASI ULANG: withdraw(100, alamat, alamat)");
  console.log("==========================================");

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  // Alamat wallet dari nonce 7 & 8 (dari BscScan)
  const USER_ADDRESS = "0x7EA3202d612D911fBC23183a289060eb606EB4f1";
  const amount = parseUnits("100", 18); // persis input data nonce 8

  try {
    console.log(`Mensimulasikan withdraw dari ${USER_ADDRESS}...`);
    const result = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "withdraw",
      args: [amount, USER_ADDRESS, USER_ADDRESS],
      account: USER_ADDRESS as `0x${string}`, // cukup alamat, tanpa private key
    });
    console.log(
      "✅ Simulasi LOLOS (tidak revert). Return value:",
      result.result,
    );
  } catch (error: any) {
    console.log("❌ Simulasi REVERT — ini alasan sungguhannya:");
    if (error instanceof BaseError) {
      const revertError = error.walk(
        (err: any) => err instanceof ContractFunctionRevertedError,
      );
      if (revertError instanceof ContractFunctionRevertedError) {
        console.log(
          "   Nama Error:",
          revertError.data?.errorName ??
            "(revert string biasa, bukan custom error)",
        );
        console.log("   Args:", revertError.data?.args);
      } else {
        console.log("   Pesan:", error.shortMessage || error.message);
      }
    } else {
      console.log(error);
    }
  }
}

simulateWithdraw();
