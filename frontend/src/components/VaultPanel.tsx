"use client";
import { useEffect, useState } from "react";
import { maxUint256, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

// 1. ALAMAT SMART CONTRACT
const VAULT_ADDRESS = "0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E";
// ⚠️ PENTING: Ganti dengan alamat kontrak USDT Testnet yang kamu gunakan!
const USDT_ADDRESS = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83"; // (Ini sekadar contoh alamat USDT BSC Testnet standar)

// 2. ABI KONTRAK
const vaultABI = [
  {
    inputs: [
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
    ],
    name: "deposit",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "assets", type: "uint256" },
      { internalType: "address", name: "receiver", type: "address" },
      { internalType: "address", name: "owner", type: "address" },
    ],
    name: "withdraw",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

const erc20ABI = [
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;

export function VaultPanel() {
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const { address, isConnected } = useAccount();

  // ==========================================
  // WEB3 HOOKS: READ & WRITE
  // ==========================================

  // A. Membaca status Allowance (Surat Kuasa) dari Token USDT
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "allowance",
    args: address ? [address, VAULT_ADDRESS] : undefined,
    query: {
      enabled: !!address, // Hanya jalan jika dompet terhubung
    },
  });

  // B. Hook untuk transaksi APPROVE
  const {
    data: approveHash,
    isPending: isApprovePending,
    writeContract: writeApprove,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });

  // C. Hook untuk transaksi DEPOSIT
  const {
    data: depositHash,
    isPending: isDepositPending,
    writeContract: writeDeposit,
  } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });

  // D. Hook untuk transaksi WITHDRAW (TAMBAHKAN INI)
  const {
    data: withdrawHash,
    isPending: isWithdrawPending,
    writeContract: writeWithdraw,
  } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  // ==========================================
  // LOGIKA STATUS UI
  // ==========================================

  // Konversi input string ke format Wei (BigInt)
  const parsedAmount =
    amount && !isNaN(Number(amount)) ? parseUnits(amount, 18) : BigInt(0);

  // Mengecek apakah kita butuh Approval (Allowance < jumlah yang mau dideposit)
  const needsApproval =
    allowance !== undefined && (allowance as bigint) < parsedAmount;

  // Polling otomatis untuk memperbarui allowance setelah approve sukses
  useEffect(() => {
    if (isApproveSuccess) {
      refetchAllowance();
    }
  }, [isApproveSuccess, refetchAllowance]);

  // Fungsi saat tombol diklik
  const handleExecute = () => {
    if (!amount || parsedAmount === BigInt(0)) return;

    if (action === "deposit") {
      if (needsApproval) {
        // Eksekusi Approve (Unlimited / maxUint256 agar user tidak perlu approve berkali-kali)
        writeApprove({
          address: USDT_ADDRESS,
          abi: erc20ABI,
          functionName: "approve",
          args: [VAULT_ADDRESS, maxUint256],
        });
      } else {
        // Eksekusi Deposit (2 parameter: jumlah dan penerima)
        writeDeposit({
          address: VAULT_ADDRESS,
          abi: vaultABI,
          functionName: "deposit",
          args: [parsedAmount, address as `0x${string}`], // <--- Tambahkan address di sini!
        });
      }
    } else {
      // TAMBAHKAN LOGIKA WITHDRAW INI:
      writeWithdraw({
        address: VAULT_ADDRESS,
        abi: vaultABI,
        functionName: "withdraw",
        // 3 parameter: jumlah ditarik, penerima (kita), pemilik share (kita)
        args: [
          parsedAmount,
          address as `0x${string}`,
          address as `0x${string}`,
        ],
      });
    }
  };

  // Logika Cerdas Teks Tombol
  let buttonText = "Enter Amount";
  let isButtonDisabled = true;

  if (!isConnected) {
    buttonText = "Connect Wallet First";
  } else if (amount && parsedAmount > BigInt(0)) {
    if (action === "deposit") {
      if (needsApproval) {
        if (isApprovePending) buttonText = "Confirming in Wallet...";
        else if (isApproveConfirming) buttonText = "Approving USDT...";
        else if (isApproveSuccess) buttonText = "Approval Success!";
        else {
          buttonText = "Approve USDT";
          isButtonDisabled = false;
        }
      } else {
        if (isDepositPending) buttonText = "Confirming in Wallet...";
        else if (isDepositConfirming) buttonText = "Executing on BSC...";
        else if (isDepositSuccess) buttonText = "Deposit Success!";
        else {
          buttonText = "Execute Deposit";
          isButtonDisabled = false;
        }
      }
    } else {
      buttonText = "Execute Withdrawal";
      isButtonDisabled = false;
    }
  }

  // Tentukan Hash aktif yang akan ditampilkan di layar
  const activeHash = depositHash || approveHash;

  return (
    <aside className="bg-[#0b1120]/90 rounded-3xl border border-white/[0.05] p-6 flex flex-col gap-6 relative overflow-hidden backdrop-blur-2xl shadow-2xl">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-[80px] pointer-events-none"></div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-white/[0.05] pb-3 relative z-10">
        <button
          onClick={() => setAction("deposit")}
          className={`font-semibold tracking-wide pb-2 border-b-2 transition-colors ${action === "deposit" ? "text-white border-primary" : "text-gray-500 border-transparent hover:text-gray-300"}`}
        >
          Deposit Asset
        </button>
        <button
          onClick={() => setAction("withdraw")}
          className={`font-semibold tracking-wide pb-2 border-b-2 transition-colors ${action === "withdraw" ? "text-white border-primary" : "text-gray-500 border-transparent hover:text-gray-300"}`}
        >
          Withdraw
        </button>
      </div>

      {/* Input Form */}
      <div className="flex flex-col gap-2 relative z-10">
        <label className="text-[10px] font-mono text-gray-400 uppercase tracking-wider">
          Amount
        </label>
        <div className="flex items-center justify-between bg-black/60 border border-white/10 rounded-xl p-3 focus-within:border-primary/50 transition-colors">
          <input
            type="number"
            placeholder="0.0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={
              isApprovePending ||
              isApproveConfirming ||
              isDepositPending ||
              isDepositConfirming
            }
            className="bg-transparent text-2xl text-white outline-none w-full font-mono placeholder:text-gray-700 disabled:opacity-50"
          />
          <span className="font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg text-sm">
            USDT
          </span>
        </div>
      </div>

      {/* Route Info */}
      <div className="flex flex-col gap-3 p-4 bg-white/[0.02] rounded-xl border border-white/[0.05] relative z-10">
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">AI Strategy Pool</span>
          <span className="text-white font-mono">Dynamic Multi-Routing</span>
        </div>
        <div className="flex justify-between text-xs">
          <span className="text-gray-400">Simulated APY</span>
          <span className="text-success font-mono font-bold">~24.5%</span>
        </div>
      </div>

      {/* Tombol Eksekusi Cerdas */}
      <button
        onClick={handleExecute}
        disabled={
          isButtonDisabled ||
          isApprovePending ||
          isApproveConfirming ||
          isDepositPending ||
          isDepositConfirming
        }
        className={`w-full py-4 rounded-xl font-bold tracking-wide transition-all relative z-10
          ${
            isButtonDisabled
              ? "bg-gray-800 text-gray-500 cursor-not-allowed"
              : isDepositSuccess
                ? "bg-success text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]"
                : needsApproval && action === "deposit"
                  ? "bg-info text-white hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]" // Warna berbeda untuk Approve
                  : "bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] hover:-translate-y-0.5"
          }
        `}
      >
        {isApprovePending ||
        isApproveConfirming ||
        isDepositPending ||
        isDepositConfirming ? (
          <span className="flex items-center justify-center gap-2">
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {buttonText}
          </span>
        ) : (
          buttonText
        )}
      </button>

      {/* Link BscScan jika transaksi berhasil dikirim */}
      {activeHash && (
        <a
          href={`https://testnet.bscscan.com/tx/${activeHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-center text-primary hover:underline font-mono truncate relative z-10"
        >
          Tx: {activeHash.slice(0, 14)}...
        </a>
      )}
    </aside>
  );
}
