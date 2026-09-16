import { useMemo } from "react";
import { Particles, ParticlesProvider } from "@tsparticles/react";
import type { Engine, ISourceOptions } from "@tsparticles/engine";
import { loadSlim } from "@tsparticles/slim";

async function initEngine(engine: Engine) {
  await loadSlim(engine);
}

export function ParticlesBackground() {
  const options: ISourceOptions = useMemo(
    () => ({
      background: { opacity: 0 },
      fullScreen: { enable: false },
      fpsLimit: 60,
      interactivity: {
        events: {
          onHover: { enable: false },
          resize: { enable: true },
        },
      },
      particles: {
        number: { value: 35, density: { enable: true, area: 1000 } },
        color: { value: ["#3b82f6", "#60a5fa", "#aeb9cf"] },
        shape: { type: "circle" },
        opacity: { value: 0.25 },
        size: { value: { min: 1, max: 2.5 } },
        move: {
          enable: true,
          speed: 0.4,
          direction: "none",
          random: true,
          straight: false,
          outModes: { default: "out" },
        },
        links: {
          enable: true,
          distance: 140,
          color: "#60a5fa",
          opacity: 0.1,
          width: 1,
        },
      },
      detectRetina: true,
    }),
    [],
  );

  return (
    <ParticlesProvider init={initEngine}>
      <div className="fixed inset-0 z-[1] pointer-events-none">
        <Particles id="tsparticles" options={options} />
      </div>
    </ParticlesProvider>
  );
}
