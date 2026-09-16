"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { useState } from "react";

// Import RainbowKit
import {
  RainbowKitProvider,
  getDefaultConfig,
  darkTheme,
} from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

// 1. Konfigurasi Wagmi + RainbowKit
export const wagmiConfig = getDefaultConfig({
  appName: "NeuroLoom DeFi Vault",
  projectId: "a3285d6d372e5390b3b1c529505c224d", // Ganti dengan Project ID dari WalletConnect (bisa asal untuk test lokal)
  chains: [bscTestnet],
  ssr: true,
});

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient diinisialisasi di dalam komponen agar stabil dan aman dari SSR
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={darkTheme({ accentColor: "#8b5cf6" })}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
