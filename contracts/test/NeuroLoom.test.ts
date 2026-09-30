import { network } from "hardhat";
import type { NetworkConnection } from "hardhat/types";
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { encodeFunctionData, parseUnits } from "viem";

describe("Security Audit & Wamia Guards: NeuroLoomVault (Hardhat v3 + Viem)", () => {
  async function deployVaultFixture({ viem }: NetworkConnection) {
    const publicClient = await viem.getPublicClient();
    const [admin, aiAgent, hacker, unapprovedProtocol] =
      await viem.getWalletClients();

    const mockUSDT = await viem.deployContract("MockERC20", [
      "Mock USDT",
      "USDT",
      18,
    ]);

    const vaultLogic = await viem.deployContract("NeuroLoomVault");
    const initData = encodeFunctionData({
      abi: vaultLogic.abi,
      functionName: "initialize",
      args: [
        mockUSDT.address,
        "NeuroLoom Yield Vault",
        "nUSDT",
        admin.account.address,
        aiAgent.account.address,
      ],
    });

    const proxy = await viem.deployContract("NeuroLoomProxy", [
      vaultLogic.address,
      initData,
    ]);
    const vault = await viem.getContractAt("NeuroLoomVault", proxy.address);

    const initialTvl = parseUnits("1000", 18);
    await mockUSDT.write.mint([admin.account.address, initialTvl]);
    await mockUSDT.write.approve([vault.address, initialTvl], {
      account: admin.account,
    });
    await vault.write.deposit([initialTvl, admin.account.address], {
      account: admin.account,
    });

    await vault.write.setApprovedProtocol([hacker.account.address, true], {
      account: admin.account,
    });

    return {
      publicClient,
      admin,
      aiAgent,
      hacker,
      unapprovedProtocol,
      vault,
      mockUSDT,
    };
  }

  describe("🛡 Core Access Control (RBAC & Whitelist)", () => {
    it("Must have a valid AI_EXECUTOR_ROLE.", async () => {
      const { networkHelpers } = await network.create();
      const { vault } = await networkHelpers.loadFixture(deployVaultFixture);

      const aiRole = await vault.read.AI_EXECUTOR_ROLE();
      assert.strictEqual(
        aiRole,
        "0x0c821e1b44f170b6d24f8a571604a3ff6cf1c5732d7f3ef80e53eee98cf3fc56",
        "AI Role Hash does not match!",
      );
    });

    it("Must REVERT if the AI ​​targets a non-whitelisted protocol.", async () => {
      const { networkHelpers, viem } = await network.create();
      const { vault, mockUSDT, aiAgent, unapprovedProtocol } =
        await networkHelpers.loadFixture(deployVaultFixture);

      await assert.rejects(
        vault.write.executeOmnichain(
          [
            unapprovedProtocol.account.address,
            "0x",
            mockUSDT.address,
            mockUSDT.address,
            100n,
            0n,
          ],
          { account: aiAgent.account },
        ),
        (err: any) => err.message.includes("Protocol not approved"),
      );
    });
  });

  describe("NeuroLoom Defense Systems ", () => {
    it("Velocity Guard: Must REVERT if AI uses > 20% of TVL in a single transaction.", async () => {
      const { networkHelpers, viem } = await network.create();
      const { vault, mockUSDT, aiAgent, hacker } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const overVelocityAmount = parseUnits("250", 18); // 25% dari 1000 USDT

      await assert.rejects(
        vault.write.executeOmnichain(
          [
            hacker.account.address,
            "0x",
            mockUSDT.address,
            mockUSDT.address,
            overVelocityAmount,
            0n,
          ],
          { account: aiAgent.account },
        ),
        (err: any) =>
          err.message.includes("VelocityGuard: Amount exceeds 20% per TX"),
      );
    });

    it("Oracle Guard: Must REVERT if the transaction does not have a valid Oracle Price Feed.", async () => {
      const { networkHelpers } = await network.create();
      const { vault, mockUSDT, aiAgent, hacker } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const safeAmount = parseUnits("100", 18);

      await assert.rejects(
        vault.write.executeOmnichain(
          [
            hacker.account.address,
            "0x",
            mockUSDT.address,
            mockUSDT.address,
            safeAmount,
            0n,
          ],
          { account: aiAgent.account },
        ),
        (err: any) =>
          err.message.includes("No oracle feed configured for this pair"),
      );
    });
  });
});
