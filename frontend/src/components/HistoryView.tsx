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

const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "The Yield Farm",
  [ACTIVE_VAULTS[1].toLowerCase()]: "Bluechip Momentum",
  [ACTIVE_VAULTS[2].toLowerCase()]: "Degen Accumulator",
};

function getVaultName(address?: string) {
  if (!address) return "NeuroLoom Vault";
  return VAULT_MAP[address.toLowerCase()] || "NeuroLoom Vault";
}

type EventType =
  | "AI_REBALANCE"
  | "USER_DEPOSIT"
  | "USER_WITHDRAWAL"
  | "ADMIN_WHITELIST"
  | "SYSTEM_PAUSED"
  | "SYSTEM_UNPAUSED";

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
interface RawWhitelist {
  id: string;
  protocol: string;
  status: boolean;
  blockTimestamp: string;
  transactionHash: string;
}
interface RawPause {
  id: string;
  account: string;
  blockTimestamp: string;
  transactionHash: string;
}

const ITEMS_PER_PAGE = 15;

export function HistoryView() {
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);

  const GRAPHQL_ENDPOINT =
    "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.6";

  useEffect(() => {
    async function fetchMasterLedger() {
      try {
        setLoading(true);
        const query = `
          {
            rebalanceExecuteds(first: 100, orderBy: blockTimestamp, orderDirection: desc) { id, tokenIn, tokenOut, amountIn, address, blockTimestamp, transactionHash }
            deposits(first: 100, orderBy: blockTimestamp, orderDirection: desc) { id, assets, address, blockTimestamp, transactionHash }
            withdraws(first: 100, orderBy: blockTimestamp, orderDirection: desc) { id, assets, address, blockTimestamp, transactionHash }
            protocolApproveds(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, protocol, status, blockTimestamp, transactionHash }
            pauseds(first: 5, orderBy: blockTimestamp, orderDirection: desc) { id, account, blockTimestamp, transactionHash }
            unpauseds(first: 5, orderBy: blockTimestamp, orderDirection: desc) { id, account, blockTimestamp, transactionHash }
          }
        `;
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();
        const normalizedData: VaultEvent[] = [];

        if (data) {
          if (data.rebalanceExecuteds) {
            normalizedData.push(
              ...data.rebalanceExecuteds.map((e: RawRebalance) => {
                const vaultName = getVaultName(e.address);
                return {
                  id: e.id,
                  type: "AI_REBALANCE" as EventType,
                  amount: `${formatUnits(BigInt(e.amountIn), 6)} USDT`,
                  route: `[${vaultName}] Reallocated ${shortenAddress(e.tokenIn)} to ${shortenAddress(e.tokenOut)}`,
                  timestamp: Number(e.blockTimestamp),
                  txHash: e.transactionHash,
                };
              }),
            );
          }
          if (data.deposits) {
            normalizedData.push(
              ...data.deposits.map((e: RawDepositWithdraw) => ({
                id: e.id,
                type: "USER_DEPOSIT" as EventType,
                amount: `+ ${formatUnits(BigInt(e.assets), 6)} USDT`,
                route: `Capital Inbound to ${getVaultName(e.address)}`,
                timestamp: Number(e.blockTimestamp),
                txHash: e.transactionHash,
              })),
            );
          }
          if (data.withdraws) {
            normalizedData.push(
              ...data.withdraws.map((e: RawDepositWithdraw) => ({
                id: e.id,
                type: "USER_WITHDRAWAL" as EventType,
                amount: `- ${formatUnits(BigInt(e.assets), 6)} USDT`,
                route: `Capital Outbound from ${getVaultName(e.address)}`,
                timestamp: Number(e.blockTimestamp),
                txHash: e.transactionHash,
              })),
            );
          }
          if (data.protocolApproveds) {
            normalizedData.push(
              ...data.protocolApproveds.map((e: RawWhitelist) => ({
                id: e.id,
                type: "ADMIN_WHITELIST" as EventType,
                amount: e.status ? "APPROVED" : "REVOKED",
                route: `Target Protocol: ${shortenAddress(e.protocol)}`,
                timestamp: Number(e.blockTimestamp),
                txHash: e.transactionHash,
              })),
            );
          }
          if (data.pauseds) {
            normalizedData.push(
              ...data.pauseds.map((e: RawPause) => ({
                id: e.id,
                type: "SYSTEM_PAUSED" as EventType,
                amount: "EMERGENCY",
                route: "Global Vault Operations Halted",
                timestamp: Number(e.blockTimestamp),
                txHash: e.transactionHash,
              })),
            );
          }
        }
        normalizedData.sort((a, b) => b.timestamp - a.timestamp);
        setEvents(normalizedData);
      } catch (error) {
        console.error("Failed to fetch graph data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchMasterLedger();
  }, []);

  const filteredEvents = events.filter((e) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      e.txHash.toLowerCase().includes(searchLower) ||
      e.route.toLowerCase().includes(searchLower);
    const matchesType = filterType === "ALL" || e.type === filterType;
    return matchesSearch && matchesType;
  });

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
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
      {/* GLOW ATMOSFERIK */}
      <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[120%] h-[60vh] pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,_rgba(139,92,246,0.1),_transparent_60%)] z-0"></div>

      {/* HEADER */}
      <div className="relative z-10 mb-8">
        <div className="flex items-center gap-2 mb-5">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-white/[0.03] border border-white/[0.08] text-primary text-[10px] uppercase tracking-widest font-mono shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
            Audit • On-Chain Ledger
          </div>
        </div>
        <h1 className="text-3xl md:text-[32px] font-bold text-[#f5f5f5] mb-3 font-mono uppercase tracking-widest">
          Master <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-[#8a8a8a] text-[13px] max-w-2xl font-mono leading-relaxed">
          {">"} The immutable audit trail of every vault rebalance, user
          deposit, and administrative action, verified directly by the BSC smart
          contracts.
        </p>
      </div>


      <div className="relative z-30 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-white/[0.02] p-4 rounded-[12px] border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)] backdrop-blur-sm">
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 flex-grow">
          {/* SEARCH INPUT - Inset Glass */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Hash or Route..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-black/40 border border-white/[0.08] rounded-md py-2.5 px-4 text-[12px] text-[#f5f5f5] focus:outline-none focus:border-primary/60 transition-colors font-mono placeholder:text-[#555] shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)]"
            />
          </div>

          {/* FILTER DROPDOWN */}
          <div className="relative w-full sm:w-56">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full bg-black/40 border border-white/[0.08] rounded-md py-2.5 px-4 text-[11.5px] uppercase tracking-widest text-[#d5d5d5] focus:outline-none focus:border-primary/60 transition-colors cursor-pointer font-mono shadow-[inset_0_2px_5px_rgba(0,0,0,0.3)]"
            >
              <div className="flex items-center gap-2.5">
                <Filter className="w-[14px] h-[14px] text-[#8a8a8a]" />
                <span>
                  {filterType === "ALL" && "All Events"}
                  {filterType === "AI_REBALANCE" && "AI Rebalances"}
                  {filterType === "USER_DEPOSIT" && "User Deposits"}
                  {filterType === "USER_WITHDRAWAL" && "User Withdrawals"}
                  {filterType === "ADMIN_WHITELIST" && "Admin Whitelist"}
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
              <div className="absolute top-full left-0 mt-2 w-full bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.12] rounded-md shadow-[0_10px_30px_rgba(0,0,0,0.8)] z-50 flex flex-col overflow-hidden">
                {[
                  { value: "ALL", label: "All Events" },
                  { value: "AI_REBALANCE", label: "AI Rebalances" },
                  { value: "USER_DEPOSIT", label: "User Deposits" },
                  { value: "USER_WITHDRAWAL", label: "User Withdrawals" },
                  { value: "ADMIN_WHITELIST", label: "Admin Whitelist" },
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
                        : "text-[#8a8a8a] hover:bg-white/[0.05] hover:text-[#f5f5f5] border-l-2 border-transparent"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* EXPORT BUTTON - Ghost Style */}
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2.5 h-[42px] px-6 rounded-md bg-gradient-to-br from-white/[0.05] to-transparent text-[#c5c5c5] border border-white/[0.12] text-[10.5px] uppercase tracking-[0.15em] font-mono font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] hover:text-[#f5f5f5] hover:border-primary/50 hover:bg-white/[0.02] transition-all duration-300 shrink-0 justify-center w-full md:w-auto"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      <div className="relative z-10 rounded-[12px] border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.01] shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_24px_48px_rgba(0,0,0,0.2)] flex-grow flex flex-col min-h-[400px] overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto flex-grow">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/[0.08] text-[10.5px] text-[#8a8a8a] font-mono uppercase tracking-widest">
                <th className="py-4 px-6 font-normal">Event Type</th>
                <th className="py-4 px-6 font-normal">Amount / Status</th>
                <th className="py-4 px-6 font-normal">Routing / Target</th>
                <th className="py-4 px-6 font-normal">Timestamp</th>
                <th className="py-4 px-6 font-normal">Transaction</th>
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
                    className="border-b border-white/[0.05] hover:bg-white/[0.03] transition-colors group"
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
                        className="flex items-center gap-2 text-[#8a8a8a] hover:text-primary transition-colors border-b border-dashed border-white/[0.2] hover:border-primary pb-[1px] w-fit"
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

        {/* PAGINATION CONTROLS */}
        {!loading && filteredEvents.length > 0 && (
          <div className="mt-auto border-t border-white/[0.08] bg-white/[0.01] px-6 py-4 flex items-center justify-between">
            <div className="text-[10px] font-mono text-[#8a8a8a] uppercase tracking-widest">
              Showing {startIndex + 1}-
              {Math.min(startIndex + ITEMS_PER_PAGE, filteredEvents.length)} of{" "}
              {filteredEvents.length} events
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.02] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-white/[0.02] disabled:hover:text-[#8a8a8a] transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-2 font-mono text-[11px] text-[#f5f5f5]">
                {currentPage} <span className="text-[#555]">/</span>{" "}
                {totalPages}
              </div>
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="w-7 h-7 flex items-center justify-center rounded-md border border-white/[0.12] bg-white/[0.02] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.05] disabled:opacity-30 disabled:hover:bg-white/[0.02] disabled:hover:text-[#8a8a8a] transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EventBadge({ type }: { type: EventType }) {
  switch (type) {
    case "AI_REBALANCE":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
          REBALANCE
        </span>
      );
    case "USER_DEPOSIT":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#10b981]/10 border border-[#10b981]/30 text-[#10b981] text-[10px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]" />
          INBOUND
        </span>
      );
    case "USER_WITHDRAWAL":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white/[0.05] border border-white/[0.12] text-[#d5d5d5] text-[10px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#6a6a6a]" />
          OUTBOUND
        </span>
      );
    case "ADMIN_WHITELIST":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#0be5b5]/10 border border-[#0be5b5]/30 text-[#0be5b5] text-[10px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          WHITELIST
        </span>
      );
    case "SYSTEM_PAUSED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#ff5f5f]/10 border border-[#ff5f5f]/30 text-[#ff5f5f] text-[10px] font-bold animate-pulse shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#ff5f5f]" />
          HALTED
        </span>
      );
    case "SYSTEM_UNPAUSED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          RESUMED
        </span>
      );
    default:
      return (
        <span className="text-[#8a8a8a] font-bold text-[10px]">[ {type} ]</span>
      );
  }
}

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
