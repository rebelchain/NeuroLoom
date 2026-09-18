<div align="center">
  <img src="frontend/public/neuroloom-banner.png" width="100%" alt="NEUROLOOM — Autonomous AI-Driven DeFi Yield Optimizer" />
</div>

# NEUROLOOM

> **Autonomous AI-Driven DeFi Yield Optimizer — Multi-Protocol Routing & Hardcoded MEV Resistance.**

NeuroLoom is a next-generation Decentralized Finance (DeFi) protocol that fuses advanced **Agentic Workflows** with mathematically guaranteed on-chain execution. It enables an autonomous AI engine to analyze, optimize, and route portfolios (Swap, Lending, Staking) 24/7 across the DeFi ecosystem, while strict Smart Contract guardrails protect the Total Value Locked (TVL) from MEV bots, flash loan attacks, and AI hallucinations.

Built for the **Indonesia Web3 Hackathon 2026** on the **BNB Chain**.

<p align="center">
  <img alt="Solidity 0.8.28" src="https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity&logoColor=white&style=for-the-badge" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-14-000000?logo=next.js&logoColor=white&style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img alt="LangChain" src="https://img.shields.io/badge/AI-LangChain%20%7C%20Qwen%203.8%2027b-10B981?style=for-the-badge" />
  <img alt="BSC Testnet" src="https://img.shields.io/badge/Network-BSC%20Testnet-F3BA2F?logo=binance&logoColor=black&style=for-the-badge" />
  <img alt="Tests" src="https://img.shields.io/badge/Tests-7%20passing-10B981?style=for-the-badge" />
</p>

### At a glance

<div align="center">

<table>
  <tr>
    <th>Architecture</th>
    <th>Enforcement</th>
    <th>Stack</th>
  </tr>
  <tr>
    <td><b>Agentic Workflow:</b> Orchestrator-Workers & Evaluator-Optimizer LLM loops.</td>
    <td><b>AI Proposes, Chain Verifies:</b> Raw <code>calldata</code> is validated against live Chainlink USD feeds before execution.</td>
    <td><b>Full-Stack:</b> Next.js (DApp), Node.js (AI Engine), Hardhat (EVM), The Graph (Indexing).</td>
  </tr>
  <tr>
    <td><b>Multi-Protocol:</b> AI dynamically generates generic <code>calldata</code> for any allowed target protocol (PancakeSwap, Venus, etc).</td>
    <td><b>MEV Bounded:</b> Slippage is mathematically hardcapped. Over-slippage reverts the transaction entirely.</td>
    <td><b>Viem & SQLite:</b> Fast on-chain reads/writes and localized high-speed LLM memory states.</td>
  </tr>
</table>

</div>

---

## Table of contents

