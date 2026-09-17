<?php
/**
 * SCRIPT DE ATUALIZAÇÃO AUTOMÁTICA DO BANCO DE DADOS
 * DATA: 18/05/2026
 */

header('Content-Type: text/html; charset=utf-8');
require_once("api/db.php");

echo "<h2>Iniciando atualização do banco de dados...</h2>";

if (!$conn) {
    die("<p style='color:red;'>Erro: Conexão com o banco falhou.</p>");
}

function adicionarColuna($conn, $tabela, $coluna, $definicao) {
    $check = mysqli_query($conn, "SHOW COLUMNS FROM `$tabela` LIKE '$coluna'");
    if (mysqli_num_rows($check) == 0) {
        $sql = "ALTER TABLE `$tabela` ADD `$coluna` $definicao";
        if (mysqli_query($conn, $sql)) {
            echo "<p style='color:green;'>[OK] Coluna '$coluna' adicionada na tabela '$tabela'.</p>";
        } else {
            echo "<p style='color:red;'>[ERRO] Falha ao adicionar '$coluna' em '$tabela': " . mysqli_error($conn) . "</p>";
        }
    } else {
        echo "<p style='color:blue;'>[INFO] Coluna '$coluna' já existe na tabela '$tabela'.</p>";
    }
}

// 1. Atualizar Clientes
adicionarColuna($conn, 'clientes', 'variacoes', 'LONGTEXT DEFAULT NULL');
adicionarColuna($conn, 'clientes', 'pagamento_confirmado', "tinyint(1) NOT NULL DEFAULT 0");
adicionarColuna($conn, 'clientes', 'data_pagamento', "datetime DEFAULT NULL");

// 2. Atualizar Pix Gerado
adicionarColuna($conn, 'pixgerado', 'variacoes', 'LONGTEXT DEFAULT NULL');
adicionarColuna($conn, 'pixgerado', 'pixgo_payment_id', "text NOT NULL DEFAULT ''");
adicionarColuna($conn, 'pixgerado', 'pixgo_status', "varchar(50) NOT NULL DEFAULT 'pending'");
adicionarColuna($conn, 'pixgerado', 'data_atualizacao', 'datetime DEFAULT NULL');

// 3. Atualizar Produtos
adicionarColuna($conn, 'produto', 'categoria', "VARCHAR(100) DEFAULT 'Geral'");

// 4. Atualizar Configurações de Pix
adicionarColuna($conn, 'pix', 'use_pix_produto', 'tinyint(1) NOT NULL DEFAULT 1');
adicionarColuna($conn, 'pix', 'pixgo_api_key', "text NOT NULL DEFAULT ''");
adicionarColuna($conn, 'pix', 'pixgo_webhook_secret', "text NOT NULL DEFAULT ''");
adicionarColuna($conn, 'pix', 'use_pixgo', 'tinyint(1) NOT NULL DEFAULT 0');

// Limpeza de duplicados antigos (opcional, mas ajuda a limpar o painel agora)
mysqli_query($conn, "DELETE FROM online WHERE time < " . time());

// 5. Criar Tabelas se não existirem
$sql_multi = "CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` TEXT NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel',
  `data_cadastro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_uso` DATETIME DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (mysqli_query($conn, $sql_multi)) {
    echo "<p style='color:green;'>[OK] Tabela 'produto_pix_codigos' verificada/criada.</p>";
}

$sql_vendas = "CREATE TABLE IF NOT EXISTS `vendas_confirmadas` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `cliente_ip` varchar(100) NOT NULL,
  `transaction_id` varchar(128) NOT NULL,
  `valor` varchar(20) NOT NULL DEFAULT '0',
  `data_venda` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `status` varchar(20) NOT NULL DEFAULT 'PAID',
  `gateway` varchar(30) NOT NULL DEFAULT 'mercadopago',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_transaction_id` (`transaction_id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (mysqli_query($conn, $sql_vendas)) {
    echo "<p style='color:green;'>[OK] Tabela 'vendas_confirmadas' verificada/criada.</p>";
}

echo "<h3>Atualização concluída! Você já pode deletar este arquivo (atualizar_banco.php).</h3>";
?>
