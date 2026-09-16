import { PageHero } from "./PageHero";
import { AIEventLog } from "./AIEventLog";

export function AITerminalView() {
  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Platform · Terminal"
          title="Live AI"
          accent="Execution Stream"
          subtitle="Real-time execution logs of the NeuroLoom agent. Watch the AI index the graph and find optimal yield routes."
          media={{ kind: "video", src: "/bg/aiterminal.mp4", opacity: 55 }}
        />
      </div>

      {/* Nanti EventLog raksasanya kita taruh di sini */}
      <div className="p-12 text-center text-gray-500 mt-4 border border-white/5 rounded-3xl bg-white/[0.02] shadow-inner">
        <AIEventLog />
      </div>
    </div>
  );
}
