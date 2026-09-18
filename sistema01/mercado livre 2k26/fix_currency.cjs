const fs = require('fs');

const filesToFix = [
  'src/pages/StoreHome.tsx',
  'src/pages/StoreProducts.tsx',
  'src/pages/StoreSearch.tsx',
  'src/pages/StoreCollection.tsx'
];

for (const file of filesToFix) {
  if (!fs.existsSync(file)) {
    console.log('File not found:', file);
    continue;
  }
  let code = fs.readFileSync(file, 'utf8');

  // Skip if already processed
  if (code.includes('currencyLocale') && code.includes('currencySymbol') && !code.includes('StoreHome')) {
    // For StoreHome we might need re-run to ensure proper tag replacement if it failed earlier,
    // but better check if there are any unmodified R$ left
  }

  // Add import if missing
  if (!code.includes('useI18n')) {
    code = code.replace(/import React/, 'import { useI18n } from "@/contexts/I18nContext";\nimport React');
  }

  // Inject hook into component
  // E.g. export default function StoreHome() {
  const funcRegex = /export default function ([a-zA-Z0-9_]+)\([^)]*\)\s*\{/;
  if (funcRegex.test(code)) {
    if (!code.includes('const { currencySymbol')) {
      code = code.replace(
        funcRegex,
        (match) => match + '\n  const { currencySymbol, currencyLocale, formatCurrencyParts } = useI18n();'
      );
    }
  }

  // Replace .toLocaleString('pt-BR') -> .toLocaleString(currencyLocale)
  code = code.replace(/\.toLocaleString\(['"]pt-BR['"]\)/g, '.toLocaleString(currencyLocale)');

  // 1. Replace explicitly >R$<
  code = code.replace(/>R\$</g, '>${currencySymbol}<');

  // 2. Replace R$ followed by a space
  code = code.replace(/R\$ /g, '${currencySymbol} ');

  fs.writeFileSync(file, code);
  console.log('Processed', file);
}
