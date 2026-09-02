import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx > 0) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const candidates = [
  { name: "Pooler Port 5432", url: "postgresql://postgres.ehgbrsnjwfdgxazhdhnr:BioCore%40AI26@aws-0-sa-east-1.pooler.supabase.com:5432/postgres" },
  { name: "Direct Port 5432", url: "postgresql://postgres:BioCore%40AI26@db.ehgbrsnjwfdgxazhdhnr.supabase.co:5432/postgres" },
  { name: "Pooler Port 6543", url: "postgresql://postgres.ehgbrsnjwfdgxazhdhnr:BioCore%40AI26@aws-0-sa-east-1.pooler.supabase.com:6543/postgres" },
];

async function testAll() {
  for (const c of candidates) {
    console.log(`\nTesting: ${c.name}...`);
    const sql = postgres(c.url, { connect_timeout: 5, max: 1 });
    try {
      const res = await sql`SELECT 1 as connected, NOW() as server_time`;
      console.log(`✅ SUCCESS for ${c.name}:`, res[0]);
      
      const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
      console.log(`Tables in DB:`, tables.map(t => t.table_name));
      await sql.end();
      return c.url;
    } catch (e) {
      console.error(`❌ FAILED for ${c.name}:`, e.message || e.code);
      try { await sql.end(); } catch {}
    }
  }
}

testAll();

