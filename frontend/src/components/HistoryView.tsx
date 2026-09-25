"use client";

import { formatTimeAgo } from "@/lib/utils";
import { Activity, Download, ExternalLink, Filter } from "lucide-react";
import { useEffect, useState } from "react";
import { formatUnits } from "viem";
import { ACTIVE_VAULTS } from "../config/addresses";


const VAULT_MAP: Record<string, string> = {
  [ACTIVE_VAULTS[0].toLowerCase()]: "Yield Farm",
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

export function HistoryView() {
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);


  const GRAPHQL_ENDPOINT =
    "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.6";

  useEffect(() => {
    async function fetchMasterLedger() {
      try {
        setLoading(true);
        const query = `
          {
            rebalanceExecuteds(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, tokenIn, tokenOut, amountIn, address, blockTimestamp, transactionHash }
            deposits(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, assets, address, blockTimestamp, transactionHash }
            withdraws(first: 20, orderBy: blockTimestamp, orderDirection: desc) { id, assets, address, blockTimestamp, transactionHash }
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
                  route: `[${vaultName}] ${shortenAddress(e.tokenIn)} → ${shortenAddress(e.tokenOut)}`,
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
                route: `Inbound to ${getVaultName(e.address)}`,
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
                route: `Outbound from ${getVaultName(e.address)}`,
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
  }, []);

  const filteredEvents = events.filter((e) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      e.txHash.toLowerCase().includes(searchLower) ||
      e.route.toLowerCase().includes(searchLower);

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
    <div className="w-full h-full flex flex-col p-6 lg:p-10 overflow-y-auto">
      {/* HEADER */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-4">
          <div className="px-3 py-1.5 border border-primary/30 bg-primary/10 text-primary text-[10px] uppercase tracking-widest font-mono tick-frame">
            Audit • On-Chain Ledger
          </div>
        </div>
        <h1 className="text-2xl font-bold text-[#f5f5f5] mb-2 font-mono uppercase tracking-widest">
          Master <span className="text-primary">Ledger</span>
        </h1>
        <p className="text-[#8a8a8a] text-xs max-w-2xl font-mono">
          {">"} The immutable audit trail of every vault rebalance, user
          deposit, and administrative action, verified directly by the BSC smart
          contracts.
        </p>
      </div>

      {/* CONTROL PANEL  */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 bg-[#0a0a0a] p-4 border border-[#1f1f1f]">
        <div className="flex flex-col sm:flex-row w-full md:w-auto gap-4 flex-grow">
          {/* SEARCH INPUT */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search Hash or Vault..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121212] border border-[#1f1f1f] py-2.5 px-4 text-xs text-[#f5f5f5] focus:outline-none focus:border-primary transition-colors font-mono placeholder:text-[#333]"
            />
          </div>

          {/* FILTER DROPDOWN */}
          <div className="relative w-full sm:w-56">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center justify-between w-full bg-[#121212] border border-[#1f1f1f] py-2.5 px-4 text-[11px] uppercase tracking-widest text-[#f5f5f5] focus:outline-none focus:border-primary transition-colors cursor-pointer font-mono"
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
                className={`w-3 h-3 text-[#8a8a8a] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
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
              <div className="absolute top-full left-0 mt-1 w-full bg-[#0a0a0a] border border-[#1f1f1f] shadow-2xl z-50 flex flex-col">
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
                    className={`w-full text-left px-4 py-3 text-[10px] uppercase tracking-widest font-mono transition-colors ${
                      filterType === option.value
                        ? "bg-primary text-[#0a0a0a] font-bold"
                        : "text-[#8a8a8a] hover:bg-[#121212] hover:text-[#f5f5f5]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/*  EXPORT BUTTON */}
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 bg-primary hover:bg-transparent text-[#0a0a0a] hover:text-primary border border-primary px-6 py-2.5 text-[11px] uppercase tracking-widest font-mono font-bold transition-colors shrink-0 justify-center w-full md:w-auto"
        >
          <Download className="w-3.5 h-3.5" />[ Export CSV ]
        </button>
      </div>

      {/* DATA GRID  */}
      <div className="bg-[#0a0a0a] border border-[#1f1f1f] flex-grow flex flex-col min-h-[400px]">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-[#121212] border-b border-[#1f1f1f] text-[10px] text-[#8a8a8a] font-mono uppercase tracking-widest">
                <th className="py-4 px-6 font-normal">Event Type</th>
                <th className="py-4 px-6 font-normal">Amount / Status</th>
                <th className="py-4 px-6 font-normal">Routing / Target</th>
                <th className="py-4 px-6 font-normal">Timestamp</th>
                <th className="py-4 px-6 font-normal">Transaction</th>
              </tr>
            </thead>
            <tbody className="text-[11px] font-mono">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#8a8a8a]">
                    <div className="flex flex-col items-center gap-3">
                      <Activity className="w-5 h-5 text-primary animate-spin" />
                      {">"} _Syncing ledger from The Graph...
                    </div>
                  </td>
                </tr>
              ) : filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-16 text-center text-[#8a8a8a]">
                    {">"} _No events found matching your parameters.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((event, idx) => (
                  <tr
                    key={`${event.txHash}-${idx}`}
                    className="border-b border-[#1f1f1f] hover:bg-[#121212] transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <EventBadge type={event.type} />
                    </td>
                    <td className="py-4 px-6 text-[#f5f5f5] tnum">
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
                        className="flex items-center gap-2 text-[#8a8a8a] hover:text-primary transition-colors"
                      >
                        [{shortenAddress(event.txHash)}]
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
    </div>
  );
}

function EventBadge({ type }: { type: EventType }) {
  switch (type) {
    case "AI_REBALANCE":
      return <span className="text-primary font-bold">[ REBALANCE ]</span>;
    case "USER_DEPOSIT":
      return <span className="text-[#f5f5f5] font-bold">[ + DEPOSIT ]</span>;
    case "USER_WITHDRAWAL":
      return <span className="text-[#8a8a8a] font-bold">[ - WITHDRAW ]</span>;
    case "ADMIN_WHITELIST":
      return <span className="text-[#c5c5c5] font-bold">[ WHITELIST ]</span>;
    case "SYSTEM_PAUSED":
      return (
        <span className="text-[#ff5f5f] font-bold animate-pulse">
          [ HALTED ]
        </span>
      );
    case "SYSTEM_UNPAUSED":
      return <span className="text-primary font-bold">[ RESUMED ]</span>;
    default:
      return <span className="text-[#8a8a8a] font-bold">[ {type} ]</span>;
  }
}

function shortenAddress(address: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
