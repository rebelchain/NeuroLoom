import { useState, useEffect } from "react";

// Struktur data ini persis seperti yang akan kamu ambil dari Smart Contract nanti
export interface VaultAllocation {
  protocol: string;
  percentage: number;
  colorClass: string; // Untuk UI
}

export interface VaultData {
  id: string;
  name: string;
  risk: "Low Risk" | "Med Risk" | "High Risk";
  tvl: number;
  apy: number;
  drawdown: number;
  allocations: VaultAllocation[];
}

export function useVaultTelemetry() {
  const [vaults, setVaults] = useState<VaultData[]>([
    {
      id: "vault-1",
      name: "THE YIELD FARM",
      risk: "Low Risk",
      tvl: 503284.12,
      apy: 14.5,
      drawdown: 0.8,
      allocations: [
        {
          protocol: "Venus Protocol (vUSDT)",
          percentage: 65.0,
          colorClass: "bg-primary",
        },
        {
          protocol: "PancakeSwap (USDT/USDC)",
          percentage: 25.0,
          colorClass: "bg-primary/50",
        },
        {
          protocol: "Idle Capital",
          percentage: 10.0,
          colorClass: "bg-[#1f1f1f] bg-stripes",
        },
      ],
    },
    {
      id: "vault-2",
      name: "BLUECHIP MOMENTUM",
      risk: "Med Risk",
      tvl: 1245000.5,
      apy: 22.4,
      drawdown: 4.2,
      allocations: [
        {
          protocol: "Pancake V3 (WBNB/USDT)",
          percentage: 55.0,
          colorClass: "bg-[#00ED64]",
        },
        {
          protocol: "Kinza Finance (Lending)",
          percentage: 35.0,
          colorClass: "bg-[#00ED64]/40",
        },
        {
          protocol: "Idle Capital",
          percentage: 10.0,
          colorClass: "bg-[#1f1f1f] bg-stripes",
        },
      ],
    },
    {
      id: "vault-3",
      name: "DEGEN ACCUMULATOR",
      risk: "High Risk",
      tvl: 890120.0,
      apy: 38.2,
      drawdown: 14.5,
      allocations: [
        {
          protocol: "Radiant (Cross-Chain)",
          percentage: 85.0,
          colorClass: "bg-[#ff5f5f]",
        },
        {
          protocol: "Idle Capital",
          percentage: 15.0,
          colorClass: "bg-[#1f1f1f] bg-stripes",
        },
      ],
    },
  ]);

  useEffect(() => {
    const interval = setInterval(() => {
      setVaults((prev) =>
        prev.map((vault) => ({
          ...vault,
          tvl: vault.tvl + (Math.random() * 200 - 100),
          apy: Number((vault.apy + (Math.random() * 0.4 - 0.2)).toFixed(2)),
        })),
      );
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return { vaults, isLoading: false };
}
