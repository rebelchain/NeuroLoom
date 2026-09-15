```
<div align="center">
  <h1>🧠 NeuroLoom (Aegis Vault)</h1>
</div>

> **Autonomous AI-Driven DeFi Yield Optimizer — Hardcoded MEV resistance: AI yang mengusulkan, Blockchain yang memverifikasi.**

NeuroLoom adalah protokol Decentralized Finance (DeFi) generasi berikutnya yang menggabungkan Kecerdasan Buatan (AI) dengan eksekusi on-chain yang aman. Protokol ini memungkinkan agen AI otonom untuk mengelola *rebalancing* portofolio 24/7, sementara *guardrail Smart Contract* yang ketat melindungi Total Value Locked (TVL) dari bot MEV, *flash loan attacks*, dan halusinasi AI.

Dibangun untuk kompetisi Web3 Hackathon 2026.

<p align="center">
  <img alt="Solidity 0.8.24" src="https://img.shields.io/badge/Solidity-0.8.24-363636?logo=solidity&logoColor=white&style=flat-square" />
  <img alt="Hardhat v3" src="https://img.shields.io/badge/Hardhat-v3%20(Viem)-EBE138?logo=hardhat&logoColor=black&style=flat-square" />
  <img alt="Node.js" src="https://img.shields.io/badge/Node.js-Backend-339933?logo=nodedotjs&logoColor=white&style=flat-square" />
  <img alt="BSC Testnet" src="https://img.shields.io/badge/Network-BSC%20Testnet-F3BA2F?logo=binance&logoColor=black&style=flat-square" />
  <img alt="Tests" src="https://img.shields.io/badge/Tests-Passing%20(E2E%20Mocked)-10B981?style=flat-square" />
</p>

---

## Daftar Isi

1. Sorotan Utama (Highlights)
2. Masalah yang Diselesaikan
3. Model Vault
4. Arsitektur Sistem
5. Fungsi Smart Contract
6. Live Deployment (BSC Testnet)
7. Struktur Repositori
8. Teknologi yang Digunakan
9. Mulai Menjalankan Proyek
10. Aplikasi AI Otonom (Fase 2)
11. Keamanan & Pengujian
12. Batasan Sistem Saat Ini
13. Catatan Integrasi BSC & PancakeSwap
14. Lisensi

---

## Sorotan Utama (Highlights)

- **AI Mengusulkan, Blockchain Memverifikasi.** Model AI bisa berhalusinasi. NeuroLoom menyelesaikannya dengan mengisolasi AI di luar rantai (*off-chain*) dan memaksa setiap *trade* untuk melewati validasi matematis yang ketat terhadap Oracle Chainlink yang tidak dapat diubah (*immutable*) secara *on-chain*.
- **Bounded MEV Exposure.** NeuroLoom tidak mengklaim imunitas MEV 100% — itu mustahil di *mempool* publik. Yang dijamin oleh kontrak ini adalah **batas atas kerugian**: setiap *swap* wajib menghasilkan minimal 98% dari *fair value* Chainlink, atau transaksi akan dibatalkan (*revert*). Kerugian maksimum per *rebalance* terkunci di 200 BPS secara matematis, seberapa pun agresifnya bot atau sekacau apa pun output AI-nya.
- **Pembaruan Tanpa Downtime.** Menggunakan pola proxy UUPS (EIP-1822), logika eksekusi protokol dapat diperbarui tanpa memaksa pengguna memigrasikan likuiditas mereka.
- **Blast Radius Terkunci.** Jika *private key* AI bocor sepenuhnya, penyerang tetap tidak bisa: (a) *swap* ke token di luar *whitelist*, (b) memindahkan lebih dari batas persentase TVL dalam satu transaksi, (c) melakukan *trade* tanpa melewati *cooldown*, atau (d) menarik dana keluar dari *vault* sama sekali. Kerugian terburuk terhitung secara matematis, bukan diasumsikan.

---

## Masalah yang Diselesaikan

*Automated Yield Optimizers* saat ini menghadapi dua kelemahan fatal:
1. **Otomatisasi Kaku:** *Vault* tradisional menggunakan logika statis (*hardcoded*) yang tidak dapat beradaptasi dengan berita makroekonomi atau pergeseran pasar mendadak.
2. **Pembantaian MEV:** Jika sebuah *vault* dikendalikan oleh entitas *off-chain* dinamis (seperti AI) yang meminta *swap* via DEX *router*, bot MEV akan memantau *mempool* untuk melakukan *front-run* dan *back-run* transaksi tersebut, menguras TVL melalui manipulasi *slippage*.

NeuroLoom menjembatani celah ini dengan memberikan otak cerdas dari AI yang dilapisi perisai matematis *on-chain* kriptografik yang tidak bisa ditembus.

## Model Vault

Primitif utama dari NeuroLoom adalah kontrak `NeuroLoomVaultV2`, yang berada di belakang sebuah `ERC1967Proxy`:

1. **Penyediaan Likuiditas:** Di Fase 1, kontrak beroperasi sebagai *single-treasury vault* yang dikelola DAO/Admin untuk membuktikan konsep keamanan (ERC-4626 multi-depositor berada di *roadmap*).
2. **Pemantauan AI:** *Worker* Node.js *off-chain* secara konstan membaca data pasar dan memutuskan untuk melakukan *rebalance* portofolio.
3. **Panggilan Eksekusi:** AI (yang memegang `AI_EXECUTOR_ROLE`) memanggil fungsi `executeRebalance(amountIn, amountOutMin, path)`.
4. **Gerbang Oracle (Guardrail):** *Vault* mencegat panggilan tersebut, mengambil data `latestRoundData()` dari Chainlink, mengecek apakah data basi (>3600 detik), dan menormalisasi perbedaan desimal antara token (18) dan Oracle (8).
5. **Circuit Breaker Anti-Halusinasi:** *Vault* menghitung `minimumAcceptableAmount` dari harga Chainlink. Jika `amountOutMin` yang dikirim AI lebih rendah dari nilai itu — entah karena halusinasi model AI atau karena *key* AI telah dikuasai penyerang — kontrak akan membatalkan transaksi (*revert*) dengan pesan `SlippageExceeded`. AI sama sekali tidak memiliki wewenang untuk melonggarkan proteksi *slippage*-nya sendiri.
6. **Eksekusi Aman:** Jika aman secara matematis, *vault* akan menyetujui (*approve*) dan mengeksekusi perdagangan secara langsung via PancakeSwap.

---

## Arsitektur Sistem

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
                        │  executeRebalance()        │   └──────────────────────┘
                        └──────────────┬─────────────┘
                                       │ If slippage is safe
                        ┌──────────────▼─────────────┐
                        │    PancakeSwap V2 Router   │
                        │  swapExactTokensForTokens  │
                        └────────────────────────────┘
```

