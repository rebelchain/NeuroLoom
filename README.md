<div align="center">
  <img src="frontend/public/banner.png" width="100%" alt="NEUROLOOM — Autonomous AI-Driven DeFi Yield Optimizer" />
</div>

# NEUROLOOM
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> **Autonomous AI-Driven DeFi Yield Optimizer**

NeuroLoom is a fully autonomous DeFi protocol that fuses multi-agent AI workflows with deterministic on-chain execution. It empowers an AI engine to analyze market conditions and dynamically route capital, via tactical asset swaps, secure lending, and active concentrated liquidity provision (PancakeSwap V3 NFTs) 24/7 across the BNB Chain ecosystem. To guarantee absolute security, strict smart contract guardrails, including a hard-capped 20% velocity allocation limit, real-time Chainlink oracle validation, and ERC-4626 inflation overrides—protect the Total Value Locked from MEV bots, vault exploits, and AI hallucinations.

Built for the **Indonesia Web3 Hackathon 2026**. **BNB Chain**.
Link: https://indonesiaweb3hack.xyz/en/projects/proj_231bfb01edfeb05edc

<p align="center">
  <img alt="Solidity 0.8.28" src="https://img.shields.io/badge/Solidity-0.8.28-363636?logo=solidity&logoColor=white&style=for-the-badge" />
  <img alt="Next.js" src="https://img.shields.io/badge/Next.js-16-000000?logo=next.js&logoColor=white&style=for-the-badge" />
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white&style=for-the-badge" />
  <img alt="LangChain" src="https://img.shields.io/badge/AI--LangChain%20%7C%20openai%2Fgpt--oss-20b981?style=for-the-badge" />
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
    <td><b>Agentic Workflow:</b> Orchestrator-Workers & Evaluator-Optimizer LLM loops with intra-cycle self-correction.</td>
    <td><b>AI Proposes, Chain Verifies:</b> Executions are strictly bounded by a 20% TVL Velocity Guard and live Chainlink USD feeds.</td>
    <td><b>Full-Stack:</b> Next.js (DApp), Node.js (AI Engine), Hardhat (EVM), The Graph (Indexing).</td>
  </tr>
  <tr>
    <td><b>Multi-Protocol & NFT LP:</b> AI dynamically routes generic <code>calldata</code> and autonomously manages PancakeSwap V3 Concentrated Liquidity NFTs.</td>
    <td><b>MEV & Exploit Bounded:</b> Slippage is mathematically hardcapped (2%), and custom ERC-4626 overrides neutralize share-price inflation attacks.</td>
    <td><b>Viem & SQLite:</b> Fast on-chain reads/writes and localized high-speed LLM memory states.</td>
  </tr>
</table>

</div>

---

## Table of contents

