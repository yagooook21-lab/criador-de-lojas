<?php
require_once("api/db.php");

echo "--- TESTE DE EXPIRAÇÃO PIX ---\n";

// 1. Limpar dados de teste anteriores
mysqli_query($conn, "DELETE FROM produto_pix_codigos WHERE produto_codigo='TESTE123'");

// 2. Inserir um código de teste
mysqli_query($conn, "INSERT INTO produto_pix_codigos (produto_codigo, pix_codigo, status) VALUES ('TESTE123', 'PIX_TESTE_EXPIRA', 'disponivel')");
echo "Código de teste inserido.\n";

// 3. Simular reserva feita há 11 minutos
$data_antiga = date('Y-m-d H:i:s', strtotime('-11 minutes'));
mysqli_query($conn, "UPDATE produto_pix_codigos SET status='reservado', cliente_ip='1.2.3.4', data_uso='$data_antiga' WHERE produto_codigo='TESTE123'");
echo "Simulando reserva feita há 11 minutos...\n";

// 4. Executar a lógica de limpeza que está no success.php
$sql_limpeza = "UPDATE produto_pix_codigos SET status='disponivel', cliente_ip=NULL, data_uso=NULL WHERE status='reservado' AND TIMESTAMPDIFF(SECOND, data_uso, NOW()) >= 600";
mysqli_query($conn, $sql_limpeza);
echo "Executando limpeza (TIMESTAMPDIFF >= 600s)...\n";

// 5. Verificar se voltou a ficar disponível
$check = mysqli_query($conn, "SELECT status FROM produto_pix_codigos WHERE produto_codigo='TESTE123'");
$row = mysqli_fetch_assoc($check);

if ($row['status'] == 'disponivel') {
    echo "SUCESSO: O código voltou a ficar disponível!\n";
} else {
    echo "FALHA: O código ainda está como " . $row['status'] . "\n";
}

// 6. Testar reserva de 5 minutos (não deve expirar)
$data_recente = date('Y-m-d H:i:s', strtotime('-5 minutes'));
mysqli_query($conn, "UPDATE produto_pix_codigos SET status='reservado', cliente_ip='1.2.3.4', data_uso='$data_recente' WHERE produto_codigo='TESTE123'");
mysqli_query($conn, $sql_limpeza);
$check = mysqli_query($conn, "SELECT status FROM produto_pix_codigos WHERE produto_codigo='TESTE123'");
$row = mysqli_fetch_assoc($check);

if ($row['status'] == 'reservado') {
    echo "SUCESSO: Reserva de 5 minutos mantida corretamente.\n";
} else {
    echo "FALHA: Reserva de 5 minutos foi limpa indevidamente.\n";
}
?>
