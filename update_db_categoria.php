<?php
/**
 * Script de Atualização do Banco de Dados
 * Adiciona a coluna 'categoria' na tabela 'produto'
 */

// Habilitar exibição de erros para diagnóstico
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<!DOCTYPE html>
<html lang='pt-br'>
<head>
    <meta charset='UTF-8'>
    <title>Atualização de Banco de Dados</title>
    <style>
        body { font-family: sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; background: #f4f4f4; }
        .card { background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .success { color: #2e7d32; background: #e8f5e9; padding: 10px; border-radius: 4px; border-left: 5px solid #2e7d32; }
        .error { color: #c62828; background: #ffeeb; padding: 10px; border-radius: 4px; border-left: 5px solid #c62828; }
        .info { color: #0277bd; background: #e1f5fe; padding: 10px; border-radius: 4px; border-left: 5px solid #0277bd; }
        h2 { color: #333; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
        .btn { display: inline-block; background: #3483fa; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    </style>
</head>
<body>
<div class='card'>
    <h2>Atualização de Banco de Dados</h2>";

// Tentar incluir o arquivo de banco de dados
if (!file_exists("api/db.php")) {
    echo "<div class='error'>✗ Erro crítico: Arquivo <b>api/db.php</b> não encontrado.</div>";
} else {
    try {
        require_once("api/db.php");
        
        if (!isset($conn) || !$conn) {
            echo "<div class='error'>✗ Erro: A conexão com o banco de dados não foi estabelecida corretamente no arquivo db.php.</div>";
        } else {
            // 1. Verificar se a tabela produto existe
            $table_check = mysqli_query($conn, "SHOW TABLES LIKE 'produto'");
            if (mysqli_num_rows($table_check) == 0) {
                echo "<div class='error'>✗ Erro: A tabela <b>produto</b> não foi encontrada no banco de dados.</div>";
            } else {
                // 2. Adicionar coluna categoria se não existir
                $check_column = mysqli_query($conn, "SHOW COLUMNS FROM `produto` LIKE 'categoria'");
                
                if (mysqli_num_rows($check_column) == 0) {
                    // Tentar adicionar após tipo_produto, se não existir tipo_produto, adiciona no final
                    $check_after = mysqli_query($conn, "SHOW COLUMNS FROM `produto` LIKE 'tipo_produto'");
                    $after_clause = (mysqli_num_rows($check_after) > 0) ? "AFTER `tipo_produto`" : "";
                    
                    $sql = "ALTER TABLE `produto` ADD `categoria` VARCHAR(100) DEFAULT 'Geral' $after_clause";
                    
                    if (mysqli_query($conn, $sql)) {
                        echo "<div class='success'>✓ Coluna <b>'categoria'</b> adicionada com sucesso!</div>";
                    } else {
                        echo "<div class='error'>✗ Erro ao adicionar coluna: " . mysqli_error($conn) . "</div>";
                    }
                } else {
                    echo "<div class='info'>i A coluna <b>'categoria'</b> já existe no banco de dados. Nenhuma alteração necessária.</div>";
                }
            }
        }
    } catch (Exception $e) {
        echo "<div class='error'>✗ Ocorreu uma exceção: " . $e->getMessage() . "</div>";
    }
}

echo "    <a href='index.php' class='btn'>Voltar para o site</a>
</div>
</body>
</html>";
?>
