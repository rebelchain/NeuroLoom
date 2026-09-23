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
    <header className="relative h-16 shrink-0 flex items-center justify-between gap-4 px-4 md:px-6 bg-[rgba(9,14,28,0.6)] backdrop-blur-2xl border-b border-white/[0.07] z-40 sticky top-0">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobile}
          className="lg:hidden w-9 h-9 rounded-xl liquid-glass flex items-center justify-center text-gray-400 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <button
          onClick={onBackToLanding}
          className="hidden sm:flex items-center gap-2.5 hover:opacity-80 transition-opacity shrink-0"
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
          <span className="font-bold text-white text-sm tracking-tight">
            NEUROLOOM
          </span>
        </button>

        <ChevronRight className="hidden sm:block w-3.5 h-3.5 text-gray-500" />
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs md:text-sm font-medium text-gray-400 truncate">
            {pageTitle}
          </span>
          {/* <span className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 border border-success/25 text-[10px] text-success font-medium">
            <span className="w-1 h-1 rounded-full bg-success animate-pulse" />
            LIVE
          </span> */}
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full liquid-glass text-[11px]">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-gray-400 font-mono">BSC Testnet</span>
        </div> */}

        {/* JURUS RAHASIA: Custom RainbowKit Button */}
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
                        className="px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 liquid-glass liquid-cta liquid-glass-button"
                      >
                        <Wallet className="w-4 h-4" strokeWidth={2} />
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
                        className="px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 liquid-glass border border-red-500/30 text-red-500"
                      >
                        Wrong network
                      </button>
                    );
                  }

                  return (
                    <button
                      onClick={openAccountModal}
                      type="button"
                      className="px-4 md:px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 liquid-glass border border-primary/30 text-primary"
                    >
                      <LogOut className="w-4 h-4" strokeWidth={2} />
                      <span className="hidden sm:inline">
                        {account.displayName}
                      </span>
                      <span className="sm:hidden">✓</span>
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
