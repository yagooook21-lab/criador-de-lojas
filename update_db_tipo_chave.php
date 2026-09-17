<?php
require_once "api/db.php";

echo "Iniciando atualização do banco para suporte a Tipo de Chave PIX...\n";

// Adicionar a coluna tipo_chave na tabela pix se ela não existir
$check = mysqli_query($conn, "SHOW COLUMNS FROM pix LIKE 'tipo_chave'");
if (mysqli_num_rows($check) == 0) {
    $sql = "ALTER TABLE pix ADD COLUMN tipo_chave VARCHAR(20) NOT NULL DEFAULT 'aleatoria' AFTER chave";
    if (mysqli_query($conn, $sql)) {
        echo "Coluna 'tipo_chave' adicionada com sucesso!\n";
    } else {
        echo "Erro ao adicionar coluna: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "Coluna 'tipo_chave' já existe!\n";
}

echo "\nFinalizado!";
?>
