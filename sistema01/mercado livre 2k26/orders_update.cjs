const fs = require('fs');
const path = './src/pages/AdminOrders.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['Exportar CC\'s', '{t("orders.export_cc")}'],
  ['<h3 className="text-lg font-semibold text-foreground">nada encontrado por aqui</h3>', '<h3 className="text-lg font-semibold text-foreground">{t("orders.not_found")}</h3>'],
  ['Os pedidos aparecerão aqui assim que seus clientes finalizarem as compras.', '{t("orders.not_found_desc")}'],
  ['<span className="text-sm text-foreground font-medium">{selected.size} selecionado(s)</span>', '<span className="text-sm text-foreground font-medium">{t("orders.selected", { count: selected.size })}</span>'],
  ['<option value="">Ação em massa</option>', '<option value="">{t("orders.bulk_action")}</option>'],
  ['Marcar como Processando', 't("status.processing")'], // Wait, this is inside an option value label.
  ['Marcar como Pago', 't("status.paid")'],
  ['Marcar como Em Trânsito', 't("status.shipped_long")'],
  ['Marcar como Entregue', 't("status.delivered")'],
  ['Marcar como Cancelado', 't("status.cancelled")'],
  ['Marcar como Reembolsado', 't("status.refunded")'],
  ['Apagar selecionados', 't("store.delete")'], // Better than hardcoding
  ['Aplicar', '{t("orders.apply")}'],
  ['Limpar seleção', '{t("orders.clear_selection")}'],
];

// Special handling for the select options which are inside JSX
replacements.forEach(([search, replace]) => {
  // If search is a string label in an option, we need to be careful
  if (search.startsWith('Marcar como') || search === 'Apagar selecionados') {
    content = content.replace(`>${search}</option>`, `>{${replace}}</option>`);
  } else {
    content = content.replace(search, replace);
  }
});

fs.writeFileSync(path, content, 'utf8');
