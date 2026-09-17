-- BANCO DE DADOS COMPLETO - ATUALIZADO V2
-- Versão com Variações, Reviews e Múltiplas Imagens
-- Data: 18/05/2026
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

-- 1. CRIAÇÃO DAS TABELAS COM ESTRUTURA ATUALIZADA

-- Tabela de Acesso Admin
CREATE TABLE IF NOT EXISTS `acesso` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `login` varchar(255) NOT NULL,
  `senha` varchar(255) NOT NULL,
  `acesso` varchar(50) NOT NULL DEFAULT 'ativo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Configurações de APIs
CREATE TABLE IF NOT EXISTS `apis` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `zap` varchar(255) DEFAULT '',
  `email` varchar(255) DEFAULT '',
  `htmlemail` text,
  `texto1email` text,
  `textozap` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Clientes e Pedidos
CREATE TABLE IF NOT EXISTS `clientes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `cpf` varchar(20) NOT NULL,
  `celular` varchar(20) NOT NULL,
  `cep` varchar(15) NOT NULL,
  `endereco` varchar(255) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `bairro` varchar(100) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `complemento` varchar(100) DEFAULT '',
  `destinatario` varchar(255) DEFAULT '',
  `quantidade` varchar(10) DEFAULT '1',
  `valortotal` varchar(20) DEFAULT '',
  `variacoes` LONGTEXT DEFAULT NULL,
  `pagamento_confirmado` TINYINT(1) DEFAULT 0,
  `data_pagamento` TIMESTAMP NULL,
  `ip` varchar(100) NOT NULL,
  `hora` varchar(20) NOT NULL,
  `time` varchar(50) NOT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_pagamento_confirmado` (`pagamento_confirmado`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Configuração da Loja
CREATE TABLE IF NOT EXISTS `config` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nome` varchar(255) NOT NULL,
  `cor` varchar(10) NOT NULL,
  `img` varchar(255) NOT NULL,
  `numero` varchar(20) NOT NULL,
  `zap` varchar(20) NOT NULL,
  `texto` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Clientes Online
CREATE TABLE IF NOT EXISTS `online` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100) NOT NULL,
  `useragent` text,
  `etapa` varchar(50) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `estado` varchar(50) NOT NULL,
  `dispositivo` varchar(50) NOT NULL,
  `hora` varchar(20) NOT NULL,
  `time` varchar(50) NOT NULL,
  `situacao` varchar(50) DEFAULT 'ativo',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Configuração de Pagamento Pix
CREATE TABLE IF NOT EXISTS `pix` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `chave` varchar(255) NOT NULL,
  `cidade` varchar(100) NOT NULL,
  `descricao` varchar(255) NOT NULL,
  `identificador` varchar(100) DEFAULT '',
  `beneficiario` varchar(100) NOT NULL,
  `freepay_public_key` text,
  `freepay_secret_key` text,
  `use_freepay` tinyint(1) NOT NULL DEFAULT 0,
  `mp_access_token` text DEFAULT NULL COMMENT 'Access Token do Mercado Pago',
  `mp_webhook_secret` text DEFAULT NULL COMMENT 'Assinatura secreta do webhook MP',
  `use_mercadopago` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = Mercado Pago ativo',
  `use_pix_produto` tinyint(1) NOT NULL DEFAULT 1 COMMENT '1 = Pix por produto ativo',
  `pixgo_api_key` text NOT NULL DEFAULT '',
  `pixgo_webhook_secret` text NOT NULL DEFAULT '',
  `use_pixgo` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Pix Gerados
CREATE TABLE IF NOT EXISTS `pixgerado` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100) NOT NULL,
  `useragent` text,
  `valor` varchar(20) NOT NULL,
  `produto` varchar(255) NOT NULL,
  `hora` varchar(20) NOT NULL,
  `time` varchar(50) NOT NULL,
  `variacoes` LONGTEXT DEFAULT NULL,
  `freepay_transaction_id` TEXT,
  `freepay_status` VARCHAR(50) DEFAULT 'PENDING',
  `mp_transaction_id` VARCHAR(64) NOT NULL DEFAULT '' COMMENT 'ID da transação Mercado Pago',
  `mp_status` VARCHAR(32) NOT NULL DEFAULT 'pending' COMMENT 'Status: pending, approved, rejected',
  `pixgo_payment_id` text NOT NULL DEFAULT '',
  `pixgo_status` varchar(50) NOT NULL DEFAULT 'pending',
  `data_atualizacao` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Códigos Pix por Produto (Multi-Pix)
CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` TEXT NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel', -- disponivel, reservado, pago
  `data_cadastro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_uso` DATETIME DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Vendas Confirmadas (FreePay + Mercado Pago)
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

-- Tabela de Produtos (ESTRUTURA DEFINITIVA)
CREATE TABLE IF NOT EXISTS `produto` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `codigo` varchar(100) NOT NULL,
	  `tipo_produto` VARCHAR(50) DEFAULT 'generico',
	  `categoria` VARCHAR(100) DEFAULT 'Geral',
  `nome` varchar(255) NOT NULL,
  `valor` varchar(20) NOT NULL,
  `valor_original` varchar(20) DEFAULT NULL,
  `img` varchar(255) NOT NULL,
  `img1` varchar(255) DEFAULT NULL,
  `img2` varchar(255) DEFAULT NULL,
  `img3` varchar(255) DEFAULT NULL,
  `img4` varchar(255) DEFAULT NULL,
  `img5` varchar(255) DEFAULT NULL,
  `img6` varchar(255) DEFAULT NULL,
  `oferta` varchar(10) DEFAULT '0',
  `desconto` varchar(10) DEFAULT '0',
  `descricao` text,
  `caracteristicas` text DEFAULT NULL,
  `reviews` longtext DEFAULT NULL,
  `variacoes` LONGTEXT DEFAULT NULL,
  `venda` varchar(10) DEFAULT '0',
	  `cliques` varchar(10) DEFAULT '0',
	  `pix_copia_e_cola` TEXT DEFAULT NULL,
	  `status` varchar(50) DEFAULT 'ativo',
	  PRIMARY KEY (`id`),
  INDEX `idx_tipo_produto` (`tipo_produto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabelas de Logs de Tráfego
CREATE TABLE IF NOT EXISTS `desktop` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100),
  `useragent` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `mobile` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100),
  `useragent` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `bot` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100),
  `useragent` text,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de IPs Bloqueados
CREATE TABLE IF NOT EXISTS `bloqueados` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ip` varchar(100) NOT NULL,
  `motivo` varchar(255) DEFAULT '',
  `data_bloqueio` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip` (`ip`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Tabela de Configuração do Facebook Pixel
CREATE TABLE IF NOT EXISTS `facebook_pixel` (
  `id` int(11) NOT NULL,
  `pixel_id` varchar(64) NOT NULL DEFAULT '',
  `ativo` tinyint(1) NOT NULL DEFAULT 0,
  `purchase_event` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. DADOS INICIAIS PADRÃO
INSERT IGNORE INTO `acesso` (`id`, `login`, `senha`, `acesso`) VALUES (1, 'thefake', '12345', 'ativo');
INSERT IGNORE INTO `apis` (`id`, `zap`, `email`, `htmlemail`, `texto1email`, `textozap`) VALUES (1, '', '', '', '', '');
INSERT IGNORE INTO `config` (`id`, `nome`, `cor`, `img`, `numero`, `zap`, `texto`) VALUES (1, 'Loja Ester', '#11ce17', 'logo.png', '00000000000', '00000000000', 'Olá, vim pelo site!');
INSERT IGNORE INTO `pix` (`id`, `chave`, `cidade`, `descricao`, `identificador`, `beneficiario`, `freepay_public_key`, `freepay_secret_key`, `use_freepay`, `mp_access_token`, `use_mercadopago`) VALUES (1, 'SUA_CHAVE_PIX_AQUI', 'SAO PAULO', 'Pagamento Loja', '***', 'Minha Loja', '', '', 0, '', 0);
INSERT IGNORE INTO `facebook_pixel` (`id`, `pixel_id`, `ativo`, `purchase_event`) VALUES (1, '', 0, 1);

COMMIT;
