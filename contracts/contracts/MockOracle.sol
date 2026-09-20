// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockOracle {
    int256 public currentPrice;
    uint256 public updatedAt;
    
    uint8 public decimals = 8; 

    constructor(int256 _initialPrice) {
        currentPrice = _initialPrice;
        updatedAt = block.timestamp;
    }


    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updated,
        uint80 answeredInRound
    ) {
        return (1, currentPrice, block.timestamp, updatedAt, 1);
    }
    
}