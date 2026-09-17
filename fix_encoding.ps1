$targetDir = "C:\Users\studi\Downloads\loja_ester_v7_atualizada\ester_loja\@SERVIDOR"
$files = Get-ChildItem -Path $targetDir -Recurse -File -Include *.php,*.js,*.css,*.html,*.md

$replacements = @{
    "Ã£" = "ã"
    "Ã§" = "ç"
    "Ã¡" = "á"
    "Ã¢" = "â"
    "Ã©" = "é"
    "Ãª" = "ê"
    "Ã³" = "ó"
    "Ãµ" = "õ"
    "Ã´" = "ô"
    "Ãº" = "ú"
    "Ã‡" = "Ç"
    "Ã‰" = "É"
    "Ã“" = "Ó"
    "Ãš" = "Ú"
    "Ã€" = "À"
    "Ã­" = "í"
    "Ã" = "í" # Fallback para o í corrompido sem o caractere invisível, pode ser perigoso mas as outras já rodaram
}

foreach ($file in $files) {
    # Read as UTF8 string
    $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
    
    $changed = $false
    foreach ($key in $replacements.Keys) {
        if ($content.Contains($key)) {
            $content = $content.Replace($key, $replacements[$key])
            $changed = $true
        }
    }
    
    if ($changed) {
        $utf8NoBom = New-Object System.Text.UTF8Encoding($False)
        [System.IO.File]::WriteAllText($file.FullName, $content, $utf8NoBom)
        Write-Host "Fixed encoding in: $($file.Name)"
    }
}
Write-Host "Done!"
