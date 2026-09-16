> **Autonomous AI-Driven DeFi Yield Optimizer — True Omnichain Routing & Hardcoded MEV resistance: AI yang merakit data, Blockchain yang memverifikasi.**

NeuroLoom adalah protokol Decentralized Finance (DeFi) generasi berikutnya yang menggabungkan Kecerdasan Buatan (AI) tingkat lanjut (pola _Orchestrator-Workers_) dengan eksekusi _on-chain_ yang aman. Protokol ini memungkinkan agen AI otonom untuk menganalisis dan merutekan portofolio (Swap, Lending, Staking) 24/7 di seluruh ekosistem DeFi, sementara _guardrail Smart Contract_ yang ketat melindungi Total Value Locked (TVL) dari bot MEV, _flash loan attacks_, dan halusinasi AI.

Dibangun untuk kompetisi Indoenesia Web3 Hackathon 2026.

## Daftar Isi

1. Sorotan Utama (Highlights)
2. Masalah yang Diselesaikan
3. Model Vault (ERC-4626)
4. Arsitektur Sistem
5. Fungsi Smart Contract
6. Live Deployment (BSC Testnet)
7. Struktur Repositori
8. Teknologi yang Digunakan
9. Mulai Menjalankan Proyek
10. Keamanan & Pengujian
11. Batasan Sistem Saat Ini
12. Lisensi

## Sorotan Utama (Highlights)

- **True Omnichain Routing:** NeuroLoom tidak dikunci pada satu DEX atau protokol _Lending_. AI merakit instruksi _bytecode_ generik (`calldata`) secara dinamis, dan _Smart Contract_ mengeksekusinya ke _target protocol_ mana pun di jaringan.
- **AI Mengusulkan, Blockchain Memverifikasi.** Model AI bisa berhalusinasi. NeuroLoom menyelesaikannya dengan memaksa setiap _trade_ untuk melewati validasi matematis yang ketat terhadap Oracle Chainlink secara _on-chain_ sebelum _bytecode_ dijalankan.
- **Bounded MEV Exposure.** NeuroLoom menjamin **batas atas kerugian**: setiap eksekusi wajib menghasilkan minimal nilai yang diharapkan berdasarkan _fair value_ Chainlink, atau seluruh rantai transaksi akan dibatalkan (_revert_). Kerugian maksimum terkunci di 200 BPS (2%).
- **Pembaruan Tanpa Downtime.** Menggunakan pola proxy UUPS (EIP-1822), logika eksekusi protokol dapat diperbarui tanpa memaksa pengguna memigrasikan likuiditas mereka.
- **The Orchestrator-Workers AI Engine:** Mesin _off-chain_ tidak menggunakan prompt statis. _Orchestrator_ AI menganalisis kondisi pasar secara _real-time_, memecah tugas ke beberapa spesialis AI (MOMENTUM*ANALYST, RISK_MANAGER, dll), dan \_Synthesizer* menyimpulkan keputusan paling optimal.

## Masalah yang Diselesaikan

_Automated Yield Optimizers_ saat ini menghadapi dua kelemahan fatal:

1. **Otomatisasi Kaku & Silo Protokol:** _Vault_ tradisional menggunakan logika statis (_hardcoded_) yang hanya bisa masuk ke satu _pool_ spesifik.
2. **Pembantaian MEV & Halusinasi AI:** Jika _vault_ dikendalikan AI secara langsung tanpa _circuit breaker_, bot MEV akan memantau _mempool_ untuk melakukan _front-run/sandwich attack_, atau AI bisa saja salah merakit jumlah desimal yang berujung pada hilangnya TVL.

NeuroLoom menjembatani celah ini dengan AI dinamis _multi-perspective_ yang dilapisi perisai _Slippage Guard_ on-chain ganda.

## Model Vault (ERC-4626)

