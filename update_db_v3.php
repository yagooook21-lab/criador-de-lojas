<?php
require_once("api/db.php");
$sql = "ALTER TABLE pix ADD COLUMN use_pix_produto tinyint(1) NOT NULL DEFAULT 1";
if(mysqli_query($conn, $sql)){
    echo "Coluna use_pix_produto adicionada com sucesso!";
} else {
    echo "Erro ao adicionar coluna: " . mysqli_error($conn);
}
?>
