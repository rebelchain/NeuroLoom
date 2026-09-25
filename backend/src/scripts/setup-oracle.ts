// import * as dotenvx from "@dotenvx/dotenvx";
// import { createPublicClient, createWalletClient, http } from "viem";
// import { privateKeyToAccount } from "viem/accounts";
// import { bscTestnet } from "viem/chains";
// import { CONFIG } from "../config.js";
// dotenvx.config();

// import VaultABI from "../abi/NeuroLoomVault.json" with { type: "json" };

// async function configureOracle() {
//   console.log("Connecting Chainlink Oracke to Vault");

//   const pk = process.env.AI_PRIVATE_KEY;
//   if (!pk) throw new Error("AI_PRIVATE_KEY not found");

//   const account = privateKeyToAccount(
//     (pk.startsWith("0x") ? pk : `0x${pk}`) as `0x${string}`,
//   );
//   const publicClient = createPublicClient({
//     chain: bscTestnet,
//     transport: http(CONFIG.RPC_URL),
//   });
//   const walletClient = createWalletClient({
//     account,
//     chain: bscTestnet,
//     transport: http(CONFIG.RPC_URL),
//   });

  
//   const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
// ``
//   try {
//     console.log(
//       `Registering an Oracle for transaction security (Anti-MEV)....`,
//     );
//     const { request } = await publicClient.simulateContract({
//       address: CONFIG.VAULT_PROXY as `0x${string}`,
//       abi: VaultABI.abi,
//       functionName: "setPairPriceFeed",
//       args: [CONFIG.TOKENS.USDT, CONFIG.TOKENS.WBNB, CHAINLINK_BNB_USD],
//       account,
//     });
//     const hash = await walletClient.writeContract(request);
//     await publicClient.waitForTransactionReceipt({ hash });
//     console.log(
//       ` SUCCESS ✅ USDT -> WBNB is registered! Hash: https://testnet.bscscan.com/tx/${hash}`,
//     );

//     console.log(`Registering the reverse direction (WBNB -> USDT)...`);
//     const { request: reverseRequest } = await publicClient.simulateContract({
//       address: CONFIG.VAULT_PROXY as `0x${string}`,
//       abi: VaultABI.abi,
//       functionName: "setPairPriceFeed",
//       args: [CONFIG.TOKENS.WBNB, CONFIG.TOKENS.USDT, CHAINLINK_BNB_USD],
//       account,
//     });
//     const reverseHash = await walletClient.writeContract(reverseRequest);
//     await publicClient.waitForTransactionReceipt({ hash: reverseHash });
//     console.log(
//       ` SUCCESS ✅ WBNB -> USDT is registered! Hash: https://testnet.bscscan.com/tx/${reverseHash}`,
//     );
//   } catch (error: any) {
//     console.error(
//       " Oracle configuration failed:",
//       error.shortMessage || error.message,
//     );
//   }
// }

// configureOracle();
