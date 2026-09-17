-- Script para adicionar a coluna "ordem" na tabela "produto"
-- Esse comando pode ser executado sem medo de perder os dados já existentes, ele apenas cria uma nova coluna

ALTER TABLE `produto` ADD COLUMN `ordem` INT(11) NOT NULL DEFAULT 999;
