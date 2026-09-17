<?php
require_once('api/db.php');
mysqli_query($conn, 'TRUNCATE TABLE online');
echo 'online truncated';
