<?php
// Script para atualizar banco de dados de forma segura (não apaga dados)
require_once("api/db.php");

echo "<!DOCTYPE html><html lang='pt-BR'><head><meta charset='UTF-8'><title>Atualizador do Banco de Dados</title><style>body { font-family: Arial; padding: 20px; background: #f4f4f4; } .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); max-width: 600px; margin: 0 auto; } .success { color: green; font-weight: bold; margin: 5px 0;} .info { color: #555; margin: 5px 0; } </style></head><body><div class='card'><h2>Atualização Segura do Banco de Dados</h2>";

function addColumn($conn, $table, $column, $definition) {
    $check = mysqli_query($conn, "SHOW COLUMNS FROM `$table` LIKE '$column'");
    if ($check && mysqli_num_rows($check) == 0) {
        $result = mysqli_query($conn, "ALTER TABLE `$table` ADD COLUMN `$column` $definition");
        if ($result) {
            echo "<p class='success'>✅ Coluna '$column' adicionada na tabela '$table' com sucesso!</p>";
        } else {
            echo "<p style='color:red;'>❌ Erro ao adicionar '$column' em '$table': " . mysqli_error($conn) . "</p>";
        }
    } else {
        echo "<p class='info'>✔️ Coluna '$column' já existe na tabela '$table' (Nenhuma ação necessária).</p>";
    }
}

// Atualizações da tabela pixgerado
addColumn($conn, 'pixgerado', 'variacoes', 'LONGTEXT DEFAULT NULL');
addColumn($conn, 'pixgerado', 'produto_nome', "VARCHAR(255) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'cliente_nome', "VARCHAR(255) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'cliente_telefone', "VARCHAR(40) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'cliente_cpf', "VARCHAR(30) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'cliente_email', "VARCHAR(255) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'status', "VARCHAR(50) DEFAULT 'pendente'");
addColumn($conn, 'pixgerado', 'data_criacao', "DATETIME DEFAULT CURRENT_TIMESTAMP");
addColumn($conn, 'pixgerado', 'mp_transaction_id', "VARCHAR(64) DEFAULT ''");
addColumn($conn, 'pixgerado', 'mp_status', "VARCHAR(32) DEFAULT 'pending'");
addColumn($conn, 'pixgerado', 'freepay_transaction_id', "VARCHAR(64) DEFAULT ''");
addColumn($conn, 'pixgerado', 'freepay_status', "VARCHAR(32) DEFAULT 'PENDING'");
addColumn($conn, 'pixgerado', 'pixgo_payment_id', "VARCHAR(64) DEFAULT ''");
addColumn($conn, 'pixgerado', 'pixgo_status', "VARCHAR(32) DEFAULT 'pending'");
addColumn($conn, 'pixgerado', 'carthero_payment_id', "VARCHAR(255) DEFAULT NULL");
addColumn($conn, 'pixgerado', 'carthero_status', "VARCHAR(50) DEFAULT NULL");

// Atualizações da tabela clientes (Remarketing e Leads)
addColumn($conn, 'clientes', 'variacoes', 'LONGTEXT DEFAULT NULL');
addColumn($conn, 'clientes', 'produto_codigo', "VARCHAR(100) DEFAULT NULL");
addColumn($conn, 'clientes', 'produto_nome', "VARCHAR(255) DEFAULT NULL");
addColumn($conn, 'clientes', 'data_cadastro', "DATETIME DEFAULT CURRENT_TIMESTAMP");
addColumn($conn, 'clientes', 'ip_real', "VARCHAR(60) DEFAULT NULL");

// Atualizações da tabela pix (configurações)
addColumn($conn, 'pix', 'tipo_chave', "VARCHAR(20) NOT NULL DEFAULT 'aleatoria' AFTER chave");
addColumn($conn, 'pix', 'carthero_private_key', "TEXT DEFAULT NULL");
addColumn($conn, 'pix', 'carthero_public_key', "TEXT DEFAULT NULL");
addColumn($conn, 'pix', 'use_carthero', "TINYINT(1) DEFAULT 0");
addColumn($conn, 'pix', 'use_pix_produto', "TINYINT(1) NOT NULL DEFAULT 1");

// Atualizações da tabela produto
addColumn($conn, 'produto', 'ordem', "INT(11) NOT NULL DEFAULT 999");
addColumn($conn, 'produto', 'categoria', "VARCHAR(100) DEFAULT 'Geral'");

// Atualizações da tabela config
addColumn($conn, 'config', 'cor_botao', "VARCHAR(20) DEFAULT '#3483fa' AFTER cor");

echo "<h3>✅ Atualização concluída! Pode fechar esta tela.</h3></div></body></html>";
?>
