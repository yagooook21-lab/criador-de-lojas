<?php
/**
 * SCRIPT DE EMERGÊNCIA: RESET DE SENHA ADMIN
 * 
 * Como usar:
 * 1. Envie este arquivo para a raiz do seu site.
 * 2. Acesse: https://seu-site.com.br/reset_admin.php
 * 3. O script vai criar/atualizar o usuário 'admin' com a senha 'admin123'.
 * 4. APAGUE ESTE ARQUIVO DO SERVIDOR APÓS USAR POR SEGURANÇA.
 */

require_once("api/db.php");

echo "<h2>Reset de Senha Administrativa</h2>";

// Verificar se a tabela existe
$check = mysqli_query($conn, "SHOW TABLES LIKE 'acesso'");
if (mysqli_num_rows($check) == 0) {
    echo "<p style='color:red;'>Erro: A tabela 'acesso' não existe no banco de dados. Certifique-se de ter importado o SQL corretamente.</p>";
    exit;
}

$login = "admin";
$senha = "admin123";

// Tentar atualizar o ID 1 (padrão do sistema)
$update = mysqli_query($conn, "UPDATE acesso SET login='$login', senha='$senha' WHERE id=1");

if ($update && mysqli_affected_rows($conn) > 0) {
    echo "<p style='color:green;'>Sucesso! O usuário do ID 1 foi atualizado.</p>";
} else {
    // Se não atualizou (talvez ID 1 não exista), tenta inserir
    $insert = mysqli_query($conn, "INSERT INTO acesso (id, login, senha, acesso) VALUES (1, '$login', '$senha', 'ativo') ON DUPLICATE KEY UPDATE login='$login', senha='$senha'");
    if ($insert) {
        echo "<p style='color:green;'>Sucesso! O usuário foi criado/atualizado.</p>";
    } else {
        echo "<p style='color:red;'>Erro ao atualizar banco: " . mysqli_error($conn) . "</p>";
    }
}

echo "<hr>";
echo "<h3>Novos dados de acesso:</h3>";
echo "<strong>Login:</strong> $login<br>";
echo "<strong>Senha:</strong> $senha<br>";
echo "<p style='color:orange;'><strong>IMPORTANTE:</strong> Apague o arquivo <u>reset_admin.php</u> do seu servidor agora!</p>";
?>
