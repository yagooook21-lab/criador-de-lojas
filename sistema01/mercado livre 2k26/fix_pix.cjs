const fs = require('fs');
let content = fs.readFileSync('src/pages/StoreCheckoutPixSuccess.tsx', 'utf-8');
let target = 'const { cartTotal, cartItems, createOrder } = useStore();';
if (content.split(target).length - 1 >= 2) {
    content = content.replace(target + '\n    ' + target, target);
    fs.writeFileSync('src/pages/StoreCheckoutPixSuccess.tsx', content, 'utf-8');
    console.log('Fixed Pix');
}
