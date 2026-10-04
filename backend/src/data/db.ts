import fs from "fs";
import path from "path";

export interface TradeRecord {
  timestamp: string;
  vaultStrategy: string;
  targetVault?: string;
  action: string;
  executedPrice: number;
  rsiAtExecution: number;
  reasoning: string;
  status: string;
  txHash?: string;
}

// FUNGSI HELPER: Mendapatkan nama file spesifik per Vault
function getDbPath(vaultStrategy: string): string {
  // Ubah nama seperti "Bluechip Momentum" menjadi "bluechip-momentum"
  const safeName = vaultStrategy.toLowerCase().replace(/\s+/g, "-");
  return path.resolve(process.cwd(), `journal_${safeName}.json`);
}

// Inisialisasi awal untuk file global (jika diperlukan)
const GLOBAL_DB_PATH = path.resolve(process.cwd(), "journal_global.json");
if (!fs.existsSync(GLOBAL_DB_PATH)) {
  fs.writeFileSync(GLOBAL_DB_PATH, JSON.stringify([]));
}

export async function logAIDecision(
  vaultStrategy: string,
  action: string,
  executedPrice: number,
  rsiAtExecution: number,
  reasoning: string,
  status: string = "SUCCESS",
  txHash: string = "",
  targetVault: string = "",
): Promise<void> {
  // Tentukan path berdasarkan vault (jika kosong, gunakan global)
  const dbPath = vaultStrategy ? getDbPath(vaultStrategy) : GLOBAL_DB_PATH;

  // Pastikan file eksis
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify([]));
  }

  const data = fs.readFileSync(dbPath, "utf-8");
  const records: TradeRecord[] = JSON.parse(data);

  const newRecord: TradeRecord = {
    timestamp: new Date().toISOString(),
    vaultStrategy,
    targetVault,
    action,
    executedPrice,
    rsiAtExecution,
    reasoning,
    status,
    txHash,
  };

  records.push(newRecord);
  fs.writeFileSync(dbPath, JSON.stringify(records, null, 2));

  // --- OPSIONAL: Salin juga ke Global Journal untuk Dashboard Global ---
  // Jika kamu ingin dasbor utama melihat SEMUA log gabungan
  const globalData = fs.readFileSync(GLOBAL_DB_PATH, "utf-8");
  const globalRecords: TradeRecord[] = JSON.parse(globalData);
  globalRecords.push(newRecord);
  fs.writeFileSync(GLOBAL_DB_PATH, JSON.stringify(globalRecords, null, 2));
}

// Fungsi ini sekarang butuh parameter opsional 'vaultStrategy'
export async function getRecentMemories(
  limit: number = 5,
  vaultStrategy?: string,
): Promise<TradeRecord[]> {
  const dbPath = vaultStrategy ? getDbPath(vaultStrategy) : GLOBAL_DB_PATH;

  if (!fs.existsSync(dbPath)) {
    return [];
  }

  const data = fs.readFileSync(dbPath, "utf-8");
  const records: TradeRecord[] = JSON.parse(data);
  return records.slice(-limit);
}
