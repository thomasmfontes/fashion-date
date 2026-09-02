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

const dbUrl =
  process.env.DATABASE_URL?.trim() ||
  process.env.POSTGRES_URL?.trim() ||
  process.env.SUPABASE_DB_URL?.trim();

if (!dbUrl) {
  console.error("❌ ERRO: DATABASE_URL não encontrada.");
  process.exit(1);
}

const sql = postgres(dbUrl, { max: 1, connect_timeout: 15 });

async function cleanDatabase() {
  console.log("🧹 Iniciando limpeza completa do banco de dados Fashion Date...");

  try {
    // 1. Limpa tabelas de transações e participantes
    console.log("1️⃣ Limpando bilhetes, ganhadores e participantes...");
    await sql`TRUNCATE TABLE public.t_draw_winners RESTART IDENTITY CASCADE;`.catch(() => {});
    await sql`TRUNCATE TABLE public.t_draw_tickets RESTART IDENTITY CASCADE;`.catch(() => {});
    await sql`TRUNCATE TABLE public.t_draws RESTART IDENTITY CASCADE;`.catch(() => {});
    await sql`TRUNCATE TABLE public.t_participants RESTART IDENTITY CASCADE;`.catch(() => {});
    await sql`TRUNCATE TABLE public.t_request_rate_limits;`.catch(() => {});

    // 2. Garante que t_settings está com inscrições abertas
    console.log("2️⃣ Redefinindo configurações iniciais...");
    await sql`
      INSERT INTO public.t_settings (cd_configuracao, vl_configuracao)
      VALUES ('registrations_open', 'true')
      ON CONFLICT (cd_configuracao) DO UPDATE SET vl_configuracao = 'true';
    `;
    await sql`
      DELETE FROM public.t_settings WHERE cd_configuracao IN ('latest_draw_id', 'latest_winner_number');
    `.catch(() => {});

    // 3. Garante que os sorteios oficiais estão cadastrados e abertos
    console.log("3️⃣ Sincronizando sorteios padrão em t_draw_definitions...");
    await sql`
      INSERT INTO public.t_draw_definitions (id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio)
      VALUES 
        (
          'draw-provador-01', 
          'Provador Fashion', 
          'Provador Fashion', 
          '["lojista", "revendedor"]'::jsonb, 
          FALSE, 
          NULL, 
          'open'
        ),
        (
          'draw-terno-02', 
          'Sorteio Terno de Luxo', 
          'Terno', 
          '["lojista", "revendedor", "influencer", "visitante"]'::jsonb, 
          TRUE, 
          10, 
          'open'
        )
      ON CONFLICT (id_sorteio) DO UPDATE SET
        st_sorteio = 'open',
        nm_titulo = EXCLUDED.nm_titulo,
        nm_premio = EXCLUDED.nm_premio,
        target_user_types = EXCLUDED.target_user_types,
        tem_limite = EXCLUDED.tem_limite,
        nr_limite_maximo = EXCLUDED.nr_limite_maximo;
    `;

    console.log("\n=======================================================");
    console.log("✨ BANCO DE DADOS LIMPO E RESETADO COM SUCESSO!");
    console.log("   - Participantes: 0 (ID reiniciado em 1)");
    console.log("   - Bilhetes emitidos: 0 (ID reiniciado em 1)");
    console.log("   - Ganhadores: 0");
    console.log("   - Inscrições: ABERTAS");
    console.log("   - Sorteios disponíveis: 2 (Provador Fashion + Terno de Luxo)");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ ERRO AO LIMPAR BANCO:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

cleanDatabase();
