<?php
require_once('api/db.php');
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS mobile (id INT AUTO_INCREMENT PRIMARY KEY, time INT)");
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS desktop (id INT AUTO_INCREMENT PRIMARY KEY, time INT)");
mysqli_query($conn, "CREATE TABLE IF NOT EXISTS bot (id INT AUTO_INCREMENT PRIMARY KEY, time INT)");
echo 'Tables created!';
