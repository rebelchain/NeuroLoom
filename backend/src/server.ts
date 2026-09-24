import cors from "cors";
import express from "express";
import fs from "fs";
import { getRecentMemories } from "./data/db.js";
import { generateProofOfTradingPDF } from "./utils/pdfGenerator.js";

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

app.get("/api/history", async (req, res) => {
  try {
    const history = await getRecentMemories(20); 
    res.json({ success: true, data: history });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});


app.get("/api/report/pdf", async (req, res) => {
  try {
    const vaultName =
      (req.query.vault as string) || "NeuroLoom Multi-Strategy Vault";
    const pdfPath = await generateProofOfTradingPDF(vaultName);


    res.download(pdfPath, `NeuroLoom_Proof_${Date.now()}.pdf`, (err) => {
      if (err) console.error("Failed to send PDF:", err);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    });
  } catch (error: any) {
    res
      .status(500)
      .json({ success: false, message: "Gagal membuat PDF: " + error.message });
  }
});

app.listen(PORT, () => {
  console.log(
    `\n[API SERVER] NeuroLoom Bridge runs on http://localhost:${PORT}`,
  );
  console.log(`   - Endpoint History : http://localhost:${PORT}/api/history`);
  console.log(
    `   - Endpoint PDF     : http://localhost:${PORT}/api/report/pdf?vault=YieldFarm`,
  );
});
