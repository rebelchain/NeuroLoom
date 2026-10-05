"use client";

import { DemoVaultRebalanceSimulator } from "./DemoVaultRebalanceSimulator";
import { AiTeamChat } from "./AiTeamChat";
import { AgentOrchestratorLog } from "./AgentOrchestratorLog";

export function SimulationView() {
  return (
    <div className="relative space-y-8 flex flex-col items-center min-h-[80vh] pt-4 px-4 md:px-8">
      <div className="w-full text-center space-y-3 mb-2">
        <h1 className="text-3xl md:text-4xl text-[#f5f5f5] serif tracking-tight">
          Interactive Demo Simulation
        </h1>
        <p className="text-[#8a8a8a] text-sm max-w-2xl mx-auto font-light leading-relaxed">
          Experience the autonomous multi-agent execution pipeline in a
          sandboxed environment.
        </p>
      </div>

      {/* 
        LAYOUT SUPER LEBAR: 
        Menggunakan max-w-[1600px] agar Simulator (2 grafik) 
        dan Chat AI punya ruang napas yang cukup.
      */}
      <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* KIRI: Simulator (Makan 8 Kolom) */}
        <div className="xl:col-span-8 flex flex-col">
          <DemoVaultRebalanceSimulator />
        </div>

        {/* KANAN: AI Chat Room (Makan 4 Kolom) */}
        <div className="xl:col-span-4 mt-12 flex flex-col h-full">
          {/* Kita buat Chat-nya mengikuti tinggi Simulator */}
          <div className="sticky top-6">
            <AiTeamChat />
          </div>
        </div>
      </div>

      {/* BAWAH: Terminal Sistem (Full Width) */}
      <div className="w-full max-w-[1600px] mt-8 pb-12">
        <AgentOrchestratorLog />
      </div>
    </div>
  );
}
