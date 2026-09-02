-- ==============================================================================
-- FASHION DATE - SCRIPT DE LIMPEZA DE SORTEIOS REALIZADOS
-- ==============================================================================
-- Este script remove o histórico de apurações/ganhadores e reativa todos
-- os participantes para que fiquem disponíveis para novos sorteios.
-- ==============================================================================

BEGIN;

-- 1. Limpa os registros de ganhadores das rodadas
DELETE FROM t_draw_winners;

-- 2. Limpa o histórico de sorteios gerais do sistema
DELETE FROM t_draws;

-- 3. Retorna os participantes que foram marcados como 'winner' para 'active'
UPDATE t_participants 
SET st_participante = 'active' 
WHERE st_participante = 'winner';

-- 4. Reseta o status das definições de rodadas/acervo para 'ready' (pronto para sortear)
UPDATE t_draw_definitions 
SET st_sorteio = 'ready' 
WHERE st_sorteio IN ('completed', 'drawn');

-- 5. Caso esteja utilizando o schema legado em SQLite/Drizzle local (opcional/segurança):
-- DELETE FROM draws;
-- UPDATE participants SET status = 'active' WHERE status = 'winner';

COMMIT;

-- ==============================================================================
-- CONSULTAS DE VERIFICAÇÃO (Execute para conferir se foi zerado):
-- ==============================================================================
SELECT COUNT(*) AS total_sorteios_historico FROM t_draws;
SELECT COUNT(*) AS total_vencedores_registrados FROM t_draw_winners;
SELECT COUNT(*) AS total_participantes_vencedores FROM t_participants WHERE st_participante = 'winner';
SELECT COUNT(*) AS total_participantes_ativos FROM t_participants WHERE st_participante = 'active';
