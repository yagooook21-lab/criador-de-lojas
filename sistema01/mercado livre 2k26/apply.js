const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('StoreCheckout'));

const styleBlock = `
          <style dangerouslySetInnerHTML={{__html: \`
            @media (min-width: 768px) {
              .nav-logo { background-image: url(https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp) !important; }
            }
            @media (max-width: 767px) {
              .nav-logo { background-image: url(https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/logo__small@2x.png) !important; }
            }
          \`}} />
`;

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  if (content.includes('nav-logo') && !content.includes('pt_logo_large_plus')) {
     content = content.replace(/<a className="nav-logo">([^<]*)<\/a>/g, `${styleBlock}          <a className="nav-logo">$1</a>`);
     fs.writeFileSync(p, content);
     console.log('Updated ' + file);
  }
}
