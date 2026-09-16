import "@nomicfoundation/hardhat-viem";
import { network } from "hardhat";
import type { NetworkConnection } from "hardhat/types";
import { describe, it } from "node:test";
import { encodeFunctionData } from "viem";

describe("E2E Mainnet Fork: Anti-Sandwich Attack & Omnichain (Hardhat v3)", () => {
  const REAL_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3";
  const DUMMY_ASSET = "0x0000000000000000000000000000000000000000";

  async function deployVaultFixture({ viem }: NetworkConnection) {
    const [admin, aiAgent] = await viem.getWalletClients();

    // 1. Deploy MOCK ORACLE
    // Harga WBNB = $600 (60000000000 karena butuh 8 desimal ala Chainlink)
    const mockOracle = await viem.deployContract("MockOracle", [60000000000n]);

    // 2. Deploy Logic (Implementation) V2
    const vaultLogic = await viem.deployContract("NeuroLoomVaultV2");

    // 3. Encode data inisialisasi
    const initData = encodeFunctionData({
      abi: vaultLogic.abi,
      functionName: "initialize",
      args: [
        DUMMY_ASSET,
        admin.account.address,
        aiAgent.account.address,
        REAL_ROUTER,
        mockOracle.address,
      ],
    });

    // 4. Deploy Proxy
    const proxy = await viem.deployContract("NeuroLoomProxy", [
      vaultLogic.address,
      initData,
    ]);

    // 5. Hubungkan ABI ke Proxy
    const vault = await viem.getContractAt("NeuroLoomVaultV2", proxy.address);

    return { vault, admin, aiAgent };
  }

  it("Must revert if the AI ​​sends an expectedAmountOutMin below the reasonable limit (MEV Attack Simulation).", async () => {
    const { networkHelpers, viem } = await network.create();
    const { vault, aiAgent } =
      await networkHelpers.loadFixture(deployVaultFixture);

    const amountIn = 1000000000000000000n; // 1 WBNB
    const manipulatedAmountOutMin = 1000000000000000000n; // 1 USDT (Sangat rendah, diserang MEV)

    const tokenIn = "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd"; // WBNB
    const tokenOut = "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"; // USDT

    // Parameter Omnichain Generik
    const targetProtocol = REAL_ROUTER;
    const dummyData = "0x"; // Kosong, karena Oracle akan menggagalkan transaksi sebelum eksekusi byte data.

    console.log(
      "    Simulating Omnichain AI execution with slippage that destroys MEV...",
    );

    // Viem menangkap Revert dengan sangat presisi
    await viem.assertions.revertWithCustomError(
      vault.write.executeOmnichain(
        [
          targetProtocol,
          dummyData,
          tokenIn,
          tokenOut,
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
