<?php
$source = file_get_contents('c:/Users/studi/Downloads/RIFAS ATUL/mandir/painel criador de lojas/lojinha01/@SERVIDOR/api_adm/index.php');
$target = file_get_contents('c:/Users/studi/Downloads/RIFAS ATUL/mandir/painel criador de lojas/@SERVIDOR/api_adm/index.php');

// Extract trocapix from source
preg_match('/case "trocapix":.*?break;/s', $source, $trocapix_match);
$trocapix = $trocapix_match[0];

// Extract PIX handlers from source
preg_match('/(?s)\/\/ ===== TABELAS PIX COPIA E COLA =====.*?\/\/ ===== FIM TABELAS PIX =====/', $source, $handlers_match);
$handlers = $handlers_match[0];

// Replace trocapix in target
$target = preg_replace('/case "trocapix":.*?break;/s', $trocapix, $target, 1);

// Remove old cases
$target = preg_replace('/case "criar_tabela_pix":.*?break;/s', '', $target, 1);
$target = preg_replace('/case "deletar_tabela_pix":.*?break;/s', '', $target, 1);
$target = preg_replace('/case "ativar_tabela_pix":.*?break;/s', '', $target, 1);
$target = preg_replace('/case "salvar_codigos_pix":.*?break;/s', '', $target, 1);

// Inject handlers before lista_webhook
$target = str_replace('case "lista_webhook":', $handlers . "\n\n\tcase \"lista_webhook\":", $target);

file_put_contents('c:/Users/studi/Downloads/RIFAS ATUL/mandir/painel criador de lojas/@SERVIDOR/api_adm/index.php', $target);
echo "API updated successfully.";
