<?php
/**
 * Script de Teste Independente - CartHero
 * Acesse este arquivo diretamente pelo navegador para testar a conexão
 */

require_once("api/db.php");
require_once("api/carthero.php");

echo "<h1>Teste de Conexão CartHero</h1>";

// 1. Verificar chaves no banco
$sql = mysqli_query($conn, "SELECT * FROM pix WHERE id='1'");
$config = mysqli_fetch_assoc($sql);

if (!$config) {
    die("<p style='color:red'>Erro: Configurações de PIX não encontradas no banco de dados.</p>");
}

echo "<h3>Configurações encontradas:</h3>";
echo "Use CartHero: " . ($config['use_carthero'] ? "SIM" : "NÃO") . "<br>";
echo "Chave Privada: " . (empty($config['carthero_private_key']) ? "VAZIA" : "Preenchida (" . substr($config['carthero_private_key'], 0, 10) . "...)") . "<br>";
echo "Chave Pública: " . (empty($config['carthero_public_key']) ? "VAZIA" : "Preenchida (" . substr($config['carthero_public_key'], 0, 10) . "...)") . "<br>";

// 2. Tentar criar um pagamento de teste (R$ 1,00)
echo "<h3>Tentando gerar pagamento de R$ 1,00...</h3>";

$customer = [
    'nome' => 'Joao Silva',
    'email' => 'joao.silva@gmail.com',
    'cpf' => '12345678909',
    'celular' => '11988887777'
];

$product = [
    'nome' => 'Produto de Teste',
    'quantidade' => 1
];

$res = createCartheroPayment(1.00, $customer, $product);

// No teste, vamos forçar a exibição da resposta bruta que o carthero.php salvou no log ou na variável
if ($res['success']) {
    echo "<p style='color:green'><b>SUCESSO!</b> Pagamento gerado.</p>";
    echo "ID da Invoice: " . $res['payment_id'] . "<br>";
    echo "Código Pix: <textarea style='width:100%'>" . $res['pix_code'] . "</textarea><br>";
} else {
    echo "<p style='color:orange'><b>RESPOSTA DA API (Depuração):</b></p>";
    echo "<pre>" . htmlspecialchars($res['error']) . "</pre>";
}

echo "<hr><p>Fim do teste.</p>";
?>
