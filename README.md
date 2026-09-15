<div align="center">
  <!-- TODO: Insert your banner image here -->
  <!-- <img src="docs/NeuroLoom_Banner.png" width="100%" alt="NeuroLoom — Autonomous AI-Driven DeFi Vault" /> -->
  <h1>🧠 NeuroLoom (Aegis Vault)</h1>
</div>

> **Autonomous AI-Driven DeFi Yield Optimizer — Hardcoded MEV resistance where AI proposes, but the Blockchain verifies.**

NeuroLoom is a next-generation decentralized finance (DeFi) protocol that merges Artificial Intelligence with secure on-chain execution. It allows an autonomous AI agent to manage portfolio rebalancing 24/7, while strict Smart Contract guardrails protect the Total Value Locked (TVL) from MEV bots, flash loan attacks, and AI hallucinations.

Built for Indonesia Web3 Hackathon (Built on BNB Chain).

<p align="center">
  <img alt="Solidity 0.8.24" src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white&style=flat-square" />
  <img alt="Hardhat v3" src="https://img.shields.io/badge/Hardhat-v3%20(Viem)-EBE138?logo=hardhat&logoColor=black&style=flat-square" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white&style=flat-square" />
  <img alt="BSC Testnet" src="https://img.shields.io/badge/Network-BSC%20Testnet-F3BA2F?logo=binance&logoColor=black&style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/Tests-Passing%20(E2E%20Mocked)-10B981?style=flat-square" />
</p>

### At a glance

<div align="center">

<table>
  <tr>
    <th>Security & Execution</th>
    <th>Oracle & Pricing</th>
    <th>Architecture Stack</th>
  </tr>
  <tr>
    <td><b>AI_EXECUTOR_ROLE</b> acts off-chain; Smart Contracts enforce constraints on-chain.</td>
    <td>Guardrails powered by <b>Live Chainlink USD</b> feeds to reject high-slippage swaps.</td>
    <td><b>UUPS Upgradable Proxy</b> ensuring zero-downtime strategy deployments.</td>
  </tr>
  <tr>
    <td><b>Anti-Sandwich Attack</b> mechanisms via strict Basis Point (BPS) math.</td>
    <td>Decimals normalized on-chain (8 decimals Oracle vs 18 decimals Token).</td>
    <td><b>Monorepo</b>: Solidity contracts + TypeScript Node.js AI Worker.</td>
  </tr>
</table>

</div>

---

## Table of contents

1. [Highlights](#highlights)
2. [The problem](#the-problem)
3. [The vault model](#the-vault-model)
4. [System architecture](#system-architecture)
5. [Contract surface](#contract-surface)
6. [Live deployment (BSC Testnet)](#live-deployment-bsc-testnet)
7. [Repository layout](#repository-layout)
8. [Technology stack](#technology-stack)
9. [Getting started](#getting-started)
10. [Script commands](#script-commands)
11. [Autonomous AI Application (Phase 2)](#autonomous-ai-application)
12. [Production deployment](#production-deployment)
13. [Security & testing](#security--testing)
14. [Known limitations](#known-limitations)
15. [BSC & PancakeSwap integration notes](#bsc--pancakeswap-integration-notes)

---

## Highlights

- **The AI Proposes, Blockchain Verifies.** AI models can hallucinate. NeuroLoom solves this by isolating the AI off-chain and forcing every trade to pass a strict mathematical check against an immutable Chainlink oracle on-chain.
- **100% MEV Resistant.** Any swap execution that falls below the 200 BPS (2%) slippage threshold derived from the Fair Value is instantly reverted. Sandwich attacks are structurally impossible.
- **Zero-Downtime Upgrades.** Utilizing the UUPS (EIP-1822) proxy pattern, the protocol's execution logic can be upgraded without forcing users to migrate their liquidity.
- **Deterministic E2E Testing.** Verified using Hardhat v3 EDR Mainnet Forking with a MockOracle, proving security assertions completely independent of public RPC downtimes.

---

## The problem

Automated Yield Optimizers face two critical flaws today:

1. **Dumb Automation:** Traditional vaults use static, hardcoded logic that cannot adapt to macroeconomic news or sudden market shifts.
2. **The MEV Bloodbath:** If a vault is controlled by a dynamic off-chain entity (like an AI) that requests swaps via an AMM router, MEV bots monitor the mempool to front-run and back-run the transaction, draining the TVL through slippage manipulation.

NeuroLoom bridges the gap by providing the brain of an AI with the unbreakable shield of cryptographic on-chain math.

## The vault model

NeuroLoom's core primitive is the `NeuroLoomVaultV2` contract, sitting behind an `ERC1967Proxy`:

1. **Liquidity Provision:** Users/DAO deposit assets into the Proxy, which holds all the state and TVL.
2. **AI Monitoring:** An off-chain Node.js worker constantly reads market data and decides to rebalance the portfolio.
3. **Execution Call:** The AI (holding the `AI_EXECUTOR_ROLE`) calls `executeRebalanceV3(amountIn, amountOutMin)`.
4. **Oracle Gate (The Guardrail):** The vault intercepts the call, fetches `latestRoundData()` from Chainlink, checks for stale data (>3600s), and normalizes the decimal difference between the token (18) and the oracle (8).
5. **Circuit Breaker:** The vault calculates the `minimumAcceptableAmount`. If the AI's requested `amountOutMin` is compromised by a sandwich attack, the contract throws a `SlippageExceeded` custom error and aborts.
6. **Execution:** If safe, the vault approves and executes the trade directly via PancakeSwap.

---

## System architecture

```text
                ┌─────────────────────────────────────────────────────────────┐
                │                  AI WORKER (Node.js/TS)                     │
                │        Reads Market Data · LangChain / LLM Reasoning        │
                │     Holds AI_EXECUTOR_ROLE · Viem Transaction Signer        │
                └──────────────────────┬──────────────────────────────────────┘
                                       │ RPC (BSC Testnet)
                        ┌──────────────▼─────────────┐
                        │  NeuroLoomProxy (ERC1967)  │ <── Holds TVL (Tokens)
                        │  deployed 0xe388…FF4E      │ <── Upgradable Storage
                        └──────────────┬─────────────┘
                                       │ delegates calls to
                        ┌──────────────▼─────────────┐   ┌──────────────────────┐
                        │  NeuroLoomVaultV2 (Logic)  │───▶   Chainlink Oracle   │
                        │  _validateSlippage()       │   │  latestRoundData()   │
                        │  executeRebalanceV3()      │   └──────────────────────┘
                        └──────────────┬─────────────┘
                                       │ If slippage is safe
                        ┌──────────────▼─────────────┐
                        │    PancakeSwap Router      │
                        │  exactInputSingle / swap   │
                        └────────────────────────────┘
```
