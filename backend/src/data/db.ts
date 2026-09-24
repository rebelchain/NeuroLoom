import fs from "fs";
import path from "path";

const DB_PATH = path.resolve(process.cwd(), "trade_journal.json");

export interface TradeRecord {
  timestamp: string;
  vaultStrategy: string;
  action: string;
  executedPrice: number;
  rsiAtExecution: number;
  reasoning: string;
  status: string;
}

// Inisialisasi DB JSON jika belum ada
if (!fs.existsSync(DB_PATH)) {
  fs.writeFileSync(DB_PATH, JSON.stringify([]));
}

// Menerima 5 atau 6 argumen sesuai dengan yang dipanggil di index.ts
export async function logAIDecision(
  vaultStrategy: string,
  action: string,
  executedPrice: number,
  rsiAtExecution: number,
  reasoning: string,
  status: string = "SUCCESS", 
): Promise<void> {
  const data = fs.readFileSync(DB_PATH, "utf-8");
  const records: TradeRecord[] = JSON.parse(data);

  const newRecord: TradeRecord = {
    timestamp: new Date().toISOString(),
    vaultStrategy,
    action,
    executedPrice,
    rsiAtExecution,
    reasoning,
    status,
  };

  records.push(newRecord);
  fs.writeFileSync(DB_PATH, JSON.stringify(records, null, 2));
}

export async function getRecentMemories(
  limit: number = 5,
): Promise<TradeRecord[]> {
  const data = fs.readFileSync(DB_PATH, "utf-8");
  const records: TradeRecord[] = JSON.parse(data);
  return records.slice(-limit);
}
