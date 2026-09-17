// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title MockDex
 * @dev Mensimulasikan DEX untuk pengujian Omnichain (Jalur Sukses)
 */
contract MockDex {
    using SafeERC20 for IERC20;

    // Fungsi ini mensimulasikan calldata yang akan dikirim oleh AI (Orchestrator)
    function swapExactTokens(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 amountOut
    ) external {
        // 1. Tarik tokenIn dari pengirim (Vault)
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);
        
        // 2. Kirim tokenOut ke pengirim (Vault) sebagai hasil swap
        IERC20(tokenOut).safeTransfer(msg.sender, amountOut);
    }
}