Primitif utama dari NeuroLoom adalah kontrak `NeuroLoomVaultV2`, yang sepenuhnya mengadopsi standar `ERC4626Upgradeable` di belakang `ERC1967Proxy`:

1. **Penyediaan Likuiditas (ERC-4626):** Standar _Tokenized Vault_ memungkinkan integrasi tanpa batas dengan _Frontend_ atau protokol lain untuk proses _deposit/withdraw_.
2. **Pemantauan Multi-Lapis:** Node _off-chain_ secara konstan membaca _Market Data_, _Vault State_, dan _Database Memories_ menggunakan AI _Orchestrator_.
3. **Panggilan Eksekusi Omnichain:** AI merakit instruksi dan memanggil `executeOmnichain(targetProtocol, data, tokenIn, tokenOut, amountIn, expectedAmountOutMin)`.
4. **Gerbang Oracle (Guardrail Lapis 1):** _Vault_ mencegat panggilan, mengambil `latestRoundData()` dari Chainlink, mengecek batas kedaluwarsa data, dan memverifikasi batas slippage.
5. **Eksekusi Generik & Validasi Mutlak (Guardrail Lapis 2):** Kontrak mengeksekusi `targetProtocol.call(data)`. Jika jumlah token yang kembali (_balanceAfter - balanceBefore_) kurang dari `expectedAmountOutMin`, kontrak akan membatalkan seluruh transaksi (_revert_).

## Arsitektur Sistem

```
                ┌─────────────────────────────────────────────────────────────┐
                │             AI HARNESS (Node.js/TS Backend)                 │
                │ 1. ORCHESTRATOR: Analyzes Market, Vault, & Memories         │
                │ 2. WORKERS: Parallel analytical processing (LangChain)      │
                │ 3. SYNTHESIZER: Outputs strict JSON action                  │
                │ 4. EXECUTOR: Builds 'calldata' & signs Viem Transaction     │
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
                        │  executeOmnichain()        │   └──────────────────────┘
                        └──────────────┬─────────────┘
                                       │ If safe, injects raw calldata
           ┌───────────────────────────┼───────────────────────────┐
           ▼                           ▼                           ▼
 ┌───────────────────┐       ┌───────────────────┐       ┌───────────────────┐
 │   PancakeSwap V3  │       │   Venus Lending   │       │   Any Future DEX  │
 │ exactInputSingle  │       │    mint/supply    │       │     swap/add      │
 └───────────────────┘       └───────────────────┘       └───────────────────┘
```

## Fungsi Smart Contract

Dapat diperbarui melalui UUPS, dikelola dengan `AccessControl`, dan memiliki standar ERC-4626.

| **Fungsi**                            | **Akses**     | **Deskripsi**                                                                                          |
| ------------------------------------- | ------------- | ------------------------------------------------------------------------------------------------------ |
| `initialize(...)`                     | initializer   | Menyiapkan RBAC, aset dasar ERC4626, dan alamat Oracle.                                                |
| `executeOmnichain(...)`               | AI_EXECUTOR   | Titik masuk AI untuk mengeksekusi _raw calldata_ ke _target protocol_ (DEX/Lending) dinamis manapun.   |
| `_validateSlippageAgainstOracle(...)` | internal      | Mengambil harga Chainlink, menormalisasi desimal, dan menghitung _fair value_ untuk _Circuit Breaker_. |
| `pause()` / `unpause()`               | DEFAULT_ADMIN | _Circuit breaker_ absolut untuk menghentikan operasional dalam krisis _black swan_.                    |

**Errors:** `SlippageExceeded()`, `UnauthorizedAI()`, `StaleOracleData()`.

## Live Deployment (BSC Testnet)

**Network:** chain `97` · RPC `(https://bsc-testnet.rpc.sentio.xyz)`

| **Entitas Kontrak** | **Alamat (BscScan)**                         |
| ------------------- | -------------------------------------------- |
| NeuroLoomProxy      | `0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E` |
| Implementation V2   | `0x07e63e62adefd7dc10f5e46e99f28cbbb1b61474` |
| Chainlink BNB/USD   | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |

