<div align="center">
  <!-- TODO: Insert your banner image here -->
  <!-- <img src="docs/NeuroLoom_Banner.png" width="100%" alt="NeuroLoom — Autonomous AI-Driven DeFi Vault" /> -->
  <h1>🧠 NeuroLoom (Aegis Vault)</h1>
</div>

> **Autonomous AI-Driven DeFi Yield Optimizer — Hardcoded MEV resistance where AI proposes, but the Blockchain verifies.**

NeuroLoom is a next-generation decentralized finance (DeFi) protocol that merges Artificial Intelligence with secure on-chain execution. It allows an autonomous AI agent to manage portfolio rebalancing 24/7, while strict Smart Contract guardrails protect the Total Value Locked (TVL) from MEV bots, flash loan attacks, and AI hallucinations.

Built for the 2026 Web3 Hackathon.

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

NeuroLoom's core primitive is the `NeuroLoomVaultV2` contract, sitting behind an `ERC1967Proxy`[cite: 1]:

1. **Liquidity Provision:** Users/DAO deposit assets into the Proxy, which holds all the state and TVL.
2. **AI Monitoring:** An off-chain Node.js worker constantly reads market data and decides to rebalance the portfolio.
3. **Execution Call:** The AI (holding the `AI_EXECUTOR_ROLE`) calls `executeRebalanceV3(amountIn, amountOutMin)`.
4. **Oracle Gate (The Guardrail):** The vault intercepts the call, fetches `latestRoundData()` from Chainlink, checks for stale data (>3600s), and normalizes the decimal difference between the token (18) and the oracle (8).
5. **Circuit Breaker:** The vault calculates the `minimumAcceptableAmount`. If the AI's requested `amountOutMin` is compromised by a sandwich attack, the contract throws a `SlippageExceeded` custom error and aborts[cite: 1].
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

**Data flow for a rebalance:**

```
Market Shift → AI generates trade signal → Viem signs `executeRebalanceV3`
→ Tx enters Mempool → Contract pauses Tx → Queries Chainlink → Math validation
→ Revert if MEV attacked OR Execute if safe → Emits Event

```

---

## Contract surface

### NeuroLoomVaultV2.sol

Upgradeable via UUPS, `AccessControl` managed, `Pausable` for emergencies.

| Function                                                                 | Access        | Description                                                                                                    |
| ------------------------------------------------------------------------ | ------------- | -------------------------------------------------------------------------------------------------------------- |
| `initialize(...)`                                                        | initializer   | Sets up RBAC, asset, router, and oracle addresses. Locked on implementation contract.                          |
| `executeRebalanceV3(tokenIn, tokenOut, poolFee, amountIn, amountOutMin)` | AI_EXECUTOR   | The main entry point for the AI to execute portfolio swaps. Protected by `whenNotPaused`.                      |
| `_validateSlippageAgainstOracle(...)`                                    | internal      | Fetches Chainlink price, normalizes decimals, calculates fair value, and asserts `MAX_SLIPPAGE_BPS` (200 BPS). |
| `setDexRouter(_newRouter)`                                               | DEFAULT_ADMIN | Allows the DAO to upgrade the DEX router interface.                                                            |
| `pause()` / `unpause()`                                                  | DEFAULT_ADMIN | The ultimate circuit breaker. Halts all AI executions in case of black swan events.                            |
| `_authorizeUpgrade(...)`                                                 | UPGRADER      | Secures the `upgradeToAndCall` proxy pattern.                                                                  |

**Errors:** `SlippageExceeded(amountOutMin, minimumAcceptable)`, `UnauthorizedAI()`, `StaleOracleData()`, `InvalidOraclePrice()`.

---

## Live deployment (BSC Testnet)

**Network:** chain `97` · RPC `https://bsc-testnet.rpc.sentio.xyz`

| Contract / Entity | Address                                      |
| ----------------- | -------------------------------------------- |
| NeuroLoomProxy    | `0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E` |
| Implementation V2 | `0x07e63e62adefd7dc10f5e46e99f28cbbb1b61474` |
| PancakeRouter     | `0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3` |
| Chainlink BNB/USD | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |

_Live E2E status: Contract fully upgraded on-chain and verified against simulated manipulation attacks._

---

## Repository layout

```text
aegis-vault/
├── contracts/                     # Phase 1: Smart Contracts
│   ├── contracts/                 # NeuroLoomVaultV2.sol · NeuroLoomProxy.sol · MockOracle.sol
│   ├── scripts/                   # deployment & UUPS upgradeToV2.ts scripts
│   ├── test/                      # Hardhat v3 EDR E2E tests (Mocked Oracles)
│   └── hardhat.config.ts          # Viem + EDR Simulated Forking config
├── backend/                       # Phase 2: AI Node.js Worker (WIP)
│   ├── src/ai/                    # LLM Prompts & Strategy logic
│   └── src/chain/                 # Viem event listeners & execution clients
├── .gitignore
└── README.md

```

