<?php
$dir = __DIR__ . '/@SERVIDOR';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

foreach ($iterator as $file) {
    if ($file->isFile() && in_array($file->getExtension(), ['php'])) {
        $path = $file->getPathname();
        $content = file_get_contents($path);
        
        $changed = false;
        if (strpos($content, 'THE-FAKE') !== false) {
            $content = str_replace('THE-FAKE', 'SKIP-DSN', $content);
            $changed = true;
        }
        if (strpos($content, 'the-fake') !== false) {
            $content = str_replace('the-fake', 'SKIP-DSN', $content);
            $changed = true;
        }
        
        if ($changed) {
            file_put_contents($path, $content);
            echo "Modificado: " . basename($path) . "\n";
        }
    }
}

// Também no painel original e arquivos root se houver
$rootFiles = glob(__DIR__ . "/*.php");
foreach ($rootFiles as $path) {
    $content = file_get_contents($path);
    $changed = false;
    if (strpos($content, 'THE-FAKE') !== false) {
        $content = str_replace('THE-FAKE', 'SKIP-DSN', $content);
        $changed = true;
    }
    if (strpos($content, 'the-fake') !== false) {
        $content = str_replace('the-fake', 'SKIP-DSN', $content);
        $changed = true;
    }
    if ($changed) {
        file_put_contents($path, $content);
        echo "Modificado (raiz): " . basename($path) . "\n";
    }
}
echo "Concluído!";
?>
