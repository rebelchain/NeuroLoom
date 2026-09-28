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
    formatted =
      prefix === "$" ? formatCurrency(safeValue) : safeValue.toLocaleString();
  } catch (error) {
    formatted = safeValue.toFixed(2);
  }

  const changeMeta = {
    positive: {
      cls: "bg-primary/10 text-primary border-primary/25",
      Icon: TrendingUp,
    },
    negative: {
      cls: "bg-[#ff5f5f]/10 text-[#ff5f5f] border-[#ff5f5f]/25",
      Icon: TrendingDown,
    },
    neutral: {
      cls: "bg-white/[0.03] text-[#8a8a8a] border-white/[0.1]",
      Icon: Minus,
    },
  }[changeType];

  return (
    <div
      style={{ animationDelay: `${delay}ms` }}
      className="group relative rounded-[12px] p-5 border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] animate-fade-in-up hover:border-primary/40 transition-colors overflow-hidden min-w-0"
    >
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-start justify-between mb-5">
          <div className="w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.07] flex items-center justify-center text-primary group-hover:border-primary/70 group-hover:bg-primary/[0.05] transition-colors">
            <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
          </div>
          {change && !isLoading && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-mono px-2.5 py-1 rounded-md border",
                changeMeta.cls,
              )}
            >
              <changeMeta.Icon className="w-3 h-3" /> {change}
            </span>
          )}
        </div>

        <div>
          <div className="h-9 flex items-center mb-1">
            {isLoading ? (
              <div className="flex items-center gap-2 text-[#8a8a8a] animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-[13px] font-mono tracking-widest">
                  SYNCING
                </span>
              </div>
            ) : (
              <div className="text-[26px] font-medium tracking-tight text-[#f5f5f5] tnum truncate">
                {prefix === "$" ? formatted : `${prefix}${formatted}${suffix}`}
              </div>
            )}
          </div>

          <div className="text-[13px] text-[#c5c5c5]">{title}</div>
          {subtext && (
            <div className="text-[11px] text-[#8a8a8a] mt-1.5 truncate">
              {subtext}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
