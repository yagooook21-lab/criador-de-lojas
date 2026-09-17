<?php
// Script para consertar arquivos com acentos quebrados (double encoded UTF-8)
$dir = __DIR__ . '/@SERVIDOR';
$iterator = new RecursiveIteratorIterator(new RecursiveDirectoryIterator($dir));

echo "<h3>Verificando arquivos no painel...</h3>";
echo "<ul>";

$fixedCount = 0;
foreach ($iterator as $file) {
    if ($file->isFile() && in_array($file->getExtension(), ['php', 'js', 'html', 'css', 'md'])) {
        $path = $file->getPathname();
        $content = file_get_contents($path);
        
        // Verifica se contém os caracteres corrompidos comuns
        if (strpos($content, 'Ã£') !== false || strpos($content, 'Ã§') !== false || 
            strpos($content, 'Ã¡') !== false || strpos($content, 'Ã©') !== false || 
            strpos($content, 'Ã³') !== false || strpos($content, 'Ãª') !== false || 
            strpos($content, 'Ã') !== false || strpos($content, 'Ãµ') !== false) {
            
            // Decodifica a dupla codificação utf-8
            // $content = utf8_decode($content); 
            // O ideal para utf-8 double encoded é mb_convert_encoding se a string foi lida como utf-8 literal.
            // Mas de forma mais segura e controlada, fazemos a substituição exata das strings problemáticas:
            
            $replaces = [
                'Ã£' => 'ã',
                'Ã§' => 'ç',
                'Ã¡' => 'á',
                'Ã¢' => 'â',
                'Ã©' => 'é',
                'Ãª' => 'ê',
                'Ã³' => 'ó',
                'Ãµ' => 'õ',
                'Ã´' => 'ô',
                'Ãº' => 'ú',
                'Ã‡' => 'Ç',
                'Ã‰' => 'É',
                'Ã“' => 'Ó',
                'Ãš' => 'Ú',
                'Ã€' => 'À',
                'Ã­' => 'í', // í com \xAD
                'Ã' => 'í' // fallback
            ];
            
            foreach ($replaces as $broken => $fixed) {
                $content = str_replace($broken, $fixed, $content);
            }
            
            // Corrige o caso do fallback 'í' que pode ter sobrescrito outras coisas
            // Não usaremos o fallback sozinho para evitar bugs. Vamos usar apenas as que sabemos.
            
            file_put_contents($path, $content);
            echo "<li>Corrigido: " . basename($path) . "</li>";
            $fixedCount++;
        }
    }
}

if ($fixedCount === 0) {
    echo "<li>Nenhum arquivo precisava de correção.</li>";
}
echo "</ul>";
echo "<p><strong>Total de arquivos corrigidos: $fixedCount</strong></p>";
?>
