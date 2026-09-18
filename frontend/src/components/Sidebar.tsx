import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScrollText,
  TerminalSquare,
  Wallet,
  X,
} from "lucide-react";
import { type ElementType } from "react";
import Image from "next/image";

export type PageId = "overview" | "vaults" | "terminal" | "history";

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onBackToLanding?: () => void;
}

// ATM: Kita ganti menu bawaan Hypotecha dengan menu NeuroLoom
const navItems: { id: PageId; label: string; icon: ElementType }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "vaults", label: "Smart Vaults", icon: Wallet },
  { id: "terminal", label: "AI Terminal", icon: TerminalSquare },
  { id: "history", label: "History", icon: ScrollText },
];

function SidebarContent({
  activePage,
  onNavigate,
  onBackToLanding,
}: Pick<SidebarProps, "activePage" | "onNavigate" | "onBackToLanding">) {
  return (
    <>
      <div className="px-5 py-5 border-b border-white/[0.06]">
        <button
          onClick={onBackToLanding}
          title="Back to NeuroLoom landing"
          className="flex items-center gap-3 hover:opacity-80 transition-opacity cursor-pointer w-full"
        >
          <div className="w-10 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.3)] overflow-hidden p-0">
            <Image
              src="/neuroloom2.png"
              alt="NeuroLoom Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain scale-110"
              priority
            />
          </div>
          <div className="text-left">
            <div className="text-[15px] font-bold tracking-tight text-white">
              NEUROLOOM
            </div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-gray-500">
              AI Yield Optimizer
            </div>
          </div>
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10px] uppercase tracking-[0.2em] text-gray-500">
          Platform
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left relative",
                active
                  ? "liquid-glass text-primary border border-primary/25"
                  : "text-gray-400 hover:bg-white/[0.04] hover:text-white border border-transparent",
              )}
            >
              <span
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200",
                  active
                    ? "bg-primary/15 text-primary shadow-inner"
                    : "bg-[#151d33] text-gray-500 group-hover:text-white",
                )}
              >
                <Icon className="w-4 h-4" strokeWidth={1.75} />
              </span>
              {item.label}
              {item.id === "terminal" && (
                <span className="ml-auto text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-success/15 text-success">
                  Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-4 py-4 border-t border-white/[0.06] space-y-2">
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl liquid-glass text-[11px]">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-gray-300 font-medium">BSC Testnet</span>
          <span className="ml-auto font-mono text-gray-500">Synced</span>
        </div>
        <p className="px-3 text-[10px] leading-relaxed text-gray-500">
          Autonomous yield execution powered by Intent-Driven AI.
        </p>
      </div>
    </>
  );
}

export function Sidebar({
  activePage,
  onNavigate,
  mobileOpen,
  onCloseMobile,
  onBackToLanding,
}: SidebarProps) {
  return (
    <>
      <aside className="hidden lg:flex w-64 flex-col shrink-0 bg-[rgba(9,14,28,0.72)] backdrop-blur-2xl border-r border-white/[0.07] min-h-screen relative z-40">
        <SidebarContent
          activePage={activePage}
          onNavigate={onNavigate}
          onBackToLanding={onBackToLanding}
        />
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
        <aside
          className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0b1120] flex flex-col border-r border-white/10 shadow-2xl transition-transform duration-300"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-110%)",
          }}
        >
          <button
            onClick={onCloseMobile}
            className="absolute top-4 right-4 w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
          <SidebarContent
            activePage={activePage}
            onNavigate={onNavigate}
            onBackToLanding={onBackToLanding}
          />
        </aside>
      </div>
    </>
  );
}
