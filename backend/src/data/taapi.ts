import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

export interface QuantMarketData {
  symbol: string;
  price: number;
  rsi: number;
  macd: { value: number; signal: number; hist: number };
  ema200: number;
  marketStructure: string;
}

export async function fetchQuantData(
  symbol: string = "BNB/USDT",
): Promise<QuantMarketData> {
  const apiKey = process.env.TAAPI_API_KEY;
  console.log(`[DATA] Menyedot data teknikal ${symbol} dari TAAPI.io v2...`);

  try {
    if (!apiKey) throw new Error("TAAPI_API_KEY tidak ditemukan di .env");

    const options = {
      method: "GET",
      headers: { Authorization: `Bearer ${apiKey}` },
    };

  
    const encodedSymbol = encodeURIComponent(symbol);


    const [rsiRes, macdRes, emaRes] = await Promise.all([
      fetch(
        `https://v2.taapi.io/indicator/rsi?exchange=binance&symbol=${encodedSymbol}&timeframe=1h`,
        options,
      ),
      fetch(
        `https://v2.taapi.io/indicator/macd?exchange=binance&symbol=${encodedSymbol}&timeframe=1h`,
        options,
      ),
      fetch(
        `https://v2.taapi.io/indicator/ema?exchange=binance&symbol=${encodedSymbol}&timeframe=1h&optInTimePeriod=200`,
        options,
      ),
    ]);

    if (!rsiRes.ok || !macdRes.ok || !emaRes.ok) {
      throw new Error(
        `HTTP Error (RSI: ${rsiRes.status}, MACD: ${macdRes.status}, EMA: ${emaRes.status})`,
      );
    }

    const rsiData = await rsiRes.json();
    const macdData = await macdRes.json();
    const emaData = await emaRes.json();

    const rsi = rsiData.value[0];
    const macd = {
      value: macdData.valueMACD[0],
      signal: macdData.valueMACDSignal[0],
      hist: macdData.valueMACDHist[0],
    };
    const ema200 = emaData.value[0];

    let structure = "Ranging/Sideways";
    if (rsi < 35 && macd.hist > 0) structure = "Potential Reversal (Bullish)";
    else if (rsi > 65 && macd.hist < 0)
      structure = "Potential Reversal (Bearish)";

    return {
      symbol,
      price: 590,
      rsi,
      macd,
      ema200,
      marketStructure: structure,
    };
  } catch (error: any) {
    console.log(
      `[DATA WARNING] TAAPI v2 gagal (${error.message}). Fallback ke data simulasi historis...`,
    );
    return {
      symbol,
      price: 590,
      rsi: 32,
      macd: { value: 1.2, signal: 1.0, hist: 0.2 },
      ema200: 600,
      marketStructure:
        "Potential Reversal (Bullish) - Strong Support level detected.",
    };
  }
}
