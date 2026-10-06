"use client";
import { useEffect, useState } from "react";
import { useVault } from "../lib/useVault";

interface VaultPanelProps {
  vaultId: string;
  vaultName: string;
  vaultAddress: string;
  vaultSymbol: string;
  onClose: () => void;
}

function formatCurrencyLocal(value: string | number) {
  const num = typeof value === "string" ? Number(value) : value;
  if (isNaN(num)) return "0.00";
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(num);
}

export function VaultPanel({
  vaultName,
  vaultAddress,
  vaultSymbol,
  onClose,
}: VaultPanelProps) {
  const [action, setAction] = useState<"deposit" | "withdraw">("deposit");
  const [amount, setAmount] = useState("");

  const {
    isConnected,
    formattedWalletBalance,
    formattedVaultShares,
    executeDeposit,
    executeWithdraw,
    isDepositing,
    isSuccessDeposit,
    hashDeposit,
    needsUsdtApproval,
    isWithdrawing,
    isSuccessWithdraw,
    hashWithdraw,
    needsSharesApproval,
  } = useVault(vaultAddress as `0x${string}`);

  useEffect(() => {
    if (isSuccessDeposit || isSuccessWithdraw) {
      const timer = setTimeout(() => {
        setAmount("");
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [isSuccessDeposit, isSuccessWithdraw]);

  const handleMax = () => {
    setAmount(
      action === "deposit" ? formattedWalletBalance : formattedVaultShares,
    );
  };

  const handleExecute = () => {
    if (!amount || Number(amount) <= 0) return;
    if (action === "deposit") {
      executeDeposit(amount);
    } else {
      executeWithdraw(amount);
    }
  };

  const isInputEmpty = !amount || Number(amount) <= 0;
  const isExecuting = action === "deposit" ? isDepositing : isWithdrawing;
  const isSuccess = action === "deposit" ? isSuccessDeposit : isSuccessWithdraw;
  const txHash = action === "deposit" ? hashDeposit : hashWithdraw;

  let buttonText = "ENTER AMOUNT";
  if (!isConnected) buttonText = "WALLET NOT CONNECTED";
  else if (isExecuting) buttonText = "EXECUTING...";
  else if (isSuccess && isInputEmpty) buttonText = "SUCCESS!";
  else if (!isInputEmpty) {
    if (action === "deposit") {
      buttonText = needsUsdtApproval(amount)
        ? "APPROVE USDT"
        : "EXECUTE DEPOSIT";
    } else {
      buttonText = needsSharesApproval(amount)
        ? "APPROVE SHARES"
        : "EXECUTE WITHDRAW";
    }
  }

  const isButtonDisabled = !isConnected || isInputEmpty || isExecuting;

  const displayBalance =
    action === "deposit" ? formattedWalletBalance : formattedVaultShares;

  const cleanDisplayBalance = formatCurrencyLocal(displayBalance);
  const assetLabel = action === "deposit" ? "USDT" : "SHARES";

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
          <label className="text-[#8a8a8a]">{">"} Amount</label>
          <span
            className="text-[#a0a0a0] cursor-pointer hover:text-primary transition-colors border-b border-dashed border-[#555] pb-[1px]"
            onClick={handleMax}
          >
            {action === "deposit" ? "Wallet" : "Vault"}: {cleanDisplayBalance}{" "}
            {assetLabel}
          </span>
        </div>

        <div className="flex items-center justify-between bg-[#181818] border border-[#262626] rounded-xl p-3.5 focus-within:border-primary/60 transition-colors">
          <input
            type="number"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={isExecuting}
            className="bg-transparent text-[22px] font-medium text-[#f5f5f5] outline-none w-full font-mono placeholder:text-[#333] disabled:opacity-50"
          />
          <span className="font-mono text-[11px] font-bold text-primary bg-[#202020] px-3 py-1.5 rounded-lg border border-[#2f2f2f]">
            {action === "deposit" ? "USDT" : "SHARES"}
          </span>
        </div>
      </div>

      <button
        onClick={handleExecute}
        disabled={isButtonDisabled}
        className={`w-full h-11 rounded-xl font-mono text-[11.5px] uppercase tracking-[0.2em] font-bold transition-all duration-200 border cursor-pointer 
          ${
            isButtonDisabled
              ? "bg-[#181818] border-[#262626] text-[#555] cursor-not-allowed"
              : isSuccess && isInputEmpty
                ? "bg-[#10b981] text-[#0a0a0a] border-[#10b981]"
                : "bg-primary border-primary text-[#0a0a0a] hover:bg-primary/90"
          }`}
      >
        {isExecuting ? (
          <span className="flex items-center justify-center gap-3 animate-pulse text-[#0a0a0a]">
            [ {buttonText} ]
          </span>
        ) : (
          `[ ${buttonText} ]`
        )}
      </button>

      {txHash && (
        <a
          href={`https://testnet.bscscan.com/tx/${txHash}`}
          target="_blank"
          rel="noreferrer"
          className="text-[10px] text-center text-primary hover:text-[#a78bfa] transition-colors font-mono truncate px-4"
        >
          {">"} TX:{" "}
          <span className="border-b border-primary/30 pb-[1px]">
            {txHash.slice(0, 14)}...
          </span>
        </a>
      )}
    </div>
  );
}
