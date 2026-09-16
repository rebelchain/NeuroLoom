import type { ReactNode } from "react";
import { useSectionReveal } from "../lib/useSectionReveal";

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  desc: string;
  accent: string;
  delay: string;
  featured?: boolean;
  bars?: number[];
}

export function FeatureCard({
  icon,
  title,
  desc,
  accent,
  delay,
  featured,
  bars,
}: FeatureCardProps) {
  const { ref, visible } = useSectionReveal();
  return (
    <div
      ref={ref}
      className={`group relative liquid-glass rounded-2xl p-8 transition-all duration-500 overflow-hidden ${featured ? "md:row-span-2 md:flex md:flex-col md:justify-center" : ""} ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: delay }}
    >
      <div
        className={`absolute inset-0 bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
      />
      <div className="relative z-10">
        <div className="w-14 h-14 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-center text-2xl mb-6 group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300 shadow-inner">
          {icon}
        </div>
        {featured && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-[11px] font-medium mb-4">
            <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />{" "}
            AI Agent Active
          </div>
        )}
        <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{desc}</p>
        {featured ? (
          <div className="mt-6 h-2 rounded-full bg-white/5 overflow-hidden">
            <div className="h-full w-4/5 bg-gradient-to-r from-primary to-info rounded-full" />
          </div>
        ) : (
          bars && (
            <div className="mt-6 flex items-end gap-1.5 h-10">
              {bars.map((h, i) => (
                <div
                  key={i}
                  className="w-2 mx-auto rounded-t-md bg-gradient-to-t from-primary/30 to-primary/70 transition-all duration-500 group-hover:from-primary/60 group-hover:to-info"
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
