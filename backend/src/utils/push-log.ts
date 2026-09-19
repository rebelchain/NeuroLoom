// Push Logs to FrontEnd AIEventLog.tsx
export async function pushLog(message: string) {
  console.log(message);

  try {
    await fetch("http://localhost:3000/api/ai-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log: message }),
    });
  } catch (e) {
    // Abaikan error
  }
}