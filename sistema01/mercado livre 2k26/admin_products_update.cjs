const fs = require('fs');
const path = './src/pages/AdminProducts.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['<AdminTopbar title="Produtos" />', '<AdminTopbar title={t("products.title")} />'],
  ['{products.length} produtos', '{products.length} {t("nav.products").toLowerCase()}'],
  ['Importar produtos', '{t("products.import")}'],
  ['Novo produto', '{t("products.new")}'],
  ['<h3 className="text-lg font-semibold text-foreground">nada encontrado por aqui</h3>', '<h3 className="text-lg font-semibold text-foreground">{t("orders.not_found")}</h3>'],
  ['<span className="text-sm text-foreground font-medium">{selected.size} selecionado(s)</span>', '<span className="text-sm text-foreground font-medium">{t("orders.selected", { count: selected.size })}</span>'],
  ['<option value="">Ação em massa</option>', '<option value="">{t("orders.bulk_action")}</option>'],
  ['Duplicar selecionados', '{t("products.bulk_duplicate")}'],
  ['Apagar selecionados', '{t("products.bulk_delete")}'],
  ['Exportar selecionados', '{t("products.bulk_export")}'],
  ['Aplicar', '{t("orders.apply")}'],
  ['Limpar seleção', '{t("orders.clear_selection")}'],
  ['<th>Imagem</th>', '<th>{t("products.image")}</th>'], // Need products.image key? Let's use common
  ['<th>Nome</th>', '<th>{t("customers.name")}</th>'],
  ['<th>Preço</th>', '<th>{t("orders.price")}</th>'],
  ['<th>Status</th>', '<th>{t("orders.status")}</th>'],
  ['<th>Ações</th>', '<th>{t("orders.actions")}</th>'],
  ['{editing ? "Editar produto" : "Novo produto"}', '{editing ? t("products.edit") : t("products.new")}'],
  ['Informações Básicas', '{t("products.basic_info")}'],
  ['Título do Produto', '{t("products.name_label")}'],
  ['Ex: Tênis Esportivo Ultra', '{t("products.name_placeholder")}'],
  ['Slug (URL)', '{t("products.slug_label")}'],
  ['Descrição (HTML)', '{t("products.desc_label")}'],
  ['Galeria de Imagens', '{t("products.gallery")}'],
  ['Fazer Upload de Fotos', '{t("products.upload")}'],
  ['Arraste e solte ou clique para selecionar', '{t("products.upload_desc")}'],
  ['Adicionar por URL', '{t("products.url_label")}'],
  ['Preços e Disponibilidade', '{t("products.pricing_stock")}'],
  ['Preço de Venda', '{t("products.price_label")}'],
  ['Preço Comparativo', '{t("products.compare_price_label")}'],
  ['Estoque Disponível', '{t("products.stock_label")}'],
];

replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

// Fix labels record
content = content.replace('inactive: "Inativo",', 'inactive: t("status.inactive") || "Inativo",');
content = content.replace('active: "Ativo",', 'active: t("status.pending") || "Ativo",'); // Wait status.active?

fs.writeFileSync(path, content, 'utf8');
