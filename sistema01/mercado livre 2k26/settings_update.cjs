const fs = require('fs');
const path = './src/pages/AdminSettings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Replace tab labels
content = content.replace('{ id: "shipping", label: "Envio", icon: Truck },', '{ id: "shipping", label: t("settings.shipping_form") || "Envio", icon: Truck },');
// Wait, I didn't add settings.shipping_form yet. Let's use existing or new ones.

// Mapping of hardcoded strings to their t() equivalents
const replacements = [
  // Tabs
  ['label: "Envio"', 'label: t("settings.shipping")'],
  ['label: "Cupons"', 'label: t("nav.coupons")'],
  ['label: "Rastreamento"', 'label: t("nav.routes")'],
  ['label: "Máscara"', 'label: t("settings.mascara_title")'],
  ['label: "Comunicação"', 'label: t("settings.communications")'],
  
  // Language Tab
  ['<label className="text-sm font-medium text-foreground">País da loja</label>', '<label className="text-sm font-medium text-foreground">{t("settings.country_label")}</label>'],
  ['<p className="text-xs text-muted-foreground mb-3">Selecione o país para definir o idioma e a moeda.</p>', '<p className="text-xs text-muted-foreground mb-3">{t("settings.country_desc")}</p>'],
  ['<label className="text-sm font-medium text-foreground">Moeda da loja</label>', '<label className="text-sm font-medium text-foreground">{t("settings.currency_label")}</label>'],
  ['<p className="text-xs text-muted-foreground mb-3">Escolha entre a moeda local ou dólar americano.</p>', '<p className="text-xs text-muted-foreground mb-3">{t("settings.currency_desc")}</p>'],
  ['<span>Dólar americano (USD)</span>', '<span>{t("settings.usd")}</span>'],

  // Payment Tab
  ['<h3 className="text-sm font-semibold text-foreground mb-3">Método PIX</h3>', '<h3 className="text-sm font-semibold text-foreground mb-3">{t("settings.pix_method")}</h3>'],
  ['<h3 className="text-sm font-semibold text-foreground">Configurar Gateway PIX</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.pix_gateway_title")}</h3>'],
  ['<label className="text-xs text-muted-foreground">Gateway de Pagamento</label>', '<label className="text-xs text-muted-foreground">{t("settings.pix_gateway_label")}</label>'],
  ['<label className="text-xs text-muted-foreground">Chave API / Privada (X-API-Key)</label>', '<label className="text-xs text-muted-foreground">{t("settings.pix_api_key_black_cat")}</label>'],
  ['<label className="text-xs text-muted-foreground">Chave Pública</label>', '<label className="text-xs text-muted-foreground">{t("settings.pix_public_key_label")}</label>'],
  ['<label className="text-xs text-muted-foreground">Chave de API (Bearer Token)</label>', '<label className="text-xs text-muted-foreground">{t("settings.pix_api_key_streetpay")}</label>'],
  ['<h3 className="text-sm font-semibold text-foreground">Configurar Conta PIX</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.pix_account_title")}</h3>'],
  ['<h3 className="text-sm font-semibold text-foreground">Pagamento com Cartão</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.card_title")}</h3>'],
  ['Aceitar pagamentos com cartão de crédito/débito', '{t("settings.card_desc")}'],
  ['<h4 className="text-sm font-medium text-foreground">Solicitar Chave?</h4>', '<h4 className="text-sm font-medium text-foreground">{t("settings.card_request_key")}</h4>'],
  ['<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Taxas de Juros</h4>', '<h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">{t("settings.card_interest_rates")}</h4>'],
  ['<label className="text-xs text-muted-foreground">Parcelas sem juros</label>', '<label className="text-xs text-muted-foreground">{t("settings.card_free_installments")}</label>'],
  ['<label className="text-xs text-muted-foreground">Taxa mensal (%)</label>', '<label className="text-xs text-muted-foreground">{t("settings.card_monthly_rate")}</label>'],
  ['<label className="text-xs text-muted-foreground">Máx. parcelas</label>', '<label className="text-xs text-muted-foreground">{t("settings.card_max_installments")}</label>'],
  ['Simulação (produto de {formatCurrency(100)}):', '{t("settings.card_simulation", { amount: formatCurrency(100) })}'],
  ['<h3 className="text-sm font-semibold text-foreground">Opções da Loja</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.store_options_title")}</h3>'],
  ['<h4 className="text-sm font-medium text-foreground">Solicitar Login?</h4>', '<h4 className="text-sm font-medium text-foreground">{t("settings.request_login_label")}</h4>'],
  ['Exigir login do cliente antes de finalizar a compra', '{t("settings.request_login_desc")}'],
  ['<h4 className="text-sm font-medium text-foreground">Habilitar Adicionar ao Carrinho</h4>', '<h4 className="text-sm font-medium text-foreground">{t("settings.enable_add_to_cart_label")}</h4>'],
  ['Exibir botão "Adicionar ao Carrinho" na página de produto', '{t("settings.enable_add_to_cart_desc")}'],
  ['Salvar Todas as Configurações Acima', '{t("settings.save_all_payment")}'],

  // Shipping Tab
  ['<h3 className="text-sm font-semibold text-foreground">Frete Grátis na Loja</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.free_shipping_title")}</h3>'],
  ['Exibir selo de Frete Grátis para os produtos no site', '{t("settings.free_shipping_desc")}'],
  ['<h3 className="text-sm font-semibold text-foreground">Prazo de Entrega</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.delivery_time_title")}</h3>'],
  ['Configure o prazo mínimo e máximo de entrega em dias úteis.', '{t("settings.delivery_time_desc")}'],
  ['<label className="text-xs text-muted-foreground">Prazo mínimo (dias úteis)</label>', '<label className="text-xs text-muted-foreground">{t("settings.delivery_min_label")}</label>'],
  ['<label className="text-xs text-muted-foreground">Prazo máximo (dias úteis)</label>', '<label className="text-xs text-muted-foreground">{t("settings.delivery_max_label")}</label>'],
  ['<h3 className="text-sm font-semibold text-foreground">Localização Atual</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.current_location_title")}</h3>'],
  ['Exibir a cidade onde o pedido se encontra no rastreio.', '{t("settings.current_location_desc")}'],
  ['<label className="text-xs text-muted-foreground">Cidade / Estado Atual</label>', '<label className="text-xs text-muted-foreground">{t("settings.current_city_label")}</label>'],

  // Mascara Tab
  ['<h3 className="text-sm font-semibold text-foreground">Máscara da Loja (Checkout)</h3>', '<h3 className="text-sm font-semibold text-foreground">{t("settings.mascara_title")}</h3>'],
  ['<h4 className="text-sm font-medium text-foreground">Ativar Máscara</h4>', '<h4 className="text-sm font-medium text-foreground">{t("settings.mascara_active")}</h4>'],
  ['Substitui as informações reais da loja pelas configuradas abaixo', '{t("settings.mascara_desc")}'],
  ['<label className="text-xs text-muted-foreground">URL da Logo</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_logo")}</label>'],
  ['<label className="text-xs text-muted-foreground">Nome da Empresa</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_name")}</label>'],
  ['<label className="text-xs text-muted-foreground">Endereço Completo</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_address")}</label>'],
  ['<label className="text-xs text-muted-foreground">Cor Primária</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_primary")}</label>'],
  ['<label className="text-xs text-muted-foreground">Cor Secundária</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_secondary")}</label>'],
  ['<label className="text-xs text-muted-foreground">Cor do Texto</label>', '<label className="text-xs text-muted-foreground">{t("settings.mascara_text")}</label>'],
];

replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

fs.writeFileSync(path, content, 'utf8');
