import { describe, it } from "node:test";
import assert from "node:assert";
import { network } from "hardhat";
import type { NetworkConnection } from "hardhat/types";

describe("Audit Keamanan: NeuroLoomVaultV2 (Hardhat v-next)", () => {
  // Fungsi Fixture sekarang menerima `NetworkConnection` yang berisi `viem`
  async function deployVaultFixture({ viem }: NetworkConnection) {
    const publicClient = await viem.getPublicClient();
    const [admin, aiAgent] = await viem.getWalletClients();

    const vault = await viem.deployContract("NeuroLoomVaultV2");

    return { vault, admin, aiAgent, publicClient };
  }

  it("Harus berhasil mendeploy kontrak V2 di Local Network", async () => {
    // 1. Buat koneksi jaringan dan ambil networkHelpers
    const { networkHelpers } = await network.create();

    // 2. Gunakan loadFixture dari networkHelpers
    const { vault } = await networkHelpers.loadFixture(deployVaultFixture);

    assert.ok(
      vault.address !== undefined,
      "Alamat kontrak tidak boleh undefined",
    );
  });

  it("Harus mengenali role AI_EXECUTOR_ROLE secara deterministik", async () => {
    // 1. Buat koneksi jaringan dan ambil networkHelpers
    const { networkHelpers } = await network.create();

    // 2. Gunakan loadFixture dari networkHelpers
    const { vault } = await networkHelpers.loadFixture(deployVaultFixture);

    const aiRole = await vault.read.AI_EXECUTOR_ROLE();

    assert.strictEqual(
      aiRole,
      "0x7052dc6eb08d748f22497fc367757948a8a474d209b5fbb37f05eb1498b9a19c",
      "Hash AI Role tidak cocok",
    );
  });
});
