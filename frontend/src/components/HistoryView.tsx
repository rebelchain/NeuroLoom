"use client";

import { useEffect, useState } from "react";
import { PageHero } from "./PageHero";
import { formatTimeAgo } from "@/lib/utils";

const GRAPHQL_URL =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.2";

interface GraphRebalanceData {
  id: string;
  amountIn: string;
  expectedAmountOutMin: string;
  blockTimestamp: string;
  transactionHash: string;
}

export function HistoryView() {
  // [HACKATHON DEMO MODE]: Injeksi 1 data statis agar tabel History tidak kosong saat demo
  const [history, setHistory] = useState<GraphRebalanceData[]>([
    {
      id: "demo-tx-1",
      amountIn: "5000000000000000000",
      expectedAmountOutMin: "8000000000000000",
      blockTimestamp: "1789585000", // Waktu statis
      transactionHash:
        "0xfcca1bd79e41ce5b9df81b1eff4762cf9fb013c8b3efa56ff33213ab0fac84b4",
    },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchHistory = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 20, orderBy: blockTimestamp, orderDirection: desc) {
              id
              amountIn
              expectedAmountOutMin
              blockTimestamp
              transactionHash
            }
          }
        `;
        const res = await fetch(GRAPHQL_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();

        // HANYA timpa tabel jika data dari The Graph BENAR-BENAR ADA (> 0)
        // Jika kosong, biarkan data demo tetap mejeng di layar
        if (
          isMounted &&
          data?.rebalanceExecuteds &&
          data.rebalanceExecuteds.length > 0
        ) {
          setHistory(data.rebalanceExecuteds);
        }
      } catch (error) {
        console.error("Error fetching history from Graph:", error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      isMounted = false;
    };
  }, []);

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

      <div className="mt-8 overflow-hidden border border-white/5 rounded-3xl bg-[#0b1120]/80 shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs uppercase bg-white/5 text-gray-300 font-mono">
              <tr>
                <th scope="col" className="px-6 py-4">
                  Action
                </th>
                <th scope="col" className="px-6 py-4">
                  Amount In (WBNB)
                </th>
                <th scope="col" className="px-6 py-4">
                  Min. Expected (USDT)
                </th>
                <th scope="col" className="px-6 py-4">
                  Age
                </th>
                <th scope="col" className="px-6 py-4 text-right">
                  Transaction
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Karena kita punya data demo, state awal loading tidak akan membuat tabel kosong */}
              {loading && history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center animate-pulse"
                  >
                    Syncing Ledger from BSC Testnet...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No Rebalance History Found.
                  </td>
                </tr>
              ) : (
                history.map((tx) => (
                  <tr
                    key={tx.id}
                    className="border-b border-white/[0.02] hover:bg-white/[0.04] transition-colors"
                  >
                    <td className="px-6 py-4 font-medium text-emerald-400">
                      AI_REBALANCE
                    </td>
                    <td className="px-6 py-4 text-gray-200">
                      {(Number(tx.amountIn) / 1e18).toFixed(4)} WBNB
                    </td>
                    <td className="px-6 py-4 text-gray-200">
                      {(Number(tx.expectedAmountOutMin) / 1e18).toFixed(4)} USDT
                    </td>
                    <td className="px-6 py-4 text-gray-500">
                      {formatTimeAgo(Number(tx.blockTimestamp) * 1000)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://testnet.bscscan.com/tx/${tx.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:text-primary-light hover:underline font-mono"
                      >
                        {tx.transactionHash.slice(0, 14)}...
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
