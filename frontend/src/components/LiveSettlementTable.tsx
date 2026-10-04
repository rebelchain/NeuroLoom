"use client";

import { formatTimeAgo } from "@/lib/utils";
import { Activity, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";
import { GRAPHQL_ENDPOINT } from "../config/config";

const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "The Yield Farm",
  [ACTIVE_VAULTS[1].toLowerCase()]: "Bluechip Momentum",
  [ACTIVE_VAULTS[2].toLowerCase()]: "Degen Accumulator",
};

// --- TAMBAHAN BARU: Token & Protocol Mapping ---
// Ganti alamat Mock Venus ini (0x5ee8...) dengan alamat aslimu!
const PROTOCOL_MAP: Record<string, string> = {
  "0x1b81d678ffb9c0263b24a97847620c99d213eb14": "PancakeSwap V3",
  "0x427bf5b37357632377ecbec9de3626c71a5396c1": "PancakeSwap V3 Manager",
  "0x5ee89d4357d71368cf54a0407c64e36500dbc475": "Venus Protocol",
  "0xfa45fd644b34606cabfb7c8acc546e770e248b83": "USDT",
  "0xae13d989dac2f0debff460ac112a837c89baa7cd": "WBNB",
};

function getProtocolOrTokenName(address: string) {
  if (!address) return "Unknown";
  const lowerAddr = address.toLowerCase();

  if (VAULT_MAP[lowerAddr]) return "Vault";
  if (PROTOCOL_MAP[lowerAddr]) return PROTOCOL_MAP[lowerAddr];

  // Kembalikan alamat disingkat jika tidak dikenal
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

// --- LOGIKA CERDAS: MENGANALISIS RUTE TRANSAKSI ---
function analyzeRebalanceFlow(tokenIn: string, tokenOut: string) {
  const inName = getProtocolOrTokenName(tokenIn);
  const outName = getProtocolOrTokenName(tokenOut);

  // Jika AI menarik (Withdraw) dari Venus (Vault membakar vUSDT, dapat USDT)
  if (inName.includes("Venus")) {
    return {
      actionBadge: "WITHDRAW",
      actionColor: "text-[#ff5f5f] border-[#ff5f5f]/30 bg-[#ff5f5f]/10",
      flowDescription: `Venus Protocol → ${outName}`,
    };
  }

  // Jika AI menyetor (Deposit) ke Venus (Vault memberikan USDT, dapat vUSDT)
  if (outName.includes("Venus")) {
    return {
      actionBadge: "DEPOSIT",
      actionColor: "text-[#10b981] border-[#10b981]/30 bg-[#10b981]/10",
      flowDescription: `${inName} → Venus Protocol`,
    };
  }

  // Jika AI menambahkan LP di PancakeSwap V3 Manager
  if (
    inName.includes("PancakeSwap V3 Manager") ||
    outName.includes("PancakeSwap V3 Manager")
  ) {
    return {
      actionBadge: "PROVIDE LP",
      actionColor: "text-[#3b82f6] border-[#3b82f6]/30 bg-[#3b82f6]/10",
      flowDescription: `USDT ⇄ WBNB (PancakeSwap V3)`,
    };
  }

  // Default: Swap Biasa
  return {
    actionBadge: "SWAP",
    actionColor: "text-[#f59e0b] border-[#f59e0b]/30 bg-[#f59e0b]/10",
    flowDescription: `${inName} ⇄ ${outName}`,
  };
}

function getVaultName(address?: string) {
  if (!address) return "NeuroLoom Vault";
  return VAULT_MAP[address.toLowerCase()] || "NeuroLoom Vault";
}

function formatCurrency(valueStr: string) {
  const num = Number(valueStr);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
}

interface GraphRebalanceData {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  address: string;
  blockTimestamp: string;
  transactionHash: string;
}

export function LiveSettlementTable() {
  const [events, setEvents] = useState<GraphRebalanceData[]>([]);
  const [isSyncing, setIsSyncing] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchGraphData = async () => {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 6, orderBy: blockTimestamp, orderDirection: desc) {
              id tokenIn tokenOut amountIn address blockTimestamp transactionHash
            }
          }
        `;
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();
        if (isMounted && data?.rebalanceExecuteds?.length > 0) {
          setEvents(data.rebalanceExecuteds);
        }
      } catch (error) {
        console.error("Error fetching AI Events:", error);
      } finally {
        if (isMounted) setIsSyncing(false);
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
    <div className="rounded-2xl border border-[#1f1f1f] bg-[#121212] overflow-hidden flex flex-col">
      {/* HEADER */}
      <header className="flex justify-between items-center px-6 py-4 border-b border-[#1f1f1f] bg-[#161616]">
        <div className="flex items-center gap-3.5">
          <div className="w-8 h-8 rounded-lg bg-[#1f1f1f] border border-[#262626] flex items-center justify-center">
            <Activity className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-[13px] font-bold font-mono text-[#f5f5f5] uppercase tracking-widest">
              Live On-Chain Settlement
            </h2>
            <span className="text-[10px] text-[#8a8a8a] font-mono tracking-wider uppercase">
              Indexed by The Graph (BSC Testnet)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[10px] font-mono border border-primary/25 bg-primary/10 rounded-full px-3 py-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full bg-primary ${isSyncing ? "animate-pulse" : ""}`}
          ></span>
          <span className="text-primary tracking-widest uppercase font-semibold">
            {isSyncing ? "Syncing..." : "Synced"}
          </span>
        </div>
      </header>

      {/* TABLE */}
      <div className="overflow-x-auto bg-[#0e0e0e]">
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="bg-[#141414] text-[#8a8a8a] font-mono text-[10px] uppercase tracking-widest border-b border-[#1f1f1f]">
              <th className="px-6 py-3.5 font-normal w-1/4">Target Vault</th>
              {/* Berikan penanda lebar khusus agar kolom ini konsisten */}
              <th className="px-6 py-3.5 font-normal w-[400px]">
                Rebalance Flow
              </th>
              <th className="px-6 py-3.5 font-normal">Execution Time</th>
              <th className="px-6 py-3.5 font-normal text-right">Tx Hash</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[11.5px] divide-y divide-[#1a1a1a]">
            {events.length === 0 && !isSyncing ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-6 py-8 text-center text-[#666] italic"
                >
                  &gt; _No on-chain rebalance executions found in this cycle.
                </td>
              </tr>
            ) : (
              events.map((event) => {
                const vaultName = getVaultName(event.address);

                // Panggil fungsi logika analisis rute
                const { actionBadge, actionColor, flowDescription } =
                  analyzeRebalanceFlow(event.tokenIn, event.tokenOut);

                return (
                  <tr
                    key={event.id}
                    className="hover:bg-[#161616] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <strong className="text-[#f5f5f5] font-semibold tracking-wide text-[12px]">
                          {vaultName}
                        </strong>
                        <span className="text-[#777] text-[10px] uppercase tracking-wider flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          AI Execution
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Jumlah Nilai Aset - Lebar tetap agar sejajar */}
                        <div className="w-[85px] text-right">
                          <span className="text-[#d5d5d5] font-bold tnum text-[12.5px]">
                            {formatCurrency(
                              formatUnits(BigInt(event.amountIn), 18),
                            )}{" "}
                            <span className="text-primary text-[10px]">
                              USDT
                            </span>
                          </span>
                        </div>

                        {/* Deskripsi Rute Protokol - Lebar tetap agar sejajar dan rata tengah */}
                        <span className="w-[180px] text-center text-[#999] text-[10px] bg-[#1a1a1a] rounded px-2.5 py-1.5 border border-[#262626] whitespace-nowrap overflow-hidden text-ellipsis">
                          {flowDescription}
                        </span>

                        {/* Badge Aksi Spesifik - Lebar tetap agar sejajar dan rata tengah */}
                        <span
                          className={`w-[75px] text-center font-semibold text-[9px] uppercase tracking-wider border rounded px-2 py-1 ${actionColor}`}
                        >
                          {actionBadge}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-[#8a8a8a] text-[11px]">
                      {formatTimeAgo(Number(event.blockTimestamp) * 1000)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.transactionHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#8a8a8a] hover:text-primary transition-colors inline-flex items-center justify-end gap-1 font-mono text-[11px] group"
                      >
                        <span>
                          {event.transactionHash.slice(0, 6)}...
                          {event.transactionHash.slice(-4)}
                        </span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
