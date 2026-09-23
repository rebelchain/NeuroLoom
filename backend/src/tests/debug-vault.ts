import * as dotenvx from "@dotenvx/dotenvx";
import { createPublicClient, formatUnits, http } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";
dotenvx.config();

const ERC20_ABI = [
  {
    type: "function",
    name: "balanceOf",
    inputs: [{ type: "address", name: "account" }],
    outputs: [{ type: "uint256" }],
    stateMutability: "view",
  },
] as const;

const AGGREGATOR_ABI = [
  {
    type: "function",
    name: "latestRoundData",
    inputs: [],
    outputs: [
      { type: "uint80" },
      { type: "int256", name: "price" },
      { type: "uint256" },
      { type: "uint256", name: "updatedAt" },
      { type: "uint80" },
    ],
    stateMutability: "view",
  },
] as const;

async function runDiagnostics() {
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });

  console.log("Get Onchain Agnostic Data");

  try {
    const balance = (await publicClient.readContract({
      address: CONFIG.TOKENS.USDT as `0x${string}`,
      abi: ERC20_ABI,
      functionName: "balanceOf",
      args: [CONFIG.VAULT_PROXY as `0x${string}`],
    })) as bigint;

    console.log(`\nUSDT BALANCE IN VAULT`);
    console.log(`Vault Address: ${CONFIG.VAULT_PROXY}`);
    console.log(`Current Balance: ${formatUnits(balance, 18)} USDT`);

    if (balance === 0n) {
      console.log("The vault has a balance of 0 USDT.");
      console.log(
        "   PancakeSwap reverted the transaction because the Vault attempted to perform a swap with zero funds!",
      );
    } else {
      console.log("The Vault balance is secure.");
    }

   
    const CHAINLINK_BNB_USD = "0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526";
    const roundData = await publicClient.readContract({
      address: CHAINLINK_BNB_USD as `0x${string}`,
      abi: AGGREGATOR_ABI,
      functionName: "latestRoundData",
    });

    const price = roundData[1];
    const updatedAt = roundData[3];

    console.log(`\nCHAINLINK ORACLE HEALTH`);
    console.log(`BNB price: $${Number(price) / 1e8}`);

    const ageSeconds = Math.floor(Date.now() / 1000) - Number(updatedAt);
    console.log(
      `Oracle Data Age (Last Updated): ${ageSeconds} seconds ago`,
    );

    if (ageSeconds > 3600) {
      console.log("FOUND: Stale Chainlink Testnet Data!");
      console.log(
        "The smart contract halts the transaction via `revert StaleOracleData();`.'.",
      );
    } else {
      console.log("The Oracle is healthy and up-to-date.");
    }
  } catch (error: any) {
    console.error("Failed to run diagnostics:", error.message);
  }
}

runDiagnostics();
