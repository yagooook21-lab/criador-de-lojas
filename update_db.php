<?php
require_once('api/db.php');

function coluna_existe($conn, $tabela, $coluna) {
    $tabela = preg_replace('/[^a-zA-Z0-9_]/', '', $tabela);
    $coluna = preg_replace('/[^a-zA-Z0-9_]/', '', $coluna);
    $resultado = mysqli_query($conn, "SHOW COLUMNS FROM `$tabela` LIKE '$coluna'");
    return $resultado && mysqli_num_rows($resultado) > 0;
}

$queries = [
    "CREATE TABLE IF NOT EXISTS pix_tabelas (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(255) NOT NULL,
        ativa TINYINT(1) NOT NULL DEFAULT 0,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
    )",
    "CREATE TABLE IF NOT EXISTS pix_tabela_codigos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        tabela_id INT NOT NULL,
        valor DECIMAL(10,2) NOT NULL DEFAULT 0.00,
        codigo TEXT NOT NULL,
        status_pagamento VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL',
        reservado_em DATETIME DEFAULT NULL,
        reservado_pedido_ref VARCHAR(100) DEFAULT NULL,
        pago_em DATETIME DEFAULT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_tabela_id (tabela_id),
        INDEX idx_status (status_pagamento),
        FOREIGN KEY (tabela_id) REFERENCES pix_tabelas(id) ON DELETE CASCADE
    )",
    "CREATE TABLE IF NOT EXISTS gateways_config (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        status ENUM('ativo', 'inativo') DEFAULT 'inativo',
        taxa_pct DECIMAL(10,2) DEFAULT 0.00,
        taxa_fixa DECIMAL(10,2) DEFAULT 0.00,
        api_key VARCHAR(255) DEFAULT '',
        secret_key VARCHAR(255) DEFAULT '',
        webhook_secret VARCHAR(255) DEFAULT ''
    )"
];

foreach ($queries as $q) {
    if (mysqli_query($conn, $q)) {
        echo "OK: $q\n";
    } else {
        echo "ERR: " . mysqli_error($conn) . " on $q\n";
    }
}

// Adicionar somente as colunas que ainda não existem.
$colunas_pix = [
    'modo_pix'          => "VARCHAR(100) DEFAULT 'manual'",
    'pix_modo'          => "VARCHAR(20) NOT NULL DEFAULT 'manual'",
    'limite_por_cliente'=> "INT DEFAULT 4",
    'aleatorio_multiplas' => "TINYINT(1) DEFAULT 0"
];

foreach ($colunas_pix as $coluna => $definicao) {
    if (coluna_existe($conn, 'pix', $coluna)) {
        echo "OK: coluna pix.$coluna já existe\n";
        continue;
    }

    $sql = "ALTER TABLE pix ADD COLUMN `$coluna` $definicao";
    if (mysqli_query($conn, $sql)) {
        echo "OK: $sql\n";
    } else {
        echo "ERR: " . mysqli_error($conn) . " on $sql\n";
    }
}

// Aproveitar configurações antigas quando pix_modo ainda estiver no padrão manual.
if (coluna_existe($conn, 'pix', 'modo_pix') && coluna_existe($conn, 'pix', 'pix_modo')) {
    $sql_sync = "UPDATE pix SET pix_modo=modo_pix WHERE (pix_modo IS NULL OR pix_modo='manual') AND modo_pix IN ('copia_cola','gateway')";
    if (mysqli_query($conn, $sql_sync)) {
        echo "OK: modos Pix sincronizados\n";
    } else {
        echo "ERR: " . mysqli_error($conn) . " on $sql_sync\n";
    }
}
?>
