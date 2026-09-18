const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const ptKeys = `
    "store.inform_zip_p1": "Informe seu",
    "store.inform_zip_p2": "CEP",
    "store.items_in_cart": "produtos em seu carrinho",
    "store.free": "Grátis",
    "store.novo": "Novo",
`;

const esKeys = `
    "store.inform_zip_p1": "Ingresá tu",
    "store.inform_zip_p2": "código postal",
    "store.items_in_cart": "productos en tu carrito",
    "store.free": "Gratis",
    "store.novo": "Nuevo",
`;

content = content.replace('    "store.resumo": "Resumo",', '    "store.resumo": "Resumo",' + ptKeys);
content = content.replace('    "store.resumo": "Resumen",', '    "store.resumo": "Resumen",' + esKeys);

fs.writeFileSync(path, content, 'utf8');
