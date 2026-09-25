import { type ReactNode } from "react";
import { SectionBackground } from "@/components/SectionBackground";

type PageHeroProps = {
  badge?: string;
  title: string;
  accent?: string;
  subtitle: string;
  media?: { kind: "video" | "image"; src: string; opacity?: number };
  actions?: ReactNode;
};

export function PageHero({
  badge,
  title,
  accent,
  subtitle,
  media,
  actions,
}: PageHeroProps) {
  return (
    <div className="relative -mx-6 overflow-hidden bg-[#121212] border-b border-[#1f1f1f] animate-fade-in-up mb-8">
      {media?.src && (
        <SectionBackground
          kind={media.kind}
          src={media.src}
          opacity={media.opacity ?? 100}
          grain
          overlay="linear-gradient(to bottom, rgba(10,10,10,0.8), rgba(10,10,10,0.95))"
        />
      )}

      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-[#1f1f1f] bg-[#1a1a1a] text-[10px] uppercase tracking-[0.18em] text-[#8a8a8a] mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                {badge}
              </div>
            )}

            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-[#f5f5f5]">
              {title}{" "}
              {accent && (
                <span className="serif text-primary ml-2 font-normal">
                  {accent}
                </span>
              )}
            </h1>
            <p className="text-sm md:text-base text-[#c5c5c5] mt-2.5 leading-relaxed">
              {subtitle}
            </p>
          </div>
          {actions && <div className="relative z-10">{actions}</div>}
        </div>
      </div>
    </div>
  );
}