## Fungsi Smart Contract

Dapat diperbarui melalui UUPS, dikelola dengan `AccessControl`, dan memiliki fitur `Pausable` untuk keadaan darurat.

| **Fungsi** | **Akses** | **Deskripsi** |
| --- | --- | --- |
| `initialize(...)` | initializer | Menyiapkan RBAC, aset, *router*, dan alamat Oracle. Terkunci pada kontrak implementasi. |
| `executeRebalance(amountIn, amountOutMin, path)` | AI_EXECUTOR | Titik masuk utama bagi AI untuk mengeksekusi *swap* portofolio. Dilindungi oleh `whenNotPaused`. |
| `_validateSlippageAgainstOracle(...)` | internal | Mengambil harga Chainlink, menormalisasi desimal, menghitung *fair value*, dan menerapkan batas `MAX_SLIPPAGE_BPS` (200 BPS). |
| `setDexRouter(_newRouter)` | DEFAULT_ADMIN | Memungkinkan DAO untuk memperbarui *interface router* DEX. |
| `pause()` / `unpause()` | DEFAULT_ADMIN | *Circuit breaker* absolut. Menghentikan semua eksekusi AI jika terjadi krisis *black swan*. |

**Errors:** `SlippageExceeded(amountOutMin, minimumAcceptable)`, `UnauthorizedAI()`, `StaleOracleData()`, `InvalidOraclePrice()`.

## Live Deployment (BSC Testnet)

**Network:** chain `97` · RPC `https://bsc-testnet.rpc.sentio.xyz`

| **Entitas Kontrak** | **Alamat (Klik untuk cek di BscScan)** |
| --- | --- |
| NeuroLoomProxy | `0xe38887648d7272e9Eb3C06628767bb3d84a9FF4E` |
| Implementation V2 | `0x07e63e62adefd7dc10f5e46e99f28cbbb1b61474` |
| PancakeRouter V2 | `0x9Ac64Cc6e4415144C455BD8E4837Fea55603e5c3` |
| Chainlink BNB/USD | `0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526` |

## Struktur Repositori

Plaintext

# 

```
aegis-vault/
├── contracts/                     # Fase 1: Smart Contracts (Solidity)
│   ├── contracts/                 # Logika Vault, UUPS Proxy, dan MockOracle
│   ├── scripts/                   # Skrip deployment & UUPS upgrade
│   ├── test/                      # Hardhat v3 EDR E2E tests (Mocked Oracles)
│   └── hardhat.config.ts          # Konfigurasi Viem + EDR Simulated Forking
├── backend/                       # Fase 2: AI Node.js Worker (WIP)
│   ├── src/ai/                    # Logika LLM Prompts & RAG Memory
│   └── src/chain/                 # Eksekusi Viem & KMS Integrations
└── README.md
```

