import type { ReactNode } from "react";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  accent?: string;
  delay: string;
  featured?: boolean;
  bars?: number[];
}

export function FeatureCard({
  icon,
  title,
  desc,
  delay,
  featured,
  bars,
}: FeatureCardProps) {
  return (
    <div
      className={`group relative border border-[#1f1f1f] bg-[#0a0a0a] rounded-2xl p-8 transition-all duration-500 overflow-hidden hover:border-primary/50 ${
        featured ? "md:row-span-2 md:flex md:flex-col md:justify-center" : ""
      }`}
      style={{ transitionDelay: delay }}
    >
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-xl border border-[#1f1f1f] bg-[#121212] flex items-center justify-center text-2xl mb-6 group-hover:border-primary transition-all duration-300">
          {icon}
        </div>

        {featured && (
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#121212] border border-[#1f1f1f] rounded-full text-primary text-[10px] uppercase font-mono tracking-widest mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Agentic Workflow
          </div>
        )}

        <h3 className="text-lg font-semibold text-[#f5f5f5] mb-3.5">{title}</h3>
        <p className="text-sm text-[#8a8a8a] leading-relaxed">{desc}</p>

        {featured ? (
          <div className="mt-8 h-1.5 w-full bg-[#1f1f1f] rounded-full overflow-hidden">
            <div className="h-full w-4/5 bg-primary rounded-full transition-all duration-1000 group-hover:w-full" />
          </div>
        ) : (
          bars && (
            <div className="mt-6 flex items-end gap-1.5 h-10">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-2 mx-auto bg-[#1f1f1f] rounded-t-sm transition-all duration-500 group-hover:bg-primary"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
