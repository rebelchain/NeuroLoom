const tickerItems = [
  { label: "VENUS USDT", value: "7.84%", change: "+0.2%", up: true },
  { label: "PANCAKESWAP WBNB/USDT", value: "22.4%", change: "+1.5%", up: true },
  { label: "RADIANT USDT", value: "10.2%", change: "-0.4%", up: false },
  { label: "BSC GAS PRICE", value: "3.1 Gwei", change: "Stable", up: true },
  { label: "KINZA USDT", value: "11.2%", change: "+0.8%", up: true },
  { label: "ALPACA WBNB", value: "9.1%", change: "+0.1%", up: true },
  { label: "AI ROUTING SPREAD", value: "0.15%", change: "Optimal", up: true },
];

export function LiveTicker() {
  return (
    <div className="relative overflow-hidden border-y border-[#1f1f1f] bg-[#0a0a0a] z-20">
      {/* SUNTIKAN KEYFRAMES ANIMASI */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite;
        }
      `}</style>

      <div className="flex w-max animate-marquee hover:[animation-play-state:paused]">
        {[...tickerItems, ...tickerItems].map((item, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-8 py-3 shrink-0 border-r border-[#1f1f1f]"
          >
            <span
              className={`w-1.5 h-1.5 ${item.up ? "bg-primary animate-pulse" : "bg-[#ff5f5f]"}`}
            />
            <span className="text-[11px] font-semibold text-[#8a8a8a] uppercase tracking-widest font-mono">
              {item.label}
            </span>
            <span className="text-xs font-mono tnum text-[#f5f5f5]">
              {item.value}
            </span>
            <span
              className={`text-[10px] font-mono tnum ${item.up ? "text-primary" : "text-[#ff5f5f]"}`}
            >
              {item.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
