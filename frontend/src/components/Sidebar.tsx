import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ScrollText,
  TerminalSquare,
  Wallet,
  X,
} from "lucide-react";
import Image from "next/image";
import { type ElementType } from "react";

export type PageId = "overview" | "vaults" | "terminal" | "history";

interface SidebarProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onBackToLanding?: () => void;
}

const navItems: { id: PageId; label: string; icon: ElementType }[] = [
  { id: "overview", label: "Dashboard", icon: LayoutDashboard },
  { id: "vaults", label: "Strategy Vaults", icon: Wallet }, 
  { id: "terminal", label: "AI Terminal", icon: TerminalSquare },
  { id: "history", label: "Audit Trail", icon: ScrollText }, 
];

function SidebarContent({
  activePage,
  onNavigate,
  onBackToLanding,
}: Pick<SidebarProps, "activePage" | "onNavigate" | "onBackToLanding">) {
  return (
    <>
      {/* HEADER LOGO */}
      <div className="px-5 py-6 border-b border-[#1f1f1f]">
        <button
          onClick={onBackToLanding}
          title="Back to NeuroLoom landing"
          className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer w-full group"
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
            <div className="text-[15px] font-bold tracking-widest text-[#f5f5f5] uppercase font-mono">
              NeuroLoom
            </div>
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary mt-1">
              AI Yield Optimizer
            </div>
          </div>
        </button>
      </div>

      {/* MENU NAVIGASI */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <div className="px-2 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#8a8a8a] font-mono"></div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group w-full flex items-center gap-3 px-3 py-3 text-sm transition-all duration-200 text-left relative border",
                active
                  ? "bg-[#121212] border-[#1f1f1f] text-primary" 
                  : "bg-transparent border-transparent text-[#8a8a8a] hover:bg-[#121212] hover:border-[#1f1f1f] hover:text-[#f5f5f5]",
              )}
            >
              {active && (
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-primary shadow-[0_0_8px_var(--color-primary)]" />
              )}

              <span
                className={cn(
                  "flex items-center justify-center transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-[#8a8a8a] group-hover:text-primary",
                )}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </span>
              <span className="font-medium tracking-wide">{item.label}</span>

              {item.id === "terminal" && (
                <span className="ml-auto text-[9px] uppercase tracking-widest px-1.5 py-0.5 border border-primary/30 bg-primary/10 text-primary font-mono">
                  Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="px-5 py-6 border-t border-[#1f1f1f] space-y-4 bg-[#0a0a0a]">
        <div className="flex items-center gap-2 px-3 py-3 border border-[#1f1f1f] bg-[#121212] tick-frame">
          <span className="w-1.5 h-1.5 bg-primary animate-pulse" />
          <span className="text-[10px] font-mono tracking-widest text-[#c5c5c5] uppercase">
            BSC Testnet
          </span>
          <span className="ml-auto font-mono text-[10px] text-primary uppercase">
            Synced
          </span>
        </div>
        <p className="text-[10px] leading-relaxed text-[#8a8a8a] font-mono">
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
      {/* SIDEBAR DESKTOP */}
      <aside className="hidden lg:flex w-64 flex-col shrink-0 bg-[#0a0a0a] border-r border-[#1f1f1f] min-h-screen relative z-40">
        <SidebarContent
          activePage={activePage}
          onNavigate={onNavigate}
          onBackToLanding={onBackToLanding}
        />
      </aside>

      {/* SIDEBAR MOBILE */}
      <div
        className={cn(
          "fixed inset-0 z-[100] lg:hidden transition-opacity duration-300",
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
      >
        <div
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          onClick={onCloseMobile}
        />
        <aside
          className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0a0a0a] flex flex-col border-r border-[#1f1f1f] shadow-2xl transition-transform duration-300"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-110%)",
          }}
        >
          <button
            onClick={onCloseMobile}
            className="absolute top-6 right-4 w-8 h-8 border border-[#1f1f1f] bg-[#121212] flex items-center justify-center text-[#8a8a8a] hover:text-primary hover:border-primary transition-colors"
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
