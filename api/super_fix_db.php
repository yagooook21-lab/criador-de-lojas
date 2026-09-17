<?php
require_once("db.php");

echo "<pre>Iniciando Super Correção de Banco de Dados...\n";

// 1. Garantir tabela 'pix' e suas colunas de gateways
$queries_pix = [
    "CREATE TABLE IF NOT EXISTS pix (id INT PRIMARY KEY) ENGINE=InnoDB",
    "INSERT IGNORE INTO pix (id) VALUES (1)",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS chave VARCHAR(255) DEFAULT ''",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS beneficiario VARCHAR(255) DEFAULT ''",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS cidade VARCHAR(255) DEFAULT ''",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS descricao VARCHAR(255) DEFAULT ''",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS identificador VARCHAR(255) DEFAULT ''",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS use_freepay TINYINT(1) DEFAULT 0",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS freepay_public_key TEXT",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS freepay_secret_key TEXT",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS use_mercadopago TINYINT(1) DEFAULT 0",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS mp_access_token TEXT",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS use_pixgo TINYINT(1) DEFAULT 0",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS pixgo_api_key TEXT",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS use_pix_produto TINYINT(1) DEFAULT 1"
];

foreach ($queries_pix as $q) {
    if (mysqli_query($conn, $q)) {
        echo "[OK] " . substr($q, 0, 50) . "...\n";
    } else {
        echo "[ERRO] " . mysqli_error($conn) . " na query: $q\n";
    }
}

// 2. Garantir tabela 'pixgerado' e colunas de status
$queries_pixgerado = [
    "CREATE TABLE IF NOT EXISTS pixgerado (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ip VARCHAR(45),
        useragent TEXT,
        valor VARCHAR(20),
        produto VARCHAR(50),
        hora VARCHAR(20),
        time INT
    ) ENGINE=InnoDB",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS mp_transaction_id VARCHAR(64) DEFAULT ''",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS mp_status VARCHAR(32) DEFAULT 'pending'",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS freepay_transaction_id VARCHAR(64) DEFAULT ''",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS freepay_status VARCHAR(32) DEFAULT 'PENDING'",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS pixgo_payment_id VARCHAR(64) DEFAULT ''",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS pixgo_status VARCHAR(32) DEFAULT 'pending'"
];

foreach ($queries_pixgerado as $q) {
    if (mysqli_query($conn, $q)) {
        echo "[OK] " . substr($q, 0, 50) . "...\n";
    } else {
        echo "[ERRO] " . mysqli_error($conn) . " na query: $q\n";
    }
}

// 3. Garantir tabela 'produto_pix_codigos' para Multi-Pix
$query_multi = "CREATE TABLE IF NOT EXISTS produto_pix_codigos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    produto_codigo VARCHAR(50),
    pix_codigo TEXT,
    status VARCHAR(20) DEFAULT 'disponivel',
    cliente_ip VARCHAR(45) DEFAULT NULL,
    data_uso DATETIME DEFAULT NULL
) ENGINE=InnoDB";

if (mysqli_query($conn, $query_multi)) {
    echo "[OK] Tabela produto_pix_codigos garantida.\n";
}

// 4. Garantir coluna 'pix_copia_e_cola' na tabela 'produto'
mysqli_query($conn, "ALTER TABLE produto ADD COLUMN IF NOT EXISTS pix_copia_e_cola TEXT");

echo "\nCorreção concluída!</pre>";
?>
