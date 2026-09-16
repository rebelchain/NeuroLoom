interface StepCardProps {
  step: string;
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}

export function StepCard({
  step,
  title,
  desc,
  active,
  onClick,
}: StepCardProps) {
  return (
    <button
      onClick={onClick}
      className={`relative transition-all duration-500 group text-center focus:outline-none ${active ? "scale-[1.03]" : "opacity-70 hover:opacity-100"}`}
    >
      <div
        className={`relative w-16 h-16 rounded-2xl liquid-glass border flex items-center justify-center font-mono font-bold text-lg mx-auto mb-6 transition-all duration-300 ${active ? "border-primary/40 bg-white/[0.03] shadow-lg shadow-primary/20" : "border-white/10 hover:border-primary/30"}`}
      >
        <span
          className={
            active
              ? "text-primary"
              : "text-gray-400 group-hover:text-white transition-colors"
          }
        >
          {step}
        </span>
        <div
          className={`absolute inset-0 rounded-2xl ${active ? "bg-primary/10 animate-pulse" : "bg-primary/5 opacity-0 group-hover:opacity-100"} transition-opacity duration-300`}
        />
        {active && (
          <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-primary" />
        )}
      </div>
      <h3 className="text-lg font-semibold text-white mb-3">{title}</h3>
      <p className="text-sm text-gray-400 leading-relaxed max-w-xs mx-auto">
        {desc}
      </p>
    </button>
  );
}
