"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { ArrowRight, LogOut, ShieldCheck, Wallet } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { useAccount, useDisconnect } from "wagmi";

interface IdentityGateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onContinue: () => void;
}

export function IdentityGateModal({
  isOpen,
  onClose,
  onContinue,
}: IdentityGateModalProps) {
  const { address, isConnected, status } = useAccount();
  const { disconnect } = useDisconnect();
  const [mounted, setMounted] = useState(false);

  // Menghindari Hydration Mismatch dari Next.js
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!isOpen || !mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md bg-[#0b1120] border border-white/[0.08] shadow-2xl rounded-3xl overflow-hidden liquid-glass-strong p-8 animate-scale-up">
        {/* Header Modal */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-black border border-white/10 rounded-xl flex items-center justify-center shadow-inner">
            <Image
              src="/neuroloom2.png"
              alt="NeuroLoom Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain scale-110"
              priority
            />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm tracking-wide">
              NEUROLOOM
            </h3>
            <p className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">
              identity gate · evm wallet
            </p>
          </div>
        </div>

        {isConnected ? (
          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-success/10 border border-success/20 rounded-2xl flex items-center justify-center mb-5 shadow-[0_0_20px_rgba(34,197,94,0.15)]">
              <ShieldCheck className="w-8 h-8 text-success" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Wallet connected
            </h2>
            <p className="text-sm text-gray-400 mb-6 leading-relaxed">
              Your identity is bound to the AI Vault. You can now securely enter
              the dashboard.
            </p>

            <div className="w-full bg-black/40 border border-white/[0.05] rounded-2xl p-4 font-mono text-xs mb-6">
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500">account</span>
                <span className="text-gray-600">—</span>
              </div>
              <div className="flex justify-between items-center mb-3">
                <span className="text-gray-500">evm</span>
                <span className="text-primary-light">
                  {address?.slice(0, 6)}...{address?.slice(-4)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-500">status</span>
                <span className="text-success">connected</span>
              </div>
            </div>

            <button
              onClick={onContinue}
              className="w-full bg-primary hover:bg-primary-light text-white font-semibold py-3.5 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mb-4 shadow-[0_0_15px_rgba(139,92,246,0.4)]"
            >
              Continue <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => disconnect()}
              className="text-xs text-gray-500 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3 h-3" /> Use a different wallet
            </button>
          </div>
        ) : (

          <div className="flex flex-col items-center text-center animate-fade-in-up">
            <div className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-5">
              <Wallet className="w-8 h-8 text-gray-400" />
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              Authentication
            </h2>
            <p className="text-sm text-gray-400 mb-8 leading-relaxed">
              Please connect your Web3 wallet to verify your identity and access
              the NeuroLoom platform.
            </p>

            <div className="w-full flex justify-center">
              <ConnectButton />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
