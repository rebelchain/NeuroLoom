"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { LogOut, Sparkles, Wallet } from "lucide-react";
import Image from "next/image";

export type PageId =
  | "overview"
  | "vaults"
  | "terminal"
  | "history"
  | "simulation";

interface TopNavProps {
  activePage: PageId;
  onNavigate: (page: PageId) => void;
  onBackToLanding: () => void;
}

const navItems: { id: PageId; label: string }[] = [
  { id: "overview", label: "Activity" },
  { id: "vaults", label: "Vaults" },
  { id: "terminal", label: "Terminal" },
  { id: "history", label: "Audit" },
];

export function TopNav({
  activePage,
  onNavigate,
  onBackToLanding,
}: TopNavProps) {
  return (
    <header className="relative shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 py-4 bg-[#0a0a0a]/90 backdrop-blur-md border-b border-[#1f1f1f] z-40 sticky top-0">
      {/* LEFT: Logo & Brand */}
      <div className="flex items-center shrink-0">
        <button
          onClick={onBackToLanding}
          className="flex items-center gap-3 hover:opacity-80 transition-opacity group cursor-pointer"
          title="Back to Landing"
        >
          <div className="w-10 h-10 rounded-xl bg-[#121212] border border-[#1f1f1f] flex items-center justify-center overflow-hidden p-0">
            <Image
              src="/neuroloom2.png"
              alt="NeuroLoom Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain scale-110"
              priority
            />
          </div>
          <div className="hidden lg:block text-left">
            <div className="font-mono font-bold text-[#f5f5f5] text-sm tracking-widest uppercase">
              NeuroLoom
            </div>
          </div>
        </button>
      </div>

      {/* CENTER: Pill Navigation (Text only, clean brutalist matte) */}
      <nav className="flex-1 max-w-[600px] flex items-center justify-center overflow-x-auto no-scrollbar">
        <div className="flex items-center bg-[#121212] border border-[#1f1f1f] p-1 rounded-full shrink-0">
          {navItems.map((item) => {
            const isActive = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`flex items-center px-4 sm:px-6 py-2 sm:py-2.5 rounded-full text-[11px] font-mono tracking-widest uppercase transition-all duration-200 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#222222] text-[#f5f5f5] font-semibold border border-[#333]"
                    : "bg-transparent text-[#8a8a8a] hover:text-[#f5f5f5] border border-transparent"
                }`}
              >
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* RIGHT: Wallet Connect & Demo Button */}
      <div className="flex items-center shrink-0 gap-3">
        <button
          onClick={() => onNavigate("simulation")}
          className={`flex items-center gap-2 h-9 sm:h-[38px] px-3 sm:px-4 rounded-lg font-mono font-bold text-[10.5px] uppercase tracking-widest transition-all duration-300 border cursor-pointer ${
            activePage === "simulation"
              ? "bg-primary/20 text-primary border-primary/50 shadow-[0_0_12px_rgba(139,92,246,0.3)]"
              : "bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hover:border-primary/50"
          }`}
        >
          <span className="hidden sm:inline">Demo Simulation</span>
        </button>

        <ConnectButton.Custom>
          {({
            account,
            chain,
            openAccountModal,
            openChainModal,
            openConnectModal,
            authenticationStatus,
            mounted,
          }) => {
            const ready = mounted && authenticationStatus !== "loading";
            const connected =
              ready &&
              account &&
              chain &&
              (!authenticationStatus ||
                authenticationStatus === "authenticated");

            return (
              <div
                {...(!ready && {
                  "aria-hidden": true,
                  style: {
                    opacity: 0,
                    pointerEvents: "none",
                    userSelect: "none",
                  },
                })}
              >
                {(() => {
                  if (!connected) {
                    return (
                      <button
                        onClick={openConnectModal}
                        type="button"
                        className="relative flex items-center gap-2 h-9 sm:h-[38px] px-4 sm:px-5 rounded-lg bg-[#f5f5f5] text-[#111] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-white hover:bg-white transition-all duration-200 cursor-pointer"
                      >
                        <Wallet className="w-3.5 h-3.5" strokeWidth={2.5} />
                        <span className="hidden sm:inline">Connect Wallet</span>
                        <span className="sm:hidden">Connect</span>
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="relative flex items-center gap-2 h-9 sm:h-[38px] px-4 sm:px-5 rounded-lg bg-[#ff5f5f]/10 text-[#ff5f5f] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-[#ff5f5f]/30 hover:border-[#ff5f5f]/60 transition-all duration-200 cursor-pointer"
                      >
                        Wrong Network
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="relative flex items-center gap-2 h-9 sm:h-[38px] px-4 sm:px-5 rounded-lg bg-[#161616] text-[#f5f5f5] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-[#2a2a2a] hover:border-[#444] hover:text-white transition-all duration-200 group cursor-pointer"
                    >
                      <span className="hidden sm:inline">
                        {account.displayName}
                      </span>
                      <span className="sm:hidden">
                        {account.displayName.slice(0, 4)}...
                      </span>
                      <LogOut
                        className="w-3.5 h-3.5 ml-1 opacity-60 group-hover:opacity-100 transition-opacity"
                        strokeWidth={2}
                      />
                    </button>
                  );
                })()}
              </div>
            );
          }}
        </ConnectButton.Custom>
      </div>
    </header>
  );
}
