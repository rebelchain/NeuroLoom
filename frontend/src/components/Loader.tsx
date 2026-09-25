"use client";

import { useEffect, useState } from "react";

const LOADER_WORDS = [
  "Mounting Agent...",
  "Loading The Graph...",
  "Syncing Oracles...",
  "Igniting Core...",
];

export function Loader() {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<"counting" | "fading" | "gone">(
    "counting",
  );

  useEffect(() => {
    document.body.classList.add("locked");

    let current = 0;

    const interval = setInterval(() => {
      current += Math.random() * 0.05 + 0.01;

      if (current >= 1) {
        current = 1;
        clearInterval(interval);
        setPhase("fading");

        setTimeout(() => {
          document.body.classList.remove("locked");
          document.body.classList.add("ready");
          setPhase("gone");
        }, 800); 
      }
      setProgress(current);
    }, 40);

    return () => clearInterval(interval);
  }, []);

  if (phase === "gone") return null;

  const wordIndex = Math.min(
    LOADER_WORDS.length - 1,
    Math.floor(progress * LOADER_WORDS.length),
  );

  return (
    <div
      className="loader flex items-center justify-center pointer-events-none"
      data-done={phase === "fading"}
      aria-hidden="true"
      style={{ transitionDuration: "800ms" }}
    >
      <div className="label absolute left-8 top-8 md:left-12 md:top-12 tracking-widest text-[#00ED64]">
        NEUROLOOM
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        {LOADER_WORDS.map((w, i) => (
          <span
            key={w}
            className="loader-word serif absolute transition-all duration-300"
            style={{
              opacity: i === wordIndex ? 1 : 0,
              transform: `translateY(${i === wordIndex ? 0 : i < wordIndex ? -20 : 20}px)`,
            }}
          >
            {w}
          </span>
        ))}
      </div>

      <div className="loader-count tnum absolute bottom-8 right-8 text-[#f5f5f5] text-6xl md:bottom-12 md:right-12">
        {Math.round(progress * 100)
          .toString()
          .padStart(3, "0")}
      </div>

      <div className="loader-rail">
        <div
          className="loader-fill"
          style={{
            transform: `scaleX(${progress})`,
            transition: "transform 0.1s linear",
          }}
        />
      </div>
    </div>
  );
}
