import { tool } from "@langchain/core/tools";
import { z } from "zod";

export const calculateOptimalAllocation = tool(
  async ({ expectedApy, riskFreeRate, volatility, currentTvlWei }) => {
    const numerator = expectedApy - riskFreeRate;
    const denominator = Math.pow(volatility, 2);
    let kelly = denominator > 0 ? numerator / denominator : 0;

    if (kelly < 0) kelly = 0;

    let fractionalKelly = kelly * 0.25;

    if (fractionalKelly > 0.2) fractionalKelly = 0.2;

    const tvl = BigInt(currentTvlWei);
    const allocationMultiplier = BigInt(Math.floor(fractionalKelly * 10000));
    const allocationWei = (tvl * allocationMultiplier) / 10000n;

    return `[QUANT TOOL] OPTIMAL ALLOCATION: ${allocationWei.toString()} WEI (${(fractionalKelly * 100).toFixed(2)}% of TVL). You MUST use this exact WEI amount in your execution tool.`;
  },
  {
    name: "calculate_optimal_allocation",
    description:
      "Calculates the mathematically safest trade size in WEI using Quarter Kelly Criterion. Call this BEFORE executing any swap or deposit.",
    schema: z.object({
      expectedApy: z
        .number()
        .describe("Expected annual yield in decimal (e.g., 0.22 for 22%)"),
      riskFreeRate: z
        .number()
        .describe(
          "Risk-free rate from lending protocol in decimal (e.g., 0.05 for 5%)",
        ),
      volatility: z
        .number()
        .describe(
          "Annualized market volatility in decimal (e.g., 0.40 for 40%)",
        ),
      currentTvlWei: z
        .string()
        .describe("The total assets of the vault in WEI as string"),
    }),
  },
);
