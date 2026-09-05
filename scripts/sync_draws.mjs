import postgres from 'postgres';
import fs from 'fs';

let envUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!envUrl && fs.existsSync('.env.local')) {
  const envContent = fs.readFileSync('.env.local', 'utf-8');
  for (const line of envContent.split('\n')) {
    const match = line.match(/^\s*(DATABASE_URL|POSTGRES_URL|SUPABASE_DB_URL)\s*=\s*["']?(.*?)["']?\s*$/);
    if (match) {
      envUrl = match[2];
      break;
    }
  }
}

const sql = postgres(envUrl);

async function main() {
  console.log('🔄 Sincronizando os 3 sorteios oficiais no PostgreSQL...');

  // Limpar sorteios anteriores e inserir exatamente os 3 do painel
  await sql`DELETE FROM t_draw_definitions WHERE id_sorteio = 'draw-terno-02'`;

  // 1. Provador Fashion
  await sql`
    INSERT INTO t_draw_definitions (id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio)
    VALUES (
      'draw-provador-01',
      'Provador Fashion',
      'Provador Fashion',
      '["lojista", "revendedor"]'::jsonb,
      false,
      null,
      'open'
    )
    ON CONFLICT (id_sorteio) DO UPDATE SET
      nm_titulo = EXCLUDED.nm_titulo,
      nm_premio = EXCLUDED.nm_premio,
      target_user_types = EXCLUDED.target_user_types,
      tem_limite = EXCLUDED.tem_limite,
      nr_limite_maximo = EXCLUDED.nr_limite_maximo;
  `;

  // 2. Presença da Re
  await sql`
    INSERT INTO t_draw_definitions (id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio)
    VALUES (
      'draw-presenca-re-02',
      'Presença da Re',
      'Presença da Renata',
      '["lojista", "revendedor"]'::jsonb,
      false,
      null,
      'open'
    )
    ON CONFLICT (id_sorteio) DO UPDATE SET
      nm_titulo = EXCLUDED.nm_titulo,
      nm_premio = EXCLUDED.nm_premio,
      target_user_types = EXCLUDED.target_user_types,
      tem_limite = EXCLUDED.tem_limite,
      nr_limite_maximo = EXCLUDED.nr_limite_maximo;
  `;

  // 3. Atomy
  await sql`
    INSERT INTO t_draw_definitions (id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio)
    VALUES (
      'draw-atomy-03',
      'Atomy',
      'Kit de Produtos Atomy',
      '["lojista", "revendedor", "influencer", "visitante"]'::jsonb,
      true,
      475,
      'open'
    )
    ON CONFLICT (id_sorteio) DO UPDATE SET
      nm_titulo = EXCLUDED.nm_titulo,
      nm_premio = EXCLUDED.nm_premio,
      target_user_types = EXCLUDED.target_user_types,
      tem_limite = EXCLUDED.tem_limite,
      nr_limite_maximo = EXCLUDED.nr_limite_maximo;
  `;

  console.log('✅ Sorteios atualizados no PostgreSQL:');
  const draws = await sql`SELECT id_sorteio, nm_titulo, nm_premio, target_user_types, tem_limite, nr_limite_maximo, st_sorteio FROM t_draw_definitions ORDER BY dt_criacao ASC`;
  console.log(JSON.stringify(draws, null, 2));

  await sql.end();
}

main().catch((err) => {
  console.error('Erro ao sincronizar:', err);
  process.exit(1);
});