## Struktur Repositori

```
NeuroLoom/
├── contracts/                     # Fase 1: Smart Contracts (Solidity)
│   ├── contracts/                 # Logika Vault V2, UUPS Proxy, dan MockOracle
│   ├── scripts/                   # Skrip deployment & UUPS upgrade
│   ├── test/                      # E2E tests: Anti-Sandwich Attack (Omnichain)
│   └── hardhat.config.ts          # Konfigurasi Viem + Hardhat v3
├── backend/                       # Fase 2: AI Harness Node.js (LangChain)
│   ├── src/ai/agent.ts            # Orchestrator-Workers & Synthesizer Workflow
│   ├── src/chain/executor.ts      # Pembuat Calldata Omnichain & Web3 Signer
│   ├── src/data/db.ts             # SQLite: Log Memori & Keputusan AI
│   └── src/index.ts               # Autonomous Daemon Cycle (24/7)
└── README.md
```

## Teknologi yang Digunakan

| **Kategori**       | **Teknologi Utama**                             |
| ------------------ | ----------------------------------------------- |
| Smart Contracts    | Solidity `^0.8.24`, ERC-4626, OpenZeppelin UUPS |
| EVM Environment    | Hardhat v3 (v-next), `viem`                     |
| AI / LLM Framework | LangChain JS, Google Gemini 3.6 Flash           |
| Backend & DB       | Node.js, TypeScript (tsx), SQLite               |

## Mulai Menjalankan Proyek

**Prasyarat**

- Node.js 18+
- npm atau yarn.

```
git clone https://github.com/your-username/aegis-vault.git
cd NeuroLoom/backend
npm install
```

**Konfigurasi Environment Backend (`.env`)**

```
GOOGLE_API_KEY=your_gemini_api_key
AI_PRIVATE_KEY=your_ai_executor_wallet_private_key
```

Jalankan _Autonomous AI Agent_:

```
npx tsx src/index.ts
```

## Keamanan & Pengujian

### Model Ancaman (Threat Model)

| **Ancaman**                | **Mitigasi yang Diterapkan**            | **Status**   |
| -------------------------- | --------------------------------------- | ------------ |
| AI halusinasi rute/jumlah  | _Pre-execution Oracle floor validation_ | ✅ On-chain  |
| Oracle stale / Flash crash | Menolak data Chainlink > 3600 detik     | ✅ On-chain  |
| Sandwich MEV Attack        | _Post-execution balance check_ absolut  | ✅ On-chain  |
| AI Infinite Loop           | _Memory-aware prompting_ via SQLite DB  | ✅ Off-chain |

### Pengujian Deterministik (E2E)

Pengujian E2E menggunakan Viem pada lingkungan Hardhat v3 yang sangat cepat untuk menyimulasikan injeksi data _Omnichain_ yang dimanipulasi bot MEV.

**Output Test:**

```
  E2E Mainnet Fork: Anti-Sandwich Attack & Omnichain (Hardhat v3)
    ⏳ Mensimulasikan eksekusi Omnichain AI dengan slippage yang dihancurkan MEV...
    ✔ Harus REVERT jika AI mengirim expectedAmountOutMin di bawah batas wajar (MEV Attack Simulation) (1124ms)
```

## Batasan Sistem Saat Ini

1. **Pembatasan Oracle:** Saat ini, validasi tingkat pertama terikat pada satu `IChainlinkAggregator` (BNB/USD). Integrasi Oracle _multi-pair_ sedang dalam tahap arsitektur.
2. **Database Mode Lokal:** Log memori AI saat ini menggunakan SQLite untuk prototipe berkecepatan tinggi tanpa hambatan I/O jaringan. Akan dimigrasikan ke _cloud database_ untuk _scaling_ tahap produksi.

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