---

## Technology stack

| Layer     | Choice                                              |
| --------- | --------------------------------------------------- |
| Contracts | Solidity `^0.8.24` · OpenZeppelin Upgradable (UUPS) |

|
| EVM Environment | Hardhat v3 (v-next) · Node.js native `node:test` |
| Web3 / Blockchain | viem `^2.x` · `@nomicfoundation/hardhat-viem`<br> |
| Backend (Phase 2) | Node.js (v18+) · TypeScript · LangChain |

---

## Getting started

**Prerequisites**

- Node.js 18+ (Node 20 LTS recommended for Hardhat v3 native test runner).
- npm or yarn.

```bash
git clone [https://github.com/your-username/aegis-vault.git](https://github.com/your-username/aegis-vault.git)
cd aegis-vault/contracts
npm install
cp .env.example .env

```

Set up your `.env`:

```env
PRIVATE_KEY=your_deployer_wallet_private_key

```

---

## Script commands

Navigate to the `contracts/` directory to run these operations.

| Command                                                       | What it does                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------------ |
| `npx hardhat clean`                                           | Clears artifacts and cache to resolve fully qualified name errors. |
| `npx hardhat compile`                                         | Compiles contracts and generates Viem types.                       |
| `npx hardhat test test/E2ESlippage.test.ts`                   | Runs the Mainnet Fork E2E test to validate MEV protection.         |
| `npx hardhat run scripts/upgradeToV2.ts --network bscTestnet` | Upgrades the Proxy logic to a new implementation on testnet.       |

---

## Autonomous AI Application (Phase 2 - WIP)

Unlike traditional dApps, NeuroLoom does not rely solely on a frontend dashboard. The core "application" is a headless Node.js backend.

**Execution Flow:**

1. **Observe:** The worker polls market indicators via APIs (e.g., Binance, Coingecko) and on-chain events.
2. **Reason:** Data is fed into an LLM (LangChain) with strict system prompts to determine the optimal allocation.
3. **Act:** If a rebalance is necessary, the worker (authenticated as `AI_EXECUTOR_ROLE`) uses `viem` to broadcast the transaction.
4. **Safeguard:** If the AI hallucinates or is front-run, the Smart Contract drops the transaction, logging a failure but preserving the TVL.

---

## Production deployment

1. **Contracts:** Proxies are deployed permanently. Any logic updates are handled via `_authorizeUpgrade` by the DAO or Multisig.
2. **AI Node:** The backend can be dockerized and hosted on reliable infrastructure (AWS EC2 / DigitalOcean) using `PM2` to ensure 24/7 uptime.

---

## Security & testing

- **Isolated E2E Forking:** Testing relies on `MockOracle.sol` injected into the local EDR-Simulated network, ensuring tests run deterministically regardless of BSC Testnet RPC instability.

- **Dependency Sandboxing:** Interactions with PancakeSwap utilize `SafeERC20`'s `forceApprove` to prevent deadlocks on non-standard ERC20 tokens.
- **Stale Data Protection:** Chainlink data older than 3600 seconds is automatically rejected to prevent flash-crashes.
- **Strict BPS Logic:** Floating point math is avoided. All slippage and fair value calculations are executed in base uint256 with 1e8 and 10000 normalizations.

---

## Known limitations

1. **Oracle Pair Restriction:** Currently, the contract binds to a single `IChainlinkAggregator`. The AI can only safely rebalance pairs that match this specific Oracle (e.g., BNB/USD). Multi-pair routing requires a registry contract update.
2. **Hardhat v3 Caching:** Fully qualified names (e.g., `@openzeppelin/...:ERC1967Proxy`) must be used for deployment scripts due to aggressive artifact caching in v-next.

---

## BSC & PancakeSwap integration notes

- **V2 vs V3 Routing:** While V3 utilizes Concentrated Liquidity (`exactInputSingle`), the contract architecture gracefully falls back to V2 (`swapExactTokensForTokens`) for broader token support and simpler mathematical constraints in Phase 1.

- **Chainlink Decimals:** BSC Chainlink feeds predominantly use 8 decimals for USD pairs. The vault contract hardcodes a `1e8` normalization divisor to align with standard 18-decimal ERC20 assets.

---

_Built by rebel for the Indonesia Web3 Hackathon (BNB Chain)._
