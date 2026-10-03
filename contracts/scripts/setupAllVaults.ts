import { config } from "dotenv";
import {
  createPublicClient,
  createWalletClient,
  http,
  maxUint256,
  parseAbi,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";

const VAULT_ADDRESSES = [
  "0xf25297f1a2d83f738dc32fc5851bdff732c20141",
  "0x48d1edfaedd9ebae51abfb4d4d53a624b8411917",
  "0x42de62e19704f591acb71a63f892751dc37f098c",
] as `0x${string}`[];

const BCSPX_ORACLE = "0x92762ef11b4ca8941d306a348e16995ef53a0d52";

const TESTNET_WBNB =
  "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as `0x${string}`;
const TESTNET_PANCAKE_V3_MANAGER =
  "0x427bF5b37357632377eCbEC9de3626C71A5396c1" as `0x${string}`;
const TESTNET_PANCAKE_ROUTER =
  "0x1b81D678ffb9C0263b24A97847620C99d213eB14" as `0x${string}`;
const MUSDT_TESTNET =
  "0xFa45Fd644B34606cABFb7c8acc546E770e248b83" as `0x${string}`;
const CHAINLINK_ORACLE_BNB_USDT =
  "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" as `0x${string}`;
const VENUS_VUSDT =
  "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as `0x${string}`;
const BCSPX_ADDRESS =
  "0xe2e0f08d4fe0ed7c737353cf03404bf153a0938a" as `0x${string}`;

const vaultAbi = parseAbi([
  "function setWbnbToken(address _wbnbToken) external",
  "function setNftPositionManager(address _manager) external",
  "function setApprovedProtocol(address protocol, bool status) external",
  "function setPairPriceFeed(address tokenIn, address tokenOut, address feed) external",
  "function setVenusVToken(address _venusVToken) external",
  "function setLendingProtocol(address protocol, bool status) external",
]);

const erc20Abi = parseAbi([
  "function approve(address spender, uint256 amount) external returns (bool)",
]);

async function setupAllVaults() {
  console.log("🚀 Starting Ultimate Mass Setup for 3 NEW NeuroLoom Vaults...");

  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error("No private key found in .env");

  const account = privateKeyToAccount(
    (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
  );
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: bscTestnet,
    transport: http(RPC_URL),
  });

  for (let i = 0; i < VAULT_ADDRESSES.length; i++) {
    const vault = VAULT_ADDRESSES[i];
    console.log(`\n===========================================`);
    console.log(`⚙️️ CONFIGURING VAULT ${i + 1}/3: ${vault}`);
    console.log(`===========================================`);

    try {
      console.log("-> 🔑 Approving bCSPX for Vault...");
      const { request: approveReq } = await publicClient.simulateContract({
        account,
        address: BCSPX_ADDRESS,
        abi: erc20Abi,
        functionName: "approve",
        args: [vault, maxUint256],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(approveReq),
      });

      console.log("-> ⚙️ Setting WBNB...");
      const { request: r1 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setWbnbToken",
        args: [TESTNET_WBNB],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r1),
      });

      console.log("-> ⚙️ Setting Manager V3...");
      const { request: r2 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setNftPositionManager",
        args: [TESTNET_PANCAKE_V3_MANAGER],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r2),
      });

      console.log("-> 🔓 Whitelisting PancakeSwap Protocols...");
      const { request: r3 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setApprovedProtocol",
        args: [TESTNET_PANCAKE_ROUTER, true],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r3),
      });
      const { request: r4 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setApprovedProtocol",
        args: [TESTNET_PANCAKE_V3_MANAGER, true],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r4),
      });

      console.log("-> 📡 Configuring Chainlink Oracle (USDT <-> WBNB)...");
      const { request: r5 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [MUSDT_TESTNET, TESTNET_WBNB, CHAINLINK_ORACLE_BNB_USDT],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r5),
      });
      const { request: r6 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [TESTNET_WBNB, MUSDT_TESTNET, CHAINLINK_ORACLE_BNB_USDT],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r6),
      });

      console.log("-> 📡 Configuring Mock Oracle (bCSPX <-> USDT)...");
      const { request: rBcspx1 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [BCSPX_ADDRESS, MUSDT_TESTNET, BCSPX_ORACLE],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(rBcspx1),
      });
      const { request: rBcspx2 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [MUSDT_TESTNET, BCSPX_ADDRESS, BCSPX_ORACLE],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(rBcspx2),
      });

      console.log("-> 🏦 Configuring Venus Protocol (Lending Whitelist)...");
      const { request: r7 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setVenusVToken",
        args: [VENUS_VUSDT],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r7),
      });

      const { request: r8 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setLendingProtocol",
        args: [VENUS_VUSDT, true],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r8),
      });

      const { request: r9 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setApprovedProtocol",
        args: [VENUS_VUSDT, true],
      });
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r9),
      });

      console.log(`🎉 Vault ${vault} Fully Configured & Ready!`);
    } catch (error: any) {
      console.error(
        `❌ Failed on Vault ${vault}:`,
        error.shortMessage || error.message,
      );
    }
  }
  console.log("\n✅ ALL VAULTS READY FOR NEUROLOOM AI!");
}

setupAllVaults();
