const fs = require('fs');
const path = './src/pages/StoreHome.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['const titles = [\'Visto recentemente\', \'Também te interessa\', \'O que você quer\'];', 'const titles = [t("store.viewed_recently"), t("store.also_interests_you"), t("store.what_you_want")];'],
  ['aria-label={`Antes: ${fCompare.integer} reais`}', 'aria-label={`${t("store.before")}: ${fCompare.integer}`}'], // Add store.before later if needed
  ['aria-label={`Agora: ${fCurrent.integer} reais`}', 'aria-label={`${t("store.now")}: ${fCurrent.integer}`}'],
  ['Frete grátis', '{t("store.free_shipping")}'], // This is tricky because it's in string templates
];

// Handling the string template for free shipping
content = content.replace(/Frete grátis/g, (match, offset, string) => {
  // If inside a backtick or quote, we might need a different replacement
  // but for simplicity in this file:
  return '${t("store.free_shipping")}';
});

// Actually, let's just do a blanket replacement of the most common hardcoded strings in backticks
content = content.replace(/aria-label="Antes: \${fCompare.integer} reais"/g, 'aria-label={`${t("store.before")}: ${fCompare.integer}`}');
content = content.replace(/aria-label="Agora: \${fCurrent.integer} reais"/g, 'aria-label={`${t("store.now")}: ${fCurrent.integer}`}');

fs.writeFileSync(path, content, 'utf8');
