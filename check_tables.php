<?php
require_once('api/db.php');
$tables = ['mobile', 'desktop', 'bot', 'online'];
foreach($tables as $t) {
    $q = mysqli_query($conn, "SHOW COLUMNS FROM $t");
    if($q) {
        echo "Table $t exists. Columns: ";
        while($r = mysqli_fetch_assoc($q)) {
            echo $r['Field'] . " ";
        }
        echo "\n";
    } else {
        echo "Table $t does NOT exist.\n";
    }
}
