import { tool } from "@langchain/core/tools";
import { z } from "zod";


export const checkPoolDepth = tool(
  async ({ pair, dex }) => {
    console.log(`[TOOL] Checking liquidity depth for ${pair} on ${dex}...`);
  
    const data = {
      pair,
      dex,
      totalLiquidityUsd: pair.includes("WBNB") ? 45000000 : 2000000,
      liquidityDepthMinus2Percent: pair.includes("WBNB") ? "$1.2M" : "$50K",
      status: pair.includes("WBNB") ? "HEALTHY" : "THIN_LIQUIDITY",
    };
    return JSON.stringify(data);
  },
  {
    name: "check_pool_depth",
    description:
      "Fetch the total liquidity and -2% depth for a trading pair to assess manipulation risks.",
    schema: z.object({
      pair: z.string().describe("Trading pair, e.g., 'WBNB/USDT'"),
      dex: z.enum(["PancakeSwapV3", "Biswap"]).describe("The DEX to analyze"),
    }),
  },
);

export const simulateTradeSlippage = tool(
  async ({ pair, tradeSizeUsd }) => {
    console.log(
      `[TOOL] Simulating slippage for a $${tradeSizeUsd} trade on ${pair}...`,
    );
    // Simulasi kalkulasi slippage on-chain
    let estimatedSlippage = 0.05; 
    if (tradeSizeUsd > 10000) estimatedSlippage = 0.15;
    if (tradeSizeUsd > 100000) estimatedSlippage = 1.2;

    const data = {
      pair,
      tradeSizeUsd,
      estimatedSlippagePercent: estimatedSlippage,
      isSafeToTrade: estimatedSlippage < 0.5,
    };
    return JSON.stringify(data);
  },
  {
    name: "simulate_trade_slippage",
    description:
      "Simulate a trade to calculate the estimated price impact (slippage) in percentage.",
    schema: z.object({
      pair: z.string().describe("Trading pair, e.g., 'WBNB/USDT'"),
      tradeSizeUsd: z
        .number()
        .describe("The estimated size of the trade in USD"),
    }),
  },
);

export const liquidityRiskTools = [checkPoolDepth, simulateTradeSlippage];
