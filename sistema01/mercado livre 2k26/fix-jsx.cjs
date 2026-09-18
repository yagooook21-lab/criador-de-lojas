const fs = require('fs');

const file = 'src/pages/StoreCheckoutShipping.tsx';
let content = fs.readFileSync(file, 'utf8');

// Replace class with className, for with htmlFor
content = content.replace(/class=/g, 'className=');
content = content.replace(/for=/g, 'htmlFor=');

// Remove React internals comments
content = content.replace(/<!--\$?-->/g, ''); 
content = content.replace(/<!--\/\$-->/g, ''); 

// Convert regular HTML comments to JSX comments
content = content.replace(/<!--(.*?)-->/g, '{/*$1*/}'); 

// Convert inline styles
content = content.replace(/style="font-size:16px"/g, 'style={{ fontSize: "16px" }}');
content = content.replace(/style="font-size:10px;margin-top:2px"/g, 'style={{ fontSize: "10px", marginTop: "2px" }}');
content = content.replace(/style="font-size:10px;margin-top:3px"/g, 'style={{ fontSize: "10px", marginTop: "3px" }}');
content = content.replace(/style="font-size:18px"/g, 'style={{ fontSize: "18px" }}');

// Self closing tags (input, img, hr, br)
content = content.replace(/<input([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<input${p1} />`;
});
content = content.replace(/<img([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<img${p1} />`;
});
content = content.replace(/<hr([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<hr${p1} />`;
});
content = content.replace(/<br([^>]*?)>/g, (match, p1) => {
  if (p1.endsWith('/')) return match;
  return `<br${p1} />`;
});

// Fix specific broken tags the user pasted like unclosed tags
content = content.replace(/checked=""/g, 'checked');
content = content.replace(/hidden="hidden"/g, 'hidden');

fs.writeFileSync(file, content);
console.log('Fixed JSX formatting');
