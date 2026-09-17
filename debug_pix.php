<?php
require 'api/db.php';
$res = mysqli_query($conn, "INSERT INTO pixgerado (ip, useragent, valor, produto, hora, time, variacoes, pix_code, pix_qr_base64) VALUES ('127.0.0.1', 'test', '10.00', '1', '12:00:00', 123456, 'test', 'pixcode', 'qr')");
if (!$res) echo "Error: " . mysqli_error($conn);
else echo "Success";
?>
