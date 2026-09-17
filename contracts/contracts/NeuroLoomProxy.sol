// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title NeuroLoomProxy
 * @dev Custom UUPS Proxy implementation mengamankan TVL Vault.
 */
contract NeuroLoomProxy is ERC1967Proxy {
    constructor(address logic, bytes memory data) payable ERC1967Proxy(logic, data) {}
}