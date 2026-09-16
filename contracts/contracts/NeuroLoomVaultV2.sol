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

    // Event yang akan "didengar" oleh The Graph untuk grafik Frontend
    event RebalanceExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 timestamp
    );
    // Fungsi untuk memperbarui alamat router dari V2 ke V3 
    function setDexRouter(address _newRouter) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_newRouter != address(0), "Invalid Router Address");
        dexRouter = IPancakeRouter02(_newRouter); 
    }

/**
     * @dev Fungsi Eksekusi TRUE OMNICHAIN
     * Menerima byte data mentah dari AI Agent (Python) untuk dieksekusi ke target mana pun.
     */
    function executeOmnichain(
        address targetProtocol,
        bytes calldata data,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOutMin
    ) external onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        require(amountIn > 0, "Amount must be > 0");
        require(targetProtocol != address(0), "Invalid target");

        // 1. Validasi slippage awal dengan Chainlink Oracle (Circuit Breaker)
        _validateSlippageAgainstOracle(tokenIn, tokenOut, amountIn, expectedAmountOutMin);

        // 2. Approve protokol tujuan secara dinamis
        IERC20(tokenIn).forceApprove(targetProtocol, amountIn);

        // 3. Snapshot saldo sebelum eksekusi (Proteksi Lapis 2)
        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        // 4. Eksekusi instruksi AI (Bisa berupa swap V2, swap V3, deposit Venus, dll)
        (bool success, bytes memory returnData) = targetProtocol.call(data);
        
        // Membungkam warning unused returnData
        require(success || returnData.length > 0, "Omnichain routing failed");
        require(success, "Transaction reverted at target protocol");

        // 5. Validasi hasil akhir yang mutlak (Mencegah AI kena sandwich attack / slippage)
        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require((balanceAfter - balanceBefore) >= expectedAmountOutMin, "Fatal: Post-execution slippage/loss detected");

        emit RebalanceExecuted(tokenIn, tokenOut, amountIn, block.timestamp);
    }

   /**
     * @dev Proteksi Manipulasi & MEV: Kalkulasi ketat berbasis Oracle
     */
    function _validateSlippageAgainstOracle(
        address /* tokenIn */, 
        address /* tokenOut */, 
        uint256 amountIn, 
        uint256 amountOutMin 
    ) internal view virtual override { // [PERBAIKAN 1]: Tambahkan kata kunci "override" di sini
        (
            /* uint80 roundID */,
            int256 price,
            /* uint startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = priceFeed.latestRoundData();

        // 1. Cek Data Basi
        if (block.timestamp - updatedAt > 3600) revert StaleOracleData();
        require(price > 0, "Invalid Oracle Price");

        uint256 oraclePrice = uint256(price);

        // 2. Normalisasi Desimal & Hitung Fair Value
        uint256 expectedAmountOut = (amountIn * oraclePrice) / 1e8;

        // 3. Kalkulasi Minimum Acceptable (Batas Slippage 2%)
        uint256 minimumAcceptableAmount = (expectedAmountOut * (10000 - MAX_SLIPPAGE_BPS)) / 10000;

        // 4. Circuit Breaker!
        if (amountOutMin < minimumAcceptableAmount) {
            // [PERBAIKAN 2]: Hapus argumen agar sesuai dengan deklarasi "error SlippageExceeded();" di V1
            revert SlippageExceeded(); 
        }
    }
}