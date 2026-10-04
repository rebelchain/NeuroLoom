import { tool } from "@langchain/core/tools";
import { z } from "zod";

/**
 * TOKEN SORTING
 * PancakeSwap V3 requires token0 to have a hex address lower than token1.
 * This function automatically swaps the tokens and amounts so that the AI ​​does not need to intervene.
 */
function sortTokens(tokenA: string, tokenB: string) {
  const lowerA = tokenA.toLowerCase();
  const lowerB = tokenB.toLowerCase();
  if (lowerA < lowerB) {
    return { token0: lowerA, token1: lowerB, isReversed: false };
  }
  return { token0: lowerB, token1: lowerA, isReversed: true };
}

/**
 * TICK MATH
 * The price in V3 is calculated using an exponential formula: Price = 1.0001 ^ Tick.
 * To find the Tick from the Price, we use a logarithm with a base of 1.0001.
 */
function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

/**
 * RULE 3: TICK SPACING
 * For the MEDIUM Fee Tier (2500 / 0.25%), `tickLower` and `tickUpper` MUST be multiples of 50.
 * Otherwise, the smart contract will immediately revert the transaction.
 */
function nearestUsableTick(tick: number, tickSpacing: number): number {
  return Math.round(tick / tickSpacing) * tickSpacing;
}

export const calculateV3LpParams = tool(
  async ({
    tokenA,
    tokenB,
    currentPrice,
    atrVolatilityPercent,
    marketDirection,
    amountADesiredWei,
    amountBDesiredWei,
  }) => {

    const { token0, token1, isReversed } = sortTokens(tokenA, tokenB);

    // 2. Koreksi Harga Base
    const actualPrice = isReversed ? 1 / currentPrice : currentPrice;
    const currentTick = priceToTick(actualPrice);

    // 3. Kalkulasi Volatility Bands (Rentang Harga Dasar)
    // Di V3, pergerakan harga 1% setara dengan ~100 tick.
    const baseTickSpread = Math.floor(atrVolatilityPercent * 100);

    // 4. Directional Bias (Manipulasi Rentang Asimetris)
    let lowerSpread = baseTickSpread;
    let upperSpread = baseTickSpread;

    if (marketDirection === "BULLISH") {
      // Harga diproyeksikan naik: Pertahankan WBNB lebih lama dengan melempar batas atas sangat jauh.
      lowerSpread = Math.floor(baseTickSpread * 0.2); // Jarak bawah sangat ketat (Cut loss cepat jika salah)
      upperSpread = Math.floor(baseTickSpread * 2.0); // Jarak atas 2x lipat lebih luas
    } else if (marketDirection === "BEARISH") {
      // Harga diproyeksikan turun: Amankan ke USDT lebih awal dengan melempar batas bawah jauh.
      lowerSpread = Math.floor(baseTickSpread * 2.0); // Jarak bawah 2x lipat (akumulasi perlahan)
      upperSpread = Math.floor(baseTickSpread * 0.2); // Jarak atas sangat ketat
    }

    // 5. Pembulatan Sesuai Aturan Tick Spacing PancakeSwap (Fee 0.25% = Spacing 50)
    const TICK_SPACING = 50;
    const tickLower = nearestUsableTick(
      currentTick - lowerSpread,
      TICK_SPACING,
    );
    const tickUpper = nearestUsableTick(
      currentTick + upperSpread,
      TICK_SPACING,
    );

    const amount0 = isReversed ? amountBDesiredWei : amountADesiredWei;
    const amount1 = isReversed ? amountADesiredWei : amountBDesiredWei;

    console.log(
      `[LP MATH] Asymmetric Ticks generated based on ${marketDirection} bias: [${tickLower} to ${tickUpper}]`,
    );

    return JSON.stringify(
      {
        instruction:
          "CRITICAL: Pass these exact ticks and amounts to the next mathematical tool or execution step.",
        token0,
        token1,
        fee: 2500,
        tickLower,
        tickUpper,
        amount0DesiredWei: amount0,
        amount1DesiredWei: amount1,
      },
      null,
      2,
    );
  },
  {
    name: "calculate_v3_lp_params",
    description:
      "Calculates mathematically safe and directional-biased parameters for V3 Concentrated Liquidity. Use this BEFORE simulating IL or providing liquidity.",
    schema: z.object({
      tokenA: z.string().describe("Address of the first token (e.g., WBNB)"),
      tokenB: z.string().describe("Address of the second token (e.g., USDT)"),
      currentPrice: z
        .number()
        .describe("Current price of Token A in terms of Token B"),
      atrVolatilityPercent: z
        .number()
        .describe(
          "Market volatility percentage to determine base range width (e.g., 5.0 for a 5% move)",
        ),
      marketDirection: z
        .enum(["BULLISH", "BEARISH", "SIDEWAYS"])
        .describe(
          "The trend direction provided by the Yield Strategist or Orchestrator",
        ),
      amountADesiredWei: z
        .string()
        .describe("Allocated amount of Token A in WEI"),
      amountBDesiredWei: z
        .string()
        .describe("Allocated amount of Token B in WEI"),
    }),
  },
);


