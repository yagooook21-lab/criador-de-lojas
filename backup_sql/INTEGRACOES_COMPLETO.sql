-- ============================================================
-- ARQUIVO CONSOLIDADO DAS TABELAS DE INTEGRAÇÕES (MIGRAÇÕES)
-- ============================================================
-- Este arquivo reúne todas as estruturas de tabelas utilizadas
-- pelas integrações de pagamento (Mercado Pago, FreePay, PixGo, CartHero)
-- e ferramentas avançadas de Pix.
-- ============================================================

-- 1. TABELA PIX (Configurações dos Gateways e Chaves)
CREATE TABLE IF NOT EXISTS `pix` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chave` varchar(255) DEFAULT '',
  `tipo_chave` varchar(20) NOT NULL DEFAULT 'aleatoria',
  `cidade` varchar(100) DEFAULT '',
  `identificador` varchar(100) DEFAULT '',
  `descricao` varchar(255) DEFAULT '',
  `beneficiario` varchar(255) DEFAULT '',
  
  -- Integração FreePay
  `use_freepay` tinyint(1) DEFAULT 0,
  `freepay_public_key` text,
  `freepay_secret_key` text,
  
  -- Integração Mercado Pago
  `use_mercadopago` tinyint(1) DEFAULT 0,
  `mp_access_token` varchar(255) DEFAULT NULL,
  `mp_webhook_secret` varchar(255) DEFAULT NULL,
  
  -- Integração PixGo
  `use_pixgo` tinyint(1) DEFAULT 0,
  `pixgo_api_key` varchar(255) DEFAULT NULL,
  `pixgo_webhook_secret` varchar(255) DEFAULT NULL,
  
  -- Integração CartHero
  `use_carthero` tinyint(1) DEFAULT 0,
  `carthero_private_key` varchar(255) DEFAULT NULL,
  `carthero_public_key` varchar(255) DEFAULT NULL,
  
  -- Opções Globais
  `use_pix_produto` tinyint(1) DEFAULT 1,
  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Garantir registro único de configuração
INSERT IGNORE INTO `pix` (id) VALUES (1);


-- 2. TABELA PIXGERADO (Registro de Transações/Pedidos criados)
CREATE TABLE IF NOT EXISTS `pixgerado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(45) DEFAULT NULL,
  `useragent` text,
  `valor` varchar(20) DEFAULT NULL,
  `produto` varchar(50) DEFAULT NULL,
  `hora` varchar(20) DEFAULT NULL,
  `time` int(11) DEFAULT NULL,
  `variacoes` text,
  `pix_code` text,
  `pix_qr_base64` longtext,
  
  -- Transações Mercado Pago
  `mp_transaction_id` varchar(64) DEFAULT '',
  `mp_status` varchar(32) DEFAULT 'pending',
  
  -- Transações FreePay
  `freepay_transaction_id` varchar(64) DEFAULT '',
  `freepay_status` varchar(32) DEFAULT 'PENDING',
  
  -- Transações PixGo
  `pixgo_payment_id` varchar(64) DEFAULT '',
  `pixgo_status` varchar(32) DEFAULT 'pending',
  
  -- Transações CartHero
  `carthero_payment_id` varchar(255) DEFAULT NULL,
  `carthero_status` varchar(50) DEFAULT NULL,
  
  `data_atualizacao` datetime DEFAULT NULL,
  
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- 3. TABELA VENDAS_CONFIRMADAS (Registro unificado de pagamentos aprovados)
CREATE TABLE IF NOT EXISTS `vendas_confirmadas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `cliente_ip` varchar(100) NOT NULL,
  `transaction_id` varchar(128) NOT NULL,
  `valor` varchar(20) NOT NULL DEFAULT '0',
  `data_venda` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'PAID',
  `gateway` varchar(30) NOT NULL DEFAULT 'mercadopago' COMMENT 'freepay | mercadopago | carthero | pixgo | pix_estatico',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_id` (`transaction_id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='Vendas com pagamento confirmado em qualquer gateway';


-- 4. TABELA PRODUTO_PIX_CODIGOS (Sistema Avançado de Múltiplos Pix para o mesmo produto)
CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel', -- disponivel, reservado, pago
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_uso` datetime DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produto_codigo` (`produto_codigo`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
