<?php
/**
 * Script de Diagnóstico - FreePay Brasil
 * 
 * Use este arquivo para debugar problemas na integração FreePay.
 * Acesse: https://seudominio.com/api/debug_freepay.php
 * 
 * IMPORTANTE: Remova este arquivo após o diagnóstico por questões de segurança!
 */

session_start();
require_once("db.php");

// Permitir apenas acesso local ou com token
$token_esperado = md5('freepay_debug_' . date('Y-m-d'));
$token_recebido = isset($_GET['token']) ? $_GET['token'] : '';

// Comentar a linha abaixo para permitir acesso sem autenticação (apenas para testes!)
// if ($token_recebido !== $token_esperado && $_SERVER['REMOTE_ADDR'] !== '127.0.0.1') {
//     die("Acesso negado. Token inválido.");
// }

echo "<pre style='font-family: monospace; background: #f5f5f5; padding: 20px; border-radius: 5px;'>";
echo "=== DIAGNÓSTICO FREEPAY BRASIL ===\n\n";

// -------------------------------------------------------
// 1. Verificar se as colunas existem no banco
// -------------------------------------------------------
echo "1. COLUNAS NO BANCO DE DADOS\n";
echo str_repeat("-", 50) . "\n";

$check_pix = mysqli_query($conn, "SHOW COLUMNS FROM pix");
$cols_pix = [];
while($check_pix && $row = mysqli_fetch_assoc($check_pix)) {
    $cols_pix[] = $row['Field'];
}

$required_pix = ['freepay_public_key', 'freepay_secret_key', 'use_freepay'];
foreach ($required_pix as $col) {
    $status = in_array($col, $cols_pix) ? "✓ OK" : "✗ FALTA";
    echo "   Tabela 'pix' → $col: $status\n";
}

$check_pixgerado = mysqli_query($conn, "SHOW COLUMNS FROM pixgerado");
$cols_pixgerado = [];
while($check_pixgerado && $row = mysqli_fetch_assoc($check_pixgerado)) {
    $cols_pixgerado[] = $row['Field'];
}

$required_pixgerado = ['freepay_transaction_id', 'freepay_status'];
foreach ($required_pixgerado as $col) {
    $status = in_array($col, $cols_pixgerado) ? "✓ OK" : "✗ FALTA";
    echo "   Tabela 'pixgerado' → $col: $status\n";
}

// -------------------------------------------------------
// 2. Verificar configurações salvas no banco
// -------------------------------------------------------
echo "\n2. CONFIGURAÇÕES SALVAS NO BANCO\n";
echo str_repeat("-", 50) . "\n";

$config = mysqli_query($conn, "SELECT * FROM pix WHERE id='1'");
$cfg = ($config) ? mysqli_fetch_assoc($config) : null;

if ($cfg) {
    $use_fp = (int)($cfg['use_freepay'] ?? 0);
    $pub_key = trim($cfg['freepay_public_key'] ?? '');
    $sec_key = trim($cfg['freepay_secret_key'] ?? '');

    echo "   use_freepay: " . ($use_fp === 1 ? "✓ ATIVO (1)" : "✗ INATIVO (0)") . "\n";
    echo "   freepay_public_key: " . (strlen($pub_key) > 0 ? "✓ PREENCHIDA (" . strlen($pub_key) . " chars)" : "✗ VAZIA") . "\n";
    echo "   freepay_secret_key: " . (strlen($sec_key) > 0 ? "✓ PREENCHIDA (" . strlen($sec_key) . " chars)" : "✗ VAZIA") . "\n";

    if ($use_fp === 1 && strlen($pub_key) > 0 && strlen($sec_key) > 0) {
        echo "\n   ✓ CONFIGURAÇÃO VÁLIDA - Pronto para usar FreePay\n";
    } else {
        echo "\n   ✗ CONFIGURAÇÃO INCOMPLETA - Verifique as chaves\n";
    }
} else {
    echo "   ✗ Nenhum registro encontrado na tabela 'pix' com id=1\n";
}

// -------------------------------------------------------
// 3. Verificar se o arquivo freepay.php existe
// -------------------------------------------------------
echo "\n3. ARQUIVOS NECESSÁRIOS\n";
echo str_repeat("-", 50) . "\n";

$files_to_check = [
    'freepay.php' => __DIR__ . '/freepay.php',
    'webhook_freepay.php' => __DIR__ . '/webhook_freepay.php',
    'check_payment.php' => __DIR__ . '/check_payment.php',
];

foreach ($files_to_check as $name => $path) {
    $status = file_exists($path) ? "✓ EXISTE" : "✗ FALTA";
    echo "   $name: $status\n";
}

// -------------------------------------------------------
// 4. Testar conexão com a API FreePay
// -------------------------------------------------------
echo "\n4. TESTE DE CONEXÃO COM FREEPAY\n";
echo str_repeat("-", 50) . "\n";

