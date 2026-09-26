export async function pushLog(message: string) {
  console.log(message);
  try {
    // Tembak ke Express Server lokal di VPS
    await fetch("http://localhost:4000/api/ai-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ log: message }),
    });
  } catch (e) {
    // Abaikan
  }
}

export async function clearLogs() {
  console.log("--- CLEARING LOGS ---");
  try {
    await fetch("http://localhost:4000/api/ai-logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear" }),
    });
  } catch (e) {}
}