function tickToPrice(tick: number): number {
  return Math.pow(1.0001, tick);
}

// Helper: Inti Matematika Nilai Posisi V3
function calculateV3PositionValue(tickLower: number, tickUpper: number) {
  const priceA = tickToPrice(tickLower);
  const priceB = tickToPrice(tickUpper);

  const getX = (p: number) => {
    if (p < priceA)
      return (
        (Math.sqrt(priceB) - Math.sqrt(priceA)) /
        (Math.sqrt(priceA) * Math.sqrt(priceB))
      );
    if (p > priceB) return 0;
    return (
      (Math.sqrt(priceB) - Math.sqrt(p)) / (Math.sqrt(p) * Math.sqrt(priceB))
    );
  };

  const getY = (p: number) => {
    if (p < priceA) return 0;
    if (p > priceB) return Math.sqrt(priceB) - Math.sqrt(priceA);
    return Math.sqrt(p) - Math.sqrt(priceA);
  };

  return { getX, getY };
}

export const simulateILRisk = tool(
  async ({ currentPrice, tickLower, tickUpper, expectedVolatilityDecimal }) => {
    const priceDown = currentPrice * (1 - expectedVolatilityDecimal);
    const priceUp = currentPrice * (1 + expectedVolatilityDecimal);


    const { getX, getY } = calculateV3PositionValue(tickLower, tickUpper);


    const x0 = getX(currentPrice);
    const y0 = getY(currentPrice);

    const calculateIL = (newPrice: number) => {
      const x1 = getX(newPrice);
      const y1 = getY(newPrice);

      const valueIfHeld = x0 * newPrice + y0;
      const valueInLP = x1 * newPrice + y1;

      return valueInLP / valueIfHeld - 1;
    };

    const ilDown = calculateIL(priceDown);
    const ilUp = calculateIL(priceUp);

 
    const rDown = priceDown / currentPrice;
    const v2IlDown = (2 * Math.sqrt(rDown)) / (1 + rDown) - 1;
    const amplificationFactor =
      v2IlDown !== 0 ? (ilDown / v2IlDown).toFixed(2) : "0";

    const report = `
[IL RISK SIMULATION REPORT]
- Simulated Volatility: ±${(expectedVolatilityDecimal * 100).toFixed(1)}%
- Impermanent Loss if price drops: ${(ilDown * 100).toFixed(2)}%
- Impermanent Loss if price rises: ${(ilUp * 100).toFixed(2)}%
- V3 Amplification Factor vs V2: ${amplificationFactor}x

RISK OFFICER DIRECTIVE:
If the absolute IL (e.g., ${(ilDown * 100).toFixed(2)}%) is significantly larger than the expected APY yield from trading fees over your timeframe, providing liquidity is mathematically detrimental. 
If price breaches tickLower, position becomes 100% volatile asset. If it breaches tickUpper, position becomes 100% stablecoin.
`;

    console.log(report);
    return report;
  },
  {
    name: "simulate_il_risk",
    description:
      "Calculates the exact Impermanent Loss percentage for a V3 liquidity position given a projected price move. Use this to validate if LPing is mathematically safer than holding.",
    schema: z.object({
      currentPrice: z.number().describe("Current market price of Token 0"),
      tickLower: z
        .number()
        .describe("Lower tick bound of the proposed LP range"),
      tickUpper: z
        .number()
        .describe("Upper tick bound of the proposed LP range"),
      expectedVolatilityDecimal: z
        .number()
        .describe("Expected price move in decimal (e.g., 0.10 for a 10% move)"),
    }),
  },
);