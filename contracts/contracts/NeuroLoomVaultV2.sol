// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;


import {NeuroLoomVault, IPancakeRouter02} from "./NeuroLoomVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Antarmuka ASLI PancakeSwap V3
interface ISwapRouterV3 {
    struct ExactInputSingleParams {
        address tokenIn;
        address tokenOut;
        uint24 fee;
        address recipient;
        uint256 deadline;
        uint256 amountIn;
        uint256 amountOutMinimum;
        uint160 sqrtPriceLimitX96;
    }
    function exactInputSingle(ExactInputSingleParams calldata params) external payable returns (uint256 amountOut);
}

/**
 * @title NeuroLoomVaultV2
 * @dev Upgrade V2: Integrasi PancakeSwap V3 Router & Proteksi Slippage Chainlink On-Chain
 */
contract NeuroLoomVaultV2 is NeuroLoomVault {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_SLIPPAGE_BPS = 200; // 2% maksimal slippage (1 BPS = 0.01%)

    // Fungsi untuk memperbarui alamat router dari V2 ke V3 (Hanya Admin)
    function setDexRouter(address _newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRouter != address(0), "Invalid Router Address");
        dexRouter = IPancakeRouter02(_newRouter); // Sekarang IPancakeRouter02 sudah dikenali!
    }

    /**
     * @dev Fungsi Eksekusi V2 menggunakan PancakeSwap V3
     */
    function executeRebalanceV3(
        address tokenIn,
        address tokenOut,
        uint24 poolFee,
        uint256 amountIn,
        uint256 amountOutMin
    ) external onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        require(amountIn > 0, "Amount must be > 0");
        
        // 1. HARD GUARDRAILS: Cek harga AI vs Chainlink Oracle
        _validateSlippageAgainstOracle(tokenIn, tokenOut, amountIn, amountOutMin);

        // 2. Eksekusi swap di PancakeSwap V3
        IERC20(tokenIn).forceApprove(address(dexRouter), amountIn);

        ISwapRouterV3.ExactInputSingleParams memory params = ISwapRouterV3.ExactInputSingleParams({
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            fee: poolFee,
            recipient: address(this),
            deadline: block.timestamp + 300,
            amountIn: amountIn,
            amountOutMinimum: amountOutMin,
            sqrtPriceLimitX96: 0
        });

        ISwapRouterV3(address(dexRouter)).exactInputSingle(params);
    }

    /**
     * @dev Proteksi Manipulasi & MEV: Kalkulasi ketat berbasis Oracle
     */
    function _validateSlippageAgainstOracle(
        address /* tokenIn */, 
        address /* tokenOut */, 
        uint256 amountIn, 
        uint256 amountOutMin
    ) internal view override {
        (
            ,
            int256 price,
            ,
            uint256 updatedAt,
            
        ) = priceFeed.latestRoundData();

        if (block.timestamp - updatedAt > 3600) revert StaleOracleData();
        require(price > 0, "Oracle price <= 0");

        // Asumsi standar: MockUSDT (18 decimals) dikonversi ke BNB (18 decimals)
        // Chainlink BNB/USD Oracle biasanya memiliki 8 decimals.
        // Formula: Expected BNB = (amountIn * 1e8) / oraclePrice
        
        uint256 oraclePrice = uint256(price);
        uint256 expectedAmountOut = (amountIn * 1e8) / oraclePrice;

        // Toleransi slippage maksimal 2% (MAX_SLIPPAGE_BPS = 200)
        // Minimum amount out wajar = expectedAmountOut * 98%
        uint256 lowestAcceptableOut = (expectedAmountOut * (10000 - MAX_SLIPPAGE_BPS)) / 10000;

        // Jika AI mencoba mengeksekusi swap yang menghasilkan output di bawah harga wajar Oracle -> REVERT!
        if (amountOutMin < lowestAcceptableOut) {
            revert SlippageExceeded();
        }
    }
}