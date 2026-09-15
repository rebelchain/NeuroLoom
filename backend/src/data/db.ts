import sqlite3 from "sqlite3";
import { open, Database } from "sqlite";

// Fungsi untuk membuka koneksi ke file database lokal
export async function getDb(): Promise<Database> {
  const db = await open({
    filename: "./neuro_memory.sqlite", // File ini akan terbuat otomatis
    driver: sqlite3.Database,
  });

  // Membuat tabel jika belum ada
  await db.exec(`
    CREATE TABLE IF NOT EXISTS trade_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      amountPercentage INTEGER NOT NULL,
      reasoning TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  return db;
}

// Fungsi untuk mencatat keputusan baru AI
export async function logAIDecision(
  action: string,
  amountPercentage: number,
  reasoning: string,
) {
  const db = await getDb();
  await db.run(
    "INSERT INTO trade_history (action, amountPercentage, reasoning) VALUES (?, ?, ?)",
    [action, amountPercentage, reasoning],
  );
}

// Fungsi untuk menarik X ingatan terakhir AI
export async function getRecentMemories(limit: number = 3) {
  const db = await getDb();
  // Mengambil data terbaru secara menurun
  return await db.all(
    "SELECT action, amountPercentage, reasoning, timestamp FROM trade_history ORDER BY id DESC LIMIT ?",
    [limit],
  );
}
