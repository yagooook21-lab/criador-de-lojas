const fs = require('fs');

let content = fs.readFileSync('src/pages/StoreCheckoutPixSuccess.tsx', 'utf8');

// Fix aria-labels that were stripped of quotes
content = content.split('aria-label=Copiar código').join('aria-label="Copiar código"');
content = content.split('aria-label=Ir para minhas compras').join('aria-label="Ir para minhas compras"');

fs.writeFileSync('src/pages/StoreCheckoutPixSuccess.tsx', content, 'utf8');
console.log('Fixed aria labels!');
