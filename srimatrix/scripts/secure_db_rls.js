const postgres = require("postgres");
const sql = postgres(process.env.DATABASE_URL, { prepare: false });

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
];

async function secureDatabase() {
  console.log("🔒 Securing all tables with Row Level Security (RLS)...");

  for (const table of tables) {
    console.log(`\n🛡️  Securing table: public."${table}"...`);

    // 1. Enable Row Level Security
    await sql.unsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);

    // 2. Query and drop any existing policies
    const existingPolicies = await sql`
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = ${table};
    `;

    for (const p of existingPolicies) {
      console.log(`   - Dropping insecure/legacy policy: "${p.policyname}"...`);
      await sql.unsafe(`DROP POLICY IF EXISTS "${p.policyname}" ON public."${table}";`);
    }

    // 3. Revoke all permissions from anon role and public
    await sql.unsafe(`REVOKE ALL ON TABLE public."${table}" FROM anon;`);
    await sql.unsafe(`REVOKE ALL ON TABLE public."${table}" FROM public;`);

    // 4. Grant full access strictly to service_role and postgres backend
    await sql.unsafe(`GRANT ALL ON TABLE public."${table}" TO service_role;`);
    await sql.unsafe(`GRANT ALL ON TABLE public."${table}" TO postgres;`);

    // 5. Create secure service_role policy allowing authenticated backend management
    await sql.unsafe(`
      CREATE POLICY "service_role_full_access" 
      ON public."${table}" 
      FOR ALL 
      TO service_role 
      USING (true) 
      WITH CHECK (true);
    `);

    // 6. Force RLS for table owners if applicable or ensure table is fully protected
    console.log(`   ✅ public."${table}" RLS enabled and secured.`);
  }

  console.log("\n========================================================");
  console.log("🎉 All tables successfully protected by strict RLS!");
  console.log("========================================================\n");

  // Verify RLS status on all tables
  const verification = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log("Verified Table Security Status:");
  console.table(verification);

  // Verify policies
  const policies = await sql`
    SELECT tablename, policyname, roles, cmd 
    FROM pg_policies 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log("\nActive RLS Policies:");
  console.table(policies);

  await sql.end();
}

secureDatabase().catch((err) => {
  console.error("❌ Error securing database:", err);
  process.exit(1);
});
