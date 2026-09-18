const fs = require('fs');
const path = './src/contexts/I18nContext.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove EN from Language type
content = content.replace('export type Language = "pt" | "en" | "es";', 'export type Language = "pt" | "es";');

// 2. Remove EN dictionary
content = content.replace(/en: \{[\s\S]*?\},\s*es: \{/g, 'es: {');

// 3. Add keys to PT dictionary
const ptStart = 'pt: {';
const ptEnd = '  },';
const ptKeys = `
    "dash.title": "Painel Executivo",
    "dash.subtitle": "Monitore o desempenho da sua loja em tempo real",
    "dash.today": "Hoje",
    "dash.7days": "7 dias",
    "dash.30days": "30 dias",
    "dash.boletos_generated": "Boletos Gerados",
    "dash.live_view": "Live View",
    "dash.no_visitors": "Nenhum visitante online no momento",
    "dash.no_traffic": "Sem dados de tráfego disponíveis",
    "dash.unknown": "Desconhecido",
    "settings.country_label": "País da loja",
    "settings.country_desc": "Selecione o país para definir o idioma e a moeda.",
    "settings.currency_label": "Moeda da loja",
    "settings.currency_desc": "Escolha entre a moeda local ou dólar americano.",
    "settings.usd": "Dólar americano (USD)",
    "settings.pix_method": "Método PIX",
    "settings.pix_gateway_title": "Configurar Gateway PIX",
    "settings.pix_gateway_label": "Gateway de Pagamento",
    "settings.pix_api_key_black_cat": "Chave API / Privada (X-API-Key)",
    "settings.pix_public_key_label": "Chave Pública",
    "settings.pix_api_key_streetpay": "Chave de API (Bearer Token)",
    "settings.pix_account_title": "Configurar Conta PIX",
    "settings.card_title": "Pagamento com Cartão",
    "settings.card_desc": "Aceitar pagamentos com cartão de crédito/débito",
    "settings.card_request_key": "Solicitar Chave?",
    "settings.card_interest_rates": "Taxas de Juros",
    "settings.card_free_installments": "Parcelas sem juros",
    "settings.card_monthly_rate": "Taxa mensal (%)",
    "settings.card_max_installments": "Máx. parcelas",
    "settings.card_simulation": "Simulação (produto de {amount}):",
    "settings.store_options_title": "Opções da Loja",
    "settings.request_login_label": "Solicitar Login?",
    "settings.request_login_desc": "Exigir login do cliente antes de finalizar a compra",
    "settings.enable_add_to_cart_label": "Habilitar Adicionar ao Carrinho",
    "settings.enable_add_to_cart_desc": "Exibir botão \"Adicionar ao Carrinho\" na página de produto",
    "settings.save_all_payment": "Salvar Todas as Configurações Acima",
    "settings.free_shipping_title": "Frete Grátis na Loja",
    "settings.free_shipping_desc": "Exibir selo de Frete Grátis para os produtos no site",
    "settings.delivery_time_title": "Prazo de Entrega",
    "settings.delivery_time_desc": "Configure o prazo mínimo e máximo de entrega em dias úteis.",
    "settings.delivery_min_label": "Prazo mínimo (dias úteis)",
    "settings.delivery_max_label": "Prazo máximo (dias úteis)",
    "settings.current_location_title": "Localização Atual",
    "settings.current_location_desc": "Exibir a cidade onde o pedido se encontra no rastreio.",
    "settings.current_city_label": "Cidade / Estado Atual",
    "settings.mascara_title": "Máscara da Loja (Checkout)",
    "settings.mascara_active": "Ativar Máscara",
    "settings.mascara_desc": "Substitui as informações reais da loja pelas configuradas abaixo",
    "settings.mascara_logo": "URL da Logo",
    "settings.mascara_name": "Nome da Empresa",
    "settings.mascara_address": "Endereço Completo",
    "settings.mascara_primary": "Cor Primária",
    "settings.mascara_secondary": "Cor Secundária",
    "settings.mascara_text": "Cor do Texto",
    "topbar.dev_contact": "Contato do desenvolvedor",
    "topbar.change_credentials": "Alterar credenciais",
    "topbar.new_email": "Novo email",
    "topbar.update_email": "Alterar email",
    "topbar.new_password": "Nova senha",
    "topbar.confirm_password": "Confirmar senha",
    "topbar.update_password": "Alterar senha",
    "status.processing": "Processando",
    "status.shipped_long": "Em Trânsito",
    "orders.bulk_action": "Ação em massa",
    "orders.apply": "Aplicar",
    "orders.clear_selection": "Limpar seleção",
    "orders.selected": "{count} selecionado(s)",
    "orders.export_cc": "Exportar CC's",
    "orders.not_found": "nada encontrado por aqui",
    "orders.not_found_desc": "Os pedidos aparecerão aqui assim que seus clientes finalizarem as compras.",
`;

// Insert into pt
content = content.replace('    "store.show_password": "Mostrar Senha",', '    "store.show_password": "Mostrar Senha",' + ptKeys);

// 4. Add keys to ES dictionary
const esKeys = `
    "dash.title": "Panel Ejecutivo",
    "dash.subtitle": "Monitore el desempeño de su tienda en tiempo real",
    "dash.today": "Hoy",
    "dash.7days": "7 días",
    "dash.30days": "30 días",
    "dash.boletos_generated": "Boletos Generados",
    "dash.live_view": "Vista en Vivo",
    "dash.no_visitors": "Ningún visitante en línea en este momento",
    "dash.no_traffic": "Sin datos de tráfico disponibles",
    "dash.unknown": "Desconocido",
    "settings.country_label": "País de la tienda",
    "settings.country_desc": "Seleccione el país para definir el idioma y la moneda.",
    "settings.currency_label": "Moneda de la tienda",
    "settings.currency_desc": "Elija entre la moneda local o dólar estadounidense.",
    "settings.usd": "Dólar estadounidense (USD)",
    "settings.pix_method": "Método PIX",
    "settings.pix_gateway_title": "Configurar Gateway PIX",
    "settings.pix_gateway_label": "Pasarela de Pago",
    "settings.pix_api_key_black_cat": "Clave API / Privada (X-API-Key)",
    "settings.pix_public_key_label": "Clave Pública",
    "settings.pix_api_key_streetpay": "Clave de API (Bearer Token)",
    "settings.pix_account_title": "Configurar Cuenta PIX",
    "settings.card_title": "Pago con Tarjeta",
    "settings.card_desc": "Aceptar pagos con tarjeta de crédito/débito",
    "settings.card_request_key": "¿Solicitar Clave?",
    "settings.card_interest_rates": "Tasas de Interés",
    "settings.card_free_installments": "Cuotas sin interés",
    "settings.card_monthly_rate": "Tasa mensual (%)",
    "settings.card_max_installments": "Máx. cuotas",
    "settings.card_simulation": "Simulación (producto de {amount}):",
    "settings.store_options_title": "Opciones de la Tienda",
    "settings.request_login_label": "¿Solicitar Login?",
    "settings.request_login_desc": "Exigir login del cliente antes de finalizar la compra",
    "settings.enable_add_to_cart_label": "Habilitar Agregar al Carrito",
    "settings.enable_add_to_cart_desc": "Mostrar botón \"Agregar al Carrito\" en la página de producto",
    "settings.save_all_payment": "Guardar Todas las Configuraciones Anteriores",
    "settings.free_shipping_title": "Envío Gratis en la Tienda",
    "settings.free_shipping_desc": "Mostrar sello de Envío Gratis para los productos en el sitio",
    "settings.delivery_time_title": "Plazo de Entrega",
    "settings.delivery_time_desc": "Configure el plazo mínimo y máximo de entrega en días hábiles.",
    "settings.delivery_min_label": "Plazo mínimo (días hábiles)",
    "settings.delivery_max_label": "Plazo máximo (días hábiles)",
    "settings.current_location_title": "Ubicación Actual",
    "settings.current_location_desc": "Mostrar la ciudad donde se encuentra el pedido en el rastreo.",
    "settings.current_city_label": "Ciudad / Estado Actual",
    "settings.mascara_title": "Máscara de la Tienda (Checkout)",
    "settings.mascara_active": "Activar Máscara",
    "settings.mascara_desc": "Reemplaza la información real de la tienda por la configurada abajo",
    "settings.mascara_logo": "URL del Logo",
    "settings.mascara_name": "Nombre de la Empresa",
    "settings.mascara_address": "Dirección Completa",
    "settings.mascara_primary": "Color Primario",
    "settings.mascara_secondary": "Color Secundario",
    "settings.mascara_text": "Color del Texto",
    "topbar.dev_contact": "Contacto del desarrollador",
    "topbar.change_credentials": "Cambiar credenciales",
    "topbar.new_email": "Nuevo email",
    "topbar.update_email": "Cambiar email",
    "topbar.new_password": "Nueva contraseña",
    "topbar.confirm_password": "Confirmar contraseña",
    "topbar.update_password": "Cambiar contraseña",
    "status.processing": "Procesando",
    "status.shipped_long": "En Tránsito",
    "orders.bulk_action": "Acción en masa",
    "orders.apply": "Aplicar",
    "orders.clear_selection": "Limpiar selección",
    "orders.selected": "{count} seleccionado(s)",
    "orders.export_cc": "Exportar CC's",
    "orders.not_found": "nada encontrado por aquí",
    "orders.not_found_desc": "Los pedidos aparecerán aquí tan pronto como sus clientes finalicen las compras.",
`;

// Insert into es
content = content.replace('    "store.show_password": "Mostrar Contraseña",', '    "store.show_password": "Mostrar Contraseña",' + esKeys);

// 5. Update setCountry logic to enforce language
content = content.replace(/setCountry = useCallback\(\(code: Country\) => \{[\s\S]*?\}, \[persistI18n\]\);/g, `setCountry = useCallback((code: Country) => {
    setCountryState(code);
    localStorage.setItem("app_country", code);
    const found = countries.find(c => c.code === code);
    if (found) {
      // Force PT for Brazil, ES for all others
      const forcedLang = code === "BR" ? "pt" : "es";
      setLanguageState(forcedLang);
      localStorage.setItem("app_language", forcedLang);
      
      setCurrencyState(found.currency);
      localStorage.setItem("app_currency", found.currency);
      persistI18n(code, forcedLang, found.currency);
    }
  }, [persistI18n]);`);

fs.writeFileSync(path, content, 'utf8');
