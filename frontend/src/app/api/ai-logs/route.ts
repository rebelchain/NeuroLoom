// THIS API AI LOGS Only For Hackathon Demo that listening to log rebalance_executed & unwind_position script
import { NextResponse } from "next/server";

let globalLogs: string[] = [];

// GET: recent logs
export async function GET() {
  return NextResponse.json({ logs: globalLogs });
}

// POST: Called by node js
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.action === "clear") {
      globalLogs = [];
      return NextResponse.json({ success: true, message: "Logs cleared" });
    }

    if (body.log) {
      globalLogs.push(body.log);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
