interface MetricCardProps {
  label: string;
  value: string;
  detail: string;
  accent?: "buy" | "sell" | "default";
}

export function MetricCard({
  label,
  value,
  detail,
  accent = "default",
}: MetricCardProps) {
  // Menentukan warna garis atas berdasarkan tipe accent
  const accentColor =
    accent === "buy"
      ? "bg-success"
      : accent === "sell"
        ? "bg-error"
        : "bg-primary";

  return (
    <div className="relative p-6 rounded-2xl bg-[#0b1120]/80 border border-white/[0.05] backdrop-blur-xl flex flex-col overflow-hidden group hover:border-white/10 transition-colors">
      <div
        className={`absolute top-0 left-0 w-full h-1 ${accentColor} opacity-70`}
      ></div>
      <span className="text-[10px] font-mono text-gray-400 uppercase tracking-[0.2em] mb-2">
        {label}
      </span>
      <strong className="text-3xl font-bold text-white tracking-tight mb-1">
        {value}
      </strong>
      <small className="text-xs text-gray-500 font-medium font-mono">
        {detail}
      </small>
    </div>
  );
}
