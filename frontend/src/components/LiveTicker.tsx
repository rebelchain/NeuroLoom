const tickerItems = [
  { label: "VENUS USDT", value: "14.2%", change: "+0.8%", up: true },
  { label: "PANCAKESWAP WBNB", value: "24.1%", change: "+1.2%", up: true },
  { label: "RADIANT USDC", value: "11.5%", change: "-0.3%", up: false },
  { label: "BSC NETWORK", value: "Gas", change: "3 Gwei", up: true },
  { label: "KINZA USDT", value: "16.8%", change: "+2.1%", up: true },
  { label: "ALPACA WBNB", value: "18.4%", change: "+0.5%", up: true },
  { label: "NEUROLOOM TVL", value: "$145.2K", change: "Optimal", up: true },
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
