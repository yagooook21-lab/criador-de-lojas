<?php
require_once('api/db.php');
$q = mysqli_query($conn, "SELECT * FROM online");
$rows = [];
while($r = mysqli_fetch_assoc($q)) {
    $rows[] = $r;
}
echo json_encode($rows, JSON_PRETTY_PRINT);
