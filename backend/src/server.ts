import * as dotenvx from "@dotenvx/dotenvx";
dotenvx.config();

import cors from "cors";
import express from "express";
import { getRecentMemories } from "./data/db.js";
import { neuroLoomCycle } from "./index.js";

// --- IMPORT ROUTER & SERVICE MODUL ---
import bluechipRouter from "./scripts/bluechipSimulation.js";
// import yieldFarmRouter from "./scripts/yieldFarmSimulation.js"; // Nanti buat file ini
// import degenRouter from "./scripts/degenSimulation.js";         // Nanti buat file ini
import { generateDynamicVaultPDF } from "./utils/pdfGenerator.js";

const app = express();
const PORT = process.env.PORT || 9000;

app.use(cors());
app.use(express.json());

// ==========================================
// 1. GLOBAL LOGGING SYSTEM
// ==========================================
let globalLogs: string[] = [];

app.get("/api/ai-logs", (req, res) => {
  res.json({ logs: globalLogs });
});

app.post("/api/ai-logs", (req, res) => {
  const { action, log } = req.body;

  if (action === "clear") {
    globalLogs = [];
    return res.json({ success: true, message: "Logs cleared" });
  }

  if (log) {
    globalLogs.push(log);
    if (globalLogs.length > 100) globalLogs.shift();
  }

  res.json({ success: true });
});

app.get("/api/history", async (req, res) => {
  try {
    const history = await getRecentMemories(20);
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post("/api/force-cycle", (req, res) => {
  const { stage } = req.body;

  if (!stage || ![1, 2, 3].includes(Number(stage))) {
    return res.status(400).json({
      success: false,
      message: "Kirimkan parameter stage 1, 2, atau 3",
    });
  }

  console.log(`\n[DEMO TRIGGER] NeuroLoom AI for STAGE: ${stage}...`);

  try {
    if (Number(stage) === 1) {
      neuroLoomCycle({ stage: 1 }).catch(console.error);
    } else if (Number(stage) === 2) {
      neuroLoomCycle({ stage: 2 }).catch(console.error);
    } else if (Number(stage) === 3) {
      neuroLoomCycle({ forceCrash: true, stage: 3 }).catch(console.error);
    }

    res.json({ success: true, message: `AI Cycle STAGE ${stage} triggered!` });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==========================================
// 2. MOUNT LIVE SIMULATION ROUTER
// ==========================================
app.use("/api", bluechipRouter);
// app.use("/api", yieldFarmRouter);
// app.use("/api", degenRouter);

// ==========================================
// 3. PDF GENERATION ROUTER (MODULAR)
// ==========================================
app.get("/api/report/pdf", (req, res) => {
  // Tangkap parameter 'vault' (misal: ?vault=bluechip-momentum)
  const vaultId = (req.query.vault as string) || "global";

  console.log(`[PDF] Meng-generate laporan untuk Vault: ${vaultId}`);

  // generateDynamicVaultPDF akan mencari journal_${vaultId}.json secara otomatis
  generateDynamicVaultPDF(res, vaultId).catch((err) => {
    console.error("[PDF ERROR]", err);
    if (!res.headersSent) {
      res.status(500).send("Gagal meng-generate PDF: " + err.message);
    }
  });
});

// ==========================================
// 4. SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(
    `\n[API SERVER] NeuroLoom Bridge runs on http://localhost:${PORT}`,
  );
  console.log(`   - Endpoint History : http://localhost:${PORT}/api/history`);
  console.log(
    `   - Endpoint Sim API : http://localhost:${PORT}/api/live-simulation`,
  );
  console.log(
    `   - Endpoint PDF     : http://localhost:${PORT}/api/report/pdf?vault=global`,
  );
});
