const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const ptKeys = `
    "store.free_shipping_between": "Chegará grátis entre",
    "store.avista_pix_boleto": "À vista no Pix e Boleto",
    "store.avista_pix": "À vista no Pix",
    "store.avista_boleto": "À vista no Boleto",
    "store.avista": "À vista",
    "store.interest_free": "sem juros",
    "store.installment_in": "em",
    "store.new": "Novo",
    "store.used": "Usado",
    "store.sold": "vendidos",
    "store.thousand_sold": "mil vendidos",
    "store.available": "disponíveis",
    "store.sharing": "Compartilhar",
    "store.return": "Voltar",
    "store.sell_similar": "Vender um igual",
    "store.best_seller": "MAIS VENDIDO",
    "store.product_desc": "Descrição",
    "store.questions_answers": "Perguntas e respostas",
    "store.opinions": "Opiniões sobre o produto",
    "store.buy_now": "Comprar agora",
    "store.add_to_cart": "Adicionar ao carrinho",
    "store.characteristics": "Características do produto",
    "store.what_need_to_know": "O que você precisa saber sobre este produto",
    "store.view_characteristics": "Ver características",
    "store.buy_options": "Opções de compra",
    "store.go_to_purchase": "Ir para a compra",
    "store.also_interested": "Você também pode estar interessado",
`;

const esKeys = `
    "store.free_shipping_between": "Llegará gratis entre",
    "store.avista_pix_boleto": "En un pago con transferencia",
    "store.avista_pix": "En un pago con transferencia",
    "store.avista_boleto": "En un pago con Boleto",
    "store.avista": "En un pago",
    "store.interest_free": "sin interés",
    "store.installment_in": "en",
    "store.new": "Nuevo",
    "store.used": "Usado",
    "store.sold": "vendidos",
    "store.thousand_sold": "mil vendidos",
    "store.available": "disponibles",
    "store.sharing": "Compartir",
    "store.return": "Volver",
    "store.sell_similar": "Vender uno igual",
    "store.best_seller": "MÁS VENDIDO",
    "store.product_desc": "Descripción",
    "store.questions_answers": "Preguntas y respuestas",
    "store.opinions": "Opiniones sobre el producto",
    "store.buy_now": "Comprar ahora",
    "store.add_to_cart": "Agregar al carrito",
    "store.characteristics": "Características del producto",
    "store.what_need_to_know": "Lo que tenés que saber de este producto",
    "store.view_characteristics": "Ver características",
    "store.buy_options": "Opciones de compra",
    "store.go_to_purchase": "Ir a la compra",
    "store.also_interested": "También te puede interesar",
`;

content = content.replace('    "store.close": "Fechar",', '    "store.close": "Fechar",' + ptKeys);
content = content.replace('    "store.close": "Cerrar",', '    "store.close": "Cerrar",' + esKeys);

fs.writeFileSync(path, content, 'utf8');
