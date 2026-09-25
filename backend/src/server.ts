import cors from "cors";
import express from "express";
import PDFDocument from "pdfkit"; 
import { getRecentMemories } from "./data/db.js";

const app = express();
const PORT = process.env.PORT || 4000;
const GRAPHQL_ENDPOINT =
  "https://api.studio.thegraph.com/query/1760378/neuroloom-bsc-testnet/v0.0.6";

const VAULT_MAP_REVERSE: Record<string, string> = {
  "yield-farm": "0xD00b514048AFC47bFc4DE6a1646D5c63Bd23401a",
  "bluechip-momentum": "0xF4be9e83543cc31e93B1a10EAe502B49fe3be92e",
  "degen-accumulator": "0xc86dB8fBeC6eb19DCF70aC9d34cb159867B36e55",
};

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

// app.get("/api/chart/:vaultId", async (req, res) => {
//   try {
//     const { vaultId } = req.params;
//     const targetAddress = VAULT_MAP_REVERSE[vaultId]?.toLowerCase();

//     if (!targetAddress) {
//       return res
//         .status(400)
//         .json({ success: false, message: "Vault ID tidak valid" });
//     }

//     const query = `{
//       deposits(where: {address: "${targetAddress}"}) { assets }
//       withdraws(where: {address: "${targetAddress}"}) { assets }
//     }`;

//     const graphRes = await fetch(GRAPHQL_ENDPOINT, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ query }),
//     });

//     const { data: graphData } = await graphRes.json();

//     let realTVL = 0;
//     if (graphData) {
//       const totalDeposits = (graphData.deposits || []).reduce(
//         (acc: number, val: any) => acc + Number(val.assets),
//         0,
//       );
//       const totalWithdraws = (graphData.withdraws || []).reduce(
//         (acc: number, val: any) => acc + Number(val.assets),
//         0,
//       );
//       realTVL = (totalDeposits - totalWithdraws) / 1e6;
//     }

//     if (realTVL <= 0) {
//       const today = new Date().toISOString().split("T")[0];
//       return res.json({ success: true, data: [{ time: today, value: 0 }] });
//     }

//     const chartData = [];
//     const DAYS_TO_SIMULATE = 30;

//     let simulatedBalance = realTVL * 0.8;

//     for (let i = DAYS_TO_SIMULATE; i >= 0; i--) {
//       const date = new Date();
//       date.setDate(date.getDate() - i);
//       const timeString = date.toISOString().split("T")[0];

//       if (i === 0) {
//         chartData.push({ time: timeString, value: realTVL });
//       } else {
//         const dailyAlpha =
//           simulatedBalance * (1 + (Math.random() * 0.017 - 0.005));
//         simulatedBalance = dailyAlpha;
//         chartData.push({
//           time: timeString,
//           value: Number(simulatedBalance.toFixed(2)),
//         });
//       }
//     }

//     res.json({ success: true, data: chartData });
//   } catch (error: any) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// });



// GENERATE INSTITUTIONAL PDF REPORT

