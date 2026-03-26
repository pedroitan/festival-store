-- ============================================================
-- Migration 004 — Dashboard de Produção
-- Adiciona tracking_code, alinha status e shipping_service
-- ============================================================

-- Coluna de rastreio (obrigatória ao marcar como despachado)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_code TEXT;

-- Serviço de frete real selecionado (PAC | SEDEX)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_service TEXT;

-- Index para fila de produção (status é consultado frequentemente)
CREATE INDEX IF NOT EXISTS idx_orders_status_tenant ON orders(tenant_id, status);

-- Comentário: valores de status válidos
-- pending           → aguardando pagamento
-- aguardando_producao → pagamento confirmado, na fila do produtor
-- em_producao       → produtor iniciou
-- despachado        → enviado pelos Correios (tracking obrigatório)
-- entregue          → confirmado
-- cancelled         → cancelado
