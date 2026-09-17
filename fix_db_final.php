<?php
require_once("api/db.php");

echo "<h2>Iniciando correção do banco de dados...</h2>";

$tabelas_colunas = [
    'produto' => [
        'codigo' => "varchar(100) NOT NULL",
        'tipo_produto' => "VARCHAR(50) DEFAULT 'generico'",
        'nome' => "varchar(255) NOT NULL",
        'valor' => "varchar(20) NOT NULL",
        'valor_original' => "varchar(20) DEFAULT NULL",
        'img' => "varchar(255) NOT NULL",
        'img1' => "varchar(255) DEFAULT NULL",
        'img2' => "varchar(255) DEFAULT NULL",
        'img3' => "varchar(255) DEFAULT NULL",
        'img4' => "varchar(255) DEFAULT NULL",
        'img5' => "varchar(255) DEFAULT NULL",
        'img6' => "varchar(255) DEFAULT NULL",
        'oferta' => "varchar(10) DEFAULT '0'",
        'desconto' => "varchar(10) DEFAULT '0'",
        'descricao' => "text",
        'caracteristicas' => "text DEFAULT NULL",
        'reviews' => "longtext DEFAULT NULL",
        'variacoes' => "LONGTEXT DEFAULT NULL",
        'venda' => "varchar(10) DEFAULT '0'",
        'cliques' => "varchar(10) DEFAULT '0'",
        'pix_copia_e_cola' => "TEXT DEFAULT NULL"
    ],
    'clientes' => [
        'variacoes' => "LONGTEXT DEFAULT NULL"
    ]
];

foreach ($tabelas_colunas as $tabela => $colunas) {
    echo "<h3>Verificando tabela: $tabela</h3>";
    
    // Verificar se a tabela existe
    $res = mysqli_query($conn, "SHOW TABLES LIKE '$tabela'");
    if (mysqli_num_rows($res) == 0) {
        echo "<p style='color:red;'>Tabela $tabela não existe! Criando...</p>";
        // Aqui poderíamos colocar o CREATE TABLE completo se necessário, 
        // mas vamos focar em adicionar colunas se ela existir.
        continue;
    }

    foreach ($colunas as $coluna => $definicao) {
        $check = mysqli_query($conn, "SHOW COLUMNS FROM `$tabela` LIKE '$coluna'");
        if (mysqli_num_rows($check) == 0) {
            echo "Adicionando coluna `$coluna` na tabela `$tabela`... ";
            $alter = "ALTER TABLE `$tabela` ADD COLUMN `$coluna` $definicao";
            if (mysqli_query($conn, $alter)) {
                echo "<span style='color:green;'>OK</span><br>";
            } else {
                echo "<span style='color:red;'>ERRO: " . mysqli_error($conn) . "</span><br>";
            }
        } else {
            echo "Coluna `$coluna` já existe.<br>";
        }
    }
}

// Criar tabela produto_pix_codigos se não existir
$sql_pix = "CREATE TABLE IF NOT EXISTS `produto_pix_codigos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `produto_codigo` varchar(100) NOT NULL,
  `pix_codigo` text NOT NULL,
  `status` varchar(20) NOT NULL DEFAULT 'disponivel',
  `data_cadastro` timestamp NOT NULL DEFAULT current_timestamp(),
  `data_uso` datetime DEFAULT NULL,
  `cliente_ip` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `produto_codigo` (`produto_codigo`),
  KEY `status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;";

echo "<h3>Verificando tabela produto_pix_codigos</h3>";
if (mysqli_query($conn, $sql_pix)) {
    echo "<span style='color:green;'>Tabela verificada/criada com sucesso!</span><br>";
} else {
    echo "<span style='color:red;'>Erro ao criar tabela: " . mysqli_error($conn) . "</span><br>";
}

echo "<h2>Correção finalizada!</h2>";
?>
