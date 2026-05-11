import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  const rows = await sql.unsafe(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('projects','pools')
      AND column_name IN (
        'description','about_project','about_pool','highlights',
        'management_text','financials_text','documents','trust_score','expected_apy_bps'
      )
    ORDER BY table_name, column_name
  `);
  console.table(rows);
  await sql.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
