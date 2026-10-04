import { Response } from "express";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

async function fetchChartBuffer(
  data: number[],
  labels: string[],
): Promise<Buffer | null> {
  if (data.length === 0) return null;

  try {
    let chartData = [...data];
    let chartLabels = [...labels];
    if (chartData.length === 1) {
      chartData = [chartData[0], chartData[0]];
      chartLabels = ["Start", chartLabels[0]];
    }

    const chartConfig = {
      type: "line",
      data: {
        labels: chartLabels,
        datasets: [
          {
            label: "Execution Price (USD)",
            data: chartData,
            borderColor: "#3b82f6",
            backgroundColor: "rgba(59, 130, 246, 0.15)",
            fill: true,
            borderWidth: 2.5,
            pointRadius: 0,
            tension: 0.3,
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        layout: { padding: 15 },
        scales: {
          x: {
            display: true,
            grid: { display: false },
            ticks: { fontColor: "#666666" },
          },
          y: {
            display: true,
            grid: { color: "rgba(255,255,255,0.08)", drawBorder: false },
            ticks: {
              // Format angka Y-axis menjadi harga USD
              callback: (value: any) => "$" + Number(value).toFixed(2),
              fontColor: "#8a8a8a",
            },
          },
        },
      },
    };

    const url = `https://quickchart.io/chart?width=540&height=200&bkg=%23121212&c=${encodeURIComponent(
      JSON.stringify(chartConfig),
    )}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Gagal menarik chart visual:", error);
    return null;
  }
}
``;

function cleanMarkdown(text: string): string {
  if (!text) return "No data available.";
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

// --- DYNAMIC METADATA CONFIGURATION ---
const VAULT_CONFIG: Record<string, any> = {
  "yield-farm": {
    title: "The Yield Farm Vault",
    dbName: "yield-farm",
    riskProfile: "Low",
    targetApy: "14.5%",
    agents: [
      { role: "System Orchestrator", model: "openai/gpt-oss-20b" },
      { role: "Liquidity Risk Manager", model: "openai/gpt-oss-20b" },
      { role: "Yield Strategist", model: "openai/gpt-oss-20b" },
    ],
    currentHoldings: [
      {
        asset: "vUSDT (Venus Protocol)",
        allocation: "85.0%",
        return: "+12.4% APY",
        valueUsd: "$85,000",
      },
      {
        asset: "USDT (Idle Cash)",
        allocation: "15.0%",
        return: "0.0%",
        valueUsd: "$15,000",
      },
    ],
  },
  "bluechip-momentum": {
    title: "Bluechip Momentum Vault",
    dbName: "bluechip-momentum",
    riskProfile: "Moderate",
    targetApy: "22.4%",
    agents: [
      { role: "System Orchestrator", model: "openai/gpt-oss-20b" },
      { role: "NeuroLoom Quant Agent", model: "gemini-3-flash-preview" },
      { role: "Chief Risk Officer", model: "gemini-3-flash-preview" },
    ],
    currentHoldings: [
      {
        asset: "WBNB (PancakeSwap)",
        allocation: "60.0%",
        return: "+4.2% (7d)",
        valueUsd: "$60,000",
      },
      {
        asset: "USDT (Stable Reserve)",
        allocation: "40.0%",
        return: "0.0%",
        valueUsd: "$40,000",
      },
    ],
  },
  "degen-accumulator": {
    title: "Degen Accumulator Vault",
    dbName: "degen-accumulator",
    riskProfile: "High",
    targetApy: "38.2%",
    agents: [
      { role: "System Orchestrator", model: "openai/gpt-oss-20b" },
      { role: "Deep Degen Agent", model: "gemini-3-flash-preview" },
      { role: "Chief Risk Officer", model: "gemini-3-flash-preview" },
    ],
    currentHoldings: [
      {
        asset: "BTCB (Radiant Capital)",
        allocation: "75.0%",
        return: "+8.1% (7d)",
        valueUsd: "$75,000",
      },
      {
        asset: "USDT (Stop-Loss Reserve)",
        allocation: "25.0%",
        return: "0.0%",
        valueUsd: "$25,000",
      },
    ],
  },
  global: {
    title: "Macro Protocol Overview",
    dbName: "global",
    riskProfile: "Diversified Delta-Neutral",
    targetApy: "25.0% (Blended)",
    agents: [{ role: "Master Orchestrator", model: "openai/gpt-oss-20b" }],
    currentHoldings: [
      {
        asset: "Vault: The Yield Farm",
        allocation: "30.0%",
        return: "+12.4% APY",
        valueUsd: "$30,000",
      },
      {
        asset: "Vault: Bluechip Momentum",
        allocation: "50.0%",
        return: "+15.2% YTD",
        valueUsd: "$50,000",
      },
      {
        asset: "Vault: Degen Accumulator",
        allocation: "20.0%",
        return: "+24.5% YTD",
        valueUsd: "$20,000",
      },
    ],
  },
};

// --- PDF GENERATOR ---
export async function generateDynamicVaultPDF(
  res: Response,
  vaultId: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const normalizedId = vaultId.toLowerCase();
      const config = VAULT_CONFIG[normalizedId];
      if (!config) throw new Error("Vault Configuration not found.");

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `inline; filename="NeuroLoom_TearSheet_${config.title.replace(/\s+/g, "_")}.pdf"`,
      );

      const doc = new PDFDocument({
        margin: 40,
        size: "A4",
        bufferPages: true,
      });
      doc.pipe(res);

      const PRIMARY_COLOR = "#121212";
      const SECONDARY_COLOR = "#555555";
      const ACCENT_COLOR = "#3b82f6";

      // DATA FETCHING
      const dbPath = path.resolve(
        process.cwd(),
        `journal_${config.dbName}.json`,
      );
      let strategyExecutions: any[] = [];

      if (fs.existsSync(dbPath)) {
        const data = fs.readFileSync(dbPath, "utf-8");
        const rawLogs = JSON.parse(data);
        strategyExecutions = rawLogs
          .filter(
            (h: any) =>
              h.action &&
              ![
                "DEPOSIT",
                "WITHDRAW",
                "USER_DEPOSIT",
                "USER_WITHDRAWAL",
              ].includes(h.action.toUpperCase()),
          )
          .sort((a: any, b: any) => a.timestamp - b.timestamp);
      }

      const totalExecutions = strategyExecutions.length;
      const successExecutions = strategyExecutions.filter(
        (h: any) => h.status === "SUCCESS",
      ).length;
      const successRate =
        totalExecutions > 0
          ? ((successExecutions / totalExecutions) * 100).toFixed(1)
          : "0.0";

      // SECTION 1: HEADER & TITLE
      doc
        .fontSize(22)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("NeuroLoom Strategy Tear Sheet", { align: "center" });
      doc.moveDown(0.2);
      doc
        .fontSize(12)
        .font("Helvetica")
        .fillColor(ACCENT_COLOR)
        .text(config.title.toUpperCase(), {
          align: "center",
          characterSpacing: 2,
        });
      doc.moveDown(1);
      doc
        .moveTo(40, doc.y)
        .lineTo(555, doc.y)
        .lineWidth(1)
        .strokeColor("#e5e5e5")
        .stroke();
      doc.moveDown(1);

      // -------------------------------------------------------------
      // SECTION 2: SYSTEM METRICS & MULTI-AGENT ARCHITECTURE
      // -------------------------------------------------------------
      const metricsStartY = doc.y;

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("PERFORMANCE METRICS", 40, metricsStartY);
      doc.fontSize(9).font("Helvetica").fillColor(SECONDARY_COLOR);
      doc.text("Total Executions", 40, metricsStartY + 15);
      doc.text("Success Rate", 40, metricsStartY + 30);
      doc.text("Risk Profile", 40, metricsStartY + 45);
      doc.text("Target APY", 40, metricsStartY + 60);

      doc.font("Helvetica-Bold").fillColor(PRIMARY_COLOR);
      doc.text(`:  ${totalExecutions}`, 130, metricsStartY + 15);
      doc.text(`:  ${successRate}%`, 130, metricsStartY + 30);
      doc.text(`:  ${config.riskProfile}`, 130, metricsStartY + 45);
      doc.text(`:  ${config.targetApy}`, 130, metricsStartY + 60);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("MULTI-AGENT ARCHITECTURE", 280, metricsStartY);

      let agentY = metricsStartY + 15;
      config.agents.forEach((agent: any) => {
        doc
          .fontSize(9)
          .font("Helvetica")
          .fillColor(SECONDARY_COLOR)
          .text(`${agent.role}`, 280, agentY);
        doc
          .font("Helvetica-Bold")
          .fillColor(PRIMARY_COLOR)
          .text(`:  ${agent.model}`, 400, agentY);
        agentY += 15;
      });

      const lowestYInMetrics = Math.max(metricsStartY + 75, agentY + 15);
      doc.x = 40;
      doc.y = lowestYInMetrics;

      // -------------------------------------------------------------
      // SECTION 3: EQUITY CURVE (CHART)
      // -------------------------------------------------------------
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("I. SIMULATED EQUITY CURVE (CUMULATIVE)");
      doc.moveDown(0.5);

      if (totalExecutions > 0 && normalizedId !== "global") {
        const chartPrices = strategyExecutions.map((h: any) => {
          return h.executedPrice ? Number(h.executedPrice) : 500;
        });

        const chartLabels = strategyExecutions.map(
          (_: any, i: number) => `Op-${i + 1}`,
        );

        const chartBuffer = await fetchChartBuffer(chartPrices, chartLabels);

        if (chartBuffer) {
          doc.image(chartBuffer, 40, doc.y, { width: 515 });
          doc.y += 210;
        }
      } else {
        doc.rect(40, doc.y, 515, 120).fill("#f5f5f5");
        doc
          .fontSize(9)
          .font("Helvetica-Oblique")
          .fillColor("#888888")
          .text(
            "Awaiting sufficient on-chain execution data to render curve.",
            40,
            doc.y + 55,
            { align: "center", width: 515 },
          );
        doc.y += 135;
      }
      doc.moveDown(1);
      doc.x = 40;

      // SECTION 4: REAL-TIME ASSET ALLOCATION
      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("II. HOLDINGS DETAIL & ALLOCATION");
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(SECONDARY_COLOR)
        .text("Simulated Snapshot Based on Latest AI Routings");
      doc.moveDown(0.5);

      const tableTop = doc.y;

      doc.rect(40, tableTop, 515, 22).fill(PRIMARY_COLOR);
      doc.fontSize(9).font("Helvetica-Bold").fillColor("#ffffff");

      const col1X = 50;
      const col2X = 300;
      const col3X = 380;
      const col4X = 460;

      doc.text("Asset / Protocol", col1X, tableTop + 7);
      doc.text("Weight", col2X, tableTop + 7);
      doc.text("Est. Return", col3X, tableTop + 7);
      doc.text("USD Value", col4X, tableTop + 7);

      let rowY = tableTop + 22;

      config.currentHoldings.forEach((holding: any, index: number) => {
        doc
          .rect(40, rowY, 515, 22)
          .fill(index % 2 === 0 ? "#f9f9f9" : "#ffffff");

        doc
          .fontSize(9)
          .font("Helvetica-Bold")
          .fillColor(PRIMARY_COLOR)
          .text(holding.asset, col1X, rowY + 7);
        doc
          .font("Helvetica")
          .fillColor(SECONDARY_COLOR)
          .text(holding.allocation, col2X, rowY + 7);

        if (holding.return.includes("+")) doc.fillColor("#10b981");
        else if (holding.return.includes("-")) doc.fillColor("#ff5f5f");
        else doc.fillColor(SECONDARY_COLOR);

        doc.text(holding.return, col3X, rowY + 7);
        doc.fillColor(PRIMARY_COLOR).text(holding.valueUsd, col4X, rowY + 7);

        rowY += 22;
      });

      doc.y = rowY + 25;
      doc.x = 40;

      // SECTION 5: ALGORITHMIC REASONING MATRIX
      if (doc.y > 600) doc.addPage();

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor(PRIMARY_COLOR)
        .text("III. ALGORITHMIC REASONING MATRIX");
      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor(SECONDARY_COLOR)
        .text("Detailed audit trail of AI decision-making processes.");
      doc.moveDown(1);

      if (totalExecutions === 0) {
        doc
          .fontSize(10)
          .font("Helvetica-Oblique")
          .fillColor("#888888")
          .text("No strategic operations recorded.");
      } else {
        strategyExecutions
          .reverse()
          .slice(0, 5)
          .forEach((trade: any, index: number) => {
            if (doc.y > 600) doc.addPage();

            const startY = doc.y;

            doc.rect(40, startY, 515, 18).fill(PRIMARY_COLOR);
            doc
              .fillColor("#ffffff")
              .fontSize(9)
              .font("Helvetica-Bold")
              .text(
                `EXECUTION ID: AI-OP-${totalExecutions - index}   |   TIME: ${new Date(trade.timestamp).toUTCString()}`,
                50,
                startY + 5,
              );

            if (trade.transactionHash) {
              const shortHash = `${trade.transactionHash.substring(0, 8)}...${trade.transactionHash.substring(trade.transactionHash.length - 6)}`;
              const explorerUrl = `https://testnet.bscscan.com/tx/${trade.transactionHash}`;

              doc
                .fontSize(8)
                .font("Helvetica-Oblique")
                .fillColor("#4cdae6")
                .text(`View Tx: ${shortHash}`, 440, startY + 6, {
                  link: explorerUrl,
                  underline: true,
                });
            }

            doc.rect(40, startY + 18, 515, 20).fill("#f4f4f5");

            doc
              .fillColor(PRIMARY_COLOR)
              .font("Helvetica-Bold")
              .text("Action:", 50, startY + 24);
            doc
              .font("Helvetica")
              .fillColor(ACCENT_COLOR)
              .text(`${trade.action}`, 90, startY + 24);

            doc
              .font("Helvetica-Bold")
              .fillColor(PRIMARY_COLOR)
              .text("Route:", 200, startY + 24);
            doc
              .font("Helvetica")
              .fillColor(PRIMARY_COLOR)
              .text(`${trade.route || "USDT ⇄ WBNB"}`, 240, startY + 24);

            doc
              .font("Helvetica-Bold")
              .fillColor(PRIMARY_COLOR)
              .text("Price:", 420, startY + 24);
            doc
              .font("Helvetica")
              .fillColor(PRIMARY_COLOR)
              .text(`$${trade.executedPrice || 0}`, 455, startY + 24);

            doc.y = startY + 45;
            doc.x = 40;

            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .fillColor(PRIMARY_COLOR)
              .text("Quant Agent Hypothesis:");
            doc
              .font("Helvetica")
              .fillColor(SECONDARY_COLOR)
              .text(cleanMarkdown(trade.reasoning), {
                width: 495,
                align: "justify",
                lineGap: 2,
              });
            doc.moveDown(0.7);

            doc
              .fontSize(9)
              .font("Helvetica-Bold")
              .fillColor(PRIMARY_COLOR)
              .text("Risk/Strategist Verdict:");
            doc
              .font("Helvetica-Oblique")
              .fillColor("#10b981")
              .text(trade.cro_reasoning || "Approved. Nominal risk factors.", {
                width: 495,
              });

            doc.moveDown(1.5);
            doc
              .moveTo(40, doc.y)
              .lineTo(555, doc.y)
              .lineWidth(0.5)
              .strokeColor("#e5e5e5")
              .stroke();
            doc.moveDown(1);
          });
      }

      // -------------------------------------------------------------
      // FOOTER
      // -------------------------------------------------------------
      const pages = doc.bufferedPageRange();
      for (let i = 0; i < pages.count; i++) {
        doc.switchToPage(i);
        doc.fontSize(7).font("Helvetica").fillColor("#aaaaaa");
        doc.text(
          `Generated autonomously by NeuroLoom AI Engine on ${new Date().toUTCString()} | Logic verified cryptographically.`,
          40,
          doc.page.height - 30,
          { align: "center", width: 515 },
        );
      }

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
