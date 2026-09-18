"use client";

import { useEffect, useState } from "react";
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

export function AIEventLog() {
  // [HACKATHON DEMO MODE]: Data statis murni yang aman dari linter
  const [events, setEvents] = useState<GraphRebalanceData[]>([
    {
      id: "demo-tx-1",
      amountIn: "5000000000000000000", // 5 mUSDT
      expectedAmountOutMin: "8000000000000000", // ~0.008 WBNB
      blockTimestamp: "1789585000", // Timestamp murni (Pure)
      transactionHash:
        "0xfcca1bd79e41ce5b9df81b1eff4762cf9fb013c8b3efa56ff33213ab0fac84b4",
    },
  ]);

  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchGraphData = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 5, orderBy: blockTimestamp, orderDirection: desc) {
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

        // Mencegah The Graph menimpa data demo dengan array kosong
        if (
          isMounted &&
          data?.rebalanceExecuteds &&
          data.rebalanceExecuteds.length > 0
        ) {
          setEvents(data.rebalanceExecuteds);
        }
      } catch (error) {
        console.error("Error fetching AI Events:", error);
      } finally {
        if (isMounted) {
          setIsSyncing(false);
        }
      }
    };

    void fetchGraphData();
    const interval = setInterval(fetchGraphData, 10000);

    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

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
          <span
            className={`w-2 h-2 rounded-full bg-success ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-success tracking-widest">
            {isSyncing ? "SYNCING..." : "SYNCED"}
          </span>
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
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-gray-500">
                  Waiting for AI intents...
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr
                  key={event.id}
                  className="hover:bg-white/[0.02] border-b border-white/[0.02] transition-colors group"
                >
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
                      <span className="text-error font-medium">
                        {(Number(event.amountIn) / 1e18).toFixed(4)} WBNB
                      </span>
                      <span className="text-gray-600">→</span>
                      <span className="text-success font-medium">
                        Min.{" "}
                        {(Number(event.expectedAmountOutMin) / 1e18).toFixed(4)}{" "}
                        USDT
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-[11px]">
                    {formatTimeAgo(Number(event.blockTimestamp) * 1000)}
                  </td>
                  <td className="px-5 py-4">
                    <a
                      href={`https://testnet.bscscan.com/tx/${event.transactionHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary hover:text-primary/80 hover:underline cursor-pointer transition-colors"
                    >
                      {event.transactionHash.slice(0, 6)}...
                      {event.transactionHash.slice(-4)}
                    </a>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}