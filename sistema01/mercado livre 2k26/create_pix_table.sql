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
