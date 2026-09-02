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

const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;
const sql = postgres(dbUrl, { max: 1 });

async function list() {
  const draws = await sql`SELECT * FROM public.t_draw_definitions ORDER BY dt_criacao ASC`;
  console.log("Sorteios no banco:", JSON.stringify(draws, null, 2));
  await sql.end();
}

list();
