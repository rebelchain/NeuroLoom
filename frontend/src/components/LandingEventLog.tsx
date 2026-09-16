import { useSectionReveal } from "../lib/useSectionReveal";

export interface LandingEvent {
  msg: string;
  type?: "pass" | "reject" | "mint" | "info";
}

interface EventLogProps {
  events: LandingEvent[];
}

export function LandingEventLog({ events }: EventLogProps) {
  const { ref, visible } = useSectionReveal(0.3);
  const color = (t?: "pass" | "reject" | "mint" | "info") =>
    t === "pass"
      ? "text-success"
      : t === "reject"
        ? "text-error"
        : t === "mint"
          ? "text-info"
          : "text-gray-400";

  return (
    <div
      ref={ref}
      className={`transition-opacity duration-500 text-left ${visible ? "opacity-100" : "opacity-0"}`}
    >
      <div className="rounded-xl bg-[#04060d]/80 border border-white/10 px-5 py-4 font-mono text-xs leading-7 shadow-inner">
        {events.map((e, i) => (
          <div
            key={i}
            className="flex items-start gap-2 animate-fade-in-up"
            style={{ animationDelay: `${200 + i * 320}ms` }}
          >
            <span className="text-gray-600 select-none" aria-hidden>
              ›
            </span>
            <span className={color(e.type)}>{e.msg}</span>
          </div>
        ))}
        <div
          className="flex items-center gap-2 animate-fade-in-up"
          style={{ animationDelay: `${200 + events.length * 320}ms` }}
        >
          <span className="text-gray-600 select-none" aria-hidden>
            ›
          </span>
          <span className="text-primary inline-block animate-pulse">▍</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        <span className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Every execution verifiable on BSC · BscScan
        </span>
      </div>
    </div>
  );
}
