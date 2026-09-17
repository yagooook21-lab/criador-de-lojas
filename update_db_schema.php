<?php
require_once(__DIR__ . '/api/db.php');

$query_check_categoria = "SHOW COLUMNS FROM `produto` LIKE 'categoria'";
$result_cat = mysqli_query($conn, $query_check_categoria);

if(mysqli_num_rows($result_cat) == 0){
    $query_add_cat = "ALTER TABLE `produto` ADD `categoria` VARCHAR(255) DEFAULT 'Geral'";
    if(mysqli_query($conn, $query_add_cat)){
        echo "Coluna 'categoria' adicionada com sucesso.<br>";
    } else {
        echo "Erro ao adicionar 'categoria': " . mysqli_error($conn) . "<br>";
    }
} else {
    echo "Coluna 'categoria' já existe.<br>";
}

$query_check_rel = "SHOW COLUMNS FROM `produto` LIKE 'produtos_relacionados'";
$result_rel = mysqli_query($conn, $query_check_rel);

if(mysqli_num_rows($result_rel) == 0){
    $query_add_rel = "ALTER TABLE `produto` ADD `produtos_relacionados` VARCHAR(255) DEFAULT ''";
    if(mysqli_query($conn, $query_add_rel)){
        echo "Coluna 'produtos_relacionados' adicionada com sucesso.<br>";
    } else {
        echo "Erro ao adicionar 'produtos_relacionados': " . mysqli_error($conn) . "<br>";
    }
} else {
    echo "Coluna 'produtos_relacionados' já existe.<br>";
}

echo "Finalizado.";
?>
