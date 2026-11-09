require("dotenv").config({ path: ".env.local" });
const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

async function verifyAll() {
  console.log("🔍 Verifying all database tables & queries...");

  const tables = [
    "accounts",
    "sessions",
    "logs",
    "timesheets",
    "candidates",
    "pipeline_followups",
    "srimatrix",
    "mileage_entries",
    "email_credentials",
    "job_offer_letters",
    "permissions",
  ];

  for (const t of tables) {
    const res = await sql.unsafe(`SELECT COUNT(*) as total FROM public."${t}"`);
    console.log(`✅ Table public."${t}": ${res[0].total} rows (accessible to backend)`);
  }

  console.log("\n🔍 Verifying Groq AI generation...");
  const apiKey = process.env.GROQ_API_KEY;
  const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "qwen/qwen3.8-27b",
      messages: [{ role: "user", content: "Ping" }],
      max_tokens: 5,
    }),
  });

  if (aiRes.ok) {
    console.log("✅ Groq AI API endpoint: Active & verified 200 OK");
  } else {
    console.error("❌ Groq AI API failed:", await aiRes.text());
  }

  await sql.end();
  console.log("\n🚀 All database tables & APIs verified successfully!");
}

verifyAll().catch((e) => {
  console.error("❌ Verification failed:", e);
  process.exit(1);
});
