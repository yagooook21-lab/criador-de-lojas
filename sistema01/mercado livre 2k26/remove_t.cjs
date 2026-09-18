const fs = require('fs');

let content = fs.readFileSync('src/pages/StoreCheckoutPixSuccess.tsx', 'utf8');

const replacements = {
  "t('checkout.pix_generating')": `"Gerando código PIX..."`,
  "t('checkout.almost_there')": `"Quase lá!"`,
  "t('checkout.scan_qr_to_pay')": `"Escaneie o QR Code"`,
  "t('checkout.access_bank_app')": `"Acesse o app do seu banco ou instituição financeira."`,
  "t('checkout.choose_pix')": `"Acesse a área Pix e escolha a opção de ler QR Code."`,
  "t('checkout.scan_following_code')": `"Escaneie o código abaixo com a câmera do seu celular."`,
  "t('checkout.copy_code')": `"Copiar código"`,
  't("checkout.copy_code")': `"Copiar código"`,
  "t('checkout.go_to_purchases')": `"Ir para minhas compras"`,
  't("checkout.go_to_purchases")': `"Ir para minhas compras"`,
  "t('checkout.scan_or_paste_code')": `"Cole ou escaneie o código."`,
  "t('checkout.credited_instantly')": `"Aprovação imediata"`,
  "t('checkout.delivery_confirmation_pending')": `"Aguardando confirmação do pagamento"`,
  "t('common.copyright')": `"Copyright © 1999-2024 Ebazar.com.br LTDA."`,
  "t('checkout.secure_payment_description')": `"CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre."`,
  "t('checkout.secure_payment_tag')": `"Mercado Livre"`
};

for (const [key, value] of Object.entries(replacements)) {
    content = content.split(`{${key}}`).join(value.replace(/"/g, ''));
    content = content.split(`aria-label={${key}}`).join(`aria-label=${value}`);
}

fs.writeFileSync('src/pages/StoreCheckoutPixSuccess.tsx', content, 'utf8');
console.log('Removed i18n t() calls from StoreCheckoutPixSuccess.tsx');