## Teknologi yang Digunakan

| **Kategori** | **Teknologi Utama** |
| --- | --- |
| Smart Contracts | Solidity `^0.8.24`, OpenZeppelin Upgradable (UUPS) |
| EVM Environment | Hardhat v3 (v-next), Node.js native `node:test` |
| Web3 / Interaksi | viem `^2.x`, `@nomicfoundation/hardhat-viem` |
| AI Backend (Fase 2) | Node.js, TypeScript, LangChain, PostgreSQL/Redis |

## Mulai Menjalankan Proyek

**Prasyarat**

- Node.js 18+ (Node 20 LTS direkomendasikan untuk *native test runner* Hardhat v3).
- npm atau yarn.

Bash

# 

```
git clone https://github.com/your-username/aegis-vault.git
cd aegis-vault/contracts
npm install
```

**Konfigurasi Environment**

Buat file `.env` di direktori `contracts`:

Cuplikan kode

# 

```
PRIVATE_KEY=your_deployer_wallet_private_key
```

> ⚠️ **Catatan Keamanan:** *Key deployer* ini **hanya** digunakan untuk *deployment* di testnet. Di fase produksi, *Private Key* untuk `AI_EXECUTOR_ROLE` dikelola melalui *Key Management System* (KMS) dan tidak pernah menyentuh *disk* dalam bentuk *plaintext*.
> 

## Keamanan & Pengujian

### Model Ancaman (Threat Model)

| **Ancaman** | **Mitigasi yang Diterapkan** | **Status** |
| --- | --- | --- |
| AI halusinasi nilai tukar | Oracle *floor validation* (Batas slippage 200 BPS) | ✅ On-chain |
| Oracle stale / Flash crash | Menolak data Chainlink > 3600 detik | ✅ On-chain |
| Sandwich MEV Attack | Kerugian maksimal terkunci di 2% | ✅ On-chain |
| Private Key AI bocor | *Whitelist*, *Size cap*, & *Cooldown timer* | ⚠️ Roadmap |
| Rug pull via Upgrade | Timelock + Multisig DAO admin | ❌ Roadmap |

### Pengujian Deterministik (E2E)

Pengujian E2E tidak bergantung pada RPC Testnet publik yang tidak stabil. NeuroLoom menyuntikkan `MockOracle.sol` ke dalam jaringan EDR-Simulated lokal, membuktikan secara *real-time* bahwa transaksi yang diserang bot MEV akan digagalkan.

**Output Hardhat v3:**

Plaintext

# 

```
  E2E Mainnet Fork: Anti-Sandwich Attack (Hardhat v3)
    ⏳ Mensimulasikan eksekusi AI dengan slippage yang dihancurkan MEV...
    ✔ Harus REVERT jika AI mengirim amountOutMin di bawah batas wajar (MEV Attack Simulation) (1139ms)

  1 passing (1 nodejs)
```

Untuk menjalankan tes sendiri:

Bash

# 

```
npx hardhat clean
npx hardhat test test/E2ESlippage.test.ts
```

## Batasan Sistem Saat Ini

1. **Pembatasan Pasangan Oracle:** Saat ini, kontrak hanya terikat pada satu `IChainlinkAggregator`. AI hanya dapat melakukan *rebalance* secara aman pada pasangan token yang sesuai dengan Oracle tersebut (contoh: BNB/USD). Dukungan *multi-pair routing* memerlukan pembaruan arsitektur *registry*.
2. **Desain Single-Treasury:** Fase 1 dirancang sebagai *vault* portofolio tunggal untuk membuktikan keamanan perlindungan MEV. Standar multi-depositor ERC-4626 (dengan fitur *deposit/withdraw* dan *share accounting*) sedang dalam pengembangan.

## Catatan Integrasi BSC & PancakeSwap

- **PancakeSwap V2 vs V3:** Meskipun PancakeSwap V3 menawarkan likuiditas terkonsentrasi, eksekusi pada Fase 1 ini menggunakan *interface* PancakeSwap V2 (`swapExactTokensForTokens`). Hal ini diputuskan secara sadar karena kurangnya kedalaman likuiditas V3 yang stabil di lingkungan BSC Testnet. *Upgrade* ke V3 `exactInputSingle` akan dilakukan saat peluncuran di *Mainnet*.
- **Normalisasi Desimal:** *Data feed* Chainlink BSC umumnya menggunakan 8 desimal untuk pasangan USD. Kontrak *vault* secara internal melakukan normalisasi dengan pembagi `1e8` agar sejajar dengan standar aset ERC20 (18 desimal), mencegah eksploitasi matematika.

## Lisensi

Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.