<?php
require_once('api/db.php');
mysqli_query($conn, "DROP TABLE IF EXISTS mobile");
mysqli_query($conn, "DROP TABLE IF EXISTS desktop");
mysqli_query($conn, "DROP TABLE IF EXISTS bot");

mysqli_query($conn, "CREATE TABLE mobile (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(255), useragent TEXT, time INT)");
mysqli_query($conn, "CREATE TABLE desktop (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(255), useragent TEXT, time INT)");
mysqli_query($conn, "CREATE TABLE bot (id INT AUTO_INCREMENT PRIMARY KEY, ip VARCHAR(255), useragent TEXT, time INT)");
echo 'Tables recreated!';