1. [The Problem](#the-problem)
2. [The Idea](#the-solution)
3. [The Agentic Workflow Architecture](#the-agentic-workflow-architecture)
4. [Live Engine Output](#live-engine-output-the-orchestrator-in-action)
5. [The Vault Architecture (Factory & ERC-4626)](#the-vault-architecture-factory--erc-4626)
6. [System Flow](#system-flow)
7. [Live Deployment (BSC Testnet)](#live-deployment-bsc-testnet)
8. [Repository Layout](#repository-layout)
9. [Technology Stack](#technology-stack)
10. [Cloud Architecture & Autonomous Execution](#cloud-architecture--autonomous-execution)
11. [Getting Started](#getting-started)
12. [Security & Threat Model](#security--threat-model)
13. [Deterministic Test Coverage](#deterministic-test-coverage)
14. [On-Chain Provisioning & Operational Scripts](#on-chain-provisioning--operational-scripts)
15. [Known Limitations & Production Roadmap](#known-limitations--production-roadmap)
16. [License](#license)

## 
---

## The Problem

Delegating asset management within the Web3 ecosystem promises financial freedom, yet its mass adoption is hindered by three structural barriers. Aligned with the vision to make DeFi more efficient, intelligent, and accessible, the current ecosystem faces the following trilemma:

1. **The Complexity Bottleneck:** The current DeFi ecosystem demands its users to be financial experts. Setting up smart wallets, calculating gas fee fluctuations, and managing Concentrated Liquidity price ranges create massive UX friction. Retail users need an interface that abstracts all these technical complexities into a single-deposit experience without constant manual intervention.
2. **Liquidity Fragmentation & Capital Inefficiency:** Early-generation AI delegation models typically operate on isolated individual wallet architectures. This approach locks capital at a small scale, triggers high gas fee inefficiencies for every rebalancing action, and fundamentally prevents retail users from achieving economies of scale ("whale power") to enter advanced liquidity pools. Even when funds are pooled in standard vaults, the infrastructure remains vulnerable. In May 2026, the Inertia protocol lost $152,000 to a share price inflation attack (ERC-4626 donation attack).
3. **The Vulnerability of Blind Automation:** Handing complete capital control to fast AI without deterministic defensive walls is a fatal security flaw. In June 2026, one of Ethereum's top MEV Bots was drained of $7.5 million after its automated logic was tricked into approving malicious routing contracts. On the other hand, traditional vaults are too passive to react to market dynamics. The ecosystem requires an infrastructure that is not only autonomous but also mathematically secured at the smart contract level.

---
## The Solution

NeuroLoom emerges as an intelligent agent connecting artificial intelligence with decentralized execution on the BNB Chain. We bridge this gap by pairing a dynamic "Agentic Harness" with an impenetrable on-chain security layer.

Through the **ERC-4626 Omni-Vault** architecture, NeuroLoom pools retail user liquidity to eliminate individual gas costs and enable aggregate, institutional-scale Concentrated Liquidity management. Instead of rigid scripts, NeuroLoom’s backend AI continuously analyzes on-chain states and delegates yield-hunting to parallel LangChain workers. Every AI proposal must pass a strict "Evaluator Loop" (Chief Risk Officer Agent) before formulating raw `calldata`. However, the ultimate security lies in the `NeuroLoomVault` Smart Contract, which acts as a deterministic gatekeeper against AI hallucinations and market manipulation:

* - Unlike exploited automated bots, the NeuroLoom AI cannot be tricked into approving malicious contracts. The Vault enforces a strict `approvedProtocols` whitelist, ensuring capital only flows to vetted platforms (such as Thena Fusion and PancakeSwap V3).
* - To prevent passive oracle failures, every AI execution is validated against live Chainlink feeds. If a transaction exceeds a strict 2% slippage boundary (`MAX_SLIPPAGE_BPS`) or the data is older than 1 hour, the Vault forcefully reverts the transaction.
* - Leveraging OpenZeppelin v5's virtual offset defense and a custom `totalAssets()` override, the Vault dynamically tracks idle cash, lending positions, and LP principal, rendering share price manipulation and donation attacks (as seen in the Inertia case) mathematically impossible.
* - The smart contract mathematically hard-caps any single AI execution to a maximum of 20% of the live TVL (`MAX_VELOCITY_BPS`), completely mitigating severe drain risks.

NeuroLoom makes decisions and routes assets autonomously, making decentralized finance efficient and safe for everyone.

## The Agentic Workflow Architecture

NeuroLoom does not rely on a simple, static LLM prompt. It implements rigorous Agentic Workflows based on industry-leading research:

* **Orchestrator-Workers Workflow:** A central Orchestrator LLM analyzes real-time AMM liquidity depth and lending pool utilization rates, dynamically delegating route simulations to specialized worker LLMs (e.g., Yield Strategist, Liquidity Risk Manager). This parallel processing generates the optimal yield-routing strategy.
* **Evaluator-Optimizer Workflow:** Before execution, the generated strategy is evaluated and refined in a strict LLM feedback loop to ensure maximum APY and zero hallucination before finalizing the action.

---

## Live Engine Output: The Orchestrator in Action

The following is a real execution log from the NeuroLoom AI backend demonstrating the parallel delegation and synthesis process:

```console
[SYSTEM] NeuroLoom Autonomous Multi-Agent is ONLINE.
--- CLEARING LOGS ---

[SYSTEM] Initiating AUTONOMOUS AI Cycle - 2026-09-29T05:21:00.767Z
[DATA] Fetching live market conditions...
[DATA] Menyedot data teknikal BNB/USDT dari TAAPI.io v2...
[ORACLE] Live BNB/USD Price Verified: $756.74
[STATE] Live Vault USDT Balance: 6590.828979 USDT
[ORCHESTRATOR] Planning strategy & deploying workers...
[ORCHESTRATOR] Analyzing market and planning tasks.

[ORCHESTRATOR ANALYSIS]:
The BNB/USDT pair is in a ranging/sideways market with a neutral RSI (~42.6) and a negative MACD,
indicating no strong trend. In such a market, yield opportunities can be attractive because price volatility
is low, reducing impermanent loss risk. However, thelack of a clear trend also means liquidity pools
may experience higher slippage if traders are uncertain.
Therefore, both a YIELD_STRATEGIST to identify the most profitable and low‑risk yield farms,
and a LIQUIDITY_RISK worker to assess slippage, depth, and potential impermanent loss,
should be deployed to formulate a balanced strategy.

[AGENT] Synthesizing worker reports into action plan...
[EVALUATOR] Auditing AI Agent draft...
[EVALUATOR VERDICT] PASS
Reasoning: Deposit into the Yield Farm vault (0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a) is a neutral,
income‑generating action that aligns with the current ranging/sideways market structure.
The tool call correctly targets the available vault address and will allocate 1% of the vault balance,
which is a conservative and safe strategy given the market conditions.
[EXECUTOR] AI Selected Tool: execute_venus_deposit
[RISK CONTROL] Execution forced to 1% of vault balance: 65.908289 USDT
[EXECUTION] Signing transaction for execute_venus_deposit...
[NETWORK] Awaiting confirmation... TxHash: 0x0855f7b50820f9f34c257101fd2f81694797e7406bf9c32a3b6d118012294ca0
[SUCCESS] Autonomous on-chain execution verified!
[SYSTEM] Cycle completed. Logs securely stored to D:\About Coding\NeuroLoom\backend\autonomous_ai_logs.json

```

## The Vault Architecture (Factory & ERC-4626)

The core infrastructure of NeuroLoom utilizes a scalable Factory Pattern. The `NeuroLoomVaultFactory` dynamically deploys isolated strategy vaults as `ERC1967Proxy` instances, all delegating calls to a single, gas-efficient `NeuroLoomVault` master implementation that adopts the `ERC4626Upgradeable` standard:

1. **Dynamic Strategy Deployment:** The Factory contract enables the instantaneous creation of new risk-adjusted vaults (e.g., Yield Farm, Bluechip Momentum, Degen Accumulator) while maintaining strictly isolated states, liquidity pools, and tokenomics.
2. **Liquidity Provision (ERC-4626):** The tokenized vault standard ensures seamless, non-custodial deposit and withdraw integrations for end-users.
3. **Multi-Protocol Execution & NFT LP:** The AI agent compiles raw calldata instructions for generic routing via `executeOmnichain` (e.g., Venus lending, basic swaps), AND directly manages active concentrated liquidity positions via `executeLiquidityProvision` and `closeLPPosition` for DEX V3 NFTs.
4. **The Protocol Allowlist (Layer 1 Guardrail):** The vault asserts that any `targetProtocol` exists in a strict admin-approved whitelist, physically preventing the AI from routing user funds to malicious or arbitrary smart contracts.
5. **The Oracle Gate & Decimal Agnostic Math (Layer 2 Guardrail):** The Vault maps the asset pair to its corresponding Chainlink feeds. It dynamically normalizes the math via `IERC20Metadata` to prevent decimal hallucinations, checks for stale data, and validates the expected execution price based on real-time market bounds.
6. **Absolute Slippage Validation (Layer 3 Guardrail):** Protected by OpenZeppelin v5's `ReentrancyGuard`, the contract executes the trade and verifies the exact `balanceAfter - balanceBefore`. Maximum allowable slippage is mathematically hardcapped at 200 BPS (2%), neutralizing MEV sandwich attacks.
7. **Deterministic Velocity Guard (Layer 4 Guardrail):** To prevent capital drain from a compromised or hallucinating AI, the smart contract mathematically hard-caps any single execution to a maximum of 20% of the live TVL (`MAX_VELOCITY_BPS`).
8. **Inflation-Resistant Accounting (Layer 5 Guardrail):** By strictly overriding the standard ERC-4626 `totalAssets()` calculation, the Vault dynamically tracks idle cash, live lending rates, and deployed LP principal. This completely neutralizes the notorious share-price manipulation and ERC-4626 donation attacks.
   
---

## System Flow

<div align="center">
  <img src="frontend/public/system-flow.png" width="100%" alt="NEUROLOOM — System Flow" />
</div>

---

## Live Deployment (BSC Testnet)

**Network:** Chain ID `97` (BNB Smart Chain Testnet)

NeuroLoom utilizes a Factory-Proxy architecture to deploy isolated ERC-4626 standard vaults. The AI Agent acts as an external EOA (msg.sender) that continuously monitors state and executes verified calldata into these vaults.

### Smart Contracts & Execution
| Component | Address / Link (BscScan) |
| :--- | :--- |
| **Agent EOA (AI Executor)** | [`0x5f2AC81d58582C16f606d38927120e4676A1e07b`](https://testnet.bscscan.com/address/0x5f2AC81d58582C16f606d38927120e4676A1e07b) |
| **Vault Factory** | [`0x2d2e967e3114bb32175f4dfcf81cddcfb35bff6b`](https://testnet.bscscan.com/address/0x2d2e967e3114bb32175f4dfcf81cddcfb35bff6b) |
| **Master Logic (Implementation)** | [`0xee02cc386315d42d4d9ca34acb3967b6b27d92a6`](https://testnet.bscscan.com/address/0xee02cc386315d42d4d9ca34acb3967b6b27d92a6) |
| **Vault 1: The Yield Farm** (Proxy) | [`0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a`](https://testnet.bscscan.com/address/0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a) |
| **Vault 2: Bluechip Momentum** (Proxy) | [`0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e`](https://testnet.bscscan.com/address/0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e) |
| **Vault 3: Degen Accumulator** (Proxy) | [`0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55`](https://testnet.bscscan.com/address/0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55) |

### Oracles & Infrastructure
| Entity | Address / Endpoint |
| :--- | :--- |
| **Chainlink BNB/USD Oracle** | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |
| **Chainlink BTC/USD Oracle** | `0x5741306c21795FdCBb9b265Ea0255F499DFe515C` |
| **Venus Protocol (vUSDT)** | `0xb7526572FFE56AB9D7489838Bf2E18e3323b441A`
| **PancakeSwap Router (v3)** *(Testnet)* | `0x1b81D678ffb9C0263b24A97847620C99d213eB14` |
| **Mock Swap Router** *(Hackathon Tesnet)* | `0xf33c30a801720294eba818a143339e487cddf129`
| **The Graph Subgraph API** | `https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.7` |

---

## Repository Layout

```text
NeuroLoom/
├── frontend/                        # Next.js App Router (Web3 Dashboard)
│   ├── public/                      # Static assets & background videos
│   └── src/
│       ├── app/                     # Page layouts and Next.js API routes (e.g., ai-logs)
│       ├── components/              # UI modules (SmartVaultsView, AITerminalView, EventLog)
│       ├── config/                  # Subgraph & contract address configurations
│       └── lib/                     # Custom React hooks (useVaultTelemetry) and utilities
│
├── backend/                         # Node.js AI Orchestrator & API Server
│   ├── src/
│       ├── ai/                      # LangChain agents and strategy evaluators
│       ├── chain/                   # Viem clients and smart contract interactions
│       ├── data/                    # External data integrations (Binance, TAAPI, DB)
│       ├── scripts/                 # Core automation (demo_rebalance, demo_unwind, setup)
│       ├── tools/                   # DeFi execution tools for the AI agent
│       ├── utils/                   # Helpers including Institutional PDF Generator
│       └── server.ts                # Express server entry point
│   
│
├── contracts/                       # Solidity Smart Contracts (Hardhat)
│   ├── contracts/
│   │   ├── NeuroLoomVault.sol       # Main ERC-4626 Vault Logic (Implementation)
│   │   ├── NeuroLoomVaultFactory.sol# Factory for generating ERC1967 Proxies
│   │   ├── NeuroLoomProxy.sol       # Custom ERC1967 Proxy structure
│   │   ├── MockRouterV2.sol         # DEX Router simulation for safe local/testnet testing
│   │   └── MockEcosystem.sol        # Testnet mock tokens (MockWBNB, MockBTCB)
│   ├── scripts/                     # Deployment scripts (deploy-factory, fund-router)
│   ├── test/                        # Hardhat unit tests (SecurityGuard, E2ESlippage)
│   └── hardhat.config.ts            # Network configurations (BSC Testnet)
│
└── neuroloom-bsc-testnet/           # The Graph (Subgraph Indexer)
    ├── src/                         # AssemblyScript event mapping logic
    ├── schema.graphql               # Subgraph GraphQL entities definition
    └── subgraph.yaml                # Subgraph manifest tracking all Vault Proxies

```

---

## Technology Stack

The NeuroLoom ecosystem is built on a modern, high-performance web3 stack, strictly separating on-chain execution, AI orchestration, and client-side visualization.

| Layer | Technologies Used |
| :--- | :--- |
| **Smart Contracts** | Solidity `^0.8.28`, Hardhat v3 (Ignition & Viem), OpenZeppelin v5 (ERC-4626 & ERC-1967 Proxies) |
| **Frontend (Core & UI)** | Next.js 16.3 (App Router), React 19, Tailwind CSS v4, Three.js (WebGL), GSAP, Framer Motion, tsParticles |
| **Frontend (Analytics)** | Lightweight Charts (TradingView UI), jsPDF & html-to-image |
| **Frontend (Web3 & Data)**| Wagmi v2, Viem, RainbowKit, Apollo Client (GraphQL), TanStack React Query, @x402/evm |
| **Backend (API & AI Engine)** | Express.js (REST API), Node.js (tsx), TypeScript v7, Viem (Tx Signer), LangChain (`@langchain/core`), TAAPI.io (Quant Market Data), PDFKit PDFKit |
| **AI Model & Memory** | Groq API (openai/gpt-oss-20b) *— Dynamic Orchestrator*, SQLite (Local Agent State) |
| **On-chain Indexing** | The Graph (Subgraph API for real-time event streaming) |
| **Infrastructure & Backend Deployment** | Oracle Cloud (Linux VPS), Nginx (Reverse Proxy), DuckDNS (Dynamic DNS), Let's Encrypt (SSL/TLS)|

---

## Cloud Architecture & Autonomous Execution

NeuroLoom's architecture cleanly separates the client-facing Web3 UI from the autonomous AI execution engine.

### 1. Frontend Dashboard (Vercel)
The UI is built with Next.js (App Router) and deployed via Vercel.
- **Environment:** Zero-config. All network configurations and proxy contract addresses are hardcoded constants.

### 2. API Server, PDF Engine & AI Worker (Oracle Cloud)
To ensure high availability, the Express.js backend and the autonomous AI worker are deployed on an Oracle Cloud Ubuntu VM behind an Nginx reverse proxy with SSL (Let's Encrypt).
- **Function:** Serves live history data via `/api/history` and dynamically generates Institutional PDF Tear Sheets via `pdfkit`.
- **Autonomous AI Engine:** The execution script (`autonomous_yield_farm.ts`) is architected for 24/7 continuous tick-by-tick execution. However, for this demo deployment, it is throttled to a **strict 12-hour cron schedule** to accommodate Groq's free-tier API rate limits. It ingests live market data from TAAPI, synthesizes strategies through a multi-agent LangChain/Groq pipeline, and executes real on-chain transactions (BSC Testnet) via Viem.
- **Ledger:** All AI reasoning, risk evaluation outputs, and on-chain transaction hashes are actively written to `autonomous_ai_logs.json`, providing a real-time, transparent audit trail.
---

## Getting Started

**Prerequisites:** Node.js 18+ and npm/yarn.
*Note: NeuroLoom enforces Separation of Duties. You must use two distinct wallets for Admin & AI (or use the same wallet strictly for local Testnet demonstration).*

### 1. Installation
```bash
git clone <repo-url>
cd NeuroLoom

# Install dependencies across all workspaces
cd contracts && npm install
cd backend && npm install
cd frontend && npm install
```

### 2. Environment Variables

Create a `.env` file in both `/contracts` and `/backend` directories.

| **Variable** | **Location** | **Required** | **Purpose** |
| --- | --- | --- | --- |
| `PRIVATE_KEY` | `/contracts/.env` | Yes | Admin Deployer Wallet for proxy upgrades & whitelisting. |
| `AI_PRIVATE_KEY` | `/backend/.env` | Yes | AI Executor Wallet for signing live omnichain trades. |
| `GROQ_API_KEY` | `/backend/.env` | Yes | LLM Engine inference capability. |
| `MOCK_SCENARIO` | `/backend/.env` | No | Set to `"DEMO"` for micro-transactions (0.0001 USDT) during live pitches. |

### 3. Quick Start Commands

Run these core services from their respective directories in separate terminal windows:

| **Service** | **Command** | **Description** |
| :--- | :--- | :--- |
| **Smart Contracts** | `npx hardhat test test/E2ESlippage.test.ts` | Runs deterministic security & MEV attack simulations. |
| **API & PDF Server** | `npx tsx src/server.ts` | Boots the Express backend (Port 4000) for PDF rendering and history logs. |
| **AI Orchestrator** | `npx tsx src/index.ts` | Boots the autonomous LangChain Harness (requires Groq key). |
| **Frontend UI** | `npm run dev` | Launches the Next.js Web3 Dashboard at `http://localhost:7000`. |

## Security & Threat Model

| **Threat** | **Applied Mitigation** | **Status** |
| --- | --- | --- |
| Unauthorized Execution | Strict `AccessControl` (`onlyRole(AI_EXECUTOR_ROLE)`) | ✅ On-chain |
| AI Arbitrary Execution | Strict On-Chain Protocol Allowlist (`approvedProtocols`) | ✅ On-chain |
| AI Route/Decimal Hallucination | Pre-execution Oracle validation & dynamic `IERC20Metadata` | ✅ On-chain |
| Reentrancy Attacks | OpenZeppelin v5 `ReentrancyGuard` (ERC-7201 safe) | ✅ On-chain |
| Oracle Stale / Flash crash | Rejects Chainlink data older than 3600 seconds | ✅ On-chain |
| Sandwich MEV Attack | Absolute post-execution balance check via Fair Value | ✅ On-chain |
| AI API Failure / Network Outage | Evaluator Circuit Breaker (Halts execution to `HOLD`) | ✅ Off-chain |

## Deterministic Test Coverage

```
$ npx hardhat test

 Security Audit & Wamia Guards: NeuroLoomVault (Hardhat v3 + Viem)
    🛡 Core Access Control (RBAC & Whitelist)
      ✔ Must have a valid AI_EXECUTOR_ROLE. (1029ms)
      ✔ Must REVERT if the AI ​​targets a non-whitelisted protocol.
    NeuroLoom Defense Systems 
      ✔ Velocity Guard: Must REVERT if AI uses > 20% of TVL in a single transaction.
      ✔ Oracle Guard: Must REVERT if the transaction does not have a valid Oracle Price Feed.


4 passing (4 nodejs)
```

## On-Chain Provisioning & Operational Scripts

Targeted network scripts for real-world deployment, security provisioning, and live BSC Testnet demonstrations. These enforce role-based access control and integrate the Vault with decentralized infrastructure.

**Run these commands from their designated workspace directories:**

| **Phase** | **Command** | **Directory** | **Purpose** |
| --- | --- | --- | --- |
| **1. Whitelist Target** | `npx hardhat run scripts/whitelist-protocol.ts --network bscTestnet` | `/contracts` | Admin authorization for the V3 Router at the contract level. |
| **2. Oracle Setup** | `npx tsx src/scripts/setup-oracle.ts` | `/backend` | Connects Chainlink BNB/USD to the dynamic oracle system. |
| **3. Demo Rebalance** | `npx tsx src/scripts/demo_rebalance.ts` | `/backend` | Bypasses LLM delay to blast a deterministic entry payload. |
| **4. Demo Unwind** | `npx tsx src/scripts/demo_unwind.ts` | `/backend` | Simulates an AI exiting a volatile AMM position. |
| **5. Audit Vault** | `npx tsx src/scripts/debug-vault.ts` | `/backend` | Read-only diagnostic utility fetching real-time idle and active TVL. |
---

## Known Limitations

NeuroLoom was built as a highly functional prototype for the Indonesia Web3 Hackathon. The current architecture successfully demonstrates advanced capabilities, including autonomous Concentrated Liquidity (NFT V3) management, on-chain emergency unwinding, and intra-cycle AI self-correction (Multi-Agent Debate). 

To transition this architecture into a production-ready Mainnet environment, the following infrastructure upgrades are scoped:

**Impermanent Loss (IL) Mathematical Modeling & Simulation**
- *Current Prototype:* The system currently features a deterministic `simulate_il_risk` module. The AI pre-calculates exact V3 IL exposure and amplification factors against projected volatility bands before committing capital to a liquidity pool.
- *Production Target:* Evolve the current IL simulation into a continuous, automated dynamic hedging engine. The system will autonomously construct delta-neutral positions (e.g., executing perpetual shorts against the LP base asset) to perfectly offset the simulated IL exposure during high-volatility events.

**AI Executor Key Management**
- *Current Prototype:* The `AI_PRIVATE_KEY` is loaded from a local `.env` file for rapid hackathon iteration.
- *Production Target:* Migrate to KMS-backed signing (AWS KMS / HashiCorp Vault). The raw private key must never exist in plaintext or process memory during autonomous execution.

**AI Memory & Long-Term Execution Learning**
- *Current Prototype:* The system uses a local JSON ledger (`autonomous_ai_logs.json`) for short-term memory, and the Evaluator agent provides immediate, intra-cycle self-correction.
- *Production Target:* Migrate to a distributed PostgreSQL/Vector database. This enables semantic retrieval of past failures, allowing the AI to dynamically learn from long-term on-chain rejections (e.g., automatically widening its baseline slippage tolerance if the last 30 days of transactions reverted due to liquidity crunches).

**Oracle Feed Diversity & Redundancy**
- *Current Prototype:* The smart contract's slippage guardrail intercepts data from a single Chainlink aggregator per pair.
- *Production Target:* Integration of multi-asset Time-Weighted Average Price (TWAP) and redundant decentralized oracle networks (DONs) to neutralize isolated flash-crash vulnerabilities and provide fallback pricing.

**Dynamic Risk-Parity & Allocation Sizing**
- *Current Prototype:* The AI currently utilizes the Quarter Kelly Criterion (`calculate_optimal_allocation`) to mathematically propose safe trade sizes based on volatility and risk-free rates, which is then strictly capped by the smart contract's 20% Velocity Guard.
- *Production Target:* Expand the current Kelly sizing module to ingest real-time on-chain mempool liquidity depth and multi-asset covariance matrices, enabling institutional-grade risk-parity portfolio balancing across dozens of vaults simultaneously.

**Evaluation Framework & Observability Stack**
- *Current Prototype:* Relies on LangChain agents utilizing Zod schemas for tool execution.
- *Production Target:* Integrate LangGraph as a deterministic state manager for the Evaluator-Optimizer cycle, and deploy LangSmith for per-node tracing, AI token cost optimization, and latency monitoring.

**Gas-Aware Cycle Scheduler**
- *Current Prototype:* Execution cycles run at a fixed interval or are triggered by simulated events.
- *Production Target:* Implement a continuous gas-aware scheduler. The AI will autonomously delay execution when estimated gas costs exceed a defined threshold relative to the projected yield gain, ensuring net-positive protocol revenue.

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

*NeuroLoom — AI that routes, Blockchain that verifies.* 
Building for Indonesia Web3 Hackathon. BNB Chain.
