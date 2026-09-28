"use client";
import { useEffect, useState } from "react";
import { formatUnits, maxUint256, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

const USDT_ADDRESS = "0xA11c8D9DC9b66E209Ef60F0C8D969D3CD988782c";

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
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "maxWithdraw",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
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
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

interface VaultPanelProps {
  vaultAddress: `0x${string}`;
  vaultName: string;
  vaultSymbol: string;
  onClose: () => void;
}

export function VaultPanel({
  vaultAddress,
  vaultName,
  vaultSymbol,
  onClose,
}: VaultPanelProps) {
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");
  const { address, isConnected } = useAccount();

  const { data: userBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });
  const { data: maxWithdrawData } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: "maxWithdraw",
    args: address ? [address] : undefined,
    query: { enabled: !!address, refetchInterval: 3000 },
  });
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "allowance",
    args: address ? [address, vaultAddress] : undefined,
    query: { enabled: !!address },
  });

  const {
    data: approveHash,
    isPending: isApprovePending,
    writeContract: writeApprove,
  } = useWriteContract();
  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const {
    data: depositHash,
    isPending: isDepositPending,
    writeContract: writeDeposit,
  } = useWriteContract();
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });
  const {
    data: withdrawHash,
    isPending: isWithdrawPending,
    writeContract: writeWithdraw,
  } = useWriteContract();
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const parsedAmount =
    amount && !isNaN(Number(amount)) ? parseUnits(amount, 6) : BigInt(0);
  const needsApproval =
    allowance !== undefined && (allowance as bigint) < parsedAmount;

  useEffect(() => {
    if (isApproveSuccess) refetchAllowance();
  }, [isApproveSuccess, refetchAllowance]);

  const handleExecute = () => {
    if (!amount || parsedAmount === BigInt(0)) return;
    if (action === "deposit") {
      if (needsApproval) {
        writeApprove({
          address: USDT_ADDRESS,
          abi: erc20ABI,
          functionName: "approve",
          args: [vaultAddress, maxUint256],
        });
      } else {
        writeDeposit({
          address: vaultAddress,
          abi: vaultABI,
          functionName: "deposit",
          args: [parsedAmount, address as `0x${string}`],
        });
      }
    } else {
      writeWithdraw({
        address: vaultAddress,
        abi: vaultABI,
        functionName: "withdraw",
        args: [
          parsedAmount,
          address as `0x${string}`,
          address as `0x${string}`,
        ],
      });
    }
  };

  let buttonText = "Enter Amount";
  let isButtonDisabled = true;
  const hasInsufficientDeposit =
    userBalance !== undefined && (userBalance as bigint) < parsedAmount;
  const hasInsufficientWithdraw =
    maxWithdrawData !== undefined && (maxWithdrawData as bigint) < parsedAmount;

  if (!isConnected) {
    buttonText = "Connect Wallet First";
  } else if (amount && parsedAmount > BigInt(0)) {
    if (action === "deposit" && hasInsufficientDeposit) {
      buttonText = "Insufficient USDT";
      isButtonDisabled = true;
    } else if (action === "withdraw" && hasInsufficientWithdraw) {
      buttonText = "Exceeds Vault Balance";
      isButtonDisabled = true;
    } else if (action === "deposit") {
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
      if (isWithdrawPending) buttonText = "Confirming in Wallet...";
      else if (isWithdrawConfirming) buttonText = "Withdrawing...";
      else if (isWithdrawSuccess) buttonText = "Withdraw Success!";
      else {
        buttonText = "Execute Withdrawal";
        isButtonDisabled = false;
      }
    }
  }

  const activeHash = depositHash || approveHash || withdrawHash;
  const displayBalance =
    action === "deposit"
      ? userBalance
        ? formatUnits(userBalance as bigint, 6)
        : "0"
      : maxWithdrawData
        ? formatUnits(maxWithdrawData as bigint, 6)
        : "0";

  return (
    <div className="rounded-[16px] bg-[#0a0a0a]/95 backdrop-blur-xl border border-white/[0.12] p-7 flex flex-col gap-7 relative w-full max-w-md mx-auto shadow-[inset_0_1px_0_rgba(255,255,255,0.05),_0_24px_48px_rgba(0,0,0,0.8)]">
      <div className="flex justify-between items-start border-b border-white/[0.08] pb-4">
        <div>
          <h2 className="text-[14px] font-bold font-mono uppercase tracking-widest text-[#f5f5f5]">
            Target: {vaultName}
          </h2>
          <p className="text-[10px] font-mono text-[#8a8a8a] mt-1.5">
            {">"} Contract:{" "}
            <span className="text-[#a0a0a0]">
              {vaultAddress.slice(0, 6)}...{vaultAddress.slice(-4)}
            </span>
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-md bg-white/[0.02] border border-white/[0.08] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-white/[0.05] transition-colors flex items-center justify-center font-mono text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
        >
          X
        </button>
      </div>

      <div className="flex gap-6 border-b border-white/[0.08] font-mono text-[11px] uppercase tracking-widest">
        <button
          onClick={() => {
            setAction("deposit");
            setAmount("");
          }}
          className={`pb-3 border-b-2 transition-all duration-300 ${action === "deposit" ? "text-[#f5f5f5] border-primary text-[11.5px]" : "text-[#6a6a6a] border-transparent hover:text-[#a0a0a0]"}`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setAction("withdraw");
            setAmount("");
          }}
          className={`pb-3 border-b-2 transition-all duration-300 ${action === "withdraw" ? "text-[#f5f5f5] border-primary text-[11.5px]" : "text-[#6a6a6a] border-transparent hover:text-[#a0a0a0]"}`}
        >
          Withdraw
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
          <label className="text-[#8a8a8a]">{">"} Asset Amount</label>
          <span
            className="text-[#a0a0a0] cursor-pointer hover:text-primary transition-colors border-b border-dashed border-[#555] pb-[1px]"
            onClick={() => setAmount(displayBalance)}
          >
            {action === "deposit" ? "Wallet" : "Vault"}:{" "}
            {Number(displayBalance).toFixed(2)} USDT
          </span>
        </div>

        {/* Inset Glass Input */}
        <div className="flex items-center justify-between bg-black/40 border border-white/[0.08] rounded-md p-3.5 focus-within:border-primary/60 shadow-[inset_0_2px_5px_rgba(0,0,0,0.5)] transition-colors">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={
              isApprovePending ||
              isApproveConfirming ||
              isDepositPending ||
              isDepositConfirming ||
              isWithdrawPending ||
              isWithdrawConfirming
            }
            className="bg-transparent text-[22px] font-medium text-[#f5f5f5] outline-none w-full font-mono placeholder:text-[#333] disabled:opacity-50"
          />
          <span className="font-mono text-[11px] font-bold text-primary bg-white/[0.04] px-3 py-1.5 rounded-md border border-white/[0.08] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            {vaultSymbol.split("/")[0]}
          </span>
        </div>
      </div>

      {/* Solid Primary Button styling */}
      <button
        onClick={handleExecute}
        disabled={
          isButtonDisabled ||
          isApprovePending ||
          isApproveConfirming ||
          isDepositPending ||
          isDepositConfirming ||
          isWithdrawPending ||
          isWithdrawConfirming
        }
        className={`w-full h-12 rounded-md font-mono text-[11.5px] uppercase tracking-[0.2em] font-bold transition-all duration-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.2)] border 
          ${
            isButtonDisabled
              ? "bg-white/[0.02] border-white/[0.05] text-[#555] cursor-not-allowed shadow-none"
              : isDepositSuccess || isWithdrawSuccess
                ? "bg-primary text-[#0a0a0a] border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)]"
                : needsApproval && action === "deposit"
                  ? "bg-white/[0.1] border-white/[0.2] text-[#f5f5f5] hover:bg-white/[0.15]"
                  : "bg-primary border-primary text-[#0a0a0a] hover:bg-primary/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.4),_0_0_20px_rgba(139,92,246,0.25)] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.5),_0_0_30px_rgba(139,92,246,0.4)]"
          }`}
      >
        {isApprovePending ||
        isApproveConfirming ||
        isDepositPending ||
        isDepositConfirming ||
        isWithdrawPending ||
        isWithdrawConfirming ? (
          <span className="flex items-center justify-center gap-3 animate-pulse text-[#0a0a0a]">
            [ EXECUTING... ]
          </span>
        ) : (
          `[ ${buttonText} ]`
        )}
      </button>

      {activeHash && (
        <a
          href={`https://testnet.bscscan.com/tx/${activeHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-center text-primary hover:text-[#a78bfa] transition-colors font-mono truncate px-4"
        >
          {">"} TX:{" "}
          <span className="border-b border-primary/30 pb-[1px]">
            {activeHash.slice(0, 14)}...
          </span>
        </a>
      )}
    </div>
  );
}
