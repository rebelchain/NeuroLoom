"use client";

import {
  Activity,
  AlertTriangle,
  Download,
  ExternalLink,
  Filter,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";

// ==========================================
// 1. TYPES & DATA NORMALIZATION
// ==========================================
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
  blockTimestamp: string;
  transactionHash: string;
}
interface RawDepositWithdraw {
  id: string;
  assets: string;
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

export function HistoryView() {
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const GRAPHQL_ENDPOINT =
    "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/version/latest";

  // ==========================================
  // 2. THE OMNISCIENT QUERY (Di dalam useEffect)
  // ==========================================
  useEffect(() => {
    async function fetchMasterLedger() {
      try {
        setLoading(true);
        const query = `
          {
            rebalanceExecuteds(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, tokenIn, tokenOut, amountIn, blockTimestamp, transactionHash }
            deposits(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, assets, blockTimestamp, transactionHash }
            withdraws(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, assets, blockTimestamp, transactionHash }
            protocolApproveds(first: 10, orderBy: blockTimestamp, orderDirection: desc) { id, protocol, status, blockTimestamp, transactionHash }
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

        // ==========================================
        // 3. DATA NORMALIZATION
        // ==========================================
        const normalizedData: VaultEvent[] = [];

        if (data) {
          if (data.rebalanceExecuteds) {
            normalizedData.push(
              ...data.rebalanceExecuteds.map((e: RawRebalance) => ({
                id: e.id,
                type: "AI_REBALANCE" as EventType,
                amount: `${formatUnits(BigInt(e.amountIn), 18)} USDT`,
                route: `${shortenAddress(e.tokenIn)} → ${shortenAddress(e.tokenOut)}`,
                timestamp: Number(e.blockTimestamp),
                txHash: e.transactionHash,
              })),
            );
          }
          if (data.deposits) {
            normalizedData.push(
              ...data.deposits.map((e: RawDepositWithdraw) => ({
                id: e.id,
                type: "USER_DEPOSIT" as EventType,
                amount: `+ ${formatUnits(BigInt(e.assets), 18)} USDT`,
                route: "Inbound Liquidity",
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
                amount: `- ${formatUnits(BigInt(e.assets), 18)} USDT`,
                route: "Outbound Liquidity",
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
                route: `Target: ${shortenAddress(e.protocol)}`,
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
                route: "Vault Operations Halted",
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
  }, []); // Dependensi kosong, hanya berjalan 1x saat komponen di-mount

  // ==========================================
  // 4. FILTER & EXPORT LOGIC
  // ==========================================
  const filteredEvents = events.filter((e) => {
    const matchesSearch = e.txHash
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "ALL" || e.type === filterType;
    return matchesSearch && matchesType;
  });

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
    <div className="w-full h-full flex flex-col p-8 overflow-y-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <div className="px-3 py-1 rounded-full border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-mono">
            Audit • On-Chain Ledger
          </div>
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">
          Master <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-gray-400 text-sm max-w-2xl">
          The immutable audit trail of every vault rebalance, user deposit, and
          administrative action, verified directly by the BSC smart contracts.
        </p>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 bg-white/[0.02] p-4 rounded-xl border border-white/5">
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search Tx Hash..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-64 bg-black/20 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors font-mono"
            />
          </div>

          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 z-10 pointer-events-none" />

            {/* Tombol Pemicu Custom Dropdown */}
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full md:w-48 bg-black/40 border border-white/10 rounded-lg py-2 pl-10 pr-4 text-sm text-white focus:outline-none focus:border-primary/50 transition-colors cursor-pointer"
            >
              <span>
                {filterType === "ALL" && "All Events"}
                {filterType === "AI_REBALANCE" && "AI Rebalances"}
                {filterType === "USER_DEPOSIT" && "User Deposits"}
                {filterType === "USER_WITHDRAWAL" && "User Withdrawals"}
                {filterType === "ADMIN_WHITELIST" && "Admin Whitelist"}
              </span>
              <svg
                className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
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

            {/* Backdrop transparan untuk menutup menu saat area luar diklik */}
            {isDropdownOpen && (
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsDropdownOpen(false)}
              />
            )}

            {/* Menu Dropdown Kustom */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#0b1021] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
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
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      filterType === option.value
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-gray-400 hover:bg-white/5 hover:text-white"
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
          className="flex items-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/30 px-4 py-2 rounded-lg text-sm font-medium transition-all w-full md:w-auto justify-center"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      <div className="bg-[#0b1021] border border-white/5 rounded-2xl overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-xs text-gray-500 font-mono tracking-wider">
              <th className="py-4 px-6 font-medium">EVENT TYPE</th>
              <th className="py-4 px-6 font-medium">AMOUNT / STATUS</th>
              <th className="py-4 px-6 font-medium">ROUTING / TARGET</th>
              <th className="py-4 px-6 font-medium">TIMESTAMP</th>
              <th className="py-4 px-6 font-medium">TRANSACTION</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-gray-500 font-mono"
                >
                  <Activity className="w-6 h-6 animate-spin mx-auto mb-2 opacity-50" />
                  Syncing from The Graph...
                </td>
              </tr>
            ) : filteredEvents.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="py-12 text-center text-gray-500 font-mono"
                >
                  No events found matching your filter.
                </td>
              </tr>
            ) : (
              filteredEvents.map((event, idx) => (
                <tr
                  key={`${event.txHash}-${idx}`}
                  className="border-b border-white/5 hover:bg-white/[0.02] transition-colors group"
                >
                  <td className="py-4 px-6">
                    <EventBadge type={event.type} />
                  </td>
                  <td className="py-4 px-6 font-mono text-gray-300">
                    {event.amount}
                  </td>
                  <td className="py-4 px-6 font-mono text-gray-400">
                    {event.route}
                  </td>
                  <td className="py-4 px-6 text-gray-500">
                    {formatTimeAgo(event.timestamp)}
                  </td>
                  <td className="py-4 px-6">
                    <a
                      href={`https://testnet.bscscan.com/tx/${event.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-primary/70 hover:text-primary font-mono transition-colors"
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
    </div>
  );
}

function EventBadge({ type }: { type: EventType }) {
  switch (type) {
    case "AI_REBALANCE":
      return (
        <span className="text-success font-medium flex items-center gap-2">
          <Activity className="w-4 h-4" /> AI_REBALANCE
        </span>
      );
    case "USER_DEPOSIT":
      return <span className="text-blue-400 font-medium">VAULT_DEPOSIT</span>;
    case "USER_WITHDRAWAL":
      return (
        <span className="text-orange-400 font-medium">VAULT_WITHDRAWAL</span>
      );
    case "ADMIN_WHITELIST":
      return (
        <span className="text-purple-400 font-medium flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" /> ADMIN_WHITELIST
        </span>
      );
    case "SYSTEM_PAUSED":
      return (
        <span className="text-red-500 font-medium flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> EMERGENCY_PAUSED
        </span>
      );
    default:
      return <span className="text-gray-400 font-medium">{type}</span>;
  }
}

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatTimeAgo(timestamp: number) {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}
