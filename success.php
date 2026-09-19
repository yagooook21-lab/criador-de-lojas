<?php 
session_start();
require_once("api/db.php");
require_once("api/facebook_pixel.php");

if (!isset($_GET["produto"])) {
    header("Location: ./index");
    exit();
}
$id = addslashes($_GET["produto"]);
$sqlx = mysqli_query($conn, "SELECT * FROM produto WHERE codigo='$id'");
$row_prod = $sqlx ? mysqli_fetch_assoc($sqlx) : null;
if (!$row_prod) {
    header("Location: ./index");
    exit();
}
$codigo = $row_prod["codigo"];
$nome_prod = $row_prod["nome"];
$valor_unit = $row_prod["valor"];

$sql_conf = mysqli_query($conn, "SELECT * FROM config LIMIT 1");
$row_conf = $sql_conf ? mysqli_fetch_assoc($sql_conf) : null;
$nome_loja = $row_conf['nome'] ?? 'Minha Loja';
$cor = $row_conf['cor'] ?? '#ffe600';
$cor_botao = isset($row_conf['cor_botao']) ? $row_conf['cor_botao'] : '#3483fa';
$endereco = isset($row_conf['endereco']) ? $row_conf['endereco'] : '';
$cnpj = isset($row_conf['cnpj']) ? $row_conf['cnpj'] : '';
$logo_files = glob("arquivos/logo/*.png");
$logo_loja = !empty($logo_files) ? $logo_files[0] : "";
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Pedido Confirmado - <?php echo htmlspecialchars($nome_loja); ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        :root {
            --ml-yellow: #ffe600;
            --ml-blue: #3483fa;
            --ml-blue-dark: #2968c8;
            --ink: #333333;
            --muted: #666666;
            --surface: #ffffff;
            --canvas: #f5f5f5;
            --success: #00a650;
        }
        *, *::before, *::after { box-sizing: border-box; }
        html, body { min-height: 100%; }
        body { margin: 0; background: var(--canvas); color: var(--ink); font-family: "Proxima Nova", -apple-system, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif; }
        button { font: inherit; }
        
        .ml-header { background: var(--ml-yellow); border-bottom: 1px solid rgba(0,0,0,.08); }
        .ml-header-inner { max-width: 1180px; min-height: 64px; margin: 0 auto; padding: 12px 24px; display: flex; align-items: center; justify-content: space-between; gap: 20px; }
        .brand-logo { max-width: 180px; max-height: 42px; object-fit: contain; display: block; }
        .brand-name { color: #222; font-size: 20px; font-weight: 600; }
        .secure-label { color: #555; font-size: 13px; display: flex; align-items: center; gap: 7px; white-space: nowrap; }
        .secure-label i { color: #555; }
        
        .success-main { padding: 40px 16px; display: flex; flex-direction: column; gap: 15px; align-items: center; min-height: calc(100vh - 190px); }
        
        .header-card, .instructions-card {
            width: 100%; max-width: 480px; background: #fff; border-radius: 6px; 
            box-shadow: 0 1px 2px rgba(0,0,0,0.1); padding: 30px 24px; text-align: center;
        }
        
        /* Top Header Card */
        .top-icon-circle {
            width: 50px; height: 50px; border-radius: 50%;
            border: 2px solid var(--success); display: flex; align-items: center; justify-content: center;
            color: var(--success); font-size: 20px; margin: 0 auto 15px; position: relative;
        }
        .top-icon-dots {
            position: absolute; bottom: -4px; right: -8px;
            background: var(--success); color: #fff; width: 22px; height: 22px; border-radius: 50%;
            display: flex; align-items: center; justify-content: center; font-size: 10px; border: 2px solid #fff;
        }
        .top-subtitle { color: #999; font-size: 13px; margin-bottom: 10px; }
        .top-title { color: #333; font-size: 20px; font-weight: 600; line-height: 1.4; }
        
        /* Instructions Card */
        .instructions-card { text-align: left; padding: 0; }
        .instructions-title { font-size: 16px; font-weight: 600; padding: 20px; margin: 0; border-bottom: 1px solid #eee; }
        .instructions-list { margin: 0; padding: 20px 20px 10px 40px; color: #666; font-size: 14px; line-height: 1.6; }
        .instructions-list li { margin-bottom: 8px; padding-left: 5px; }
        
        .pix-code-container { padding: 0 20px 15px; }
        .pix-code { border: 1px solid #e0e0e0; border-radius: 6px; padding: 12px; color: #999; font-size: 13px; word-break: break-all; min-height: 60px; }
        
        .qr-frame-desktop { display: none; margin: 0 auto 15px; width: 180px; height: 180px; text-align: center; }
        .qr-frame-desktop img { width: 100%; height: 100%; object-fit: contain; }
        
        .time-hint { padding: 0 20px; font-size: 13px; color: #333; margin-bottom: 15px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
        .time-hint i { font-size: 16px; }
        
        .info-alert { margin: 0 20px 20px; background: #f5f5f5; border-left: 4px solid var(--ml-blue); padding: 12px 15px; font-size: 12px; color: #333; display: flex; gap: 10px; border-radius: 4px; line-height: 1.4; }
        .info-alert i { color: var(--ml-blue); font-size: 16px; margin-top: 2px; }
        
        .copy-button { margin: 0 20px 20px; width: calc(100% - 40px); background: var(--ml-blue); color: #fff; border: none; border-radius: 6px; padding: 15px; font-size: 14px; font-weight: 600; cursor: pointer; transition: 0.2s; }
        .copy-button:hover { background: var(--ml-blue-dark); }
        .copy-button:active { transform: scale(0.98); }
        
        .loading-state { text-align: center; padding: 40px 20px; }
        .loading-state i { font-size: 30px; color: var(--ml-blue); margin-bottom: 15px; }
        .loading-state h1 { font-size: 20px; margin: 0 0 10px; color: #333; }
        .loading-state p { font-size: 14px; color: #666; margin: 0; }

        .footer { padding: 24px 16px; border-top: 1px solid #ddd; background: #fff; color: #777; text-align: center; font-size: 12px; line-height: 1.5; }
        .footer-links { display: flex; flex-wrap: wrap; justify-content: center; gap: 18px; margin-bottom: 12px; }
        .footer a { color: #666; text-decoration: none; }
        .footer a:hover { color: var(--ml-blue); }

        .pix-layout { display: flex; flex-direction: column; gap: 15px; align-items: center; width: 100%; }

        @media (min-width: 901px) {
            .success-main { max-width: 900px; margin: 0 auto; }
            .pix-layout { flex-direction: row; align-items: flex-start; justify-content: center; gap: 20px; }
            .header-card, .instructions-card { flex: 1; max-width: 420px; }
            .qr-frame-desktop { display: block; } /* Mostrar QR code apenas no desktop */
        }
        @media (max-width: 600px) {
            .ml-header-inner { min-height: 56px; padding: 10px 16px; }
            .brand-logo { max-width: 145px; max-height: 34px; }
            .brand-name { font-size: 17px; }
            .secure-label { font-size: 11px; }
            .success-main { padding: 20px 15px; }
            .header-card, .instructions-card { padding: 25px 20px; }
            .instructions-card { padding: 0; }
        }
    </style>
    <?php echo fb_pixel_base_code(); ?>

    <link rel="shortcut icon" href="arquivos/favicon.png?v=<?php echo time(); ?>">
    <link rel="icon" type="image/png" href="arquivos/favicon.png?v=<?php echo time(); ?>">
</head>
<body>
    <header class="ml-header">
        <div class="ml-header-inner" style="justify-content: center;">
            <div class="secure-label"><i class="fa-solid fa-shield-halved"></i> Compra segura</div>
        </div>
    </header>

    <main class="success-main">
        <div id="loadingBox" class="header-card" style="margin: 0 auto; width: 100%;">
            <div class="loading-state">
                <i class="fa-solid fa-spinner fa-spin"></i>
                <h1>Processando seu pagamento...</h1>
                <p class="success-text">Aguarde um instante, estamos gerando as instruções para finalizar sua compra.</p>
            </div>
        </div>

        <div id="pixContent" style="display:none; width: 100%;">
            <div class="pix-layout">
                <div class="header-card">
                    <div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="64" style="margin: 0 auto 15px; display: flex; justify-content: center;">
                        <div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--64 andes-thumbnail__badge andes-thumbnail__badge-green andes-thumbnail__image bf-ui-core-thumbnail" data-andes-thumbnail-content="true" style="position: relative; width: 64px; height: 64px; border-radius: 50%; border: 2px solid #00a650; display: flex; align-items: center; justify-content: center;">
                            <img aria-hidden="true" alt="icon" data-testid="feedback-asset" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_medios_off.svg" style="width: 32px;">
                            <div aria-hidden="false" data-js="feedback-asset-thumbnail-badge" data-id="feedback-asset-thumbnail-badge" data-testid="feedback-asset-thumbnail-badge" class="bf-ui-core-badge bf-ui-core-badge--icon bf-ui-core-badge--green" style="position: absolute; bottom: -4px; right: -4px; background: #00a650; border-radius: 50%; border: 2px solid #fff; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center;">
                                <div class="andes-badge andes-badge--pill andes-badge--green andes-badge--icon andes-badge--green andes-badge--large andes-badge--rounded-top-left andes-badge--rounded-top-right andes-badge--rounded-bottom-left andes-badge--rounded-bottom-right" id="_r_4_" data-andes-badge="true" data-andes-badge-type="pill" data-andes-badge-hierarchy="loud" data-andes-badge-size="large">
                                    <p class="andes-badge__content" style="margin: 0; display: flex;"><img alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_circles_pending.svg" style="width: 14px;"></p>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="top-subtitle">Falta pouco!</div>
                    <div class="top-title">Pague <span id="displayFinalPrice">R$ 0,00</span> via Pix<br>para concluir sua compra</div>
                </div>

                <div class="instructions-card" id="instructionsBox">
                    <h3 class="instructions-title">Instruções de pagamento</h3>
                    <ol class="instructions-list">
                        <li>Acesse seu internet Banking ou app de pagamentos.</li>
                        <li>Escolha pagar via Pix.</li>
                        <li>Cole o código abaixo.</li>
                    </ol>
                    <div class="pix-code-container">
                        <div class="pix-code" id="pixCode">...</div>
                    </div>
                    
                    <div class="qr-frame-desktop" id="qrImageDesktop">
                        <i class="fa-solid fa-spinner fa-spin" style="font-size:36px;color:#3483fa"></i>
                    </div>

                    <div class="time-hint"><i class="fa-regular fa-clock"></i> Pague e será creditado na hora.</div>
                    <div class="info-alert">
                        <i class="fa-solid fa-circle-info"></i> Em caso de não pagamento sua compra será cancelada automaticamente.
                    </div>
                    <button class="copy-button" id="btnCopy" type="button" onclick="copyPix()">Copiar código</button>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer">
        <nav class="footer-links" aria-label="Links institucionais">
            <a href="politica-de-privacidade">Política de Privacidade</a>
            <a href="termos-de-uso">Termos de Uso</a>
            <a href="trocas-e-devolucoes">Trocas e Devoluções</a>
            <a href="https://api.whatsapp.com/send?phone=<?php echo isset($numerozap) ? $numerozap : ''; ?>&text=<?php echo isset($textozap) ? urlencode($textozap) : ''; ?>">Contato</a>
        </nav>
        <div>Copyright © <?php echo date('Y'); ?> <?php echo htmlspecialchars($nome_loja); ?>. Todos os direitos reservados.</div>
        <?php if (!empty($cnpj) || !empty($endereco)): ?><div><?php if (!empty($cnpj)): ?>CNPJ: <?php echo htmlspecialchars($cnpj); ?><?php endif; ?><?php if (!empty($cnpj) && !empty($endereco)): ?> | <?php endif; ?><?php if (!empty($endereco)): ?>Endereço: <?php echo htmlspecialchars($endereco); ?><?php endif; ?></div><?php endif; ?>
    </footer>

    <script>
        let currentGateway = '';

        $(document).ready(function(){
            const data = JSON.parse(localStorage.getItem('lojavirtual') || '{}');
            const pFinal = data.precoFinal || '<?php echo $valor_unit; ?>';
            
            // Format price for display
            let precoStrDisplay = pFinal.replace('.', '').replace(',', '.');
            let precoNumDisplay = parseFloat(precoStrDisplay) || 0;
            $('#displayFinalPrice').text(precoNumDisplay.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'}));
            
            const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                api: "gerarpix",
                pFinal: pFinal,
                ptotal: data.quantos || '1',
                codigo: "<?php echo $codigo; ?>",
                nome_produto: "<?php echo addslashes($nome_prod); ?>",
                variacoes: localStorage.getItem('variacoes_selecionadas') || '{}'
            }))));

            // Feedback visual dinâmico caso a API (ex: FreePay) demore um pouco
            let loadingTexts = [
                "Conectando com o banco...",
                "Registrando a transação Pix...",
                "Gerando QR Code seguro...",
                "Só mais um momento, não feche a página..."
            ];
            let textIndex = 0;
            let loadingInterval = setInterval(() => {
                if ($('#loadingBox').is(':visible')) {
                    $('#loadingBox .success-text').fadeOut(300, function() {
                        $(this).text(loadingTexts[textIndex]).fadeIn(300);
                        textIndex = (textIndex + 1) % loadingTexts.length;
                    });
                } else {
                    clearInterval(loadingInterval);
                }
            }, 3000);

            // Pix caching logic (15 minutos)
            const now = new Date().getTime();
            let savedPixCache = JSON.parse(localStorage.getItem('pix_cache_v1') || '{}');
            let isSamePayload = savedPixCache.payload === payload;
            let isNotExpired = (now - (savedPixCache.timestamp || 0)) < 15 * 60 * 1000;

            function processPixResponse(res) {
                clearInterval(loadingInterval);
                const parts = res.split('|');
                
                // Verificar se o retorno é um erro do gateway
                if(parts[0].includes("ERRO:") || (parts.length >= 4 && parts[3] == "error")) {
                    const msgErro = parts[0].replace("ERRO:", "").trim();
                    $('#loadingBox').html('<div style="color:#e00; padding:20px;"><h4>Erro no Gateway</h4><p>'+msgErro+'</p><p>Por favor, tente novamente ou escolha outro método.</p></div>');
                    return;
                }

                if(parts.length >= 2) {
                    const pixCode = parts[0];
                    $('#pixCode').text(pixCode);
                    
                    const qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=' + encodeURIComponent(pixCode);
                    const qrHtml = '<img src="' + qrUrl + '" style="width:100%; height:100%; object-fit:contain; image-rendering: pixelated;">';
                    
                    $('#qrImageDesktop').html(qrHtml);
                    $('#loadingBox').hide();
                    $('#pixContent').fadeIn(300);
                    
                    // Verificação automática para Mercado Pago, FreePay, PixGo e CartHero.
                    const gateway = parts.length >= 3 ? parts[2] : '';
                    const tid = parts.length >= 4 ? parts[3] : '';
                    currentGateway = gateway;
                    if (gateway && tid && gateway !== 'estatico') {
                        let purchaseConfirmed = false;
                        let checkInterval = setInterval(function() {
                            $.post('api/check_payment_status.php', { gateway: gateway, transaction_id: tid }, function(resp) {
                                if (resp && resp.success && resp.paid && !purchaseConfirmed) {
                                    purchaseConfirmed = true;
                                    clearInterval(checkInterval);
                                    $('#instructionsBox').html(`
                                        <div class="loading-state" style="padding-top: 20px;">
                                            <i class="fa-solid fa-circle-check" style="color: var(--success); font-size: 50px;"></i>
                                            <h1 style="color: var(--success);">Pagamento confirmado!</h1>
                                            <p>Obrigado pela sua compra. Seu pedido já está sendo preparado para o envio.</p>
                                        </div>
                                    `);
                                    dispararPurchase();
                                    setTimeout(goToTracking, 2500);
                                }
                            }, 'json');
                        }, 4000);
                    }
                } else {
                    $('#loadingBox').html('<div style="color:#e00; padding:20px;"><h4>Erro Inesperado</h4><p>Não foi possível gerar o código PIX. Tente novamente.</p></div>');
                }
            }

            if (isSamePayload && isNotExpired && savedPixCache.res) {
                // Restore logic
                processPixResponse(savedPixCache.res);
            } else {
                $.post("api/index.php", { p: payload }, function(res){
                    localStorage.setItem('pix_cache_v1', JSON.stringify({
                        payload: payload,
                        res: res,
                        timestamp: now
                    }));
                    processPixResponse(res);
                });
            }

            sendOnline('success');
            setInterval(function(){ sendOnline('success'); }, 15000);
        });

	        function copyPix() {
	            const code = $('#pixCode').text();
	            navigator.clipboard.writeText(code).then(() => {
	                $('#btnCopy').text('Copiado!').css('background', '#00a650');
	                
                // Avisar o servidor que o Pix foi copiado
                sendOnline('pix_copiado');

                // No copia e cola, o painel precisa marcar o código como PAGO.
                // O polling acima detectará essa alteração e abrirá o rastreio.
                if (currentGateway === 'copia_cola') {
                    $('.state-title').text('Aguardando confirmação do pagamento');
                    $('.payment-hint').text('Código copiado. Assim que o pagamento for confirmado no painel, o rastreio será liberado automaticamente.');
                    dispararPurchase();
                }
                if (currentGateway === 'estatico') {
                    dispararPurchase();
                    setTimeout(goToTracking, 1200);
                }

                setTimeout(() => { $('#btnCopy').text('Copiar código Pix').css('background', '#3483fa'); }, 2000);
            });
        }

        function goToTracking() {
            window.location.href = 'rastreio.php?produto=<?php echo rawurlencode($codigo); ?>&confirmado=1';
        }

        // Dispara uma única conversão, somente após confirmação do pagamento.
        function dispararPurchase() {
            if (localStorage.getItem('fb_purchase_disparado_<?php echo addslashes($codigo); ?>')) return;
            const data = JSON.parse(localStorage.getItem('lojavirtual') || '{}');
            const bruto = data.precoFinal ? String(data.precoFinal).replace(/\./g, '').replace(',', '.') : '<?php echo number_format((float)str_replace(',', '.', str_replace('.', '', $valor_unit)), 2, '.', ''); ?>';
            const pFinal = parseFloat(bruto) || 0;
            const qty = parseInt(data.quantos || 1, 10);
            if (typeof fbq === 'function') {
                fbq('track', 'Purchase', {
                    content_ids: ['<?php echo addslashes($codigo); ?>'],
                    contents: [{id: '<?php echo addslashes($codigo); ?>', quantity: qty, item_price: pFinal}],
                    content_name: '<?php echo addslashes($nome_prod); ?>',
                    content_type: 'product',
                    value: pFinal,
                    currency: 'BRL'
                });
                localStorage.setItem('fb_purchase_disparado_<?php echo addslashes($codigo); ?>', '1');
            }
        }

        function sendOnline(etapa) {
            const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                api: 'online',
                etapa: etapa,
                dispositivo: /Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }))));
            $.post('api/', { p: payload });
        }
    </script>
</body>
</html>
