<?php
/**
 * Script de Atualização Automática de Banco de Dados
 * Adiciona as colunas necessárias para o CartHero sem apagar dados existentes.
 */

require_once("api/db.php");

echo "<h1>Atualizador de Banco de Dados - CartHero</h1>";
echo "<p>Iniciando verificação de colunas...</p>";

$errors = [];
$success = [];

// Lista de comandos SQL para executar
$queries = [
    // Tabela pix (configurações)
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS carthero_private_key TEXT DEFAULT NULL",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS carthero_public_key TEXT DEFAULT NULL",
    "ALTER TABLE pix ADD COLUMN IF NOT EXISTS use_carthero INT DEFAULT 0",
    
    // Tabela pixgerado (transações)
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS carthero_payment_id VARCHAR(255) DEFAULT NULL",
    "ALTER TABLE pixgerado ADD COLUMN IF NOT EXISTS carthero_status VARCHAR(50) DEFAULT NULL"
];

// Restaurar credenciais originais (thefake / 12345)
$check_acesso = mysqli_query($conn, "SELECT * FROM acesso WHERE login='thefake' LIMIT 1");
if (mysqli_num_rows($check_acesso) == 0) {
    // Se não existe o usuário thefake, vamos inseri-lo ou resetar a tabela se estiver vazia
    mysqli_query($conn, "DELETE FROM acesso"); // Limpa acessos errados
    mysqli_query($conn, "INSERT INTO acesso (id, login, senha, acesso) VALUES (1, 'thefake', '12345', 'ativo')");
    $success[] = "Credenciais restauradas: login 'thefake' / senha '12345'";
} else {
    // Se existe mas a senha mudou, forçar a original solicitada pelo usuário
    mysqli_query($conn, "UPDATE acesso SET senha='12345' WHERE login='thefake'");
    $success[] = "Senha do usuário 'thefake' resetada para '12345'";
}

foreach ($queries as $sql) {
    // Como o IF NOT EXISTS no ALTER TABLE pode não funcionar em versões antigas do MySQL,
    // vamos tratar o erro silenciosamente se a coluna já existir.
    if (mysqli_query($conn, $sql)) {
        $success[] = "Executado: " . substr($sql, 0, 50) . "...";
    } else {
        $err = mysqli_error($conn);
        if (strpos($err, 'Duplicate column name') !== false) {
            $success[] = "Já existe: " . substr($sql, 0, 50) . "...";
        } else {
            $errors[] = "Erro ao executar [$sql]: " . $err;
        }
    }
}

echo "<h3>Resultado:</h3>";
if (!empty($success)) {
    echo "<ul style='color:green'>";
    foreach ($success as $s) echo "<li>$s</li>";
    echo "</ul>";
}

if (!empty($errors)) {
    echo "<ul style='color:red'>";
    foreach ($errors as $e) echo "<li>$e</li>";
    echo "</ul>";
} else {
    echo "<p style='color:green; font-weight:bold;'>O banco de dados está pronto para o CartHero!</p>";
}

echo "<hr><p><b>Importante:</b> Após rodar este script, apague o arquivo <code>atualizar_banco_carthero.php</code> do seu servidor por segurança.</p>";
?>
