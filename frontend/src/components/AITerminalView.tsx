import { PageHero } from "./PageHero";
import { AIEventLog } from "./AIEventLog";

export function AITerminalView() {
  return (
    <div className="space-y-8 relative">
      <div className="relative z-10 flex flex-col flex-grow">
        <div className="-mt-6">
          <PageHero
            badge="Platform · Quant Optimizer"
            title="Live AI"
            accent="Execution Stream"
            media={{ kind: "video", src: "/bg/aiterminal.mp4", opacity: 40 }}
            subtitle="Real-time execution logs of the NeuroLoom agent. Watch the AI index the graph and find optimal yield routes."
          />
        </div>

        {/* GLASSMORPHISM TERMINAL CONTAINER */}
        <div className="mt-4 rounded-[12px] border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.01] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_24px_48px_rgba(0,0,0,0.4)] backdrop-blur-md flex-grow flex flex-col overflow-hidden">
          <AIEventLog />
        </div>
      </div>
    </div>
  );
}
