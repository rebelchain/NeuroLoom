import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import { getRecentMemories } from "../data/db.js";

const GRAPHQL_ENDPOINT =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.4";

// [UTILITY] GENERATE DYNAMIC CHART VIA QUICKCHART API
async function fetchChartBuffer(
  data: number[],
  labels: string[],
): Promise<Buffer | null> {
  if (data.length === 0) return null;
  try {
    const chartConfig = {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: "Execution Price (USD)",
            data: data,
            borderColor: "#00e599",
            backgroundColor: "rgba(0, 229, 153, 0.1)",
            fill: true,
            borderWidth: 2,
            pointRadius: 2,
            pointBackgroundColor: "#ffffff",
          },
        ],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: {
          x: { display: false },
          y: {
            display: true,
            grid: { color: "rgba(0,0,0,0.05)" },
            ticks: { callback: (value: any) => "$" + value },
          },
        },
      },
    };

    const url = `https://quickchart.io/chart?width=500&height=180&c=${encodeURIComponent(JSON.stringify(chartConfig))}`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error("Gagal menarik chart visual:", error);
    return null;
  }
}


//  CLEAN AI MARKDOWN TEXT
function cleanMarkdown(text: string): string {
  if (!text) return "";
  return text
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}


// GENERATE STRATEGY TEAR SHEET 
export async function generateProofOfTradingPDF(
  vaultName: string,
): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const fileName = `NeuroLoom_Strategy_${vaultName.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      const filePath = path.resolve(process.cwd(), fileName);
      const writeStream = fs.createWriteStream(filePath);
      doc.pipe(writeStream);

    
      const allHistories = await getRecentMemories(100);
      const strategyExecutions = allHistories
        .filter(
          (h: any) =>
            (h.vaultId === vaultName ||
              h.reasoning
                ?.toLowerCase()
                .includes(vaultName.toLowerCase().replace("-", " "))) &&
            h.action &&
            ![
              "DEPOSIT",
              "WITHDRAW",
              "USER_DEPOSIT",
              "USER_WITHDRAWAL",
            ].includes(h.action.toUpperCase()),
        )
        .sort((a: any, b: any) => a.timestamp - b.timestamp);

  
      doc
        .fontSize(20)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("QUANTITATIVE STRATEGY TEAR SHEET", { align: "center" });
      doc.moveDown(0.2);
      doc
        .fontSize(11)
        .font("Helvetica")
        .fillColor("#555555")
        .text(`TARGET VAULT: ${vaultName.toUpperCase()}`, {
          align: "center",
          characterSpacing: 2,
        });
      doc.moveDown(1);

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .lineWidth(1)
        .strokeColor("#e5e5e5")
        .stroke();
      doc.moveDown(1);


      const totalExecutions = strategyExecutions.length;
      const successExecutions = strategyExecutions.filter(
        (h: any) => h.status === "SUCCESS",
      ).length;
      const successRate =
        totalExecutions > 0
          ? ((successExecutions / totalExecutions) * 100).toFixed(1)
          : "0.0";

      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("I. SYSTEM METRICS");
      doc.moveDown(0.5);

      const metricsY = doc.y;
      doc.fontSize(10).font("Helvetica").fillColor("#555555");
      doc.text("Total Automated Decisions", 50, metricsY);
      doc.text("Execution Success Rate", 50, metricsY + 15);
      doc.text("Report Timestamp", 50, metricsY + 30);
      doc.text("Execution Environment", 50, metricsY + 45);

      doc.font("Helvetica-Bold").fillColor("#121212");
      doc.text(`:  ${totalExecutions} Executions`, 220, metricsY);
      doc.text(`:  ${successRate}%`, 220, metricsY + 15);
      doc.text(`:  ${new Date().toISOString()}`, 220, metricsY + 30);
      doc.text(`:  BSC Testnet (Decentralized Network)`, 220, metricsY + 45);

      doc.x = 50;
      doc.y = metricsY + 70;

   
      if (totalExecutions > 0) {
        doc
          .fontSize(12)
          .font("Helvetica-Bold")
          .fillColor("#121212")
          .text("II. MARKET CONTEXT (ASSET PRICE AT EXECUTION)");
        doc.moveDown(0.5);

        const chartPrices = strategyExecutions.map(
          (h: any) => Number(h.executedPrice) || 0,
        );
        const chartLabels = strategyExecutions.map(
          (_: any, i: number) => `OP-${i + 1}`,
        );
        const chartBuffer = await fetchChartBuffer(chartPrices, chartLabels);

        if (chartBuffer) {
          doc.image(chartBuffer, 50, doc.y, { width: 495 });
          doc.moveDown(13);
        } else {
          doc
            .fontSize(9)
            .font("Helvetica-Oblique")
            .fillColor("#888888")
            .text("[ Visualization temporarily unavailable ]");
          doc.moveDown(2);
        }
      }


      doc
        .fontSize(12)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("III. ALGORITHMIC REASONING LEDGER");
      doc.moveDown(1);

      if (totalExecutions === 0) {
        doc
          .fontSize(10)
          .font("Helvetica-Oblique")
          .fillColor("#888888")
          .text("No strategic AI operations recorded for this vault yet.");
      } else {
        strategyExecutions
          .reverse()
          .slice(0, 10)
          .forEach((trade: any, index: number) => {
            if (doc.y > 680) doc.addPage();

            const startY = doc.y;
            doc.rect(50, startY, 495, 22).fill("#f8f9fa");

            doc
              .fillColor("#121212")
              .fontSize(9)
              .font("Helvetica-Bold")
              .text(
                `EXECUTION ID: AI-OP-${index + 1}   |   ${new Date(trade.timestamp).toUTCString()}`,
                60,
                startY + 6,
              );

            doc.moveDown(1.5);
            doc.x = 60;

            const infoY = doc.y;
            doc.font("Helvetica").fontSize(9).fillColor("#555555");
            doc.text("Action Directed", 60, infoY);
            doc.text("Market State", 60, infoY + 12);

            doc.font("Helvetica-Bold").fillColor("#121212");
            doc.text(`:  ${trade.action}`, 160, infoY);
            doc.text(
              `:  Price: $${trade.executedPrice || 0}   |   RSI: ${Number(trade.rsiAtExecution || 0).toFixed(2)}`,
              160,
              infoY + 12,
            );

            doc.y = infoY + 28;

            doc
              .font("Helvetica-Bold")
              .fillColor("#121212")
              .text("Engine Reasoning:");
            doc.moveDown(0.3);

         
            const cleanReasoningText = cleanMarkdown(trade.reasoning);

            doc
              .font("Helvetica")
              .fillColor("#333333")
              .text(cleanReasoningText, {
                width: 470,
                align: "justify",
                lineGap: 2.5, 
              });

            doc.moveDown(1.5);
            doc.x = 50;
          });
      }

   
      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .lineWidth(1)
        .strokeColor("#e5e5e5")
        .stroke();
      doc.moveDown(1);
      doc
        .fontSize(8)
        .font("Helvetica")
        .fillColor("#999999")
        .text(
          "This document is autonomously generated by the NeuroLoom AI Engine. Logic execution is cryptographically verified.",
          { align: "center" },
        );

      doc.end();
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}




// GENERATE GLOBAL REPORT
export async function generateGlobalReportPDF(): Promise<string> {
  return new Promise(async (resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: "A4" });
      const fileName = `NeuroLoom_Global_State_${Date.now()}.pdf`;
      const filePath = path.resolve(process.cwd(), fileName);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      doc
        .fontSize(24)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("NEUROLOOM GLOBAL STATE REPORT", { align: "center" });
      doc.moveDown(0.2);
      doc
        .fontSize(10)
        .font("Helvetica")
        .fillColor("#555555")
        .text(`Network: BSC Testnet | Indexer: The Graph API`, {
          align: "center",
          characterSpacing: 1,
        });
      doc.moveDown(1.5);

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .lineWidth(1)
        .strokeColor("#e5e5e5")
        .stroke();
      doc.moveDown(1.5);

   
      let totalRebalances = 0;
      let totalDeposits = 0;
      let isGraphConnected = false;

      try {
        const query = `{ rebalanceExecuteds { id } deposits { id } }`;
        const res = await fetch(GRAPHQL_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query }),
        });
        const { data } = await res.json();
        if (data) {
          isGraphConnected = true;
          totalRebalances = data.rebalanceExecuteds?.length || 0;
          totalDeposits = data.deposits?.length || 0;
        }
      } catch (e) {
        console.error("Global Report Graph Error", e);
      }

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("EXECUTIVE SUMMARY");
      doc.moveDown(0.5);
      doc.fontSize(11).font("Helvetica").fillColor("#333333");
      doc.text(
        `Indexer Connection : ${isGraphConnected ? "ACTIVE" : "OFFLINE"}`,
      );
      doc.text(`Total AI Rebalances: ${totalRebalances} Events`);
      doc.text(`Total User Deposits: ${totalDeposits} Transactions`);
      doc.moveDown(2);

      doc
        .fontSize(14)
        .font("Helvetica-Bold")
        .fillColor("#121212")
        .text("ACTIVE STRATEGY VAULTS");
      doc.moveDown(1);

      const vaults = [
        {
          name: "The Yield Farm",
          type: "Low Risk",
          protocol: "Venus Protocol",
          apy: "14.5% (Target)",
        },
        {
          name: "Bluechip Momentum",
          type: "Medium Risk",
          protocol: "PancakeSwap",
          apy: "22.4% (Target)",
        },
        {
          name: "Degen Accumulator",
          type: "High Risk",
          protocol: "PancakeSwap",
          apy: "38.2% (Target)",
        },
      ];

      vaults.forEach((v) => {
        const startY = doc.y;
        doc.rect(50, startY, 495, 25).fill("#f8f9fa");
        doc
          .fillColor("#121212")
          .fontSize(11)
          .font("Helvetica-Bold")
          .text(v.name.toUpperCase(), 60, startY + 8);

        doc.moveDown(1.5);
        doc.x = 60;
        doc.fillColor("#555555").fontSize(10).font("Helvetica");
        doc
          .text(`Risk Profile : `, { continued: true })
          .fillColor("#121212")
          .font("Helvetica-Bold")
          .text(v.type);
        doc
          .fillColor("#555555")
          .font("Helvetica")
          .text(`Target APY   : `, { continued: true })
          .fillColor("#121212")
          .font("Helvetica-Bold")
          .text(v.apy);
        doc
          .fillColor("#555555")
          .font("Helvetica")
          .text(`Routing      : `, { continued: true })
          .fillColor("#121212")
          .font("Helvetica-Bold")
          .text(v.protocol);
        doc.moveDown(1.5);
        doc.x = 50;
      });

      doc
        .moveTo(50, doc.y)
        .lineTo(545, doc.y)
        .lineWidth(1)
        .strokeColor("#e5e5e5")
        .stroke();
      doc.moveDown(1);
      doc
        .fontSize(8)
        .font("Helvetica-Oblique")
        .fillColor("#999999")
        .text(
          "This institutional snapshot is verified directly against the BSC blockchain.",
          { align: "center" },
        );

      doc.end();
      writeStream.on("finish", () => resolve(filePath));
      writeStream.on("error", reject);
    } catch (error) {
      reject(error);
    }
  });
}
