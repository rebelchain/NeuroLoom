interface ProtocolCardProps {
  image: string;
  name: string;
  desc: string;
  metric: string;
  sub: string;
  active: boolean;
  onClick: () => void;
}

export function ProtocolCard({
  image,
  name,
  desc,
  metric,
  sub,
  active,
  onClick,
}: ProtocolCardProps) {
  return (
    <button
      onClick={onClick}
      className={`liquid-glass rounded-xl group cursor-pointer text-left transition-all duration-300 focus:outline-none relative overflow-hidden bg-white/[0.02] border border-white/5 ${active ? "ring-1 ring-primary/50 border-primary/30" : "hover:bg-white/[0.04]"}`}
    >
      <div className="relative h-24 shrink-0 overflow-hidden bg-black/40 flex items-center justify-center">
        {/* Fallback gradient jika gambar belum ada */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-[#04060d] opacity-50" />
        <span
          className={`absolute top-2 right-2 text-xs font-mono px-2 py-0.5 rounded-full backdrop-blur-md ${active ? "bg-primary/20 text-primary border border-primary/30" : "bg-black/40 text-gray-400 border border-white/10"}`}
        >
          {metric}
        </span>
        {/* Jika kamu punya logo, kamu bisa memakai <img src={image} ... /> di sini */}
        <span className="text-xl font-black text-white/20 tracking-widest uppercase z-10">
          {name}
        </span>
      </div>
      <div className="relative z-10 p-5 pt-3">
        <div className="text-sm font-semibold text-white mb-1">{name}</div>
        <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
        <div
          className={`text-[10px] text-primary mt-2 font-medium transition-all duration-300 ${active ? "opacity-100" : "opacity-0 group-hover:opacity-60"}`}
        >
          {sub}
        </div>
      </div>
    </button>
  );
}
