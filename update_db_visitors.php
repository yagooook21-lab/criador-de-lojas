<?php
require_once("api/db.php");

$query = "
CREATE TABLE IF NOT EXISTS `live_visitors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `session_id` varchar(100) DEFAULT NULL,
  `ip_address` varchar(100) DEFAULT NULL,
  `device` varchar(50) DEFAULT NULL,
  `current_page` varchar(100) DEFAULT NULL,
  `action` varchar(100) DEFAULT NULL,
  `product_name` varchar(200) DEFAULT NULL,
  `last_seen` datetime DEFAULT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `session_id` (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
";

if (mysqli_query($conn, $query)) {
    echo "Tabela live_visitors criada com sucesso.\n";
} else {
    echo "Erro ao criar tabela: " . mysqli_error($conn) . "\n";
}
?>
