<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

$payload = base64_encode(json_encode([
    'api' => 'gerarpix',
    'pFinal' => '10.00',
    'ptotal' => '1',
    'codigo' => '1',
    'nome_produto' => 'Teste',
    'variacoes' => '{}'
]));

$url = "https://lightcyan-oyster-388944.hostingersite.com/api/index.php";

$ch = curl_init($url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['p' => $payload]);
// Follow redirects just in case
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
// Ignore SSL errors
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);

$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "HTTP Code: " . $httpcode . "<br><br>";
echo "Response:<br>";
echo htmlentities($response);
?>
