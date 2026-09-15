import "@nomicfoundation/hardhat-viem";
import { describe, it } from "node:test";
import { network } from "hardhat";
import { encodeFunctionData } from "viem";
import type { NetworkConnection } from "hardhat/types";

describe("E2E Mainnet Fork: Anti-Sandwich Attack (Hardhat v3)", () => {
  const REAL_ROUTER = "0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3"; 
  const DUMMY_ASSET = "0x0000000000000000000000000000000000000000"; 

  async function deployVaultFixture({ viem }: NetworkConnection) {
    const [admin, aiAgent] = await viem.getWalletClients();

    // 1. Deploy MOCK ORACLE kita sendiri
    // Kita set harga WBNB = $600 (ditulis 60000000000 karena butuh 8 desimal ala Chainlink)
    const mockOracle = await viem.deployContract("MockOracle", [60000000000n]);

    // 2. Deploy Logic (Implementation) V2
    const vaultLogic = await viem.deployContract("NeuroLoomVaultV2");

    // 3. Encode data inisialisasi (PERHATIKAN: Kita pakai mockOracle.address)
    const initData = encodeFunctionData({
      abi: vaultLogic.abi,
      functionName: "initialize",
      args: [DUMMY_ASSET, admin.account.address, aiAgent.account.address, REAL_ROUTER, mockOracle.address],
    });

    // 4. Deploy Proxy milikmu yang asli
    const proxy = await viem.deployContract("NeuroLoomProxy", [
      vaultLogic.address,
      initData,
    ]);

    // 5. Hubungkan ABI ke Proxy
    const vault = await viem.getContractAt("NeuroLoomVaultV2", proxy.address);

    return { vault, admin, aiAgent };
  }

  it("Harus REVERT jika AI mengirim amountOutMin di bawah batas wajar (MEV Attack Simulation)", async () => {
    const { networkHelpers, viem } = await network.create();
    const { vault, aiAgent } = await networkHelpers.loadFixture(deployVaultFixture);

    const amountIn = 1000000000000000000n; // 1 * 10^18 (1 WBNB)
    
    // Berdasarkan harga $600 di Oracle kita, nilai wajar 1 WBNB adalah ~600 USDT
    // Batas toleransi 2% = 588 USDT.
    // Bot MEV di sini mencoba memanipulasi agar AI hanya dapat 1 USDT (1 * 10^18)
    const manipulatedAmountOutMin = 1000000000000000000n; 
    
    const path = [
      "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd", // WBNB
      "0x337610d27c682E347C9cD60BD4b3b107C9d34dDd"  // USDT
    ];

    console.log("    ⏳ Mensimulasikan eksekusi AI dengan slippage yang dihancurkan MEV...");

    // Viem akan menangkap Revert ini dengan sempurna
    await viem.assertions.revertWithCustomError(
      vault.write.executeRebalance([amountIn, manipulatedAmountOutMin, path], {
        account: aiAgent.account,
      }),
      vault,
      "SlippageExceeded"
    );
  });
});