"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createConfig, http, WagmiProvider } from "wagmi";
import { bscTestnet } from "wagmi/chains";
import { useState } from "react";

// 1. Konfigurasi Wagmi (Koneksi Wallet ke BSC Testnet)
export const wagmiConfig = createConfig({
  chains: [bscTestnet],
  transports: {
    [bscTestnet.id]: http(),
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  // QueryClient diinisialisasi di dalam komponen agar stabil dan aman dari SSR
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {/* Kita buang ApolloProvider, cukup gunakan React Query */}
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
