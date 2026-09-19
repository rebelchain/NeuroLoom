import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

export async function getDb(): Promise<Database> {
  const db = await open({
    filename: "./neuro_memory.sqlite",
    driver: sqlite3.Database,
  });

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

export async function getRecentMemories(limit: number = 3) {
  const db = await getDb();
  return await db.all(
    "SELECT action, amountPercentage, reasoning, timestamp FROM trade_history ORDER BY id DESC LIMIT ?",
    [limit],
  );
}
