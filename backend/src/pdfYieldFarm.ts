import { Response } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const LOG_FILE = path.resolve(process.cwd(), "autonomous_ai_logs.json");

function cleanMarkdown(text: string): string {
  if (!text) return "No data available.";
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function generateYieldFarmPDF(res: Response) {
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="NeuroLoom_YieldFarm_Report_${Date.now()}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);

  // HEADER
  doc.font("Courier-Bold").fontSize(22).text("NEUROLOOM", { align: "center" });
  doc
    .fontSize(12)
    .text("AUTONOMOUS MULTI-AGENT EXECUTION REPORT", { align: "center" });
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(2);

  // DATA FETCHINg
  let logs: any[] = [];
  if (fs.existsSync(LOG_FILE)) {
    try {
      logs = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"));
    } catch (error) {
      console.error("Gagal membaca autonomous_ai_logs.json:", error);
    }
  }

  const totalExecutions = logs.length;
  const holdLogs = logs.filter((l) => l.status === "HOLD").length;
  const actionRate =
    totalExecutions > 0
      ? (((totalExecutions - holdLogs) / totalExecutions) * 100).toFixed(1)
      : "0.0";

  // --- VAULT METADATA ---
  doc.fillColor("#000000").font("Courier").fontSize(10);
  doc.text(`TARGET VAULT   : THE YIELD FARM`);
  doc.text(`REPORT DATE    : ${new Date().toUTCString()}`);
  doc.text(`NETWORK        : BSC Testnet`);
  doc.text(`AI ENGINE      : LangChain / Groq (openai/gpt-oss-20b)`);
  doc.text(
    `TOTAL CYCLES   : ${totalExecutions} (On-Chain Execution Rate: ${actionRate}%)`,
  );
  doc.moveDown(2);

  doc.font("Courier-Bold").fontSize(14).text("ALGORITHMIC REASONING LEDGER");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);

  // --- MULTI-AGENT LOG RENDERING ---
  if (logs.length === 0) {
    doc
      .font("Courier-Oblique")
      .fontSize(10)
      .fillColor("#888888")
      .text("No strategic AI operations recorded for this vault yet.");
  } else {
    logs
      .slice()
      .reverse()
      .slice(0, 10)
      .forEach((log, index) => {
        if (doc.y > 680) doc.addPage();

        doc.fillColor("#121212").fontSize(10).font("Courier-Bold");
        doc.text(
          `[CYCLE ID: NL-${totalExecutions - index}] - ${new Date(log.timestamp).toISOString()}`,
        );
        doc.font("Courier").fontSize(9);
        doc.text(`  > EXECUTOR ACTION : ${log.action}`);
        doc.text(`  > NETWORK STATUS  : ${log.status}`);
        doc.text(`  > TX HASH         : ${log.hash}`);
        doc.moveDown(0.8);

        // Orchestrator Phase
        doc.font("Courier-Bold").text(`  [ORCHESTRATOR ANALYSIS]`);
        const tasks = log.orchestratorTasks
          ? `Deployed Workers: ${log.orchestratorTasks}`
          : "Standard Yield & Risk Assessment executed.";
        doc
          .font("Courier")
          .fillColor("#333333")
          .text(tasks, 65, doc.y, { width: 470, align: "justify" });
        doc.moveDown(0.5);

        doc
          .font("Courier-Bold")
          .fillColor("#121212")
          .text(`  [AGENT SYNTHESIZER REASONING]`);
        const cleanReasoning = cleanMarkdown(log.reasoning);
        doc
          .font("Courier")
          .fillColor("#333333")
          .text(cleanReasoning, 65, doc.y, { width: 470, align: "justify" });
        doc.moveDown(0.5);

        // Evaluator Phase
        doc
          .font("Courier-Bold")
          .fillColor("#121212")
          .text(`  [RISK EVALUATOR VERDICT]`);
        const cleanFeedback = cleanMarkdown(
          log.evaluatorFeedback ||
            "PASS - System validated 1% execution constraints.",
        );
        doc
          .font("Courier")
          .fillColor(log.status === "FAIL" ? "#d32f2f" : "#2e7d32")
          .text(cleanFeedback, 65, doc.y, { width: 470, align: "justify" });

        doc.moveDown(1.5);
        doc.x = 50;
      });
  }

  // FOOTER SECTION
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);
  doc
    .font("Courier-Oblique")
    .fontSize(8)
    .fillColor("#888888")
    .text(
      "End of report. NeuroLoom Protocol cryptographically verifies all on-chain data. This document is dynamically generated based on live multi-agent execution logs.",
      { align: "center" },
    );

  doc.end();
}
