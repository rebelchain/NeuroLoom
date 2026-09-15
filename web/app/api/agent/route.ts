import { GoogleGenAI, Type } from "@google/genai";
import { NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function POST(request: Request) {
  try {
    const { marketCondition } = await request.json();

    const prompt = `
      Kamu adalah AI Fund Manager untuk NeuroLoom Vault di BNB Chain.
      Kondisi pasar saat ini: ${marketCondition || "Volatile Market"}.
      
      Tugasmu:
      1. Analisis kondisi pasar tersebut dalam 2-3 kalimat.
      2. Tentukan keputusan strategi: "REBALANCE_USDT", "BUY_BNB", atau "HOLD".
      3. Berikan alasan logis (reasoning) di balik keputusan tersebut.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            analysis: { type: Type.STRING },
            action: { type: Type.STRING },
            reasoning: { type: Type.STRING },
            confidenceScore: { type: Type.NUMBER },
          },
          required: ["analysis", "action", "reasoning", "confidenceScore"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      agentOutput: result,
    });
  } catch (error: unknown) {
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 },
    );
  }
}
