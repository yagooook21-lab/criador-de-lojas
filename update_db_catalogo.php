<?php
require_once __DIR__ . '/api/db.php';

echo "Atualizando banco de dados para o novo catálogo...\n";

// 1. Criar tabela catalogo_banners
$sqlBanners = "CREATE TABLE IF NOT EXISTS `catalogo_banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `imagem` varchar(255) NOT NULL,
  `link` varchar(255) DEFAULT '',
  `ordem` int(11) DEFAULT 0,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

if (mysqli_query($conn, $sqlBanners)) {
    echo "Tabela catalogo_banners verificada/criada com sucesso.\n";
} else {
    echo "Erro ao criar tabela catalogo_banners: " . mysqli_error($conn) . "\n";
}

// 2. Adicionar coluna destaque_catalogo na tabela produto
$sqlCheckCol = "SHOW COLUMNS FROM `produto` LIKE 'destaque_catalogo'";
$resCol = mysqli_query($conn, $sqlCheckCol);
if (mysqli_num_rows($resCol) == 0) {
    $sqlAddCol = "ALTER TABLE `produto` ADD `destaque_catalogo` TINYINT(1) DEFAULT 0";
    if (mysqli_query($conn, $sqlAddCol)) {
        echo "Coluna destaque_catalogo adicionada à tabela produto.\n";
    } else {
        echo "Erro ao adicionar coluna destaque_catalogo: " . mysqli_error($conn) . "\n";
    }
} else {
    echo "Coluna destaque_catalogo já existe.\n";
}

echo "Concluído.\n";
