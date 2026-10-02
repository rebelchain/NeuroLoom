"use client";

import { PageHero } from "./PageHero";
import { AgentOrchestratorLog } from "./AgentOrchestratorLog";
import { LiveSettlementTable } from "./LiveSettlementTable";

export function AITerminalView() {
  return (
    <div className="space-y-6 relative pb-6">
      <div className="relative z-10 flex flex-col">
        <div className="-mt-6">
          <PageHero
            badge="Platform · Quant Optimizer"
            title="Live AI"
            accent="Execution Stream"
            media={{ kind: "video", src: "/bg/aiterminal.mp4", opacity: 40 }}
            subtitle="Real-time execution logs of the NeuroLoom agent. Watch the AI analyze indicators, calculate yields, and execute optimal rebalance routes on-chain."
          />
        </div>

        {/* ORCHESTRATOR LOG (TALL TERMINAL VIEW) */}
        <div className="mt-2 space-y-6">
          <AgentOrchestratorLog />
          <LiveSettlementTable />
        </div>
      </div>
    </div>
  );
}
