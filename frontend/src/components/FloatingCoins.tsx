import { useRef } from "react";

const coins = [
  {
    src: "/coins/Ethereum.mp4",
    base: "top-[12%] left-[8%]",
    size: "w-16 h-16",
    dur: "9s",
    delay: "0s",
  },
  {
    src: "/coins/Bitcoin.mp4",
    base: "top-[18%] right-[10%]",
    size: "w-20 h-20",
    dur: "11s",
    delay: "1.5s",
  },
  {
    src: "/coins/USDC.mp4",
    base: "top-[40%] left-[3%]",
    size: "w-14 h-14",
    dur: "10s",
    delay: "0.8s",
  },
  {
    src: "/coins/Tether.mp4",
    base: "top-[45%] right-[4%]",
    size: "w-16 h-16",
    dur: "12s",
    delay: "2s",
  },
  {
    src: "/coins/Bitcoin.mp4",
    base: "bottom-[20%] left-[14%]",
    size: "w-14 h-14",
    dur: "9s",
    delay: "3s",
  },
  {
    src: "/coins/Ethereum.mp4",
    base: "bottom-[15%] right-[16%]",
    size: "w-16 h-16",
    dur: "10s",
    delay: "1s",
  },
];

const centers = [
  { x: 8, y: 20 },
  { x: 90, y: 18 },
  { x: 3, y: 42 },
  { x: 96, y: 48 },
  { x: 14, y: 70 },
  { x: 84, y: 72 },
];

export function FloatingCoins() {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden pointer-events-none z-0"
      aria-hidden
      onMouseMove={(e) => {
        const rect = containerRef.current?.getBoundingClientRect();
        if (!rect) return;
        const nx = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const ny = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        const children = containerRef.current?.children;
        if (!children) return;
        for (let i = 0; i < children.length; i++) {
          const el = children[i] as HTMLElement;
          const c = centers[i % centers.length];
          const dx = nx * 30;
          const dy = ny * 24;
          el.style.setProperty("--mx", `${dx}px`);
          el.style.setProperty("--my", `${dy}px`);
          void c;
        }
      }}
    >
      {coins.map((c, i) => (
        <div key={i} className={`absolute ${c.base} ${c.size} hidden md:block`}>
          <div
            className="h-full w-full"
            style={{ transform: "translate(var(--mx,0), var(--my,0))" }}
          >
            <div
              className="h-full w-full opacity-30"
              style={{
                animation: `float ${c.dur} ease-in-out infinite`,
                animationDelay: c.delay,
              }}
            >
              <video
                autoPlay
                loop
                muted
                playsInline
                className="h-full w-full rounded-full object-cover"
              >
                <source src={c.src} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
