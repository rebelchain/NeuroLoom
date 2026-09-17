const tickerItems = [
  { label: "VENUS USDT", value: "7.84%", change: "+0.2%", up: true },
  { label: "PANCAKESWAP WBNB/USDT", value: "22.4%", change: "+1.5%", up: true },
  { label: "RADIANT USDC", value: "10.2%", change: "-0.4%", up: false },
  { label: "BSC GAS PRICE", value: "3.1 Gwei", change: "Stable", up: true },
  { label: "KINZA USDT", value: "11.2%", change: "+0.8%", up: true },
  { label: "ALPACA WBNB", value: "9.1%", change: "+0.1%", up: true },
  { label: "AI ROUTING SPREAD", value: "0.15%", change: "Optimal", up: true },
];
  
export function LiveTicker() {
  return (
    <div className="relative overflow-hidden border-y border-white/5 bg-white/[0.01] backdrop-blur-sm z-20">
      <div className="flex w-max animate-[marquee_40s_linear_infinite] hover:[animation-play-state:paused]">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div key={i} className="flex items-center gap-2 px-8 py-3 shrink-0">
            <span
              className={`w-1.5 h-1.5 rounded-full ${item.up ? "bg-success" : "bg-warning"} animate-pulse`}
            />
            <span className="text-xs font-semibold text-gray-500 font-mono">
              {item.label}
            </span>
            <span className="text-xs font-mono text-white">{item.value}</span>
            <span
              className={`text-xs font-mono ${item.up ? "text-success" : "text-warning"}`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
