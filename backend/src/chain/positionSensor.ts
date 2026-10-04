import { createPublicClient, http, parseAbi } from "viem";
import { bscTestnet } from "viem/chains";
import { CONFIG } from "../config.js";

const NFPM_ABI = parseAbi([
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function positions(uint256 tokenId) view returns (uint96 nonce, address operator, address token0, address token1, uint24 fee, int24 tickLower, int24 tickUpper, uint128 liquidity, uint256 feeGrowthInside0LastX128, uint256 feeGrowthInside1LastX128, uint128 tokensOwed0, uint128 tokensOwed1)",
]);

function priceToTick(price: number): number {
  return Math.floor(Math.log(price) / Math.log(1.0001));
}

export interface PositionHealth {
  hasActivePosition: boolean;
  tokenId?: string;
  tickLower?: number;
  tickUpper?: number;
  currentTick?: number;
  status?: "IN_RANGE" | "OUT_OF_RANGE_BELOW" | "OUT_OF_RANGE_ABOVE";
  recommendation: string;
}

export async function checkVaultPosition(
  vaultAddress: string,
  currentMarketPrice: number,
): Promise<PositionHealth> {
  const publicClient = createPublicClient({
    chain: bscTestnet,
    transport: http(CONFIG.RPC_URL),
  });
  const nfpmAddress = CONFIG.PROTOCOLS.PANCAKE_V3_MANAGER as `0x${string}`;
  const vault = vaultAddress as `0x${string}`;

  try {
    const balance = await publicClient.readContract({
      address: nfpmAddress,
      abi: NFPM_ABI,
      functionName: "balanceOf",
      args: [vault],
    });

    if (balance === 0n) {
      return {
        hasActivePosition: false,
        recommendation:
          "Vault has no active LP positions. Capital is currently idle.",
      };
    }

    const tokenId = await publicClient.readContract({
      address: nfpmAddress,
      abi: NFPM_ABI,
      functionName: "tokenOfOwnerByIndex",
      args: [vault, balance - 1n],
    });

    const position = await publicClient.readContract({
      address: nfpmAddress,
      abi: NFPM_ABI,
      functionName: "positions",
      args: [tokenId],
    });

    const tickLower = position[5];
    const tickUpper = position[6];
    const liquidity = position[7];

    if (liquidity === 0n) {
      return {
        hasActivePosition: false,
        recommendation: "LP NFT exists but liquidity is zero (already closed).",
      };
    }

    const currentTick = priceToTick(currentMarketPrice);
    let status: "IN_RANGE" | "OUT_OF_RANGE_BELOW" | "OUT_OF_RANGE_ABOVE" =
      "IN_RANGE";
    let recommendation = "Position is IN RANGE and healthy. Earning fees.";

    if (currentTick < tickLower) {
      status = "OUT_OF_RANGE_BELOW";
      recommendation = `CRITICAL: Price dropped below tickLower. Position is 100% WBNB. Realizing Impermanent Loss! EXECUTE close_liquidity_v3 IMMEDIATELY with tokenId "${tokenId}" to cut loss.`;
    } else if (currentTick > tickUpper) {
      status = "OUT_OF_RANGE_ABOVE";
      recommendation = `WARNING: Price surged above tickUpper. Position is 100% USDT. Upside potential is bleeding! EXECUTE close_liquidity_v3 with tokenId "${tokenId}" to harvest fees and prepare for rebalance.`;
    }

    return {
      hasActivePosition: true,
      tokenId: tokenId.toString(),
      tickLower,
      tickUpper,
      currentTick,
      status,
      recommendation,
    };
  } catch (error) {
    console.error(
      `[SENSOR ERROR] Failed to fetch position for ${vaultAddress}:`,
      error,
    );
    return {
      hasActivePosition: false,
      recommendation:
        "Error reading on-chain position data. Proceed with caution.",
    };
  }
}
