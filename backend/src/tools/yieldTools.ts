import { tool } from "@langchain/core/tools";
import { z } from "zod";


export const checkLendingRates = tool(
  async ({ tokenSymbol, protocol }) => {
    console.log(
      `[TOOL] Fetching ${protocol} lending rates for ${tokenSymbol}...`,
    );
    // mock simulation API
    const data = {
      tokenSymbol,
      protocol,
      supplyAPY: tokenSymbol === "USDT" ? 8.5 : 2.1,
      totalLiquidity: tokenSymbol === "USDT" ? "$120M" : "$45M",
    };
    return JSON.stringify(data);
  },
  {
    name: "check_lending_rates",
    description:
      "Fetch the current supply APY and total liquidity for a specific token on lending protocols.",
    schema: z.object({
      tokenSymbol: z
        .string()
        .describe("The asset ticker, e.g., 'USDT', 'WBNB'"),
      protocol: z
        .enum(["Venus", "Radiant"])
        .describe("The lending protocol to analyze"),
    }),
  },
);

// check AMM pools
export const checkDexPools = tool(
  async ({ pair, dex }) => {
    console.log(`[TOOL] Analyzing pool ${pair} on ${dex}...`);
    // Simulasi respons API
    const data = {
      pair,
      dex,
      apr24h: 34.2,
      volume24h: "$12.5M",
      impermanentLossRisk: "High",
    };
    return JSON.stringify(data);
  },
  {
    name: "check_dex_pools",
    description:
      "Fetch the current 24h APR, volume, and IL risk for a specific trading pair on a DEX.",
    schema: z.object({
      pair: z.string().describe("Trading pair, e.g., 'WBNB/USDT'"),
      dex: z
        .enum(["PancakeSwapV3", "UniswapV3"])
        .describe("The DEX to analyze"),
    }),
  },
);

export const yieldStrategistTools = [checkLendingRates, checkDexPools];
