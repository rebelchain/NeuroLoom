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
      <div className="px-5 py-6 border-b border-white/[0.08]">
        <button
          onClick={onBackToLanding}
          title="Back to NeuroLoom landing"
          className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer w-full group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/[0.15] to-transparent border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)] overflow-hidden p-0">
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
            <div className="text-[9px] uppercase tracking-[0.3em] text-primary mt-1 opacity-80">
              AI Yield Optimizer
            </div>
          </div>
        </button>
      </div>

      {/* MENU NAVIGASI */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        <div className="px-2 pb-4 text-[10px] uppercase tracking-[0.2em] text-[#6a6a6a] font-mono">
          Control Panel
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activePage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={cn(
                "group w-full flex items-center gap-3.5 px-3.5 py-3 text-[13.5px] transition-all duration-200 text-left relative rounded-md border",
                active
                  ? "bg-gradient-to-r from-white/[0.045] to-transparent border-white/[0.06] text-[#f5f5f5] shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
                  : "bg-transparent border-transparent text-[#8a8a8a] hover:bg-white/[0.02] hover:border-white/[0.04] hover:text-[#f5f5f5]",
              )}
            >
              {active && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-[60%] rounded-r-md bg-primary shadow-[0_0_12px_var(--color-primary)]" />
              )}

              <span
                className={cn(
                  "flex items-center justify-center transition-all duration-200",
                  active
                    ? "text-primary"
                    : "text-[#555] group-hover:text-[#8a8a8a]",
                )}
              >
                <Icon className="w-[18px] h-[18px]" strokeWidth={1.5} />
              </span>
              <span
                className={cn(
                  "tracking-wide",
                  active ? "font-medium" : "font-normal",
                )}
              >
                {item.label}
              </span>

              {item.id === "terminal" && (
                <span className="ml-auto flex items-center gap-1.5 h-5 px-2 rounded-full border border-primary/30 bg-primary/10 text-[9px] uppercase tracking-widest text-primary font-mono">
                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                  Live
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* FOOTER & STATUS PANEL */}
      <div className="px-5 py-6 border-t border-white/[0.08] space-y-4 bg-transparent">
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-md border border-white/[0.12] bg-gradient-to-br from-white/[0.045] via-white/[0.01] to-primary/[0.02] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse shadow-[0_0_8px_var(--color-primary)]" />
          <span className="text-[10px] font-mono tracking-[0.15em] text-[#d5d5d5] uppercase">
            BSC Testnet
          </span>
          <span className="ml-auto font-mono text-[9px] tracking-widest text-primary uppercase">
            Synced
          </span>
        </div>
        <p className="text-[10.5px] leading-relaxed text-[#6a6a6a] font-mono px-1">
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
      <aside className="hidden lg:flex w-64 flex-col shrink-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-r border-white/[0.08] min-h-screen relative z-40">
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
          className="absolute inset-y-0 left-0 w-72 max-w-[85vw] bg-[#0a0a0a] flex flex-col border-r border-white/[0.08] shadow-2xl transition-transform duration-300"
          style={{
            transform: mobileOpen ? "translateX(0)" : "translateX(-110%)",
          }}
        >
          <button
            onClick={onCloseMobile}
            className="absolute top-6 right-4 w-8 h-8 rounded-md border border-white/[0.12] bg-white/[0.02] flex items-center justify-center text-[#8a8a8a] hover:text-white hover:bg-white/[0.05] transition-colors"
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
