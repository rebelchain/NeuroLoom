// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Kontrak tiruan agar kita tidak perlu bergantung pada Chainlink BSC Testnet yang sering mati
contract MockOracle {
    int256 public currentPrice;
    uint256 public updatedAt;

    constructor(int256 _initialPrice) {
        currentPrice = _initialPrice;
        updatedAt = block.timestamp;
    }

    // Meniru persis fungsi asli dari Chainlink
    function latestRoundData() external view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updated,
        uint80 answeredInRound
    ) {
        // Mengembalikan harga palsu yang kita tentukan, dengan timestamp saat ini (agar tidak Stale)
        return (1, currentPrice, block.timestamp, updatedAt, 1);
    }
}