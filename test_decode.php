<?php
$str = "ConfiguraÃ§Ã£o do Pix da Loja";
$decoded = utf8_decode($str);
echo "utf8_decode: " . $decoded . "\n";

$mb = mb_convert_encoding($str, 'latin1', 'utf-8');
echo "mb: " . $mb . "\n";
?>
