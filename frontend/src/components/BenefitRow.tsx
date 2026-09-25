import type { ReactNode } from "react";

interface BenefitRowProps {
  icon: ReactNode;
  title: string;
  desc: string;
  delay: string;
}

export function BenefitRow({ icon, title, desc, delay }: BenefitRowProps) {
  return (
    <div
      className="group flex items-start gap-4 border border-[#1f1f1f] bg-[#121212] p-5 transition-all duration-500 hover:border-primary/50"
      style={{ transitionDelay: delay }}
    >
      <div className="w-10 h-10 border border-[#1f1f1f] bg-[#0a0a0a] flex items-center justify-center shrink-0 group-hover:border-primary transition-colors">
        {icon}
      </div>
      <div>
        <div className="text-sm font-semibold text-[#f5f5f5] mb-1">{title}</div>
        <div className="text-xs text-[#8a8a8a] leading-relaxed">{desc}</div>
      </div>
    </div>
  );
}
