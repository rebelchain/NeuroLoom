import { network } from "hardhat";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { parseUnits } from "viem";

const { viem, networkHelpers } = await network.create();

describe("NeuroLoomVault (Factory Deployed)", function () {
  // ==========================================
  // FIXTURE: Setup Awal yang Bersih (Clean State)
  // Menggunakan standar industri dengan NeuroLoomVaultFactory
  // ==========================================
  async function deployVaultFixture() {
    const [owner, user1, user2, aiExecutor] = await viem.getWalletClients();
    const publicClient = await viem.getPublicClient();

    // 1. Deploy Mock USDT (Menggunakan kontrak MockERC20-mu yang meminta 3 argumen di constructor)
    const mockUsdt = await viem.deployContract("MockERC20", [
      "Mock USDT",
      "mUSDT",
      18,
    ]);

    // 2. Deploy Logic Implementation
    const vaultImpl = await viem.deployContract("NeuroLoomVault");

    // 3. Deploy Factory
    const factory = await viem.deployContract("NeuroLoomVaultFactory", [
      vaultImpl.address,
    ]);

    // 4. Deploy Proxy melalui Factory (Ini adalah cara paling aman, bebas error mismatch!)
    const createTx = await factory.write.createStrategyVault([
      mockUsdt.address,
      "NeuroLoom Bluechip",
      "nlBC",
      aiExecutor.account.address,
    ]);
    await publicClient.waitForTransactionReceipt({ hash: createTx });

    // 5. Dapatkan alamat Proxy yang baru dibuat dari Factory
    const vaultAddress = (await factory.read.allVaults([0n])) as `0x${string}`;

    // 6. Hubungkan ABI Vault ke Address Proxy tersebut
    const vault = await viem.getContractAt("NeuroLoomVault", vaultAddress);

    // 7. Berikan Modal ke User1 untuk Testing
    const depositAmount = parseUnits("1000", 18);
    // Menggunakan fungsi mint dari MockERC20.sol milikmu
    await mockUsdt.write.mint([user1.account.address, depositAmount]);

    // User1 mengizinkan Vault untuk mengambil USDT-nya
    await mockUsdt.write.approve([vault.address, depositAmount], {
      account: user1.account,
    });

    return { vault, mockUsdt, owner, user1, user2, aiExecutor, publicClient };
  }

  // ==========================================
  // TEST BLOCK 1: DEPLOYMENT & INITIALIZATION
  // ==========================================
  describe("Deployment", function () {
    it("Harus mengatur asset dasar (Underlying Asset) dengan benar", async function () {
      const { vault, mockUsdt } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const assetAddress = (await vault.read.asset()) as string;
      assert.equal(assetAddress.toLowerCase(), mockUsdt.address.toLowerCase());
    });

    it("Harus memberikan role yang tepat kepada Admin dan AI Executor", async function () {
      const { vault, owner, aiExecutor } =
        await networkHelpers.loadFixture(deployVaultFixture);

      const defaultAdminRole = await vault.read.DEFAULT_ADMIN_ROLE();
      const aiExecutorRole = await vault.read.AI_EXECUTOR_ROLE();

      // Factory mengatur msg.sender (owner) sebagai Admin saat inisialisasi
      const isOwnerAdmin = await vault.read.hasRole([
        defaultAdminRole,
        owner.account.address,
      ]);
      const isAiExecutor = await vault.read.hasRole([
        aiExecutorRole,
        aiExecutor.account.address,
      ]);

      assert.equal(isOwnerAdmin, true);
      assert.equal(isAiExecutor, true);
    });
  });

  // ==========================================
  // TEST BLOCK 2: ERC-4626 CORE (DEPOSIT & WITHDRAW)
  // ==========================================
  describe("Mekanika Deposit & Withdraw (ERC-4626)", function () {
    it("Harus mencetak jumlah Shares yang akurat 1:1 pada Deposit pertama (Zero State Fix)", async function () {
      const { vault, user1, publicClient } =
        await networkHelpers.loadFixture(deployVaultFixture);
      const depositAmount = parseUnits("200", 18);

      // Eksekusi Deposit
      const hash = await vault.write.deposit(
        [depositAmount, user1.account.address],
        {
          account: user1.account,
        },
      );
      await publicClient.waitForTransactionReceipt({ hash });

      // Validasi: Jika bug 'return 1' masih ada, ini akan salah. Jika sudah benar, harus persis 200e18.
      const sharesBalance = await vault.read.balanceOf([user1.account.address]);
      assert.equal(
        sharesBalance,
        depositAmount,
        "Rasio saham harus 1:1 saat Vault kosong",
      );
    });

    it("Harus mengizinkan Withdraw tanpa perlu Approve Shares (Bypass Bug UI)", async function () {
      const { vault, mockUsdt, user1, publicClient } =
        await networkHelpers.loadFixture(deployVaultFixture);
      const depositAmount = parseUnits("200", 18);

      // 1. User1 Deposit 200 USDT
      await vault.write.deposit([depositAmount, user1.account.address], {
        account: user1.account,
      });

      // Cek saldo USDT User1 setelah deposit (harusnya 800)
      const balanceAfterDeposit = await mockUsdt.read.balanceOf([
        user1.account.address,
      ]);
      assert.equal(balanceAfterDeposit, parseUnits("800", 18));

      // 2. User1 Withdraw 50 USDT (menggunakan fungsi withdraw)
      const withdrawAmount = parseUnits("50", 18);
      const hashWithdraw = await vault.write.withdraw(
        [withdrawAmount, user1.account.address, user1.account.address],
        { account: user1.account },
      );
      await publicClient.waitForTransactionReceipt({ hash: hashWithdraw });

      // Cek saldo USDT User1 setelah withdraw (harusnya kembali jadi 850)
      const balanceAfterWithdraw = await mockUsdt.read.balanceOf([
        user1.account.address,
      ]);
      assert.equal(balanceAfterWithdraw, parseUnits("850", 18));

      // Pastikan Shares dibakar sebesar 50
      const remainingShares = await vault.read.balanceOf([
        user1.account.address,
      ]);
      assert.equal(remainingShares, parseUnits("150", 18));
    });
  });

  // ==========================================
  // TEST BLOCK 3: AI EXECUTION & GUARDS
  // ==========================================
  describe("AI Executor & Proteksi", function () {
    it("Harus me-revert jika non-AI memanggil executeOmnichain", async function () {
      const { vault, user2 } =
        await networkHelpers.loadFixture(deployVaultFixture);

      // User2 (orang biasa) mencoba memanggil fungsi AI
      await viem.assertions.revertWithCustomError(
        vault.write.executeOmnichain(
          [
            "0x0000000000000000000000000000000000000000",
            "0x",
            "0x0000000000000000000000000000000000000000",
            "0x0000000000000000000000000000000000000000",
            100n,
            90n,
          ],
          { account: user2.account },
        ),
        vault,
        "AccessControlUnauthorizedAccount",
      );
    });

    it("Harus membatasi maxWithdraw sebesar idleCash (Liquiditas Menganggur)", async function () {
      const { vault, user1, mockUsdt } =
        await networkHelpers.loadFixture(deployVaultFixture);
      const depositAmount = parseUnits("500", 18);

      await vault.write.deposit([depositAmount, user1.account.address], {
        account: user1.account,
      });

      const maxWithdrawBefore = await vault.read.maxWithdraw([
        user1.account.address,
      ]);
      assert.equal(maxWithdrawBefore, depositAmount);

      // SIMULASI AI MENGAMBIL DANA: "Curi" 400 USDT dari vault
      const vaultAddressString = vault.address as `0x${string}`;
      await networkHelpers.impersonateAccount(vaultAddressString);
      await networkHelpers.setBalance(vaultAddressString, parseUnits("1", 18)); // Beri ETH untuk gas

      await mockUsdt.write.transfer(
        [user1.account.address, parseUnits("400", 18)],
        {
          account: vaultAddressString,
        },
      );
      await networkHelpers.stopImpersonatingAccount(vaultAddressString);

      // maxWithdraw harusnya dibatasi menjadi sisa idleCash yaitu 100 USDT.
      const maxWithdrawAfter = (await vault.read.maxWithdraw([
        user1.account.address,
      ])) as bigint;
      const expectedWithdraw = parseUnits("100", 18);

      // Kita cek apakah selisihnya sangat kecil (kurang dari atau sama dengan 2 Wei)
      const diff =
        maxWithdrawAfter > expectedWithdraw
          ? maxWithdrawAfter - expectedWithdraw
          : expectedWithdraw - maxWithdrawAfter;

      assert.ok(
        diff <= 2n,
        `Precision loss terlalu besar: expected ${expectedWithdraw}, got ${maxWithdrawAfter}`,
      );
    });
  });
});
