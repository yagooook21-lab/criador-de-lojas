const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const ptKeys = `
    "store.clear": "Limpar",
    "store.close": "Fechar",
`;

const esKeys = `
    "store.clear": "Limpiar",
    "store.close": "Cerrar",
`;

content = content.replace('    "store.novo": "Novo",', '    "store.novo": "Novo",' + ptKeys);
content = content.replace('    "store.novo": "Nuevo",', '    "store.novo": "Nuevo",' + esKeys);

fs.writeFileSync(path, content, 'utf8');
