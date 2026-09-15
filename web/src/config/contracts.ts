export const CONTRACT_ADDRESSES = {
  mockUSDT: "0xFa45Fd644B34606cABFb7c8acc546E770e248b83" as `0x${string}`,
  // Menggunakan alamat Proxy UUPS yang baru di-deploy
  neuroLoom: "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E" as `0x${string}`,
} as const;

// ABI untuk fungsi produksi NeuroLoom Vault
export const NEURO_LOOM_ABI = [
  // Standar ERC-4626 (Deposit & TVL)
  {
    inputs: [
      { name: "assets", type: "uint256" },
      { name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ name: "shares", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "totalAssets",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  // Fungsi Eksekusi Produksi (Dikunci oleh AI_EXECUTOR_ROLE)
  {
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "amountOutMin", type: "uint256" },
      { name: "path", type: "address[]" },
    ],
    name: "executeRebalance",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

// Minimal ABI untuk MockUSDT (Tetap sama)
export const MOCK_USDT_ABI = [
  {
    inputs: [
      { name: "spender", type: "address" },
      { name: "value", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
