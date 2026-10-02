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
  vaultId: string;
  vaultName: string;
  vaultAddress: string;
  vaultSymbol: string;
  onClose: () => void;
}

export function VaultPanel({
  vaultName,
  vaultAddress,
  vaultSymbol,
  onClose,
}: VaultPanelProps) {
  const { address: userAddress, isConnected } = useAccount();
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const { data: userBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { refetchInterval: 5000 },
  });

  const { data: allowanceData } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "allowance",
    args:
      userAddress && vaultAddress
        ? [userAddress, vaultAddress as `0x${string}`]
        : undefined,
    query: { refetchInterval: 5000 },
  });

  const { data: maxWithdrawData } = useReadContract({
    address: vaultAddress as `0x${string}`,
    abi: vaultABI,
    functionName: "maxWithdraw",
    args: userAddress ? [userAddress] : undefined,
    query: { refetchInterval: 5000 },
  });

  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();
  const {
    writeContract: writeDeposit,
    data: depositHash,
    isPending: isDepositPending,
  } = useWriteContract();
  const {
    writeContract: writeWithdraw,
    data: withdrawHash,
    isPending: isWithdrawPending,
  } = useWriteContract();

  const { isLoading: isApproveConfirming, isSuccess: isApproveSuccess } =
    useWaitForTransactionReceipt({ hash: approveHash });
  const { isLoading: isDepositConfirming, isSuccess: isDepositSuccess } =
    useWaitForTransactionReceipt({ hash: depositHash });
  const { isLoading: isWithdrawConfirming, isSuccess: isWithdrawSuccess } =
    useWaitForTransactionReceipt({ hash: withdrawHash });

  const parsedAmount =
    amount && !isNaN(Number(amount)) && Number(amount) > 0
      ? parseUnits(amount, 6)
      : BigInt(0);

  const needsApproval =
    action === "deposit" &&
    parsedAmount > BigInt(0) &&
    allowanceData !== undefined &&
    (allowanceData as bigint) < parsedAmount;

  const handleMax = () => {
    if (action === "deposit") {
      if (userBalance) {
        setAmount(formatUnits(userBalance as bigint, 6));
      }
    } else {
      if (maxWithdrawData) {
        setAmount(formatUnits(maxWithdrawData as bigint, 6));
      }
    }
  };

  const handleExecute = () => {
    if (!isConnected || !userAddress || parsedAmount === BigInt(0)) return;

    if (action === "deposit") {
      if (needsApproval) {
        writeApprove({
          address: USDT_ADDRESS,
          abi: erc20ABI,
          functionName: "approve",
          args: [vaultAddress as `0x${string}`, maxUint256],
        });
      } else {
        writeDeposit({
          address: vaultAddress as `0x${string}`,
          abi: vaultABI,
          functionName: "deposit",
          args: [parsedAmount, userAddress],
        });
      }
    } else {
      writeWithdraw({
        address: vaultAddress as `0x${string}`,
        abi: vaultABI,
        functionName: "withdraw",
        args: [parsedAmount, userAddress, userAddress],
      });
    }
  };

  useEffect(() => {
    if (isDepositSuccess || isWithdrawSuccess) {
      const timer = setTimeout(() => {
        setAmount("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isDepositSuccess, isWithdrawSuccess]);

  let buttonText = "Enter Amount";
  let isButtonDisabled = true;

  if (!isConnected) {
    buttonText = "Wallet Not Connected";
  } else if (!amount || Number(amount) <= 0) {
    buttonText = "Enter Amount";
  } else {
    if (action === "deposit") {
      if (needsApproval) {
        if (isApprovePending) buttonText = "Confirm Approval...";
        else if (isApproveConfirming) buttonText = "Approving...";
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
    <div className="rounded-2xl bg-[#121212] border border-[#1f1f1f] p-7 flex flex-col gap-6 relative w-full max-w-md mx-auto shadow-2xl">
      <div className="flex justify-between items-start border-b border-[#1f1f1f] pb-4">
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
          className="w-8 h-8 rounded-lg bg-[#181818] border border-[#262626] text-[#8a8a8a] hover:text-[#f5f5f5] hover:bg-[#202020] transition-colors flex items-center justify-center font-mono text-xs cursor-pointer"
        >
          ✕
        </button>
      </div>

      <div className="flex gap-6 border-b border-[#1f1f1f] font-mono text-[11px] uppercase tracking-widest">
        <button
          onClick={() => {
            setAction("deposit");
            setAmount("");
          }}
          className={`pb-3 border-b-2 transition-all duration-200 cursor-pointer ${action === "deposit" ? "text-[#f5f5f5] border-primary text-[11.5px]" : "text-[#6a6a6a] border-transparent hover:text-[#a0a0a0]"}`}
        >
          Deposit
        </button>
        <button
          onClick={() => {
            setAction("withdraw");
            setAmount("");
          }}
          className={`pb-3 border-b-2 transition-all duration-200 cursor-pointer ${action === "withdraw" ? "text-[#f5f5f5] border-primary text-[11.5px]" : "text-[#6a6a6a] border-transparent hover:text-[#a0a0a0]"}`}
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

        {/* Input */}
        <div className="flex items-center justify-between bg-[#181818] border border-[#262626] rounded-xl p-3.5 focus-within:border-primary/60 transition-colors">
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
          <span className="font-mono text-[11px] font-bold text-primary bg-[#202020] px-3 py-1.5 rounded-lg border border-[#2f2f2f]">
            {vaultSymbol.split("/")[0]}
          </span>
        </div>
      </div>

      {/* Button styling */}
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
        className={`w-full h-11 rounded-xl font-mono text-[11.5px] uppercase tracking-[0.2em] font-bold transition-all duration-200 border cursor-pointer 
          ${
            isButtonDisabled
              ? "bg-[#181818] border-[#262626] text-[#555] cursor-not-allowed"
              : isDepositSuccess || isWithdrawSuccess
                ? "bg-[#10b981] text-[#0a0a0a] border-[#10b981]"
                : needsApproval && action === "deposit"
                  ? "bg-[#f5f5f5] border-white text-[#111] hover:bg-white"
                  : "bg-primary border-primary text-[#0a0a0a] hover:bg-primary/90"
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
