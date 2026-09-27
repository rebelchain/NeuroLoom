// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

contract MockChainlinkOracle {
    uint8 public decimalsValue;
    int256 public price;

    constructor(uint8 _decimals, int256 _initialPrice) {
        decimalsValue = _decimals;
        price = _initialPrice;
    }

    function decimals() external view returns (uint8) {
        return decimalsValue;
    }

    function latestRoundData() external view returns (
        uint80 roundId, 
        int256 answer, 
        uint256 startedAt, 
        uint256 updatedAt, 
        uint80 answeredInRound
    ) {

        return (1, price, block.timestamp, block.timestamp, 1);
    }

    function setPrice(int256 _price) external {
        price = _price;
    }
}