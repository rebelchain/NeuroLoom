import { type ElementType } from "react";
import { TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
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
  isLoading?: boolean;
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
  isLoading = false,
}: KPICardProps) {
  const safeValue = typeof value === "number" && !isNaN(value) ? value : 0;

  let formatted = safeValue.toString();
  try {
    formatted = prefix === "$" ? formatCurrency(safeValue) : safeValue.toLocaleString();
  } catch (error) {
    formatted = safeValue.toFixed(2);
  }

  const changeMeta = {
    positive: { cls: "bg-primary/10 text-primary border-primary/25", Icon: TrendingUp },
    negative: { cls: "bg-[#ff5f5f]/10 text-[#ff5f5f] border-[#ff5f5f]/25", Icon: TrendingDown },
    neutral: { cls: "bg-[#1a1a1a] text-[#8a8a8a] border-[#1f1f1f]", Icon: Minus },
  }[changeType];

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative bg-[#121212] border border-[#1f1f1f] p-5 overflow-hidden animate-fade-in-up hover:border-primary/50 transition-colors"
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-10 h-10 bg-[#0a0a0a] border border-[#1f1f1f] flex items-center justify-center text-primary group-hover:border-primary transition-colors">
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </div>
          {change && !isLoading && (
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[10px] uppercase tracking-widest font-mono px-2 py-1 border",
                changeMeta.cls,
              )}
            >
              <changeMeta.Icon className="w-3 h-3" /> {change}
            </span>
          )}
        </div>

        <div className="h-9 flex items-center">
          {isLoading ? (
            <div className="flex items-center gap-2 text-[#8a8a8a] animate-pulse">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm font-mono tracking-widest">SYNCING</span>
            </div>
          ) : (
            <div className="text-2xl font-mono tracking-tight text-[#f5f5f5] tnum">
              {prefix === "$" ? formatted : `${prefix}${formatted}${suffix}`}
            </div>
          )}
        </div>

        <div className="text-sm font-medium text-[#c5c5c5] mt-1.5">{title}</div>
        {subtext && (
          <div className="text-[11px] font-mono text-[#8a8a8a] mt-1">
            &gt; {subtext}
          </div>
        )}
      </div>
    </div>
  );
}