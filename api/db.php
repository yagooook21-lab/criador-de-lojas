<?php 
/*=====================================
▀▀█▀▀ █  █ █▀▀▀    █▀▀▀ █▀▀█ █ ▄▀ █▀▀▀ 
  █   █▀▀█ █▀▀▀ ▀▀ █▀▀▀ █▄▄█ █▀▄  █▀▀▀ 
  █   █  █ █▄▄▄    █    █  █ █  █ █▄▄▄
=====================================*/

// CONFIGURAÇÃO DO BANCO DE DADOS
class db {
    public static $db_server = "localhost"; // Geralmente localhost
    public static $db_db     = "marketpl_ml002";   // Nome do banco de dados
    public static $db_user   = "marketpl_ml002";      // Usuário do banco
    public static $db_pass   = "ycHh2KVsMRRqDKY5QU4y";          // Senha do banco
}

// Desativar exceções do MySQLi (evita erro 500 fatal no PHP 8.1+)
if (function_exists('mysqli_report')) {
    @mysqli_report(MYSQLI_REPORT_OFF);
}

// Tentar conectar
$conn = @mysqli_connect(db::$db_server, db::$db_user, db::$db_pass, db::$db_db);

// Verificar se a conexão falhou
if (!$conn) { 
    $error_msg = mysqli_connect_error();
    die("<div style='font-family:sans-serif; padding:50px; text-align:center;'>
            <h2 style='color:#e00;'>Erro de Conexão com o Banco de Dados</h2>
            <p>Não foi possível conectar ao banco de dados. Verifique as configurações no arquivo <strong>api/db.php</strong>.</p>
            <p style='color:#666; font-size:13px;'>Detalhe técnico: $error_msg</p>
         </div>");
}

// Definir charset para evitar problemas com acentuação
@mysqli_set_charset($conn, "utf8mb4");

// Auto-migrate tabelas PIX. O painel usa pix_tabelas/pix_tabela_codigos;
// instalações antigas usavam pix_tabelas.status/pix_codigos_multiplos.
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS pix_tabelas (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(255) NOT NULL, ativa TINYINT(1) NOT NULL DEFAULT 0, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP)");
@mysqli_query($conn, "ALTER TABLE pix_tabelas ADD COLUMN IF NOT EXISTS ativa TINYINT(1) NOT NULL DEFAULT 0");
$pix_status_col = @mysqli_query($conn, "SHOW COLUMNS FROM pix_tabelas LIKE 'status'");
if ($pix_status_col && mysqli_num_rows($pix_status_col) > 0) {
    @mysqli_query($conn, "UPDATE pix_tabelas SET ativa = IF(status='ATIVA', 1, 0) WHERE ativa=0");
}
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS pix_tabela_codigos (id INT AUTO_INCREMENT PRIMARY KEY, tabela_id INT NOT NULL, valor DECIMAL(10,2) NOT NULL DEFAULT 0.00, codigo TEXT NOT NULL, status_pagamento VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL', reservado_em DATETIME DEFAULT NULL, reservado_pedido_ref VARCHAR(100) DEFAULT NULL, pago_em DATETIME DEFAULT NULL, criado_em DATETIME DEFAULT CURRENT_TIMESTAMP, INDEX idx_tabela_id (tabela_id), INDEX idx_status (status_pagamento)) ENGINE=InnoDB");
@mysqli_query($conn, "ALTER TABLE pix_tabela_codigos ADD COLUMN IF NOT EXISTS valor DECIMAL(10,2) NOT NULL DEFAULT 0.00");
@mysqli_query($conn, "ALTER TABLE pix_tabela_codigos ADD COLUMN IF NOT EXISTS status_pagamento VARCHAR(20) NOT NULL DEFAULT 'DISPONIVEL'");
@mysqli_query($conn, "ALTER TABLE pix_tabela_codigos ADD COLUMN IF NOT EXISTS reservado_em DATETIME DEFAULT NULL");
@mysqli_query($conn, "ALTER TABLE pix_tabela_codigos ADD COLUMN IF NOT EXISTS reservado_pedido_ref VARCHAR(100) DEFAULT NULL");
@mysqli_query($conn, "ALTER TABLE pix_tabela_codigos ADD COLUMN IF NOT EXISTS pago_em DATETIME DEFAULT NULL");
// Importar registros do modelo antigo sem duplicar códigos já migrados.
$old_pix_codes = @mysqli_query($conn, "SHOW TABLES LIKE 'pix_codigos_multiplos'");
if ($old_pix_codes && mysqli_num_rows($old_pix_codes) > 0) {
    @mysqli_query($conn, "INSERT INTO pix_tabela_codigos (tabela_id, codigo, valor, status_pagamento, pago_em) SELECT tabela_id, codigo, valor, CASE WHEN status='pago' THEN 'PAGO' WHEN status='reservado' THEN 'RESERVADO' ELSE 'DISPONIVEL' END, data_uso FROM pix_codigos_multiplos old WHERE NOT EXISTS (SELECT 1 FROM pix_tabela_codigos newc WHERE newc.tabela_id=old.tabela_id AND newc.codigo=old.codigo)");
}
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS gateways_config (id INT AUTO_INCREMENT PRIMARY KEY, nome VARCHAR(100) NOT NULL, status ENUM('ativo', 'inativo') DEFAULT 'inativo', taxa_pct DECIMAL(10,2) DEFAULT 0.00, taxa_fixa DECIMAL(10,2) DEFAULT 0.00, api_key VARCHAR(255) DEFAULT '', secret_key VARCHAR(255) DEFAULT '', webhook_secret VARCHAR(255) DEFAULT '')");
@mysqli_query($conn, "ALTER TABLE pix ADD COLUMN IF NOT EXISTS modo_pix VARCHAR(100) DEFAULT 'manual'");
@mysqli_query($conn, "ALTER TABLE pix ADD COLUMN IF NOT EXISTS pix_modo VARCHAR(20) NOT NULL DEFAULT 'manual'");
@mysqli_query($conn, "UPDATE pix SET pix_modo=modo_pix WHERE (pix_modo IS NULL OR pix_modo='manual') AND modo_pix IN ('copia_cola','gateway')");
@mysqli_query($conn, "ALTER TABLE pix ADD COLUMN IF NOT EXISTS limite_por_cliente INT DEFAULT 4");
@mysqli_query($conn, "ALTER TABLE pix ADD COLUMN IF NOT EXISTS aleatorio_multiplas TINYINT(1) DEFAULT 0");

// Garantir colunas completas para a tabela 'pixgerado'
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS pixgerado (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(45), useragent TEXT, valor VARCHAR(20), produto VARCHAR(50), hora VARCHAR(20), time INT) ENGINE=InnoDB");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS produto_nome VARCHAR(255) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS cliente_nome VARCHAR(255) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS cliente_telefone VARCHAR(50) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS cliente_cpf VARCHAR(20) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS cliente_email VARCHAR(255) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pendente'");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS variacoes TEXT");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS pix_code TEXT");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS pix_qr_base64 TEXT");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS data_criacao DATETIME DEFAULT CURRENT_TIMESTAMP");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS carthero_payment_id VARCHAR(64) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS carthero_status VARCHAR(32) DEFAULT 'pending'");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS mp_transaction_id VARCHAR(64) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS freepay_transaction_id VARCHAR(64) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS pixgo_payment_id VARCHAR(64) DEFAULT ''");

