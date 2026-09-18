const fs = require('fs');
const path = './src/components/StoreMobileHeader.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Add useI18n import
content = 'import { useI18n } from "@/contexts/I18nContext";\n' + content;

// 2. Refactor guestUserInfoHTML
content = content.replace('const guestUserInfoHTML = `', 'const getGuestUserInfoHTML = (t: any) => `');
content = content.replace('Bem-vindo', '${t("store.welcome")}');
content = content.replace('Entra na sua conta para ver suas compras, favoritos etc.', '${t("store.login_welcome_desc")}');
content = content.replace('Entre', '${t("store.login_enter")}');
content = content.replace('Crie a sua conta', '${t("store.login_create_account")}');

// 3. Refactor getLoggedUserInfoHTML
content = content.replace('const getLoggedUserInfoHTML = (firstName: string, initials: string) => `', 'const getLoggedUserInfoHTML = (t: any, firstName: string, initials: string) => `');
content = content.replace('Meu perfil', '${t("store.my_profile")}');

// 4. Refactor getHeaderHTML
content = content.replace('const getHeaderHTML = (isLoggedIn: boolean, firstName: string, initials: string, cartCount: number) => {', 'const getHeaderHTML = (t: any, isLoggedIn: boolean, firstName: string, initials: string, cartCount: number) => {');
content = content.replace('const userInfoBlock = isLoggedIn ? getLoggedUserInfoHTML(firstName, initials) : guestUserInfoHTML;', 'const userInfoBlock = isLoggedIn ? getLoggedUserInfoHTML(t, firstName, initials) : getGuestUserInfoHTML(t);');
content = content.replace('Mercado Livre Brasil - Onde comprar e vender de Tudo', '${t("store.ml_tagline")}');
content = content.replace('Menu do usuário', '${t("store.user_menu")}');
content = content.replace('<span>Início</span>', '<span>${t("nav.home")}</span>');
content = content.replace('<span>Ofertas</span>', '<span>${t("store.offers")}</span>');
content = content.replace('<span>Mercado Play</span>', '<span>${t("store.mplay")}</span>');
content = content.replace('Grátis', '${t("store.free")}');
content = content.replace('<span>Histórico</span>', '<span>${t("store.history")}</span>');
content = content.replace('<span>Contato</span>', '<span>${t("store.contact")}</span>');
content = content.replace('<span>Supermercado</span>', '<span>${t("store.supermercado")}</span>');
content = content.replace('<span>Moda</span>', '<span>${t("store.fashion")}</span>');
content = content.replace('<span>Mais vendidos</span>', '<span>${t("store.best_sellers")}</span>');
content = content.replace('Novo', '${t("store.novo")}');
content = content.replace('<span>Compra Internacional</span>', '<span>${t("store.compra_internacional")}</span>');
content = content.replace('<span>Lojas oficiais</span>', '<span>${t("store.official_stores")}</span>');
content = content.replace('<summary><i class="nav-icon-categories-mobile"></i>Categorias</summary>', '<summary><i class="nav-icon-categories-mobile"></i>${t("store.categories")}</summary>');
content = content.replace('<span>Resumo</span>', '<span>${t("store.resumo")}</span>');
content = content.replace('<span>Vender</span>', '<span>${t("store.sell")}</span>');
content = content.replace('<span>Compre e venda com o app!</span>', '<span>${t("store.download_app")}</span>');
content = content.replace('Digite o que você quer encontrar', '${t("store.search_label")}');
content = content.replace('placeholder="Estou buscando…"', 'placeholder="${t("store.search_placeholder")}"');
content = content.replace('Limpar', '${t("store.clear")}'); // Need store.clear key
content = content.replace('Fechar', '${t("store.close")}'); // Need store.close key
content = content.replace('produtos em seu carrinho', '${t("store.items_in_cart")}');
content = content.replace('Informe seu', '${t("store.inform_zip_p1")}');
content = content.replace(' CEP', ' ${t("store.inform_zip_p2")}');

// 5. Update Component
content = content.replace('const StoreMobileHeader = ({ mascara }: StoreMobileHeaderProps) => {', 'const StoreMobileHeader = ({ mascara }: StoreMobileHeaderProps) => {\n  const { t } = useI18n();');
content = content.replace('let html = getHeaderHTML(isLoggedIn, firstName, initials, cartCount);', 'let html = getHeaderHTML(t, isLoggedIn, firstName, initials, cartCount);');

fs.writeFileSync(path, content, 'utf8');
