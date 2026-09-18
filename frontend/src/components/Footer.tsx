"use client";
import { ShieldCheck } from "lucide-react";
import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.05] bg-[#050814] pt-16 pb-8 relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-32 bg-primary/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 mb-16">
          {/* 1. Brand Anchor */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/50 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xl font-bold text-white tracking-wide">
                NeuroLoom
              </span>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
              The first autonomous, AI-driven DeFi vault on the BNB Chain.
              Maximizing yield through real-time dynamic multi-routing and
              strict MEV protection.
            </p>
            <div className="flex items-center gap-4">
              <SocialLink
                href="https://github.com/r3belchain/NeuroLoom"
                icon={<GithubIcon />}
              />
              <SocialLink href="#" icon={<XIcon />} />
              <SocialLink href="#" icon={<DiscordIcon />} />
            </div>
          </div>

          {/* 2. Navigation Columns */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Navigation
            </h4>
            <ul className="space-y-3">
              {/* Diubah menjadi ScrollLink agar seragam dengan Navbar */}
              <ScrollLink targetId="features">Why NeuroLoom</ScrollLink>
              <ScrollLink targetId="how-it-works">Execution Flow</ScrollLink>
              <ScrollLink targetId="protocols">Integrations</ScrollLink>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Developers
            </h4>
            <ul className="space-y-3">
              <FooterLink href="https://testnet.bscscan.com/address/0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E">
                Smart Contracts
              </FooterLink>
              <FooterLink href="https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.2">
                The Graph API
              </FooterLink>
              <FooterLink href="https://github.com/r3belchain/NeuroLoom/blob/main/README.md">
                Documentation
              </FooterLink>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold mb-4 text-sm tracking-wider uppercase">
              Ecosystem
            </h4>
            <ul className="space-y-3">
              <FooterLink href="https://pancakeswap.finance">
                PancakeSwap V3
              </FooterLink>
              <FooterLink href="https://data.chain.link">
                Chainlink Oracles
              </FooterLink>
              <FooterLink href="https://venus.io">Venus Protocol</FooterLink>
            </ul>
          </div>
        </div>

        {/* 3. Bottom Bar & Trust Signals */}
        <div className="pt-8 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-gray-500 text-xs font-mono">
            &copy; {currentYear} NeuroLoom. Built for Indonesia Web3 Hackathon. BNB Smart Chain.
          </div>

          <div className="flex items-center gap-6 text-xs font-mono">
            <span className="text-gray-500">
              Vault Version: V2 - UUPS Proxy
            </span>
            <div className="flex items-center gap-2 bg-success/10 border border-success/20 px-3 py-1.5 rounded-full">
              <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
              <span className="text-success tracking-widest uppercase">
                BSC Testnet: Operational
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ==========================================
// BANTUAN KOMPONEN & SVG KUSTOM
// ==========================================

function ScrollLink({
  targetId,
  children,
}: {
  targetId: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <button
        onClick={() => {
          document
            .getElementById(targetId)
            ?.scrollIntoView({ behavior: "smooth" });
        }}
        className="text-gray-400 text-sm hover:text-primary transition-colors duration-200"
      >
        {children}
      </button>
    </li>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-gray-400 text-sm hover:text-primary transition-colors duration-200"
      >
        {children}
      </a>
    </li>
  );
}

function SocialLink({ href, icon }: { href: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-primary/20 hover:border-primary/50 transition-all duration-200"
    >
      {icon}
    </a>
  );
}

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 22.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function DiscordIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
    </svg>
  );
}