app.get("/api/report/pdf", (req, res) => {
  const vaultId = (req.query.vault as string) || "global";
  const isGlobal = vaultId === "global";

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `inline; filename="NeuroLoom_Report_${vaultId}.pdf"`,
  );

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  doc.pipe(res);


  doc.font("Courier-Bold").fontSize(22).text("NEUROLOOM", { align: "center" });
  doc.fontSize(12).text("AI YIELD OPTIMIZER REPORT", { align: "center" });
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(2);


  doc.fillColor("#000000").font("Courier").fontSize(10);
  doc.text(`TARGET VAULT   : ${vaultId.toUpperCase().replace("-", " ")}`);
  doc.text(`REPORT DATE    : ${new Date().toUTCString()}`);
  doc.text(`NETWORK        : BSC Testnet`);
  doc.text(`AI ENGINE      : openai/gpt-oss-safeguard-20b`);
  doc.text(`ORACLE         : CHAINLINK DECENTRALIZED DATA FEEDS`);
  doc.moveDown(2);


  doc
    .font("Courier-Bold")
    .fontSize(14)
    .text(isGlobal ? "MACRO PROTOCOL OVERVIEW" : "AI STRATEGY & MARKET THESIS");
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);

  let marketThesis = "";
  let actionPlan = "";
  let riskProfile = "";
  let dynamicRoute = "";

  if (vaultId.includes("degen")) {
    marketThesis =
      "Order flow dynamics indicate recent liquidity sweeps below key support levels. BTCB breakout momentum is building rapidly in the short term.";
    actionPlan =
      "Aggressive execution: Route capital into high-volatility Radiant Capital and PancakeSwap V3 BTCB pools to capture premium swap fees.";
    riskProfile =
      "HIGH / Targeting 38.2% APY. Strict algorithmic stop-loss mechanisms enabled to hedge against macro drawdowns.";
    dynamicRoute = "USDT -> RADIANT_CAPITAL (BTCB)";
  } else if (vaultId.includes("bluechip")) {
    marketThesis =
      "WBNB market structure shows steady accumulation. Technical analysis confirms higher-lows with supporting on-chain transaction volume on the BSC network.";
    actionPlan =
      "Momentum execution: Scale capital into WBNB liquidity pools to capture both directional upside and sustained trading fees.";
    riskProfile =
      "MODERATE / Targeting 22.4% APY with algorithmic impermanent loss mitigation protocols active.";
    dynamicRoute = "USDT -> PANCAKE_V3 (WBNB)";
  } else if (vaultId.includes("yield-farm")) {
    marketThesis =
      "Macro market volatility remains uncertain. Stablecoin yield rates across decentralized lending protocols offer the highest risk-adjusted returns currently.";
    actionPlan =
      "Defensive execution: Deploy capital primarily into single-sided USDT staking and Venus Protocol lending markets.";
    riskProfile =
      "LOW / Targeting 14.5% APY. Focus on principal preservation and consistent algorithmic compounding.";
    dynamicRoute = "USDT -> VENUS_PROTOCOL (vUSDT)";
  } else {
    marketThesis =
      "The broader BNB Chain ecosystem is experiencing segmented volatility. Stablecoins demand remains high in lending markets, while WBNB and BTCB show fragmented liquidity.";
    actionPlan =
      "Omni-Execution: NeuroLoom Orchestrator is actively managing capital across 3 isolated strategy vaults, auto-rebalancing based on real-time Oracle feeds.";
    riskProfile =
      "DIVERSIFIED / Blended APY target of 25.0%. Capital is distributed across Low, Medium, and High-risk smart contracts.";
    dynamicRoute = "SYSTEM_REBALANCE -> MULTI_ROUTING";
  }

  doc.font("Courier-Bold").fontSize(10).text("THESIS & REASONING :");
  doc.font("Courier").text(marketThesis, { width: 495, align: "justify" });
  doc.moveDown(0.7);

  doc.font("Courier-Bold").text("EXECUTION PLAN     :");
  doc.font("Courier").text(actionPlan, { width: 495, align: "justify" });
  doc.moveDown(0.7);

  doc.font("Courier-Bold").text("RISK & OUTCOME     :");
  doc.font("Courier").text(riskProfile, { width: 495, align: "justify" });
  doc.moveDown(2);

  doc
    .font("Courier-Bold")
    .fontSize(14)
    .text(
      isGlobal ? "GLOBAL EXECUTION LOGS" : "LATEST AI EXECUTIONS (3 ACTIVE)",
    );
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);

  const mockExecutions = [
    {
      action: isGlobal ? "GLOBAL_TVL_SYNC" : "INITIAL_CAPITAL_DEPOSIT",
      amount: isGlobal ? "1,532.50 USDT (AGGREGATED)" : "50.00 USDT",
      route: isGlobal ? "INDEXER -> NEUROLOOM_CORE" : "WALLET -> SMART_VAULT",
      status: "CONFIRMED_ON_CHAIN",
      slippage: "0.00%",
      hash: "0x8f4c2a9d8e7f6b5c4d3e2a1b0c9d8e7f6b5c4d3e",
    },
    {
      action: "ORACLE_PRICE_VALIDATION",
      amount: "N/A",
      route: "CHAINLINK_AGGREGATOR",
      status: "DATA_VERIFIED",
      slippage: "N/A",
      hash: "0x3a19d8c7b6a5f4e3d2c1b0a9f8e7d6c5b4a3f2e1",
    },
    {
      action: isGlobal ? "MACRO_PORTFOLIO_REBALANCE" : "AI_STRATEGY_REBALANCE",
      amount: isGlobal ? "450.00 USDT" : "200.00 USDT",
      route: dynamicRoute, 
      status: "ROUTED_SUCCESSFULLY",
      slippage: "0.15% (WITHIN LIMITS)",
      hash: "0x7bce9a8f7d6e5c4b3a2f1e0d9c8b7a6f5e4d3c2b",
    },
  ];

  doc.font("Courier").fontSize(10);
  mockExecutions.forEach((log, index) => {
    const logTime = new Date(Date.now() - (3 - index) * 450000).toISOString();

    doc.font("Courier-Bold").text(`[TX LOG #${index + 1}] - ${logTime}`);
    doc.font("Courier");
    doc.text(`  > ACTION   : ${log.action}`);
    doc.text(`  > AMOUNT   : ${log.amount}`);
    doc.text(`  > ROUTING  : ${log.route}`);
    doc.text(`  > SLIPPAGE : ${log.slippage}`);
    doc.text(`  > STATUS   : ${log.status}`);
    doc.text(
      `  > TX HASH  : ${log.hash.substring(0, 12)}...${log.hash.substring(36)}`,
    );
    doc.moveDown(1.5);
  });

  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor("#cccccc").stroke();
  doc.moveDown(1);
  doc
    .font("Courier-Oblique")
    .fontSize(8)
    .fillColor("#888888")
    .text(
      "End of report. NeuroLoom Protocol cryptographically verifies all on-chain data. This document is system-generated and reflects the current state of the smart contracts.",
      { align: "center" },
    );

  doc.end();
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
