"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ChevronRight, LogOut, Menu, Wallet } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
  onBackToLanding?: () => void;
  onOpenMobile?: () => void;
  pageTitle?: string;
}

export function Header({
  onBackToLanding,
  onOpenMobile,
  pageTitle = "Dashboard",
}: HeaderProps) {
  return (
    <header className="relative h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/[0.08] z-40 sticky top-0">
      <div className="flex items-center gap-4 min-w-0">
        {/* MENU MOBILE */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-10 h-10 rounded-lg bg-white/[0.02] border border-white/[0.08] flex items-center justify-center text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.05] transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </button>

        <button
          onClick={onBackToLanding}
          className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0 group"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/[0.15] to-transparent border border-primary/20 flex items-center justify-center shadow-[0_0_15px_rgba(139,92,246,0.2)] group-hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all overflow-hidden p-0">
            <Image
              src="/neuroloom2.png"
              alt="NeuroLoom Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain scale-110"
              priority
            />
          </div>
          <span className="font-mono font-bold text-[#f5f5f5] text-sm uppercase tracking-widest">
            NeuroLoom
          </span>
        </button>

        <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-[#444]" />

        {/* JUDUL HALAMAN */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11.5px] md:text-[12px] font-mono text-[#8a8a8a] uppercase tracking-[0.15em] truncate">
            {">"} {pageTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* RAINBOWKIT CUSTOM BUTTON */}
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
                        className="relative flex items-center gap-2 h-9 sm:h-[40px] px-4 sm:px-5 rounded-md bg-gradient-to-b from-white via-[#e7e7e7] to-[#cfcfcf] text-[#111] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-white shadow-[inset_0_1px_0_rgba(255,255,255,0.95)] hover:from-white hover:via-[#f3f6ff] hover:to-[#d5def2] hover:shadow-[inset_0_1px_0_#fff,0_0_20px_rgba(186,208,255,0.3)] transition-all duration-300"
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
                        className="relative flex items-center gap-2 h-9 sm:h-[40px] px-4 sm:px-5 rounded-md bg-gradient-to-br from-[#ff5f5f]/[0.15] to-black/[0.45] text-[#ff5f5f] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-[#ff5f5f]/[0.45] shadow-[inset_0_1px_0_rgba(255,95,95,0.12)] hover:border-[#ff5f5f] hover:shadow-[0_0_20px_rgba(255,95,95,0.25)] transition-all duration-300"
                      >
                        Wrong Network
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="relative flex items-center gap-2 h-9 sm:h-[40px] px-4 sm:px-5 rounded-md bg-gradient-to-br from-white/[0.1] to-black/[0.45] text-[#f5f5f5] font-mono font-bold text-[10.5px] uppercase tracking-widest border border-white/[0.3] shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] hover:border-primary/75 hover:text-primary hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.22),0_0_20px_rgba(139,92,246,0.25)] transition-all duration-300 group"
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
