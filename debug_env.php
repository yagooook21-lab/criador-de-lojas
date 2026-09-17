<?php
echo "<h1>Diagnosticando Variaveis do Railway</h1>";
echo "<h3>As variaveis de ambiente detectadas sao:</h3>";
echo "<pre>";
$keys = ['MYSQLHOST', 'MYSQLUSER', 'MYSQLPASSWORD', 'MYSQLDATABASE', 'MYSQLPORT', 'MYSQL_URL', 'DATABASE_URL', 'URL_MYSQL'];
$found = false;
foreach ($keys as $key) {
    $val = getenv($key) !== false ? getenv($key) : (isset($_ENV[$key]) ? $_ENV[$key] : 'NÃO DEFINIDA');
    if ($val !== 'NÃO DEFINIDA') $found = true;
    echo "<b>$key</b>: " . ($key === 'MYSQLPASSWORD' && $val !== 'NÃO DEFINIDA' ? '******' : $val) . "<br>";
}
echo "</pre>";

if (!$found) {
    echo "<h3 style='color:red;'>NENHUMA variavel do MySQL foi encontrada! Isso significa que voce nao vinculou as variaveis ao servico da sua Loja (GitHub) no painel do Railway.</h3>";
} else {
    echo "<h3 style='color:green;'>As variaveis estao aqui! O problema e outro.</h3>";
}
?>
