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
    <div className="relative -mx-6 overflow-hidden bg-transparent animate-fade-in-up mb-8 pb-4">
      {media?.src && (
        <SectionBackground
          kind={media.kind}
          src={media.src}
          opacity={media.opacity ?? 100}
          grain
          overlay="linear-gradient(to bottom, rgba(10,10,10,0.4), rgba(10,10,10,1))"
        />
      )}

      <div className="relative z-10 px-6 py-8 md:px-10 md:py-10">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div className="max-w-2xl">
            {badge && (
              <div className="inline-flex items-center gap-2 px-3 py-2 mb-2 rounded-[4px] bg-[#121212]/90 border border-[#1f1f1f] hover:border-primary/40 transition-all duration-300 shadow-md backdrop-blur-md">
                <span className="w-1 h-1 rounded-full bg-primary animate-pulse shadow-[0_0_6px_var(--color-primary)]" />
                <span className="text-[9px] uppercase tracking-wider font-semibold text-[#c5c5c5]">
                  {badge}
                </span>
              </div>
            )}

            <h1 className="text-[40px] md:text-[48px] font-medium tracking-tight leading-[1.1] text-[#f5f5f5]">
              {title}{" "}
              {accent && (
                <em className="serif text-[#9a9a9a] font-normal tracking-normal text-[1.05em] ml-1">
                  {accent}
                </em>
              )}
            </h1>
            <p className="text-[14.5px] md:text-[15.5px] text-[#8a8a8a] mt-4 leading-[1.6] max-w-xl">
              {subtitle}
            </p>
          </div>
          {actions && (
            <div className="relative z-10 flex-shrink-0">{actions}</div>
          )}
        </div>
      </div>
    </div>
  );
}
