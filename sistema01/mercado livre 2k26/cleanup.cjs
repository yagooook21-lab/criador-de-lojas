const fs = require('fs');
const path = './src/pages/AdminSettings.tsx';
let content = fs.readFileSync(path, 'utf8');

// Regex to find and remove the SPA block inside the Store Checkout Options section
// We look for the div with H4 "SPA" and P "Em breve" and the span "Breve"
const spaBlockRegex = /<div className="flex items-center justify-between p-3 rounded-\[5px\] bg-secondary\/30 border border-border\/50 opacity-80">\s*<div>\s*<h4 className="text-sm font-medium text-foreground">SPA<\/h4>\s*<p className="text-xs text-muted-foreground italic">Em breve<\/p>\s*<\/div>\s*<span className="text-\[10px\] bg-primary\/20 text-primary px-2 py-0\.5 rounded font-bold uppercase tracking-wider">Breve<\/span>\s*<\/div>/g;

content = content.replace(spaBlockRegex, '');

fs.writeFileSync(path, content, 'utf8');
