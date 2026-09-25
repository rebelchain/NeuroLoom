import { PageHero } from "./PageHero";
import { AIEventLog } from "./AIEventLog";

export function AITerminalView() {
  return (
    <div className="space-y-6">
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a0a0a] via-transparent to-[#0a0a0a] opacity-90" />
      </div>


      <div className="relative z-10 flex flex-col flex-grow">
        <div className="-mt-6">
          <PageHero
            badge="Platform · Quant Optimizer"
            title="Live AI"
            accent="Execution Stream"
            media={{ kind: "video", src: "/bg/aiterminal.mp4", opacity: 60 }}
            subtitle="Real-time execution logs of the NeuroLoom agent. Watch the AI index the graph and find optimal yield routes."
          />
        </div>

        <div className="mt-8 border border-[#1f1f1f] bg-[#0a0a0a]/80 backdrop-blur-md shadow-[0_0_30px_rgba(139,92,246,0.03)] flex-grow flex flex-col">
          <AIEventLog />
        </div>
      </div>
    </div>
  );
}
