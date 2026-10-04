"use client";

import { formatTimeAgo } from "@/lib/utils";
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  Filter,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";

import { GRAPHQL_ENDPOINT } from "../config/config";

const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "The Yield Farm",
  [ACTIVE_VAULTS[1].toLowerCase()]: "Bluechip Momentum",
  [ACTIVE_VAULTS[2].toLowerCase()]: "Degen Accumulator",
};

const PROTOCOL_MAP: Record<string, string> = {
  "0x1b81d678ffb9c0263b24a97847620c99d213eb14": "PancakeSwap (v3)",
  "0x427bf5b37357632377ecbec9de3626c71a5396c1": "PancakeSwap V3 Manager",
  "0x5ee89d4357d71368cf54a0407c64e36500dbc475": "Venus Protocol (Mock)",
  "0xfa45fd644b34606cabfb7c8acc546e770e248b83": "USDT",
  "0xae13d989dac2f0debff460ac112a837c89baa7cd": "WBNB",
};

function getProtocolOrTokenName(address: string) {
  if (!address) return "Unknown Target";
  const lowerAddr = address.toLowerCase();

  if (VAULT_MAP[lowerAddr]) return "Vault";

  if (PROTOCOL_MAP[lowerAddr]) return PROTOCOL_MAP[lowerAddr];

  return shortenAddress(address);
}

function buildRouteString(
  vaultName: string,
  tokenIn: string,
  tokenOut: string,
) {
  const inName = getProtocolOrTokenName(tokenIn);
  const outName = getProtocolOrTokenName(tokenOut);

  if (outName.includes("Venus")) {
    return `${vaultName}: Deposit to Venus`;
  }
  if (inName.includes("Venus")) {
    return `${vaultName}: Withdraw from Venus`;
  }

  // Logika khusus untuk PancakeSwap LP
  if (
    inName.includes("PancakeSwap V3 Manager") ||
    outName.includes("PancakeSwap V3 Manager")
  ) {
    return `${vaultName}: LP Management (V3)`;
  }

  // Default Swap Route (Contoh: Vault -> USDT -> WBNB)
  return `${vaultName}: Swap ${inName} → ${outName}`;
}
// -----------------------------------------------

function getVaultName(address?: string) {
  if (!address) return "NeuroLoom Vault";
  return VAULT_MAP[address.toLowerCase()] || "NeuroLoom Vault";
}

type EventType = "AI_REBALANCE" | "USER_DEPOSIT" | "USER_WITHDRAWAL";

interface VaultEvent {
  id: string;
  type: EventType;
  amount: string;
  route: string;
  timestamp: number;
  txHash: string;
}

interface RawRebalance {
  id: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  address: string;
  blockTimestamp: string;
  transactionHash: string;
}
interface RawDepositWithdraw {
  id: string;
  assets: string;
  address: string;
  blockTimestamp: string;
  transactionHash: string;
}

function shortenAddress(addr: string) {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function EventBadge({ type }: { type: EventType }) {
  switch (type) {
    case "AI_REBALANCE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-primary/10 text-primary border border-primary/25">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
          AI Execution
        </span>
      );
    case "USER_DEPOSIT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-[#10b981]/10 text-[#10b981] border border-[#10b981]/25">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          User Deposit
        </span>
      );
    case "USER_WITHDRAWAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-[#ff5f5f]/10 text-[#ff5f5f] border border-[#ff5f5f]/25">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f5f]" />
          User Withdraw
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono tracking-widest uppercase bg-white/[0.05] text-[#8a8a8a] border border-white/[0.1]">
          {type}
        </span>
      );
  }
}

function formatCurrency(valueStr: string) {
  const num = Number(valueStr);
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
}

