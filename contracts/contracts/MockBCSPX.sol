// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockBCSPX is ERC20 {
    constructor() ERC20("Mock Backed CSPX", "bCSPX") {
        // Otomatis mencetak 10.000 bCSPX ke dompet deployer (kamu) saat di-deploy!
        _mint(msg.sender, 10000 * 10 ** decimals());
    }
}