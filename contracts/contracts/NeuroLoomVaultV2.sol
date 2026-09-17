// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {NeuroLoomVault, IPancakeRouter02, IChainlinkAggregator} from "./NeuroLoomVault.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {IERC20Metadata} from "@openzeppelin/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// [PERBAIKAN OPENZEPPELIN V5]: Menggunakan ReentrancyGuard standar yang sudah mendukung ERC-7201 Upgradeable
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

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
 * @dev Upgrade V2: ReentrancyGuard, Protocol Whitelist, Multi-Pair Oracle & Deprecation of legacy routing.
 */
contract NeuroLoomVaultV2 is NeuroLoomVault, ReentrancyGuard {
    using SafeERC20 for IERC20;

    uint256 public constant MAX_SLIPPAGE_BPS = 200; // 2% maksimal slippage

    // Storage untuk Whitelist & Multi-Oracle 
    mapping(address => bool) public approvedProtocols;
    mapping(address => mapping(address => address)) public pairPriceFeeds;

    event RebalanceExecuted(
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 timestamp
    );

    // --- ADMIN CONFIGURATIONS ---
    function setApprovedProtocol(address protocol, bool status) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(protocol != address(0), "Invalid address");
        approvedProtocols[protocol] = status;
    }

    function setPairPriceFeed(address tokenIn, address tokenOut, address feed) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(feed != address(0), "Invalid feed address");
        pairPriceFeeds[tokenIn][tokenOut] = feed;
    }

    // --- DEPRECATE LEGACY FUNCTION ---
    function executeRebalance(
        uint256,
        uint256,
        address[] calldata
    ) external pure override {
        revert("Deprecated, use executeOmnichain");
    }

    /**
     * @dev Fungsi Eksekusi TRUE OMNICHAIN
     * Dilindungi oleh nonReentrant dari OZ v5 dan Protocol Whitelist.
     */
    function executeOmnichain(
        address targetProtocol,
        bytes calldata data,
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 expectedAmountOutMin
    ) external nonReentrant onlyRole(AI_EXECUTOR_ROLE) whenNotPaused {
        require(amountIn > 0, "Amount must be > 0");
        require(approvedProtocols[targetProtocol], "Protocol not approved");

        _validateSlippageAgainstOracle(tokenIn, tokenOut, amountIn, expectedAmountOutMin);

        IERC20(tokenIn).forceApprove(targetProtocol, amountIn);

        uint256 balanceBefore = IERC20(tokenOut).balanceOf(address(this));

        (bool success, ) = targetProtocol.call(data);
        require(success, "Transaction reverted at target protocol");

        uint256 balanceAfter = IERC20(tokenOut).balanceOf(address(this));
        require((balanceAfter - balanceBefore) >= expectedAmountOutMin, "Fatal: Post-execution slippage/loss detected");

        emit RebalanceExecuted(tokenIn, tokenOut, amountIn, block.timestamp);
    }

   /**
     * @dev Proteksi MEV OMNICHAIN: Menghitung Fair Value antar pasangan koin dengan desimal dinamis.
     */
    function _validateSlippageAgainstOracle(
        address tokenIn, 
        address tokenOut, 
        uint256 amountIn, 
        uint256 amountOutMin 
    ) internal view override { 
        address feedAddress = pairPriceFeeds[tokenIn][tokenOut];
        require(feedAddress != address(0), "No oracle feed configured for this pair");

        IChainlinkAggregator feed = IChainlinkAggregator(feedAddress);
        (
            /* uint80 roundID */,
            int256 price,
            /* uint startedAt */,
            uint256 updatedAt,
            /* uint80 answeredInRound */
        ) = feed.latestRoundData();

        if (block.timestamp - updatedAt > 3600) revert StaleOracleData();
        require(price > 0, "Invalid Oracle Price");

        uint8 tokenInDecimals = IERC20Metadata(tokenIn).decimals();
        uint8 tokenOutDecimals = IERC20Metadata(tokenOut).decimals();
        uint8 feedDecimals = feed.decimals(); 

        uint256 expectedAmountOut = (amountIn * uint256(price) * (10 ** tokenOutDecimals)) / 
                                    ((10 ** tokenInDecimals) * (10 ** feedDecimals));

        uint256 minimumAcceptableAmount = (expectedAmountOut * (10000 - MAX_SLIPPAGE_BPS)) / 10000;

        if (amountOutMin < minimumAcceptableAmount) {
            revert SlippageExceeded(); 
        }
    }
}