if ($use_fp === 1 && strlen($pub_key) > 0 && strlen($sec_key) > 0) {
    $auth = base64_encode($pub_key . ':' . $sec_key);

    echo "   Testando autenticação...\n";
    echo "   URL: https://api.freepaybrasil.com/v1/payment-transaction/info/test\n";
    echo "   Auth: Basic " . substr($auth, 0, 20) . "...\n\n";

    $ch = curl_init('https://api.freepaybrasil.com/v1/payment-transaction/info/test');
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPGET        => true,
        CURLOPT_HTTPHEADER     => [
            'Accept: application/json',
            'Authorization: Basic ' . $auth
        ],
        CURLOPT_TIMEOUT        => 10,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response  = curl_exec($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curl_err  = curl_error($ch);
    curl_close($ch);

    echo "   HTTP Status: $http_code\n";

    if ($curl_err) {
        echo "   ✗ Erro cURL: $curl_err\n";
    } else {
        if ($http_code === 404 || $http_code === 401) {
            echo "   ✓ Conexão OK (HTTP $http_code é esperado para ID inválido)\n";
        } elseif ($http_code === 200) {
            echo "   ✓ Conexão OK (HTTP 200)\n";
        } else {
            echo "   ⚠ Status inesperado: $http_code\n";
            echo "   Resposta: " . substr($response, 0, 200) . "...\n";
        }
    }
} else {
    echo "   ⚠ Configuração incompleta - Não é possível testar conexão\n";
}

// -------------------------------------------------------
// 5. Verificar logs de erro
// -------------------------------------------------------
echo "\n5. ÚLTIMOS ERROS NO LOG\n";
echo str_repeat("-", 50) . "\n";

$log_file = '/var/log/php_errors.log'; // Ajuste conforme seu servidor
if (file_exists($log_file)) {
    $lines = array_slice(file($log_file), -10);
    foreach ($lines as $line) {
        if (strpos($line, 'freepay') !== false || strpos($line, 'FreePay') !== false) {
            echo "   " . trim($line) . "\n";
        }
    }
    echo "\n   (Mostrando apenas linhas com 'freepay')\n";
} else {
    echo "   ⚠ Arquivo de log não encontrado em $log_file\n";
}

// -------------------------------------------------------
// 6. Verificar se o case gerarpix está sendo chamado
// -------------------------------------------------------
echo "\n6. FLUXO DE GERAÇÃO DE PIX\n";
echo str_repeat("-", 50) . "\n";

echo "   Quando o cliente clica em 'Continuar' no payment.php:\n";
echo "   1. success.php é carregado\n";
echo "   2. Se use_freepay=1, chama createFreePayPix()\n";
echo "   3. Se sucesso, exibe QR code e transaction_id\n";
echo "   4. Se falha, cai no Pix estático\n\n";

echo "   OU (método alternativo via AJAX):\n";
echo "   1. checkout.php chama api/ com api='gerarpix'\n";
echo "   2. api/index.php case 'gerarpix' verifica use_freepay\n";
echo "   3. Se ativo, chama createFreePayPix()\n";
echo "   4. Retorna pix_code|imageString|freepay|transaction_id\n";

// -------------------------------------------------------
// 7. Resumo final
// -------------------------------------------------------
echo "\n" . str_repeat("=", 50) . "\n";
echo "RESUMO DO DIAGNÓSTICO\n";
echo str_repeat("=", 50) . "\n\n";

$issues = [];

if (!in_array('freepay_public_key', $cols_pix)) $issues[] = "Coluna 'freepay_public_key' não existe em 'pix'";
if (!in_array('freepay_secret_key', $cols_pix)) $issues[] = "Coluna 'freepay_secret_key' não existe em 'pix'";
if (!in_array('use_freepay', $cols_pix)) $issues[] = "Coluna 'use_freepay' não existe em 'pix'";
if (!in_array('freepay_transaction_id', $cols_pixgerado)) $issues[] = "Coluna 'freepay_transaction_id' não existe em 'pixgerado'";
if (!in_array('freepay_status', $cols_pixgerado)) $issues[] = "Coluna 'freepay_status' não existe em 'pixgerado'";

if ($use_fp !== 1) $issues[] = "Gateway FreePay não está ATIVO (use_freepay != 1)";
if (strlen($pub_key) === 0) $issues[] = "Chave pública (freepay_public_key) está vazia";
if (strlen($sec_key) === 0) $issues[] = "Chave secreta (freepay_secret_key) está vazia";

if (!file_exists(__DIR__ . '/freepay.php')) $issues[] = "Arquivo 'api/freepay.php' não encontrado";
if (!file_exists(__DIR__ . '/webhook_freepay.php')) $issues[] = "Arquivo 'api/webhook_freepay.php' não encontrado";

if (empty($issues)) {
    echo "✓ TUDO OK! A integração FreePay deve estar funcionando.\n\n";
    echo "Se ainda assim o Pix estático está sendo gerado:\n";
    echo "1. Verifique os logs do servidor (error_log)\n";
    echo "2. Teste a conexão com a API FreePay manualmente\n";
    echo "3. Valide as chaves Public/Secret no painel da FreePay\n";
} else {
    echo "✗ PROBLEMAS ENCONTRADOS:\n\n";
    foreach ($issues as $i => $issue) {
        echo "   " . ($i + 1) . ". $issue\n";
    }
    echo "\n";
}

echo "\n" . str_repeat("=", 50) . "\n";
echo "Token para próximo acesso: $token_esperado\n";
echo "URL: ?token=$token_esperado\n";
echo "=== FIM DO DIAGNÓSTICO ===\n";

echo "</pre>";
?>
