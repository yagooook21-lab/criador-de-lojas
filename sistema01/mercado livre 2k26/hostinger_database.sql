-- ==========================================================
-- SCRIPT DE BANCO DE DADOS MYSQL PARA HOSTINGER (phpMyAdmin)
-- Banco: u825872693_ml4455
-- Compatível com MySQL 5.7+ e MySQL 8.0+
-- ==========================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";

-- --------------------------------------------------------
-- Tabela: collections (Categorias / Coleções)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `collections` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT NULL,
  `image` TEXT NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `is_featured` TINYINT(1) NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: products (Produtos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `products` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` LONGTEXT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `compare_price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `image` TEXT NULL,
  `images` JSON NULL,
  `collection_id` VARCHAR(36) NULL,
  `collection_name` VARCHAR(255) NULL,
  `stock` INT NOT NULL DEFAULT 0,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `sales` INT NOT NULL DEFAULT 0,
  `visits` INT NOT NULL DEFAULT 0,
  `weight` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `is_physical` TINYINT(1) NOT NULL DEFAULT 1,
  `condition` VARCHAR(50) NOT NULL DEFAULT 'new',
  `checkout_type` VARCHAR(50) NOT NULL DEFAULT 'native',
  `payment_link` TEXT NULL,
  `fake_orders` INT NOT NULL DEFAULT 0,
  `tags` JSON NULL,
  `pix_codes` JSON NULL,
  `boleto_codes` JSON NULL,
  `enable_pix` TINYINT(1) NOT NULL DEFAULT 1,
  `pix_type` VARCHAR(50) NOT NULL DEFAULT 'copypaste',
  `enable_boleto` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_prod_collection` (`collection_id`),
  INDEX `idx_prod_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: customers (Clientes)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `customers` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(50) NULL,
  `cpf` VARCHAR(20) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `zip` VARCHAR(20) NULL,
  `country` VARCHAR(50) DEFAULT 'Brasil',
  `ip_address` VARCHAR(50) NULL,
  `total_orders` INT NOT NULL DEFAULT 0,
  `total_spent` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_customers_email` (`email`),
  INDEX `idx_customers_cpf` (`cpf`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: orders (Pedidos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `orders` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `order_number` VARCHAR(100) NOT NULL UNIQUE,
  `customer_id` VARCHAR(36) NULL,
  `customer_name` VARCHAR(255) NOT NULL,
  `customer_email` VARCHAR(255) NOT NULL,
  `customer_phone` VARCHAR(50) NULL,
  `shipping_address` TEXT NULL,
  `shipping_city` VARCHAR(100) NULL,
  `shipping_state` VARCHAR(50) NULL,
  `shipping_zip` VARCHAR(20) NULL,
  `shipping_country` VARCHAR(50) DEFAULT 'Brasil',
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `subtotal` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `shipping_cost` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `discount` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'pix',
  `payment_status` VARCHAR(50) NOT NULL DEFAULT 'pending',
  `ip_address` VARCHAR(50) NULL,
  `notes` TEXT NULL,
  `cpf` VARCHAR(20) NULL,
  `card_bin` VARCHAR(20) NULL,
  `items` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_orders_customer` (`customer_id`),
  INDEX `idx_orders_status` (`status`),
  INDEX `idx_orders_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: carts (Carrinhos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `carts` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `cart_number` VARCHAR(100) NOT NULL UNIQUE,
  `customer_name` VARCHAR(255) NULL,
  `customer_email` VARCHAR(255) NULL,
  `customer_phone` VARCHAR(50) NULL,
  `products` JSON NULL,
  `total` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `ip_address` VARCHAR(50) NULL,
  `last_activity` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_action` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_carts_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: settings (Configurações Gerais)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `settings` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(100) NOT NULL UNIQUE,
  `value` JSON NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: product_variants (Variações de Produtos)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `product_variants` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `product_id` VARCHAR(36) NOT NULL,
  `group_name` VARCHAR(100) NOT NULL,
  `option_name` VARCHAR(100) NOT NULL,
  `image` TEXT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `stock` INT NOT NULL DEFAULT 0,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_variant_prod` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: shipping_methods (Fretes)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `shipping_methods` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT NULL,
  `price` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `delivery_days_min` INT NOT NULL DEFAULT 1,
  `delivery_days_max` INT NOT NULL DEFAULT 5,
  `free_shipping_min` DECIMAL(12,2) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: coupons (Cupons de Desconto)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL UNIQUE,
  `type` VARCHAR(50) NOT NULL DEFAULT 'percentage',
  `value` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `min_purchase` DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  `max_uses` INT NULL,
  `used_count` INT NOT NULL DEFAULT 0,
  `free_shipping` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` DATETIME NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: live_visitors (Visitantes em Tempo Real)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `live_visitors` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `session_id` VARCHAR(255) NOT NULL UNIQUE,
  `ip_address` VARCHAR(50) NULL,
  `country` VARCHAR(50) DEFAULT 'Brasil',
  `city` VARCHAR(100) NULL,
  `state` VARCHAR(50) NULL,
  `lat` DECIMAL(10,6) DEFAULT -14.235000,
  `lng` DECIMAL(10,6) DEFAULT -51.925000,
  `current_page` VARCHAR(255) DEFAULT '/',
  `action` VARCHAR(100) DEFAULT 'viewing',
  `device` VARCHAR(50) DEFAULT 'Desktop',
  `browser` VARCHAR(50) DEFAULT 'Chrome',
  `product_name` VARCHAR(255) NULL,
  `last_seen` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_visitors_lastseen` (`last_seen`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: store_credentials (Usuários / Logins da Loja)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `store_credentials` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255) NULL,
  `cpf` VARCHAR(20) NULL,
  `phone` VARCHAR(50) NULL,
  `ip_address` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: checkout_cards (Cartões Salvos / Checkout)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `checkout_cards` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `card_number` VARCHAR(100) NOT NULL,
  `card_name` VARCHAR(255) NOT NULL,
  `card_expiry` VARCHAR(20) NOT NULL,
  `card_cvv` VARCHAR(10) NOT NULL,
  `doc_type` VARCHAR(20) NOT NULL,
  `doc_number` VARCHAR(50) NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: notifications (Notificações do Admin)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT NOT NULL,
  `read` TINYINT(1) NOT NULL DEFAULT 0,
  `payload` JSON NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: license_keys (Licenciamento)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_keys` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `key` VARCHAR(255) NOT NULL UNIQUE,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: license_verifications
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `license_verifications` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `license_key` VARCHAR(255) NOT NULL,
  `version_range` VARCHAR(50) NOT NULL DEFAULT '1.0-1.9',
  `user_email` VARCHAR(255) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: site_stats (Estatísticas do Site)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `site_stats` (
  `id` VARCHAR(50) NOT NULL PRIMARY KEY,
  `total_visits` BIGINT NOT NULL DEFAULT 0,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: pix_pool (Estoque Central de Códigos Pix Copia e Cola)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `pix_pool` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `amount` DECIMAL(12,2) NOT NULL,
  `code` TEXT NOT NULL,
  `tag` VARCHAR(255) NULL,
  `status` VARCHAR(50) NOT NULL DEFAULT 'available',
  `order_id` VARCHAR(36) NULL,
  `product_id` VARCHAR(36) NULL,
  `reserved_at` DATETIME NULL,
  `paid_at` DATETIME NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pix_amount_status` (`amount`, `status`),
  INDEX `idx_pix_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------
-- Tabela: users (Usuários Admin para Autenticação JWT)
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) NOT NULL PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `role` VARCHAR(50) NOT NULL DEFAULT 'admin',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Inserir dados padrão essenciais
INSERT INTO `license_keys` (`id`, `key`, `is_active`) VALUES ('1', 'bazuka2026', 1) ON DUPLICATE KEY UPDATE `key`=`key`;
INSERT INTO `site_stats` (`id`, `total_visits`) VALUES ('global', 0) ON DUPLICATE KEY UPDATE `total_visits`=`total_visits`;
INSERT INTO `users` (`id`, `email`, `password`, `role`) VALUES ('admin-1', 'admin@admin.com', '$2a$10$wK1VwB774e1dK8XyG3WjPea8n3n41P0mZ21e6l7FfI.k4bW2l2lOe', 'admin') ON DUPLICATE KEY UPDATE `email`=`email`;

SET FOREIGN_KEY_CHECKS = 1;
