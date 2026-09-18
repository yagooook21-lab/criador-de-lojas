const fs = require('fs');
const path = './src/pages/StoreDesktopHeader.tsx'; // Wait, it's in components
const componentsPath = './src/components/StoreDesktopHeader.tsx';
let content = fs.readFileSync(componentsPath, 'utf8');

// 1. Add useI18n import and usage
content = content.replace('import { useI18n } from "@/contexts/I18nContext";', ''); // Ensure no dupes
content = 'import { useI18n } from "@/contexts/I18nContext";\n' + content;

// 2. Refactor templates to use t()
// Instead of complex regex, I'll replace the whole constant definitions with functions or inside the component logic.
// But the strings are long. I'll use a more surgical approach.

content = content.replace('const guestNavHTML = `<nav id="nav-header-menu" aria-label="Menu do usuário">', 'const getGuestNavHTML = (t: any) => `<nav id="nav-header-menu" aria-label="${t("store.user_menu")}">');
content = content.replace('Crie a sua conta', '${t("store.login_create_account")}');
content = content.replace('Entre', '${t("store.login_enter")}');
content = content.replace('Compras', '${t("store.purchases")}');

content = content.replace('const getLoggedNavHTML = (firstName: string, initials: string) => `<nav id="nav-header-menu" aria-label="Menu do usuário">', 'const getLoggedNavHTML = (t: any, firstName: string, initials: string) => `<nav id="nav-header-menu" aria-label="${t("store.user_menu")}">');
content = content.replace('Meu perfil', '${t("store.my_profile")}');
content = content.replace('Histórico', '${t("store.history")}');
content = content.replace('Perguntas', '${t("store.questions")}');
content = content.replace('Opiniões', '${t("store.reviews")}');
content = content.replace('Empréstimos', '${t("store.loans")}');
content = content.replace('Assinaturas', '${t("store.subscriptions")}');
content = content.replace('Mercado Play', '${t("store.mplay")}');
content = content.replace('GRÁTIS', '${t("store.free").toUpperCase()}'); // Need store.free key? Let's use common
if (!content.includes('"store.free"')) {
    // I'll just keep GRÁTIS or add it to i18n
}
content = content.replace('Vender', '${t("store.sell")}');
content = content.replace('Sair', '${t("nav.logout")}');
content = content.replace('Minha conta', '${t("store.my_account")}');
content = content.replace('Favoritos', '${t("store.favorites")}');

// baseHeaderStart needs t
content = content.replace('const baseHeaderStart = `<header', 'const getBaseHeaderStart = (t: any) => `<header');
content = content.replace('Pular para', '${t("store.skip_to")}');
content = content.replace('Pular para o conteúdo', '${t("store.skip_to_content")}');
content = content.replace('Comentar sobre acessibilidade', '${t("store.a11y_feedback")}');
content = content.replace('Atalhos do teclado', '${t("store.keyboard_shortcuts")}');
content = content.replace('Buscar', '${t("store.search")}');
content = content.replace('Minhas compras', '${t("store.my_purchases")}');
content = content.replace('Carrinho', '${t("store.cart")}');
content = content.replace('Abrir/fechar o menu de atalhos', '${t("store.toggle_shortcut_menu")}');
content = content.replace('Para navegar entre os elementos, use as setas para cima ou para baixo do teclado.', '${t("store.shortcut_help")}');
content = content.replace('Mercado Livre Brasil - Onde comprar e vender de Tudo', '${t("store.ml_tagline")}');
content = content.replace('Digite o que você quer encontrar', '${t("store.search_label")}');
content = content.replace('Buscar produtos, marcas e muito mais…', '${t("store.search_placeholder")}');
content = content.replace('Informe seu', '${t("store.inform_zip_p1")}'); // Split it
content = content.replace(' CEP', ' ${t("store.inform_zip_p2")}'); 
content = content.replace('Categorias', '${t("store.categories")}');
content = content.replace('Ofertas', '${t("store.offers")}');
content = content.replace('Cupons', '${t("store.coupons")}');
content = content.replace('Supermercado', '${t("store.supermercado")}');
content = content.replace('Moda', '${t("store.fashion")}');
content = content.replace('Vender', '${t("store.sell")}');
content = content.replace('Contato', '${t("store.contact")}');

// Update getBaseHeaderEnd
content = content.replace('const getBaseHeaderEnd = (cartCount: number) => {', 'const getBaseHeaderEnd = (t: any, cartCount: number) => {');
content = content.replace('produtos em seu carrinho', '${t("store.items_in_cart")}');

// Update getHeaderHTML
content = content.replace('const getHeaderHTML = (isLoggedIn: boolean, firstName: string, initials: string, cartCount: number) => {', 'const getHeaderHTML = (t: any, isLoggedIn: boolean, firstName: string, initials: string, cartCount: number) => {');
content = content.replace('const navBlock = isLoggedIn ? getLoggedNavHTML(firstName, initials) : guestNavHTML;', 'const navBlock = isLoggedIn ? getLoggedNavHTML(t, firstName, initials) : getGuestNavHTML(t);');
content = content.replace('return baseHeaderStart + navBlock + getBaseHeaderEnd(cartCount);', 'return getBaseHeaderStart(t) + navBlock + getBaseHeaderEnd(t, cartCount);');

// Update component
content = content.replace('const { mascara } = props;', 'const { t } = useI18n();'); // Wait, props?
content = content.replace('const StoreDesktopHeader = ({ mascara }: StoreDesktopHeaderProps) => {', 'const StoreDesktopHeader = ({ mascara }: StoreDesktopHeaderProps) => {\n  const { t } = useI18n();');
content = content.replace('let headerHTML = getHeaderHTML(isLoggedIn, firstName, initials, cartCount);', 'let headerHTML = getHeaderHTML(t, isLoggedIn, firstName, initials, cartCount);');

fs.writeFileSync(componentsPath, content, 'utf8');
