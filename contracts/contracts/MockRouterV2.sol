// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract NeuroMockRouterV2 {
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        require(block.timestamp <= deadline, "Expired");
        
        address tokenIn = path[0];
        address tokenOut = path[path.length - 1];

        IERC20(tokenIn).transferFrom(msg.sender, address(this), amountIn);


        IERC20(tokenOut).transfer(to, amountOutMin);

        amounts = new uint256[](path.length);
        amounts[0] = amountIn;
        amounts[path.length - 1] = amountOutMin;
        return amounts;
    }
}