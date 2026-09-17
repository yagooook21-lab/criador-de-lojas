<?php
/**
 * SCRIPT DE ENTRADA DIRETA NO PAINEL
 * 
 * Como usar:
 * 1. Envie este arquivo para a raiz do seu site.
 * 2. Acesse: https://seu-site.com.br/login_direto.php
 * 3. Você será logado automaticamente e levado ao dashboard.
 * 4. APAGUE ESTE ARQUIVO APÓS USAR.
 */

session_start();
require_once("api/db.php");

// Buscar o primeiro usuário admin disponível no banco
$sql = mysqli_query($conn, "SELECT * FROM acesso LIMIT 1");
$user = mysqli_fetch_assoc($sql);

if ($user) {
    $tempo = time() + 7200; // 2 horas de sessão
    $_SESSION['login'] = $user['login'];
    $_SESSION['senha'] = $user['senha'];
    $_SESSION['tempo'] = $tempo;
    
    echo "<h2>Login realizado com sucesso!</h2>";
    echo "<p>Redirecionando para o painel em 2 segundos...</p>";
    echo "<script>setTimeout(function(){ window.location.href='@SERVIDOR/dashboard.php'; }, 2000);</script>";
} else {
    echo "<h2>Erro: Nenhum usuário encontrado na tabela 'acesso'.</h2>";
    echo "<p>Execute o reset_admin.php primeiro.</p>";
}
?>
