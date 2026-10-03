// hooks/useVault.ts
import { formatUnits, maxUint256, parseUnits } from "viem";
import {
  useAccount,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi";

// --- KONSTANTA & ABI ---
export const USDT_ADDRESS = "0xFa45Fd644B34606cABFb7c8acc546E770e248b83";
const VAULT_DECIMALS = 18;

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


export function useVault(vaultAddress: `0x${string}`) {
  const { address: userAddress, isConnected } = useAccount();

  const { data: walletBalance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "balanceOf",
    args: userAddress ? [userAddress] : undefined,
    query: { refetchInterval: 5000 },
  });

  const { data: vaultAssetsBalance } = useReadContract({
    address: vaultAddress,
    abi: vaultABI,
    functionName: "maxWithdraw",
    args: userAddress ? [userAddress] : undefined,
    query: { refetchInterval: 5000 },
  });

  const { data: usdtAllowance } = useReadContract({
    address: USDT_ADDRESS,
    abi: erc20ABI,
    functionName: "allowance",
    args: userAddress && vaultAddress ? [userAddress, vaultAddress] : undefined,
    query: { refetchInterval: 5000 },
  });

  const {
    writeContract: writeContractApproveUsdt,
    data: hashApproveUsdt,
    isPending: isPendingApproveUsdt,
  } = useWriteContract();
  const {
    writeContract: writeContractDeposit,
    data: hashDeposit,
    isPending: isPendingDeposit,
  } = useWriteContract();
  const {
    writeContract: writeContractWithdraw,
    data: hashWithdraw,
    isPending: isPendingWithdraw,
  } = useWriteContract();

  const {
    isLoading: isConfirmingApproveUsdt,
    isSuccess: isSuccessApproveUsdt,
  } = useWaitForTransactionReceipt({ hash: hashApproveUsdt });
  const { isLoading: isConfirmingDeposit, isSuccess: isSuccessDeposit } =
    useWaitForTransactionReceipt({ hash: hashDeposit });
  const { isLoading: isConfirmingWithdraw, isSuccess: isSuccessWithdrawTx } =
    useWaitForTransactionReceipt({ hash: hashWithdraw });

  const executeDeposit = (amountString: string) => {
    if (!userAddress) return;
    const amountBN = parseUnits(amountString, VAULT_DECIMALS);

    if (usdtAllowance !== undefined && (usdtAllowance as bigint) < amountBN) {
      writeContractApproveUsdt({
        address: USDT_ADDRESS,
        abi: erc20ABI,
        functionName: "approve",
        args: [vaultAddress, maxUint256],
      });
    } else {
      writeContractDeposit({
        address: vaultAddress,
        abi: vaultABI,
        functionName: "deposit",
        args: [amountBN, userAddress],
      });
    }
  };

  const executeWithdraw = (amountString: string) => {
    if (!userAddress) return;

    const assetsBN = parseUnits(amountString, VAULT_DECIMALS);

    writeContractWithdraw({
      address: vaultAddress,
      abi: vaultABI,
      functionName: "withdraw",
      args: [assetsBN, userAddress, userAddress],
    });
  };

  return {
    isConnected,
    userAddress,
    formattedWalletBalance: walletBalance
      ? formatUnits(walletBalance as bigint, VAULT_DECIMALS)
      : "0",
    formattedVaultShares: vaultAssetsBalance
      ? formatUnits(vaultAssetsBalance as bigint, VAULT_DECIMALS)
      : "0",

    executeDeposit,
    executeWithdraw,

    isDepositing:
      isPendingApproveUsdt ||
      isConfirmingApproveUsdt ||
      isPendingDeposit ||
      isConfirmingDeposit,
    isSuccessDeposit,
    hashDeposit: hashDeposit || hashApproveUsdt,
    needsUsdtApproval: (amountStr: string) =>
      usdtAllowance !== undefined &&
      (usdtAllowance as bigint) < parseUnits(amountStr || "0", VAULT_DECIMALS),

    isWithdrawing: isPendingWithdraw || isConfirmingWithdraw,
    isSuccessWithdraw: isSuccessWithdrawTx,
    hashWithdraw: hashWithdraw,
    needsSharesApproval: (_amountStr?: string) => false,
  };
}