# NeuroLoom Smart Contract Infrastructure

This directory contains the core on-chain components of the NeuroLoom protocol. The architecture has undergone a fundamental redesign, transitioning from a single-pool prototype to a multi-strategy `Factory` model.

This repository relies on OpenZeppelin v5 standards and utilizes the EIP-1167 Minimal Proxy (Clones) and EIP-1967 Proxy patterns for gas efficiency and upgradeability.

## Architectural Overhaul (V2 Refactoring)

The contracts have been completely refactored. We have eliminated legacy code, mitigated tight coupling, and established a foundation for infinite horizontal scaling of yield strategies.

### From Static to Factory Pattern

- **Previous State:** A single `NeuroLoomVaultV2.sol` instance was manually deployed, limiting the protocol to a single base asset and a single strategy route.
- **Current Architecture:** We introduced `NeuroLoomVaultFactory.sol`. This contract acts as the deployment engine, utilizing `ERC1967Proxy` to mint fully upgradeable, independent Vaults on demand.
- **Why:** This allows the protocol to concurrently run multiple strategies (e.g., USDT Stable Yield, WBNB Momentum) without requiring discrete smart contract deployments for each.

### Upgraded Master Logic (`NeuroLoomVault.sol`)

- **Consolidation:** The deprecated `NeuroLoomVault.sol` (V1) and `NeuroLoomVaultV2.sol` have been merged into a single, clean `NeuroLoomVault.sol`. This serves as the master implementation logic for all proxies spawned by the Factory.
- **Dynamic Initialization:** The `initialize()` function now accepts dynamic `_name` and `_symbol` parameters. Previously hardcoded to `nlUSDT`, the Vault shares are now fully reflective of their underlying asset and strategy.
- **OpenZeppelin v5 Alignment:** Upgraded security modules. Removed deprecated `__ReentrancyGuard_init()` in favor of OZ v5's Namespaced Storage (ERC-7201) standard, directly importing `ReentrancyGuard.sol`.
- **Type-Safe Factory Deployment:** The Factory now employs `abi.encodeCall` instead of raw signature strings for initialization, preventing `FailedCall()` runtime reverts and enforcing compile-time type safety.

### True Omnichain Execution

- **Deprecated Legacy Routing:** Removed legacy function `executeRebalance`. All execution now flows through `executeOmnichain`.
- **Protocol Agnostic:** The execution function relies on a dynamic `targetProtocol` and `calldata`. It forces approval to the target and executes the raw bytes, allowing interaction with _any_ whitelisted protocol (DEXs, Lending markets, etc.) without altering the Vault logic.

### Security Constraints & Guardrails

- **Dynamic Whitelisting:** Execution is restricted via `approvedProtocols`. The AI executor cannot interact with arbitrary smart contracts.
- **Oracle-Backed MEV Protection:** Integrated `IChainlinkAggregator` for multi-pair price feeds. The Vault natively computes the acceptable exchange rate before execution, reverting if post-execution balances reflect slippage exceeding `MAX_SLIPPAGE_BPS` (200 BPS / 2%).

## Deployment Sequence

Deployment utilizes `viem` (`hardhat-toolbox-viem`) for absolute type safety. The sequence MUST be executed in this exact order:

1.  **Deploy Master Implementation:** Deploy `NeuroLoomVault` (Logic only).
2.  **Deploy Factory:** Deploy `NeuroLoomVaultFactory`, passing the Master Implementation address into the constructor.
3.  **Spawn Vaults:** Execute `createStrategyVault()` on the Factory to mint strategy-specific proxies.

## Toolchain

- Solidity `0.8.28`
- Hardhat + `hardhat-toolbox-viem`
- OpenZeppelin Contracts & Contracts Upgradeable (v5.x)
