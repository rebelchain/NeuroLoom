"use client";

import { useEffect, useRef } from "react";

const WORD = "NEUROLOOM";
const LETTERS = WORD.split("");


const REACH = 2.6;

function clamp01(v: number) {
  return Math.min(1, Math.max(0, v));
}

function letterGlow(
  pointerX: number,
  pointerY: number,
  letter: { centerX: number; width: number },
  band: { centerY: number; halfHeight: number },
) {
  const beyond = Math.abs(pointerY - band.centerY) - band.halfHeight;
  const vertical = clamp01(1 - Math.max(0, beyond) / (band.halfHeight * 1.2));
  if (vertical === 0) return 0;

  const away = Math.abs(pointerX - letter.centerX) / Math.max(letter.width, 1);
  const horizontal = clamp01(1 - away / REACH);

  return horizontal * horizontal * vertical;
}

export function HeroWordmark() {
  const glowRef = useRef<HTMLDivElement>(null);
  const realRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const glowNode = glowRef.current;
    const realNode = realRef.current;
    if (!glowNode || !realNode) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let pointerX = -10000;
    let pointerY = -10000;
    let animationFrame = 0;

    const eased = new Float32Array(LETTERS.length);
    const painted = new Float32Array(LETTERS.length).fill(-1);

    const onPointerMove = (event: PointerEvent) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
    };

    const animate = () => {
      const box = realNode.getBoundingClientRect();
      const band = {
        centerY: box.top + box.height / 2,
        halfHeight: box.height / 2,
      };
      const glowLetters = glowNode.children;
      const realLetters = realNode.children;

      for (let i = 0; i < LETTERS.length; i++) {
        const node = realLetters[i] as HTMLElement | undefined;
        if (!node) continue;
        const rect = node.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;

        const target = letterGlow(
          pointerX,
          pointerY,
          { centerX, width: rect.width },
          band,
        );

        eased[i] += (target - eased[i]) * (target > eased[i] ? 0.22 : 0.07);
        const value = Math.round(eased[i] * 20) / 20;

        if (painted[i] !== value) {
          painted[i] = value;
          (glowLetters[i] as HTMLElement).style.opacity = value.toFixed(2);

          node.style.color = `rgba(255,255,255,${(0.9 + 0.1 * value).toFixed(2)})`;
        }
      }

      animationFrame = requestAnimationFrame(animate);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: true });
    animationFrame = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("pointermove", onPointerMove);
    };
  }, []);

  return (
    <div className="relative grid">
      <div
        ref={glowRef}
        className="font-extrabold text-[clamp(2.6rem,11vw,11.5rem)] tracking-tight leading-none col-start-1 row-start-1"
        style={{
          color: "transparent",
          pointerEvents: "none",
          textShadow:
            "0 0 12px rgba(139, 92, 246, 0.42), 0 0 34px rgba(139, 92, 246, 0.18)",
        }}
        aria-hidden="true"
      >
        {LETTERS.map((letter, i) => (
          <span key={`glow-${i}`} style={{ opacity: 0 }}>
            {letter}
          </span>
        ))}
      </div>

      <h1
        ref={realRef}
        className="font-extrabold text-[clamp(2.6rem,11vw,11.5rem)] tracking-tight leading-none col-start-1 row-start-1"
      >
        {LETTERS.map((letter, i) => (
          <span key={`real-${i}`} style={{ color: "rgba(255,255,255,0.90)" }}>
            {letter}
          </span>
        ))}
      </h1>
    </div>
  );
}
