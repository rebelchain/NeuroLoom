import { type ElementType } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";

interface KPICardProps {
  title: string;
  value: number;
  prefix?: string;
  suffix?: string;
  change?: string;
  changeType?: "positive" | "negative" | "neutral";
  icon: ElementType;
  subtext?: string;
  delay?: number;
}

export function KPICard({
  title,
  value,
  prefix = "",
  suffix = "",
  change,
  changeType = "neutral",
  icon: Icon,
  subtext,
  delay = 0,
}: KPICardProps) {
  // MODIFIKASI: Jika prefix adalah "$", kita gunakan formatCurrency (yang sudah ada $ nya).
  // Jika tidak, biarkan menggunakan toLocaleString() biasa (untuk persen dll).
  const formatted =
    prefix === "$" ? formatCurrency(value) : value.toLocaleString();

  const changeMeta = {
    positive: {
      cls: "bg-success/10 text-success border-success/25",
      Icon: TrendingUp,
    },
    negative: {
      cls: "bg-danger/10 text-danger border-danger/25",
      Icon: TrendingDown,
    },
    neutral: {
      cls: "bg-surface-raised text-gray-400 border-white/10",
      Icon: Minus,
    },
  }[changeType];

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative liquid-glass rounded-2xl p-5 overflow-hidden animate-fade-in-up"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-11 h-11 rounded-xl bg-surface-raised border border-white/10 flex items-center justify-center text-primary group-hover:scale-110 group-hover:border-primary/30 transition-all duration-300 shadow-inner">
            <Icon className="w-5 h-5" strokeWidth={1.75} />
          </div>
          {change && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-xs font-medium font-mono px-2 py-1 rounded-full border",
                changeMeta.cls,
              )}
            >
              <changeMeta.Icon className="w-3 h-3" /> {change}
            </span>
          )}
        </div>
        <div className="text-[28px] font-semibold font-mono tracking-tight gradient-text-numbers">
          {prefix === "$" ? formatted : `${prefix}${formatted}${suffix}`}
        </div>
        <div className="text-sm font-medium text-white mt-1.5">{title}</div>
        {subtext && <div className="text-xs text-gray-500 mt-1">{subtext}</div>}
      </div>
    </div>
  );
}
