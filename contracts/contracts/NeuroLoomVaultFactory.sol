// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {NeuroLoomVault} from "./NeuroLoomVault.sol"; 

contract NeuroLoomVaultFactory is Ownable {
    address public immutable vaultImplementation;
    address[] public allVaults;

    event VaultCreated(address indexed vaultAddress, address indexed asset, string name);

    constructor(address _vaultImplementation) Ownable(msg.sender) {
        require(_vaultImplementation != address(0), "Implementation cannot be zero");
        vaultImplementation = _vaultImplementation;
    }

    function createStrategyVault(
        IERC20 _asset,
        string memory _name,
        string memory _symbol,
        address _aiExecutor
    ) external onlyOwner returns (address) {
        
        bytes memory initData = abi.encodeCall(
            NeuroLoomVault.initialize,
            (_asset, _name, _symbol, msg.sender, _aiExecutor)
        );

        ERC1967Proxy newVaultProxy = new ERC1967Proxy(vaultImplementation, initData);
        address vaultAddress = address(newVaultProxy);
        
        allVaults.push(vaultAddress);
        emit VaultCreated(vaultAddress, address(_asset), _name);
        
        return vaultAddress;
    }

    function getVaultsCount() external view returns (uint256) {
        return allVaults.length;
    }
}