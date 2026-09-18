const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

const ptKeys = `
    "products.title": "Produtos",
    "products.new": "Novo produto",
    "products.import": "Importar produtos",
    "products.basic_info": "Informações Básicas",
    "products.name_label": "Título do Produto",
    "products.name_placeholder": "Ex: Tênis Esportivo Ultra",
    "products.slug_label": "Slug (URL)",
    "products.desc_label": "Descrição (HTML)",
    "products.gallery": "Galeria de Imagens",
    "products.upload": "Fazer Upload de Fotos",
    "products.upload_desc": "Arraste e solte ou clique para selecionar",
    "products.url_label": "Adicionar por URL",
    "products.pricing_stock": "Preços e Disponibilidade",
    "products.price_label": "Preço de Venda",
    "products.compare_price_label": "Preço Comparativo",
    "products.stock_label": "Estoque Disponível",
    "products.status_label": "Status do Produto",
    "products.bulk_duplicate": "Duplicar selecionados",
    "products.bulk_delete": "Apagar selecionados",
    "products.bulk_export": "Exportar selecionados",
    "products.success_duplicate": "{count} produto(s) duplicado(s) com sucesso!",
    "products.error_save": "Erro ao salvar produto",
`;

const esKeys = `
    "products.title": "Productos",
    "products.new": "Nuevo producto",
    "products.import": "Importar productos",
    "products.basic_info": "Información Básica",
    "products.name_label": "Título del Producto",
    "products.name_placeholder": "Ej: Tenis Deportivo Ultra",
    "products.slug_label": "Slug (URL)",
    "products.desc_label": "Descripción (HTML)",
    "products.gallery": "Galería de Imágenes",
    "products.upload": "Subir Fotos",
    "products.upload_desc": "Arrastra y suelta o haz clic para seleccionar",
    "products.url_label": "Agregar por URL",
    "products.pricing_stock": "Precios y Disponibilidad",
    "products.price_label": "Precio de Venta",
    "products.compare_price_label": "Precio Comparativo",
    "products.stock_label": "Stock Disponible",
    "products.status_label": "Estado del Producto",
    "products.bulk_duplicate": "Duplicar seleccionados",
    "products.bulk_delete": "Eliminar seleccionados",
    "products.bulk_export": "Exportar seleccionados",
    "products.success_duplicate": "¡{count} producto(s) duplicado(s) con éxito!",
    "products.error_save": "Error al guardar el producto",
`;

content = content.replace('    "store.oferta_do_dia": "Oferta do dia",', '    "store.oferta_do_dia": "Oferta do dia",' + ptKeys);
content = content.replace('    "store.oferta_do_dia": "Oferta del día",', '    "store.oferta_do_dia": "Oferta del día",' + esKeys);

fs.writeFileSync(path, content, 'utf8');
