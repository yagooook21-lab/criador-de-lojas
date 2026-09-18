const fs = require('fs');

let code = fs.readFileSync('src/pages/StoreCheckoutInstallments.tsx', 'utf8');

const anchor = '})()}';
const startIdx = code.indexOf(anchor);

if (startIdx !== -1) {
  const endingTarget = 'export default StoreCheckoutInstallments;';
  const endIdx = code.lastIndexOf(endingTarget);
  if (endIdx !== -1) {
    const newCode = code.substring(0, startIdx + anchor.length) + '\n    </>\n  );\n};\n\n' + endingTarget + '\n';
    fs.writeFileSync('src/pages/StoreCheckoutInstallments.tsx', newCode);
    console.log('Fixed garbage lines at end of file!');
  } else {
    console.log('Ending target not found');
  }
} else {
  console.log('Anchor not found');
}
