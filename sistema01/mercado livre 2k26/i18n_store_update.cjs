const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const ptKeys = `
    "store.viewed_recently": "Visto recentemente",
    "store.also_interests_you": "Também te interessa",
    "store.what_you_want": "O que você quer",
    "store.oferta_do_dia": "Oferta do dia",
`;

const esKeys = `
    "store.viewed_recently": "Visto recientemente",
    "store.also_interests_you": "También te interesa",
    "store.what_you_want": "Lo que buscas",
    "store.oferta_do_dia": "Oferta del día",
`;

content = content.replace('    "store.show_password": "Mostrar Senha",', '    "store.show_password": "Mostrar Senha",' + ptKeys);
content = content.replace('    "store.show_password": "Mostrar Contraseña",', '    "store.show_password": "Mostrar Contraseña",' + esKeys);

fs.writeFileSync(path, content, 'utf8');
