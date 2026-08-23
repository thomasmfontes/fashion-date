# Publicação na Vercel com banco Supabase

O site atual deve continuar publicado até a URL provisória da Vercel passar por todos os testes. O domínio `fashiondate.com.br` só será alterado no final.

## 1. Criar o projeto no Supabase

1. Entre em `https://supabase.com/dashboard` com uma conta que ficará sob seu controle.
2. Crie uma organização e um projeto para o Fashion Date.
3. Abra **SQL Editor**, cole o conteúdo de `supabase/migrations/202608220001_initial_schema.sql` e execute.
4. Abra **Table Editor** para confirmar as tabelas `participants`, `settings`, `draws` e `request_rate_limits`.

## 2. Obter a conexão do banco

1. No projeto Supabase, abra **Connect**.
2. Selecione a conexão por pooler compatível com ambientes serverless.
3. Copie a URI e substitua a senha indicada pela senha real do banco.
4. Guarde essa URI como `DATABASE_URL`. Ela é um segredo e nunca deve ser colocada no GitHub.

## 3. Testar localmente

Crie um arquivo `.env.local` baseado em `.env.example`:

```env
DATABASE_URL=postgresql://...
ADMIN_PASSWORD=sua-senha-do-painel
```

Depois execute:

```bash
npm run dev
```

## 4. Criar o projeto na Vercel

1. Entre em `https://vercel.com` com sua conta.
2. Importe o repositório GitHub `thomasmfontes/fashion-date`.
3. O framework deve ser detectado como **Next.js**.
4. Cadastre `DATABASE_URL` e `ADMIN_PASSWORD` em **Settings > Environment Variables** para Production, Preview e Development.
5. Publique primeiro na URL provisória `*.vercel.app`.

## 5. Validar antes de trocar o domínio

- Cadastro novo e cadastro duplicado.
- Consulta do número pelo WhatsApp.
- Login administrativo.
- Edição e exclusão de participantes.
- Abrir/fechar inscrições.
- Sorteio, revelação do vencedor e alerta nos celulares.
- Exportação CSV.
- Testes em Android, iPhone e no computador do telão.

## 6. Migrar dados e domínio

Os participantes do banco atual devem ser exportados e importados no Supabase antes da virada. Depois dos testes e da conferência dos dados, adicione `fashiondate.com.br` ao projeto Vercel e use no Registro.br exatamente os registros DNS apresentados pela Vercel.

Não apague a hospedagem atual até o domínio, o HTTPS e os fluxos essenciais estarem confirmados em produção.