export function HistoryView() {
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  useEffect(() => {
    let isMounted = true;
    async function fetchOnChainAudit() {
      try {
        const query = `
          {
            rebalanceExecuteds(first: 30, orderBy: blockTimestamp, orderDirection: desc) {
              id tokenIn tokenOut amountIn address blockTimestamp transactionHash
            }
            deposits(first: 30, orderBy: blockTimestamp, orderDirection: desc) {
              id assets address blockTimestamp transactionHash
            }
            withdraws(first: 30, orderBy: blockTimestamp, orderDirection: desc) {
              id assets address blockTimestamp transactionHash
            }
          }
        `;
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const json = await res.json();
        if (json.errors) {
          console.error("The Graph Query Error:", json.errors);
        }
        const data = json.data;
        if (!isMounted || !data) return;

        const combined: VaultEvent[] = [];
        const DECIMALS = 18;

        if (data.rebalanceExecuteds) {
          data.rebalanceExecuteds.forEach((item: RawRebalance) => {
            const vault = getVaultName(item.address);
            const formattedUnit = formatUnits(BigInt(item.amountIn), DECIMALS);
            const amt = formatCurrency(formattedUnit);

            const routeDescription = buildRouteString(
              vault,
              item.tokenIn,
              item.tokenOut,
            );

            combined.push({
              id: item.id,
              type: "AI_REBALANCE",
              amount: `${amt} USDT`,
              route: routeDescription,
              timestamp: Number(item.blockTimestamp),
              txHash: item.transactionHash,
            });
          });
        }

        if (data.deposits) {
          data.deposits.forEach((item: RawDepositWithdraw) => {
            const vault = getVaultName(item.address);
            const formattedUnit = formatUnits(BigInt(item.assets), DECIMALS);
            const amt = formatCurrency(formattedUnit);

            combined.push({
              id: item.id,
              type: "USER_DEPOSIT",
              amount: `+${amt} USDT`,
              route: `External Wallet → ${vault}`,
              timestamp: Number(item.blockTimestamp),
              txHash: item.transactionHash,
            });
          });
        }

        if (data.withdraws) {
          data.withdraws.forEach((item: RawDepositWithdraw) => {
            const vault = getVaultName(item.address);
            const formattedUnit = formatUnits(BigInt(item.assets), DECIMALS);
            const amt = formatCurrency(formattedUnit);

            combined.push({
              id: item.id,
              type: "USER_WITHDRAWAL",
              amount: `-${amt} USDT`,
              route: `${vault} → External Wallet`,
              timestamp: Number(item.blockTimestamp),
              txHash: item.transactionHash,
            });
          });
        }

        combined.sort((a, b) => b.timestamp - a.timestamp);
        setEvents(combined);
      } catch (err) {
        console.error("Gagal menarik data Subgraph Audit:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void fetchOnChainAudit();
    const interval = setInterval(fetchOnChainAudit, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const filteredEvents = events.filter((e) => {
    if (filterType !== "ALL" && e.type !== filterType) return false;
    if (
      searchQuery &&
      !e.txHash.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !e.route.toLowerCase().includes(searchQuery.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(
    startIndex,
    startIndex + ITEMS_PER_PAGE,
  );

  const exportToCSV = () => {
    const headers = "Event Type,Amount,Route,Timestamp,Transaction Hash\n";
    const rows = filteredEvents
      .map(
        (e) =>
          `${e.type},"${e.amount}","${e.route}",${new Date(e.timestamp * 1000).toISOString()},${e.txHash}`,
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NeuroLoom_Audit_${new Date().getTime()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="w-full h-full flex flex-col p-6 lg:p-10 overflow-y-auto relative">
      <div className="relative z-10 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#181818] border border-[#262626] text-primary text-[10px] uppercase tracking-widest font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Audit • On-Chain Ledger
          </div>
        </div>
        <h1 className="text-3xl md:text-[32px] font-bold text-[#f5f5f5] mb-2 font-mono uppercase tracking-widest">
          Master <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-[#8a8a8a] text-[13px] max-w-2xl font-mono leading-relaxed">
          {">"} The immutable audit trail of every vault rebalance, user
          deposit, and administrative action, verified directly by the BSC smart
          contracts.
        </p>
      </div>

      <div className="relative z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-[#121212]/90 p-4 rounded-2xl border border-[#1f1f1f]">
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 flex-grow">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Hash or Route..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-[#181818] border border-[#262626] rounded-xl py-2.5 px-4 text-[12px] text-[#f5f5f5] focus:outline-none focus:border-primary/60 transition-colors font-mono placeholder:text-[#555]"
            />
          </div>

          <div className="relative w-full sm:w-56">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full bg-[#181818] border border-[#262626] rounded-xl py-2.5 px-4 text-[11.5px] uppercase tracking-widest text-[#d5d5d5] focus:outline-none focus:border-primary/60 transition-colors cursor-pointer font-mono"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-[14px] h-[14px] text-[#8a8a8a]" />
                <span>
                  {filterType === "ALL" && "All Events"}
                  {filterType === "AI_REBALANCE" && "AI Executions"}
                  {filterType === "USER_DEPOSIT" && "User Deposits"}
                  {filterType === "USER_WITHDRAWAL" && "User Withdrawals"}
                </span>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-[#8a8a8a] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}

            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#141414] border border-[#262626] rounded-xl shadow-2xl z-50 flex flex-col overflow-hidden">
                {[
                  { value: "ALL", label: "All Events" },
                  { value: "AI_REBALANCE", label: "AI Executions" },
                  { value: "USER_DEPOSIT", label: "User Deposits" },
                  { value: "USER_WITHDRAWAL", label: "User Withdrawals" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setFilterType(option.value);
                      setCurrentPage(1);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-3 text-[10.5px] uppercase tracking-widest font-mono transition-colors ${
                      filterType === option.value
                        ? "bg-primary/10 text-primary font-bold border-l-2 border-primary"
                        : "text-[#8a8a8a] hover:bg-[#1a1a1a] hover:text-[#f5f5f5] border-l-2 border-transparent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={exportToCSV}
          className="flex items-center gap-2.5 h-[40px] px-5 rounded-xl bg-[#181818] text-[#c5c5c5] border border-[#262626] hover:border-[#444] text-[10.5px] uppercase tracking-[0.15em] font-mono font-bold hover:text-[#f5f5f5] transition-all duration-200 shrink-0 justify-center w-full md:w-auto cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="relative z-10 rounded-2xl border border-[#1f1f1f] bg-[#121212] flex-grow flex flex-col min-h-[400px] overflow-hidden">
        <div className="overflow-x-auto flex-grow bg-[#0c0c0c]">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#141414] border-b border-[#1f1f1f] text-[10px] text-[#8a8a8a] font-mono uppercase tracking-widest">
                <th className="py-3.5 px-6 font-normal">Event Type</th>
                <th className="py-3.5 px-6 font-normal">Amount / Status</th>
                <th className="py-3.5 px-6 font-normal">Routing / Target</th>
                <th className="py-3.5 px-6 font-normal">Timestamp</th>
                <th className="py-3.5 px-6 font-normal">Transaction</th>
              </tr>
            </thead>
            <tbody className="text-[11.5px] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#8a8a8a]">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-5 h-5 text-primary animate-spin" />
                      {">"} _Syncing ledger from The Graph...
                    </div>
                  </td>
                </tr>
              ) : paginatedEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center text-[#8a8a8a]">
                    {">"} _No events found matching your parameters.
                  </td>
                </tr>
              ) : (
                paginatedEvents.map((event, idx) => (
                  <tr
                    key={`${event.txHash}-${idx}`}
                    className="border-b border-[#1a1a1a] hover:bg-[#141414] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <EventBadge type={event.type} />
                    </td>
                    <td className="py-4 px-6 text-[#f5f5f5] tnum font-bold">
                      {event.amount}
                    </td>
                    <td className="py-4 px-6 text-[#c5c5c5]">{event.route}</td>
                    <td className="py-4 px-6 text-[#8a8a8a]">
                      {formatTimeAgo(event.timestamp)}
                    </td>
                    <td className="py-4 px-6">
                      <a
                        href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#8a8a8a] hover:text-primary transition-colors border-b border-dashed border-[#444] hover:border-primary pb-[1px] w-fit"
                      >
                        {shortenAddress(event.txHash)}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 border-t border-[#1f1f1f] bg-[#141414] text-[11px] font-mono text-[#8a8a8a]">
          <div>
            Showing {startIndex + 1} to{" "}
            {Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)} of{" "}
            {filteredEvents.length} events
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg bg-[#181818] border border-[#262626] disabled:opacity-30 hover:border-[#444] transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg bg-[#181818] border border-[#262626] disabled:opacity-30 hover:border-[#444] transition-colors cursor-pointer"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
