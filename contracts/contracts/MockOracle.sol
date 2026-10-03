// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockOracle {
    int256 public price;
    uint8 public decimalsValue;
    uint256 public updatedAt;

    constructor(int256 initialPrice, uint8 _decimals) {
        price = initialPrice;
        decimalsValue = _decimals;
        updatedAt = block.timestamp;
    }

    function setPrice(int256 newPrice) external {
        price = newPrice;
        updatedAt = block.timestamp;
    }

    function latestRoundData() external view returns (
        uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt_, uint80 answeredInRound
    ) {
        return (0, price, 0, updatedAt, 0);
    }

    function decimals() external view returns (uint8) {
        return decimalsValue;
    }
}