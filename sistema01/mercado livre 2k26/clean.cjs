const fs = require('fs');
let lines = fs.readFileSync('src/contexts/I18nContext.tsx', 'utf-8').split('\n');

let seen_pt = new Set();
let seen_es = new Set();
let current_lang = null;
let out = [];

for (let line of lines) {
    if (line.includes('pt: {')) { current_lang = 'pt'; }
    else if (line.includes('es: {')) { current_lang = 'es'; }

    let match = line.match(/^\s*"([^"]+)"\s*:/);
    if (match && current_lang) {
        let key = match[1];
        if (current_lang === 'pt') {
            if (seen_pt.has(key)) { console.log('Duplicate pt', key); continue; }
            seen_pt.add(key);
        } else if (current_lang === 'es') {
            if (seen_es.has(key)) { console.log('Duplicate es', key); continue; }
            seen_es.add(key);
        }
    }
    out.push(line);
}
fs.writeFileSync('src/contexts/I18nContext.tsx', out.join('\n'), 'utf-8');
