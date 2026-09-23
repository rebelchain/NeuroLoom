// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {ERC1967Proxy} from "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";

/**
 * @title NeuroLoomProxy
 * @dev A custom UUPS proxy implementation secures the vault's TVL.
 */
contract NeuroLoomProxy is ERC1967Proxy {
    constructor(address logic, bytes memory data) payable ERC1967Proxy(logic, data) {}
}