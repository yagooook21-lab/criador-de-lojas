const fs = require('fs');
const path = require('path');
const dir = './src/pages';
const files = fs.readdirSync(dir).filter(f => f.startsWith('StoreCheckout') && f.endsWith('.tsx'));

for (const file of files) {
  const p = path.join(dir, file);
  let content = fs.readFileSync(p, 'utf8');
  let changed = false;

  // Fix 1: removing leftover <style dangerouslySet.../> 
  const styleRegex = /<style\s+dangerouslySetInnerHTML=\{\{__html:\s*`[\s\S]*?`\}\}\s*\/>/g;
  if (content.match(styleRegex)) {
      content = content.replace(styleRegex, '');
      changed = true;
  }

  // Fix 2: the corrupted "> navigate('/store')}" syntax
  const corruptedLogoRegex = /<a className="nav-logo" style=\{\{ backgroundImage: "[^"]+", backgroundSize: "[^"]+", backgroundRepeat: "[^"]+" \}\}> navigate\('\/store'\)\}>([^<]+)<\/a>/g;
  if (content.match(corruptedLogoRegex)) {
      content = content.replace(corruptedLogoRegex, `<a className="nav-logo" onClick={() => navigate('/store')} style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>$1</a>`);
      changed = true;
  }

  // Fix 3: any remaining unstyled nav-logo that have onClick
  const unstyledOnClickRegex = /<a\s+className="nav-logo"\s+onClick=\{\(\)\s*=>\s*navigate\('([^']+)'\)\}>([\s\S]*?)<\/a>/g;
  if (content.match(unstyledOnClickRegex)) {
      content = content.replace(unstyledOnClickRegex, `<a className="nav-logo" onClick={() => navigate('$1')} style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>$2</a>`);
      changed = true;
  }

  // Fix 4: any remaining unstyled nav-logo without onClick
  const unstyledNormalRegex = /<a\s+className="nav-logo">([\s\S]*?)<\/a>/g;
  if (content.match(unstyledNormalRegex)) {
      content = content.replace(unstyledNormalRegex, `<a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>$1</a>`);
      changed = true;
  }

  if (changed) {
     fs.writeFileSync(p, content);
     console.log('Repaired ' + file);
  }
}
