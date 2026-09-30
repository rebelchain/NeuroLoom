import { config } from "dotenv";
import { createPublicClient, createWalletClient, http, parseAbi } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";

config();

const RPC_URL = "https://data-seed-prebsc-2-s2.bnbchain.org:8545/";


const VAULT_ADDRESSES = [
  "0xCafac3dD18aC6c6e92c921884f9E4176737C052c" as `0x${string}`,
  "0x9f1ac54BEF0DD2f6f3462EA0fa94fC62300d3a8e" as `0x${string}`,
  "0xbf9fBFf01664500A33080Da5d437028b07DFcC55" as `0x${string}`,
];

const TESTNET_WBNB =
  "0xae13d989daC2f0dEbFf460aC112a837C89BAa7cd" as `0x${string}`;
const TESTNET_PANCAKE_V3_MANAGER =
  "0x427bF5b37357632377eCbEC9de3626C71A5396c1" as `0x${string}`;
const TESTNET_PANCAKE_ROUTER =
  "0x1b81D678ffb9C0263b24A97847620C99d213eB14" as `0x${string}`;
const MUSDT_TESTNET =
  "0xFa45Fd644B34606cABFb7c8acc546E770e248b83" as `0x${string}`;
const ORACLE_ADDRESS =
  "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526" as `0x${string}`;
const VENUS_VUSDT =
  "0xb7526572FFE56AB9D7489838Bf2E18e3323b441A" as `0x${string}`; 

const vaultAbi = parseAbi([
  "function setWbnbToken(address _wbnbToken) external",
  "function setNftPositionManager(address _manager) external",
  "function setApprovedProtocol(address protocol, bool status) external",
  "function setPairPriceFeed(address tokenIn, address tokenOut, address feed) external",
  "function setVenusVToken(address _venusVToken) external",
  "function setLendingProtocol(address protocol, bool status) external",
]);

async function setupAllVaults() {
  console.log("🚀 Starting Mass Setup for 3 NeuroLoom Vaults...");

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

    console.log(`CONFIGURING VAULT ${i + 1}/3: ${vault}`);

    try {
      console.log("-> Setting WBNB...");
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

      console.log("-> Setting Manager V3");
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

      console.log("-> Whitelisting PancakeSwap Router");
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

      console.log("-> Whitelisting PancakeSwap V3 Manager");
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

      console.log("-> Configuring Oracle");
      const { request: r5 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [MUSDT_TESTNET, TESTNET_WBNB, ORACLE_ADDRESS],
      });
      await walletClient.writeContract(r5);
      const { request: r6 } = await publicClient.simulateContract({
        account,
        address: vault,
        abi: vaultAbi,
        functionName: "setPairPriceFeed",
        args: [TESTNET_WBNB, MUSDT_TESTNET, ORACLE_ADDRESS],
      });
      await walletClient.writeContract(r6);

      console.log("-> Configuring Venus Protocol");
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
      }); // Whitelist target execution
      await publicClient.waitForTransactionReceipt({
        hash: await walletClient.writeContract(r9),
      });

      console.log(`✅ Vault ${i + 1} Fully Configured!`);
    } catch (error: any) {
      console.error(
        `Failed on Vault ${vault}:`,
        error.shortMessage || error.message,
      );
    }
  }
  console.log("\nREADY");
}

setupAllVaults();
