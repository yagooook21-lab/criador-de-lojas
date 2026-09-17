-- Migração: Adicionar suporte ao CartHero em bancos já existentes
-- Execute este arquivo apenas se o banco já foi instalado anteriormente

-- Colunas na tabela pix (configurações do gateway)
ALTER TABLE `pix`
  ADD COLUMN IF NOT EXISTS `use_carthero` tinyint(1) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS `carthero_private_key` text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `carthero_public_key` text DEFAULT NULL;

-- Colunas na tabela pixgerado (registros de transações)
ALTER TABLE `pixgerado`
  ADD COLUMN IF NOT EXISTS `carthero_payment_id` varchar(255) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `carthero_status` varchar(50) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS `data_atualizacao` datetime DEFAULT NULL;