1. [The Problem](#the-problem)
2. [The Agentic Workflow Architecture](#the-agentic-workflow-architecture)
3. [Live Engine Output](#live-engine-output-the-orchestrator-in-action)
4. [The Vault Model (ERC-4626)](#the-vault-model-erc-4626)
5. [System Flow](#system-flow)
6. [Live Deployment (BSC Testnet)](#live-deployment-bsc-testnet)
7. [Repository Layout](#repository-layout)
8. [Technology Stack](#technology-stack)
9. [Getting Started](#getting-started)
10. [Security & Threat Model](#security--threat-model)
11. [Known Limitations & Production Roadmap](#known-limitations--production-roadmap)

---

## The Problem

Current Automated Yield Optimizers suffer from two fatal flaws:
1. **Rigid Automation & Protocol Silos:** Traditional vaults use static, hardcoded logic that locks liquidity into a single, specific pool. By the time a human manually rebalances a position, the alpha is gone.
2. **MEV Slaughter & AI Hallucination:** If a vault is directly controlled by an AI without circuit breakers, MEV bots will monitor the mempool for sandwich attacks. Furthermore, LLMs can hallucinate decimal places or target addresses, leading to drained TVLs.

NeuroLoom bridges this gap by combining dynamic, multi-perspective AI with a multi-layered on-chain Security Guard.

---

## The Agentic Workflow Architecture

NeuroLoom does not rely on a simple, static LLM prompt. It implements rigorous Agentic Workflows based on industry-leading research:

* **Orchestrator-Workers Workflow:** A central Orchestrator LLM analyzes real-time AMM liquidity depth and lending pool utilization rates, dynamically delegating route simulations to specialized worker LLMs (e.g., Yield Strategist, Liquidity Risk Manager). This parallel processing generates the optimal yield-routing strategy.
* **Evaluator-Optimizer Workflow:** Before execution, the generated strategy is evaluated and refined in a strict LLM feedback loop to ensure maximum APY and zero hallucination before finalizing the action.

---

## Live Engine Output: The Orchestrator in Action

The following is a real execution log from the NeuroLoom AI backend demonstrating the parallel delegation and synthesis process:

```console
[2026-09-16T10:20:13.006Z] INITIALIZING NEUROLOOM AI CYCLE
=========================================================
[MARKET DATA] WBNB: $710.8 (24H: -1.0849108846805722%)
[VAULT STATE] Balance: 0 WBNB | 0 USDT
[AGENT] Analyzing market conditions and memory state...
[ORCHESTRATOR] Analyzing state and planning task delegation...
[ORCHESTRATOR] Delegating 2 specialized approaches.
[WORKERS] Generating specialized analysis concurrently...
  -> [WORKER 1 | YIELD_STRATEGIST] Recommends: HOLD
  -> [WORKER 2 | LIQUIDITY_RISK_MANAGER] Recommends: HOLD
[SYNTHESIZER] Evaluating worker reports and finalizing decision...
[DECISION] Action: HOLD | Allocation: 0%
[REASONING] Both WBNB and USDT vault balances are zero, making trade execution impossible regardless of price movement.
[EXECUTION] Action is HOLD. Preserving gas. No transaction broadcasted.
[SYSTEM] Cycle completed. Awaiting 60 seconds for the next iteration...

```

## The Vault Model (ERC-4626)

The core primitive of NeuroLoom is the `NeuroLoomVaultV2` contract, adopting the `ERC4626Upgradeable` standard behind an `ERC1967Proxy`:

1. **Liquidity Provision (ERC-4626):** Tokenized vault standard enables seamless deposit/withdraw integrations.
2. **Multi-Protocol Execution Calls:** The AI agent compiles raw instructions and calls `executeOmnichain(targetProtocol, data, tokenIn, tokenOut, amountIn, expectedAmountOutMin)`.
3. **The Protocol Allowlist (Layer 1 Guardrail):** The vault asserts that `targetProtocol` exists in a strict admin-approved whitelist, preventing the AI from routing funds to malicious or arbitrary smart contracts.
4. **The Oracle Gate & Decimal Agnostic Math (Layer 2 Guardrail):** The Vault dynamically maps the asset pair to its corresponding Chainlink feeds. It reads the exact token decimals via `IERC20Metadata`, dynamically normalizes the math to prevent decimal hallucinations, checks for stale data, and validates the expected slippage boundary.
5. **Generic Execution & Absolute Validation (Layer 3 Guardrail):** Protected by OpenZeppelin v5's `ReentrancyGuard`, the contract executes `targetProtocol.call(data)`. If the returned token balance (`balanceAfter - balanceBefore`) is strictly less than `expectedAmountOutMin`, the contract reverts the entire transaction. Maximum loss is hardcapped at 200 BPS (2%).

---

## System Flow

```text
                ┌─────────────────────────────────────────────────────────────┐
                │             AGENTIC HARNESS (Node.js Backend)               │
                │ 1. ORCHESTRATOR: Analyzes DeFi state & delegates tasks      │
                │ 2. WORKERS: Parallel processing via LangChain (qwen3.8-27b) │
                │ 3. EVALUATOR: Refines strategy in a strict feedback loop    │
                │ 4. EXECUTOR: Builds 'calldata' & signs Viem Transaction     │
                └──────────────────────┬──────────────────────────────────────┘
                                       │ RPC (https://data-seed-prebsc-2-s2.bnbchain.org:8545/)
                        ┌──────────────▼─────────────┐
                        │  NeuroLoomProxy (ERC1967)  │ <── Holds TVL (Tokens)
                        │  deployed 0xe388…FF4E      │ <── Upgradable Storage
                        └──────────────┬─────────────┘
                                       │ delegates calls to
                        ┌──────────────▼─────────────┐   ┌──────────────────────┐
                        │  NeuroLoomVaultV2 (Logic)  │───▶   Chainlink Oracle   │
                        │  1. onlyApprovedProtocol   │   │  latestRoundData()   │
                        │  2. executeOmnichain()     │   └──────────────────────┘
                        └──────────────┬─────────────┘
                                       │ If safe, injects raw calldata
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
 ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
 │   PancakeSwap V2  │       │   Venus Lending   │       │   Any Future DEX  │
 │swapExactTokensFor…│       │    mint/supply    │       │     swap/add      │
 └───────────────────┘       └───────────────────┘       └───────────────────┘

```

---

## Live Deployment (BSC Testnet)

**Network:** chain `97` (BNB Smart Chain Testnet)

| Entity | Address (BscScan) |
| --- | --- |
| NeuroLoomProxy (Vault) | `0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E` |
| Implementation V2 | `0x07e63e62adefd7dc10f5e46e99f28cbbb1b61474` |
| Chainlink BNB/USD | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |
| The Graph Subgraph | `https://api.studio.thegraph.com/query/.../neuroloom-bsc-testnet` |

---

## Repository Layout

```text
NeuroLoom/
├── frontend/                      # Next.js DApp (Dashboard, Landing, AI Terminal)
│   ├── public/                    # Static UI assets and banners
│   └── src/
│       ├── app/                   # Next.js App Router pages and layouts
│       ├── components/            # Modular React components (Terminal, Vaults, etc.)
│       └── lib/                   # Utility functions and custom hooks
├── backend/                       # AI Agentic Harness (Node.js, LangChain, SQLite)
│   └── src/
│       ├── abi/                   # Compiled smart contract ABIs for Viem
│       ├── ai/
│       │   ├── agent.ts           # The Orchestrator-Workers delegation logic
│       │   └── evaluator.ts       # Evaluator-Optimizer feedback loop
│       ├── chain/
│       │   ├── executor.ts        # Calldata builder & AI transaction signer
│       │   └── vault.ts           # Vault state reader and on-chain interaction
│       └── data/                  # SQLite database for AI memory states
├── contracts/                     # Hardhat v3 workspace (ERC-4626 Vault, Proxy, Tests)
│   ├── contracts/                 # NeuroLoomVaultV2.sol, NeuroLoomProxy.sol, MockOracle.sol, MockERC20.sol, MockDex.sol
│   ├── scripts/                   # Deployment, smoke tests, whitelist protocol, and UUPS upgrades
│   └── test/                      # E2E Slippage & Security Guard MEV tests
└── neuroloom-bsc-testnet/         # The Graph Subgraph (Event Indexing)
    ├── abis/                      # NeuroLoomVaultV2.json ABI definitions
    ├── src/                       # AssemblyScript mappings for event handlers
    └── tests/                     # Subgraph unit tests

```

---

## Technology Stack

| Layer | Technologies Used |
| --- | --- |
| **Smart Contracts** | Solidity `0.8.28`, Hardhat v3 (Ignition & Viem), OpenZeppelin v5 UUPS |
| **Frontend (Core & UI)** | Next.js 16.3, React 19, TailwindCSS v4, DaisyUI, Framer Motion, tsParticles |
| **Frontend (Web3 & Data)** | Wagmi, Viem, RainbowKit, Apollo Client (GraphQL) |
| **Backend (AI Engine)** | Node.js (tsx), TypeScript, `viem`, `@dotenvx/dotenvx` |
| **AI / LLM Framework** | Node.js (tsx), `@langchain/core` |
| **Active LLM Model** | Groq API (qwen/qwen3.8-27b) *— dynamic Orchestrator routing* |
| **Data & Indexing** | SQLite (AI Memory state), The Graph (On-chain event streaming) |

---

## Getting Started

**Prerequisites:** Node.js 18+ and npm/yarn.
*Note: NeuroLoom enforces Separation of Duties. You must use two distinct wallets for Admin & AI.*

### 1. Smart Contracts

```bash
cd contracts
npm install

```

Create a `.env` file in `/contracts` for the **Admin Wallet**:

```env
PRIVATE_KEY=your_admin_deployer_wallet_private_key

```

Run the deterministic security tests:

```bash
npx hardhat test test/E2ESlippage.test.ts nodejs

```

### 2. AI Backend Engine

```bash
cd backend
npm install

```

Create a `.env` file in `/backend` for the **AI Node Wallet**:

```env
GROQ_API_KEY=your_groq_api_key
AI_PRIVATE_KEY=your_ai_executor_wallet_private_key
CYCLE_INTERVAL_MINUTES=1

# DEMO SCENARIO CONTROL 
# SCEANRIO CHOICHES: 
# "HIGH_YIELD_ENTRY"   -> Trigger AI to Buy/Enter the LP 
# "IL_MITIGATION_EXIT" -> Triggering AI to Sell/Exit LP (Fund Rescue Simulation)
# "LIQUIDITY_VACUUM"   -> Triggering AI to HOLD (Simulation: Rejecting a Dangerous Route)
# "PRODUCTION"         -> Reading On-Chain Data & Real-Time Prices (For Mainnet)

MOCK_SCENARIO="HIGH_YIELD_ENTRY"

```

Run the Autonomous Harness:

```bash
npx tsx src/index.ts

```

### 3. Frontend Dashboard

```bash
cd frontend
npm install
npm run dev

```

---

## Security & Threat Model

| Threat | Applied Mitigation | Status |
| --- | --- | --- |
| Unauthorized Execution | Strict `AccessControl` (`onlyRole(AI_EXECUTOR_ROLE)`) | ✅ On-chain |
| AI Arbitrary Execution | Strict On-Chain Protocol Allowlist (`approvedProtocols`) | ✅ On-chain |
| AI Route/Decimal Hallucination | Pre-execution Oracle validation & dynamic `IERC20Metadata` | ✅ On-chain |
| Reentrancy Attacks | OpenZeppelin v5 `ReentrancyGuard` (ERC-7201 safe) | ✅ On-chain |
| Oracle Stale / Flash crash | Rejects Chainlink data older than 3600 seconds | ✅ On-chain |
| Sandwich MEV Attack | Absolute post-execution balance check via Fair Value | ✅ On-chain |
| AI API Failure / Network Outage | Evaluator Circuit Breaker (Halts execution to `HOLD`) | ✅ Off-chain |

## Deterministic Test Coverage

NeuroLoom's core security mechanisms and upgradeable proxy architecture are strictly validated using Hardhat v3, testing both aggressive MEV simulated attacks and multi-protocol happy paths with dynamic decimal mapping.

```console
$ npx hardhat test

  Deployment & Proxy Upgradeability (smoke-test.ts)
    ✔ Must deploy ERC1967 Proxy and Vault V2 Implementation (85ms)
    ✔ Must initialize default admin and grant AI_EXECUTOR_ROLE (62ms)
    ✔ Must allow Admin to successfully pause and unpause the vault (45ms)

  E2E BSC Testnet Fork: Anti-Sandwich Attack & Multi-Protocol Routing (E2ESlippage.test.ts)
     🛡️ Security Guards (Negative Paths)
      ✔ Must revert if called by a non-AI role (Access Control) (295ms)
      ✔ Must revert if AI targets an unapproved protocol (Protocol Whitelist) (120ms)
      ✔ Must revert if AI sends an expectedAmountOutMin below the 2% slippage limit (Anti-MEV) (158ms)
    ⚡ True Multi-Protocol Routing (Happy Path)
      ✔ Must successfully execute a cross-protocol swap with correct calldata & dynamic decimals (350ms)

  7 passing (3s)
```
---

## Known Limitations & Production Roadmap

NeuroLoom was built as a **zero-cost prototype** for the Indonesia Web3 Hackathon. The current architecture prioritizes secure forward-execution, on-chain safety guards, and lean deployment over global scalability. 

To transition this architecture into a production-ready Mainnet environment, the following infrastructure upgrades are scoped:

1. **Position Unwind & Withdrawal Path (ERC-4626 Completeness):**
   * Current Prototype: Forward execution flow (deposit → AI rebalance → external protocol) is implemented and tested. The reverse flow (tracking external LP/vToken positions and unwinding them for user `withdraw()`) is pending.
  **Note:** if a user attempts `withdraw()` while funds are actively deployed beyond the Vault's idle balance, the transaction will currently revert due to insufficient liquid `asset` balance — this is a known, expected limitation of the one-way prototype flow, not a silent failure.
   * Production Target: Build an automated position-tracking and unwind module, alongside a liquidity reserve ratio (e.g., cap AI deployment at 70-80% of TVL) so a portion of user withdrawals remain guaranteed even when the majority of assets are deployed across AMMs.
2. **Impermanent Loss (IL) Modeling:**
   * *Current Prototype:* Worker agents evaluate APY and qualitative risk signals but do not compute Impermanent Loss exposure mathematically.
   * *Production Target:* Add a dedicated IL calculation module (price divergence vs. pool composition) so LP allocation decisions strictly account for IL mitigation, not just headline APY.
3. **AI Executor Key Management:**
   * *Current Prototype:* `AI_PRIVATE_KEY` is loaded from a local `.env` file for rapid hackathon iteration.
   * *Production Target:* Migrate to KMS-backed signing (AWS KMS / HashiCorp Vault) so the raw private key never exists in plaintext or process memory.
4. **AI Framework Transition:**
   * *Current Prototype:* Relies on `@langchain/core` and OpenRouter for zero-cost rapid iteration.
   * *Production Target:* Migration to the native **Claude Agent SDK**. Anthropic's tooling is fundamentally designed to handle the exact Orchestrator-Workers loops we mapped out, offering vastly superior mathematical reasoning for financial logic.
5. **AI Memory & Database Scaling:**
   * *Current Prototype:* Uses local `SQLite` for isolated, high-speed AI memory logging.
   * *Production Target:* Migration to a distributed **PostgreSQL** architecture coupled with **Redis** caching to safely handle concurrent state-sharing across hundreds of AI workers.
6. **Closed-Loop Execution Memory:**
   * *Current Prototype:* The AI agents log their intended decisions (action, amount, reasoning) to the local database prior to on-chain execution, but the final on-chain settlement status (success/revert) is not written back.
   * *Production Target:* Upgrade the database schema to capture `txHash`, `status`, and `errorReason`. This creates a closed feedback loop, allowing the AI to retrieve past failed transactions and dynamically learn from on-chain rejections (e.g., adjusting slippage tolerance after a revert).
7. **Deterministic LLM Outputs & Tool Calling:**
   * *Current Prototype:* The system relies on prompt-engineered JSON formatting and regex parsing for AI outputs, injecting all required market context directly into the prompt state as text.
   * *Production Target:* Transition to the native `withStructuredOutput()` paradigm (via Zod schemas) to guarantee type-safe AI responses and eliminate JSON hallucination. Additionally, equip agents with explicit tool-calling capabilities (e.g., calling a deterministic `calculate_impermanent_loss()` function) rather than relying solely on LLM text reasoning for strict financial math.
8. **Oracle Feed Diversity:**
   * *Current Prototype:* The slippage guardrail intercepts data from a single Chainlink aggregator per pair.
   * *Production Target:* Integration of multi-asset Time-Weighted Average Price (TWAP) and redundant decentralized oracle networks (DONs) to neutralize isolated flash-crash vulnerabilities.


---

*NeuroLoom — AI that routes, Blockchain that verifies.*
