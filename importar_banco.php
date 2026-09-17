<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Script para importar o banco de dados automaticamente no Railway
require_once __DIR__ . '/api/db.php';

echo "<h1>Importador de Banco de Dados</h1>";

if (!isset($conn) || !$conn) {
    die("Erro: Não foi possível conectar ao banco de dados. Verifique api/db.php.");
}

$sql_file = __DIR__ . '/banco_unificado.sql';

if (!file_exists($sql_file)) {
    die("Erro: Arquivo banco_unificado.sql não encontrado!");
}

$sql_content = file_get_contents($sql_file);

// Executa as queries e reporta erros precisos
if (mysqli_multi_query($conn, $sql_content)) {
    $i = 1;
    do {
        if ($result = mysqli_store_result($conn)) {
            mysqli_free_result($result);
        }
        if (!mysqli_more_results($conn)) {
            break;
        }
        if (!mysqli_next_result($conn)) {
            echo "<h2 style='color: red;'>Erro na importação da query #$i!</h2>";
            echo "<p>Erro do MySQL: " . mysqli_error($conn) . "</p>";
            die();
        }
        $i++;
    } while (true);
    
    echo "<h2 style='color: green;'>Sucesso! O banco de dados foi importado perfeitamente!</h2>";
    echo "<p>Você já pode acessar o seu painel normalmente.</p>";
    echo "<p style='color: red;'><strong>IMPORTANTE:</strong> Por questões de segurança, delete este arquivo (importar_banco.php) e o arquivo banco_unificado.sql do seu projeto após o uso.</p>";
} else {
    echo "<h2 style='color: red;'>Erro ao iniciar importação!</h2>";
    echo "<p>Erro do MySQL: " . mysqli_error($conn) . "</p>";
}
?>
