export function AIEventLog() {
  return (
    <section className="flex flex-col h-full bg-[#0b1120]/80 rounded-3xl border border-white/[0.05] overflow-hidden backdrop-blur-2xl">
      <header className="flex justify-between items-center p-5 border-b border-white/[0.05] bg-black/20">
        <div>
          <h2 className="text-base font-semibold text-white">
            Live AI Agent Stream
          </h2>
          <span className="text-[10px] text-gray-400 font-mono tracking-[0.2em] uppercase">
            Indexed by The Graph
          </span>
        </div>
        <div className="flex items-center gap-2 text-[10px] font-mono bg-success/10 border border-success/20 px-3 py-1 rounded-full">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
          <span className="text-success tracking-widest">SYNCED</span>
        </div>
      </header>

      <div className="overflow-x-auto flex-grow">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-white/[0.02] text-gray-500 font-mono text-[10px] uppercase tracking-wider border-b border-white/[0.05]">
              <th className="px-5 py-3 font-medium">Event Action</th>
              <th className="px-5 py-3 font-medium">Rebalance Flow</th>
              <th className="px-5 py-3 font-medium">Timestamp</th>
              <th className="px-5 py-3 font-medium">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-xs">
            {/* Dummy Data - Nanti akan diganti dengan data Apollo GraphQL */}
            <tr className="hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors group">
              <td className="px-5 py-4">
                <div className="flex flex-col">
                  <strong className="text-white">RebalanceExecuted</strong>
                  <small className="text-gray-500 text-[10px]">
                    AI Threshold Reached
                  </small>
                </div>
              </td>
              <td className="px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="text-error font-medium">100 USDT</span>
                  <span className="text-gray-600">→</span>
                  <span className="text-success font-medium">0.3 WBNB</span>
                </div>
              </td>
              <td className="px-5 py-4 text-gray-400 text-[11px]">Just now</td>
              <td className="px-5 py-4">
                <span className="text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors">
                  0x7cb4...47ee
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}
