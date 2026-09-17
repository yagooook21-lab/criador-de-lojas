-- ============================================================
-- MIGRAÇÃO: Adicionar suporte ao Mercado Pago
-- Execute este script no banco de dados da loja
-- Data: 07/05/2026
-- ============================================================

-- 1. Adicionar colunas do Mercado Pago na tabela pix
ALTER TABLE `pix`
  ADD COLUMN IF NOT EXISTS `mp_access_token` TEXT DEFAULT NULL COMMENT 'Access Token do Mercado Pago (produção ou sandbox)',
  ADD COLUMN IF NOT EXISTS `mp_webhook_secret` TEXT DEFAULT NULL COMMENT 'Assinatura secreta do webhook MP (opcional)',
  ADD COLUMN IF NOT EXISTS `use_mercadopago` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 = usar Mercado Pago como gateway ativo';

-- 2. Adicionar colunas do Mercado Pago na tabela pixgerado
ALTER TABLE `pixgerado`
  ADD COLUMN IF NOT EXISTS `mp_transaction_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'ID da transação no Mercado Pago',
  ADD COLUMN IF NOT EXISTS `mp_status` VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'Status: pending, approved, rejected, cancelled, refunded';

-- 3. Criar tabela vendas_confirmadas (se ainda não existir)
CREATE TABLE IF NOT EXISTS `vendas_confirmadas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `cliente_ip` varchar(100) NOT NULL,
  `transaction_id` varchar(128) NOT NULL,
  `valor` varchar(20) NOT NULL DEFAULT '0',
  `data_venda` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'PAID',
  `gateway` varchar(30) NOT NULL DEFAULT 'mercadopago' COMMENT 'freepay | mercadopago | pix_estatico',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_id` (`transaction_id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Vendas com pagamento confirmado';

-- ============================================================
-- VERIFICAÇÃO (opcional): confirmar estrutura após migração
-- ============================================================
-- SHOW COLUMNS FROM pix;
-- SHOW COLUMNS FROM pixgerado;
-- SHOW TABLES LIKE 'vendas_confirmadas';
