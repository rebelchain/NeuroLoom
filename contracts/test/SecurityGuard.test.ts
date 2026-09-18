import { describe, it } from "node:test";
import assert from "node:assert";
import { network } from "hardhat";
import type { NetworkConnection } from "hardhat/types";

describe("Security Audit: NeuroLoomVaultV2 (Hardhat v-next)", () => {
  async function deployVaultFixture({ viem }: NetworkConnection) {
    const publicClient = await viem.getPublicClient();
    const [admin, aiAgent] = await viem.getWalletClients();

    const vault = await viem.deployContract("NeuroLoomVaultV2");

    return { vault, admin, aiAgent, publicClient };
  }

  it("Must successfully deploy the V2 contract on the local network.", async () => {
    // 1. Buat koneksi jaringan dan ambil networkHelpers
    const { networkHelpers } = await network.create();

    // 2. Gunakan loadFixture dari networkHelpers
    const { vault } = await networkHelpers.loadFixture(deployVaultFixture);

    assert.ok(
      vault.address !== undefined,
      "The contract address cannot be undefined",
    );
  });

  it("The AI_EXECUTOR_ROLE must be recognized deterministically.", async () => {
    // 1. Buat koneksi jaringan dan ambil networkHelpers
    const { networkHelpers } = await network.create();

    // 2. Gunakan loadFixture dari networkHelpers
    const { vault } = await networkHelpers.loadFixture(deployVaultFixture);

    const aiRole = await vault.read.AI_EXECUTOR_ROLE();

    assert.strictEqual(
      aiRole,
      "0x0c821e1b44f170b6d24f8a571604a3ff6cf1c5732d7f3ef80e53eee98cf3fc56",
      "Hash AI Role mismatch",
    );
  });
});
