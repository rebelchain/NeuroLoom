import type { ReactNode } from "react";
import { useSectionReveal } from "../lib/useSectionReveal";

interface BenefitRowProps {
  icon: ReactNode;
  title: string;
  desc: string;
  delay: string;
}

export function BenefitRow({ icon, title, desc, delay }: BenefitRowProps) {
  const { ref, visible } = useSectionReveal();
  return (
    <div
      ref={ref}
      className={`flex items-start gap-4 liquid-glass rounded-xl p-5 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}
      style={{ transitionDelay: delay }}
    >
      <div className="w-10 h-10 rounded-xl bg-white/[0.02] border border-white/10 flex items-center justify-center shrink-0 shadow-inner">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-white mb-1">{title}</div>
        <div className="text-xs text-gray-400 leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
