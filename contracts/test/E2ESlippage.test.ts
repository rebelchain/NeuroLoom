import "@nomicfoundation/hardhat-viem";
import { network } from "hardhat";
import type { NetworkConnection } from "hardhat/types";
import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { encodeFunctionData, parseUnits } from "viem";

const { networkHelpers, viem } = await network.create();

describe("E2E Mainnet Fork: Anti-Sandwich Attack & Omnichain (Hardhat v3)", () => {
  async function deployVaultFixture({ viem }: NetworkConnection) {
    const publicClient = await viem.getPublicClient();
    const [admin, aiAgent, unauthorizedUser] = await viem.getWalletClients();

    const mockWBNB = await viem.deployContract("MockERC20", [
      "Mock WBNB",
      "WBNB",
      18,
    ]);
    const mockUSDT = await viem.deployContract("MockERC20", [
      "Mock USDT",
      "USDT",
      6,
    ]);

    const mockOracle = await viem.deployContract("MockOracle", [60000000000n]); // $600
    const mockDex = await viem.deployContract("MockDex");

    const vaultLogic = await viem.deployContract("NeuroLoomVaultV2");
    const initData = encodeFunctionData({
      abi: vaultLogic.abi,
      functionName: "initialize",
      args: [
        mockUSDT.address,
        admin.account.address,
        aiAgent.account.address,
        mockDex.address,
        mockOracle.address,
      ],
    });

    const proxy = await viem.deployContract("NeuroLoomProxy", [
      vaultLogic.address,
      initData,
    ]);
    const vault = await viem.getContractAt("NeuroLoomVaultV2", proxy.address);

    await vault.write.setApprovedProtocol([mockDex.address, true], {
      account: admin.account,
    });
    await vault.write.setPairPriceFeed(
      [mockWBNB.address, mockUSDT.address, mockOracle.address],
      { account: admin.account },
    );

    const amountIn = parseUnits("10", 18);
    await mockWBNB.write.mint([vault.address, amountIn]);

    const dexLiquidity = parseUnits("100000", 6);
    await mockUSDT.write.mint([mockDex.address, dexLiquidity]);

    return {
      publicClient,
      admin,
      aiAgent,
      unauthorizedUser,
      vault,
      mockWBNB,
      mockUSDT,
      mockOracle,
      mockDex,
    };
  }

  describe("🛡️ Security Guards (Negative Paths)", () => {
    it("Must revert if called by a non-AI role (Access Control)", async () => {
      const { vault, mockWBNB, mockUSDT, mockDex, unauthorizedUser } =
        await networkHelpers.loadFixture(deployVaultFixture);

      await assert.rejects(
        vault.write.executeOmnichain(
          [mockDex.address, "0x", mockWBNB.address, mockUSDT.address, 1n, 1n],
          { account: unauthorizedUser.account },
        ),
        (err: any) => err.message.includes("AccessControlUnauthorizedAccount"),
      );
    });

    it("Must revert if AI targets an unapproved protocol (Protocol Whitelist)", async () => {
      const { vault, mockWBNB, mockUSDT, aiAgent, unauthorizedUser } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const hackerAddress = unauthorizedUser.account.address;

      await assert.rejects(
        vault.write.executeOmnichain(
          [hackerAddress, "0x", mockWBNB.address, mockUSDT.address, 1n, 1n],
          { account: aiAgent.account },
        ),
        (err: any) => err.message.includes("Protocol not approved"),
      );
    });

    it("Must revert if AI sends an expectedAmountOutMin below the 2% slippage limit (Anti-MEV)", async () => {
      const { vault, mockWBNB, mockUSDT, mockDex, aiAgent } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const amountIn = parseUnits("1", 18);
      const manipulatedAmountOutMin = parseUnits("100", 6);

      await viem.assertions.revertWithCustomError(
        vault.write.executeOmnichain(
          [
            mockDex.address,
            "0x",
            mockWBNB.address,
            mockUSDT.address,
            amountIn,
            manipulatedAmountOutMin,
          ],
          { account: aiAgent.account },
        ),
        vault,
        "SlippageExceeded",
      );
    });
  });

  describe("⚡ True Omnichain Routing (Happy Path)", () => {
    it("Must successfully execute a cross-protocol swap with correct calldata & dynamic decimals", async () => {
      const { publicClient, vault, mockWBNB, mockUSDT, mockDex, aiAgent } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const amountIn = parseUnits("1", 18);
      const expectedAmountOut = parseUnits("595", 6);
      const expectedAmountOutMin = parseUnits("590", 6);

      const omnichainData = encodeFunctionData({
        abi: mockDex.abi,
        functionName: "swapExactTokens",
        args: [mockWBNB.address, mockUSDT.address, amountIn, expectedAmountOut],
      });

      const vaultUsdtBefore = (await mockUSDT.read.balanceOf([
        vault.address,
      ])) as bigint;
      const vaultWbnbBefore = (await mockWBNB.read.balanceOf([
        vault.address,
      ])) as bigint;

      const txHash = await vault.write.executeOmnichain(
        [
          mockDex.address,
          omnichainData,
          mockWBNB.address,
          mockUSDT.address,
          amountIn,
          expectedAmountOutMin,
        ],
        { account: aiAgent.account },
      );

      await publicClient.waitForTransactionReceipt({ hash: txHash });

      // Tambahkan "as bigint" di sini juga
      const vaultUsdtAfter = (await mockUSDT.read.balanceOf([
        vault.address,
      ])) as bigint;
      const vaultWbnbAfter = (await mockWBNB.read.balanceOf([
        vault.address,
      ])) as bigint;

      assert.equal(vaultWbnbAfter, vaultWbnbBefore - amountIn);
      assert.equal(vaultUsdtAfter, vaultUsdtBefore + expectedAmountOut);
    });
  });
});
