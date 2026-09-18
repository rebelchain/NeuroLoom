import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();
import { createWalletClient, createPublicClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";
// Pastikan path ke ABI ini benar sesuai struktur foldermu
import VaultABI from "../abi/NeuroLoomVaultV2.json" with { type: "json" };

async function whitelistPancakeRouter() {
  console.log("==========================================");
  console.log("🔐 MENGIRIM TRANSAKSI WHITELIST KE VAULT");
  console.log("==========================================");

  // ASUMSI: AI_PRIVATE_KEY di .env adalah dompet yang men-deploy Vault (Memiliki DEFAULT_ADMIN_ROLE)
  const pk = process.env.AI_PRIVATE_KEY;
  if (!pk) throw new Error("AI_PRIVATE_KEY tidak ditemukan");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );

  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  const DEX_ROUTER = "0x1b81D678ffb9C0263b24A97847620C99d213eB14";

  try {
    console.log(
      `[1] Memeriksa status Whitelist untuk Router: ${DEX_ROUTER}...`,
    );
    const isApproved = await publicClient.readContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "approvedProtocols",
      args: [DEX_ROUTER],
    });

    if (isApproved) {
      console.log(
        "✅ Router SUDAH masuk dalam Whitelist. Tidak perlu aksi tambahan.",
      );
      return;
    }

    console.log(`[2] Menambahkan Router ke Whitelist (Membutuhkan Gas BNB)...`);
    const { request } = await publicClient.simulateContract({
      address: CONFIG.VAULT_PROXY as `0x${string}`,
      abi: VaultABI.abi,
      functionName: "setApprovedProtocol",
      args: [DEX_ROUTER, true],
      account,
    });

    const hash = await walletClient.writeContract(request);
    console.log(
      `⏳ Transaksi dikirim! Hash: https://testnet.bscscan.com/tx/${hash}`,
    );

    await publicClient.waitForTransactionReceipt({ hash });
    console.log(
      "✅ [SUCCESS] Router PancakeSwap V3 berhasil di-whitelist di Vault!",
    );
  } catch (error: any) {
    console.error(
      "❌ Gagal melakukan whitelist:",
      error.shortMessage || error.message,
    );
  }
}

whitelistPancakeRouter();
