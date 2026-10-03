"use client";

import { VaultRebalanceSimulator } from "./VaultRebalanceSimulator";

export function SimulationView() {
  return (
    <div className="relative space-y-8 flex flex-col items-center min-h-[80vh] pt-4">
      <div className="w-full text-center space-y-3 mb-4">
        <h1 className="text-3xl md:text-4xl text-[#f5f5f5] serif tracking-tight">
          Interactive Demo Simulation
        </h1>
        <p className="text-[#8a8a8a] text-sm max-w-2xl mx-auto font-light leading-relaxed">
          Experience the autonomous multi-agent execution pipeline in a sandboxed environment.
        </p>
      </div>
      
      <div className="w-full max-w-6xl mx-auto">
        <VaultRebalanceSimulator />
      </div>
    </div>
  );
}
