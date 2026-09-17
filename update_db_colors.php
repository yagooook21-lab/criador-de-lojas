<?php
require_once("api/db.php");

// Adicionar coluna cor_botao se não existir
$check = mysqli_query($conn, "SHOW COLUMNS FROM config LIKE 'cor_botao'");
if (mysqli_num_rows($check) == 0) {
    $sql = "ALTER TABLE config ADD COLUMN cor_botao VARCHAR(20) DEFAULT '#3483fa' AFTER cor";
    if (mysqli_query($conn, $sql)) {
        echo "Coluna cor_botao adicionada com sucesso!\n";
    } else {
        echo "Erro ao adicionar coluna: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "Coluna cor_botao já existe.\n";
}
?>
