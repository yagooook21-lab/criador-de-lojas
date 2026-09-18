const fs = require('fs');
let content = fs.readFileSync('src/pages/StoreCheckoutPixSuccess.tsx', 'utf-8');

// Find the first occurrence of "export default StoreCheckoutPixSuccess;"
const idx = content.indexOf('export default StoreCheckoutPixSuccess;');

if (idx !== -1) {
    const originalContent = content.substring(0, idx + 'export default StoreCheckoutPixSuccess;'.length);
    fs.writeFileSync('src/pages/StoreCheckoutPixSuccess.tsx', originalContent, 'utf-8');
    console.log('Restored to ' + originalContent.split('\n').length + ' lines.');
} else {
    console.log('Could not find the export statement.');
}
