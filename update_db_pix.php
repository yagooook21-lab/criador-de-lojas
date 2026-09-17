<?php
require_once("api/db.php");

$sql = "CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` TEXT NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel',
  `data_cadastro` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `data_uso` DATETIME DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  INDEX `idx_produto_codigo` (`produto_codigo`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (mysqli_query($conn, $sql)) {
    echo "Tabela 'produto_pix_codigos' criada ou já existente com sucesso!\n";
} else {
    echo "Erro ao criar tabela: " . mysqli_error($conn) . "\n";
}
?>
