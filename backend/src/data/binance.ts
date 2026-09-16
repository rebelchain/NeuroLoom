export interface MarketData {
  symbol: string;
  price: number;
  priceChangePercent: number;
  volume: number; // CoinGecko simple/price tidak memberikan volume, kita mock untuk MVP
}

export async function fetchBinanceData(
  symbol: string = "BNBUSDT",
): Promise<MarketData> {
  try {
    // Menggunakan CoinGecko sebagai alternatif yang tidak diblokir di Indonesia
    // binancecoin = BNB
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd&include_24hr_change=true",
    );

    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();

    // return {
    //   symbol: symbol,
    //   price: data.binancecoin.usd,
    //   priceChangePercent: data.binancecoin.usd_24h_change,
    //   volume: 0, // Tidak relevan untuk strategi BPS dasar kita saat ini
    // };

    // [MOCK UNTUK TESTING]: Seolah-olah harga WBNB hancur -10% hari ini (Sinyal Beli Kuat!)
    return {
      symbol: symbol,
      price: data.binancecoin.usd,
      priceChangePercent: -10.5,
      volume: 0,
    };
  } catch (error) {
    console.error(`❌ Gagal mengambil data pasar untuk ${symbol}:`, error);
    throw error;
  }
}
