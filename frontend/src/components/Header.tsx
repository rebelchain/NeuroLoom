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
    <header className="relative h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 bg-[#0a0a0a] border-b border-[#1f1f1f] z-40 sticky top-0">
      <div className="flex items-center gap-4 min-w-0">
        {/*  MENU MOBILE  */}
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-10 h-10 bg-[#121212] border border-[#1f1f1f] flex items-center justify-center text-[#8a8a8a] hover:text-primary transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-[18px] h-[18px]" strokeWidth={1.5} />
        </button>

        <button
          onClick={onBackToLanding}
          className="hidden sm:flex items-center gap-3 hover:opacity-80 transition-opacity shrink-0"
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
          <span className="font-mono font-bold text-[#f5f5f5] text-sm uppercase tracking-widest">
            NeuroLoom
          </span>
        </button>

        <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-[#333]" />
        
        {/* JUDUL HALAMAN */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-[11px] md:text-xs font-mono text-[#8a8a8a] uppercase tracking-widest truncate">
            {">"} {pageTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* RAINBOWKIT CUSTOM BUTTON  */}
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
                        className="px-5 py-2.5 bg-primary text-[#0a0a0a] border border-primary text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-transparent hover:text-primary transition-colors flex items-center gap-2"
                      >
                        <Wallet className="w-3.5 h-3.5" strokeWidth={2} />
                        <span className="hidden sm:inline">[ CONNECT WALLET ]</span>
                        <span className="sm:hidden">[ CONNECT ]</span>
                      </button>
                    );
                  }

                  if (chain.unsupported) {
                    return (
                      <button
                        onClick={openChainModal}
                        type="button"
                        className="px-5 py-2.5 bg-[#ff5f5f]/10 text-[#ff5f5f] border border-[#ff5f5f] text-[10px] font-mono font-bold uppercase tracking-widest hover:bg-[#ff5f5f]/20 transition-colors flex items-center gap-2"
                      >
                        [ WRONG NETWORK ]
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="px-5 py-2.5 bg-[#121212] text-primary border border-[#1f1f1f] text-[10px] font-mono font-bold uppercase tracking-widest hover:border-primary transition-colors flex items-center gap-2"
                    >
                      <span className="hidden sm:inline">
                        [ {account.displayName} ]
                      </span>
                      <span className="sm:hidden">[ {account.displayName.slice(0,4)}... ]</span>
                      <LogOut className="w-3.5 h-3.5 ml-1 opacity-70" strokeWidth={2} />
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