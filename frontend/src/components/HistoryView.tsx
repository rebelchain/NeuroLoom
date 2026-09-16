import { PageHero } from "./PageHero";

export function HistoryView() {
  return (
    <div className="space-y-6">
      <div className="-mt-6">
        <PageHero
          badge="Audit · On-Chain Ledger"
          title="On-Chain"
          accent="History"
          subtitle="The immutable audit trail of every vault rebalance and yield harvest, emitted directly by the BSC smart contracts."
          media={{ kind: "video", src: "/bg/history.mp4", opacity: 55 }}
        />
      </div>

      {/* Nanti Tabel History kita taruh di sini */}
      <div className="p-12 text-center text-gray-500 mt-4 border border-white/5 rounded-3xl bg-white/[0.02] shadow-inner">
        History Content (Segera Hadir)
      </div>
    </div>
  );
}
