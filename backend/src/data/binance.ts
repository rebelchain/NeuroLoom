export interface MarketData {
  symbol: string;
  price: number;
  priceChangePercent: number;
  volume: number;
}

export async function fetchBinanceData(
  symbol: string = "BNBUSDT",
): Promise<MarketData> {
  try {
    // Using CoinGecko because the Binance API is blocked.
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true",
    );
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = await response.json();

    const scenario = process.env.MOCK_SCENARIO || "PRODUCTION";

    switch (scenario) {
      case "HIGH_YIELD_ENTRY":
        console.log(
          "⚠️ [SCENARIO TEST] Market Stabilized + High Volume -> Safe entry for AMM Yield Pairing",
        );
        return {
          symbol,
          price: data.binancecoin.usd,
          priceChangePercent: -1.2,
          volume: 100000000,
        };

      case "IL_MITIGATION_EXIT":
        console.log(
          "⚠️ [SCENARIO TEST] High Volatility Detected -> Triggering Impermanent Loss Mitigation.",
        );
        return {
          symbol,
          price: data.binancecoin.usd,
          priceChangePercent: -20.0,
          volume: 80000000,
        };

      case "LIQUIDITY_VACUUM":
        console.log(
          "⚠️ [SCENARIO TEST] Market Crash + ZERO Volume -> Triggers a HOLD (Safety)",
        );
        return {
          symbol,
          price: data.binancecoin.usd,
          priceChangePercent: -10.5,
          volume: 0,
        };

      default: // "PRODUCTION"
        return {
          symbol,
          price: data.binancecoin.usd,
          priceChangePercent: data.binancecoin.usd_24h_change,
          volume: 0,
        };
    }
  } catch (error) {
    console.error(`❌ Gagal mengambil data pasar untuk ${symbol}:`, error);
    throw error;
  }
}