// Garantir colunas completas para a tabela 'online'
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS online (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(45), useragent TEXT, hora VARCHAR(20), time INT) ENGINE=InnoDB");
@mysqli_query($conn, "ALTER TABLE online ADD COLUMN IF NOT EXISTS etapa VARCHAR(50) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE online ADD COLUMN IF NOT EXISTS cidade VARCHAR(100) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE online ADD COLUMN IF NOT EXISTS estado VARCHAR(100) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE online ADD COLUMN IF NOT EXISTS dispositivo VARCHAR(50) DEFAULT ''");
@mysqli_query($conn, "ALTER TABLE online ADD COLUMN IF NOT EXISTS situacao VARCHAR(20) DEFAULT 'ativo'");

// Garantir estrutura completa para salvar os cadastros/leads do checkout.
// Versões antigas do banco não possuíam produto_codigo, produto_nome e ip_real;
// nesses bancos o INSERT falhava e o endpoint retornava "ok" mesmo sem salvar.
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nome VARCHAR(255) DEFAULT NULL,
    email VARCHAR(255) DEFAULT NULL,
    cpf VARCHAR(20) DEFAULT NULL,
    celular VARCHAR(20) DEFAULT NULL,
    ip VARCHAR(100) DEFAULT NULL,
    cep VARCHAR(20) DEFAULT NULL,
    endereco VARCHAR(255) DEFAULT NULL,
    numero VARCHAR(20) DEFAULT NULL,
    bairro VARCHAR(100) DEFAULT NULL,
    cidade VARCHAR(100) DEFAULT NULL,
    estado VARCHAR(50) DEFAULT NULL,
    complemento VARCHAR(255) DEFAULT NULL,
    destinatario VARCHAR(255) DEFAULT NULL,
    quantidade VARCHAR(10) DEFAULT '1',
    valortotal VARCHAR(20) DEFAULT NULL,
    variacoes LONGTEXT DEFAULT NULL,
    produto_codigo VARCHAR(100) DEFAULT NULL,
    produto_nome VARCHAR(255) DEFAULT NULL,
    ip_real VARCHAR(100) DEFAULT NULL,
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
// Não usar "ADD COLUMN IF NOT EXISTS": MySQL antigo não suporta essa sintaxe.
// A consulta SHOW COLUMNS torna a migração idempotente e compatível.
if ($conn) {
    $colunas_clientes = [
        'estado'         => "VARCHAR(50) DEFAULT NULL",
        'destinatario'   => "VARCHAR(255) DEFAULT NULL",
        'quantidade'     => "VARCHAR(10) DEFAULT '1'",
        'valortotal'     => "VARCHAR(20) DEFAULT NULL",
        'variacoes'      => "LONGTEXT DEFAULT NULL",
        'produto_codigo' => "VARCHAR(100) DEFAULT NULL",
        'produto_nome'   => "VARCHAR(255) DEFAULT NULL",
        'ip_real'        => "VARCHAR(100) DEFAULT NULL",
        'data_cadastro'  => "TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP"
    ];
    foreach ($colunas_clientes as $nome_coluna => $definicao_coluna) {
        $nome_seguro = mysqli_real_escape_string($conn, $nome_coluna);
        $existe_coluna = @mysqli_query($conn, "SHOW COLUMNS FROM clientes LIKE '$nome_seguro'");
        if (!$existe_coluna || mysqli_num_rows($existe_coluna) === 0) {
            @mysqli_query($conn, "ALTER TABLE clientes ADD COLUMN `$nome_coluna` $definicao_coluna");
        }
    }
}

// Garantir que a tabela vendas_confirmadas exista
@mysqli_query($conn, "CREATE TABLE IF NOT EXISTS vendas_confirmadas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    transaction_id VARCHAR(100) NOT NULL,
    gateway VARCHAR(50) NOT NULL,
    valor DECIMAL(10,2) NOT NULL,
    cliente_nome VARCHAR(255) DEFAULT '',
    cliente_email VARCHAR(255) DEFAULT '',
    cliente_cpf VARCHAR(20) DEFAULT '',
    cliente_telefone VARCHAR(20) DEFAULT '',
    produto_nome VARCHAR(255) DEFAULT '',
    status VARCHAR(50) DEFAULT 'paid',
    data_venda DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");

// Garantir estrutura via schema_check
require_once __DIR__ . '/schema_check.php';

?>
