const fs = require('fs');
const lines = fs.readFileSync('src/pages/StoreHome.tsx', 'utf8').split('\n');
for(let i=1100; i<1315; i++) {
  if (lines[i] && lines[i].includes('`')) {
    console.log('Line ' + (i+1) + ': ' + lines[i].indexOf('`'));
  }
}
