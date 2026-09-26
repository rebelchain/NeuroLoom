import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { bscTestnet } from "viem/chains";
import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };
import { CONFIG } from "../config.js";

dotenvx.config();

async function setupVaultMultiStrategy() {
  console.log("[MOCK Ecosystem] Launching the Multi-Configuration Strategy Vault");

  const pk = process.env.AI_PRIVATE_KEY || process.env.PRIVATE_KEY;
  if (!pk) throw new Error("PRIVATE KEY not found");

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

  // MOCK ECOSYSTEM ADDRESSES 
  const MOCK_ROUTER = "0xf33c30a801720294eba818a143339e487cddf129";
  const MOCK_WBNB = "0x4856f641715bd527f8d7b70e9ade7da3c38fe52e";
  const MOCK_BTCB = "0x18ecc91ea38ec9c5cd29f2d1e1686d0a63f49960";


  const USDT_TESTNET = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";
  const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
  const CHAINLINK_BTC_USD = "0x5741306c21795FdCBb9b265Ea0255F499DFe515C";



  const protocols = [{ name: "Neuro Mock Router", address: MOCK_ROUTER }];


  const oraclePairs = [
    {
      tokenIn: USDT_TESTNET,
      tokenOut: MOCK_WBNB, 
      oracle: CHAINLINK_BNB_USD, 
      name: "USDT -> Mock WBNB",
    },
    {
      tokenIn: MOCK_WBNB,
      tokenOut: USDT_TESTNET,
      oracle: CHAINLINK_BNB_USD,
      name: "Mock WBNB -> USDT",
    },
    {
      tokenIn: USDT_TESTNET,
      tokenOut: MOCK_BTCB,
      oracle: CHAINLINK_BTC_USD,
      name: "USDT -> Mock BTCB",
    },
  ];

  const vaults = Object.entries(CONFIG.VAULTS);

  try {
    for (const [vaultName, vaultAddress] of vaults) {
      console.log(`TARGET VAULT: ${vaultName} (${vaultAddress})`);

      console.log("\nPROTOCOL CONFIGURATION: WHITELIST");
      for (const p of protocols) {
        const isApproved = await publicClient.readContract({
          address: vaultAddress as `0x${string}`,
          abi: VaultABI.abi,
          functionName: "approvedProtocols",
          args: [p.address],
        });

        if (isApproved) {
          console.log(`[SKIP] ${p.name} Already whitelisted`);
        } else {
          console.log(`[EXEC] Add ${p.name}...`);
          const { request } = await publicClient.simulateContract({
            address: vaultAddress as `0x${string}`,
            abi: VaultABI.abi,
            functionName: "setApprovedProtocol",
            args: [p.address, true],
            account,
          });
          const hash = await walletClient.writeContract(request);
          await publicClient.waitForTransactionReceipt({ hash });
          console.log(`✅ [OK] ${p.name} whitelist success.`);
        }
      }

      console.log("\nKONFIGURASI ORACLE: MEV PROTECTION");
      for (const pair of oraclePairs) {
        const currentOracle = await publicClient.readContract({
          address: vaultAddress as `0x${string}`,
          abi: VaultABI.abi,
          functionName: "pairPriceFeeds",
          args: [pair.tokenIn, pair.tokenOut],
        });

        if (
          (currentOracle as string).toLowerCase() === pair.oracle.toLowerCase()
        ) {
          console.log(`✅ [SKIP] Oracle ${pair.name} is connected`);
        } else {
          console.log(`[EXEC] Configuring Oracle for ${pair.name}...`);
          const { request } = await publicClient.simulateContract({
            address: vaultAddress as `0x${string}`,
            abi: VaultABI.abi,
            functionName: "setPairPriceFeed",
            args: [pair.tokenIn, pair.tokenOut, pair.oracle],
            account,
          });
          const hash = await walletClient.writeContract(request);
          await publicClient.waitForTransactionReceipt({ hash });
          console.log(`✅ [OK] Oracle ${pair.name} is connected`);
        }
      }
    }

    console.log("\nDONE!");
  } catch (error: any) {
    console.error(
      "❌ Configuration failed:",
      error.shortMessage || error.message,
    );
  }
}

setupVaultMultiStrategy();
