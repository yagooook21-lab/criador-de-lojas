<?php
echo "<h1>Diagnosticando Variaveis do Railway (V2)</h1>";
echo "<pre>";

// Pega todas as variaveis de ambiente
$todas_variaveis = getenv();
if (empty($todas_variaveis)) {
    $todas_variaveis = $_ENV;
}

echo "<h3>Variaveis reais encontradas no servidor:</h3>";
$found_any = false;
foreach ($todas_variaveis as $key => $val) {
    if (strpos(strtoupper($key), 'MYSQL') !== false || strpos(strtoupper($key), 'DB') !== false || strpos(strtoupper($key), 'URL') !== false) {
        $display_val = (strpos(strtoupper($key), 'PASSWORD') !== false || strpos(strtoupper($key), 'SENHA') !== false) ? '******' : $val;
        echo "<b>$key</b>: $display_val<br>";
        $found_any = true;
    }
}

if (!$found_any) {
    echo "<span style='color:red;'>Nenhuma variavel relacionada a banco de dados encontrada.</span>";
}
echo "</pre>";
?>
