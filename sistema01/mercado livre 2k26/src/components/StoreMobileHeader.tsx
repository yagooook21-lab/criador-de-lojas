import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import type { MascaraSettings } from "@/hooks/useMascara";

const getGuestUserInfoHTML = () => `
<div id="nav-header-menu-mobile-user-info" class="nav-header-menu-mobile-guest">
  <div class="nav-header-menu-mobile-guest-logo">
    <svg class="nav-header-menu-mobile-guest-icon" width="28" height="35" xmlns="http://www.w3.org/2000/svg">
      <path d="M27.343 33.706l-1.356.64A13.25 13.25 0 0 0 14 26.75c-5.17 0-9.8 2.988-11.978 7.578l-1.356-.643A14.75 14.75 0 0 1 14 25.25a14.75 14.75 0 0 1 13.343 8.456zM14 21.75C8.063 21.75 3.25 16.937 3.25 11S8.063.25 14 .25 24.75 5.063 24.75 11 19.937 21.75 14 21.75zm0-1.5a9.25 9.25 0 1 0 0-18.5 9.25 9.25 0 0 0 0 18.5zm0-2.5v-1.5a5.25 5.25 0 1 0 0-10.5v-1.5a6.75 6.75 0 0 1 0 13.5z" fill="#BBB" fill-rule="nonzero"></path>
    </svg>
  </div>
  <p class="nav-header-menu-mobile-guest-title">Bem-vindo</p>
  <p class="nav-header-menu-mobile-guest-text">Entre para ver seus benefícios e o status das suas compras.</p>
  <div class="nav-header-menu-mobile-guest-buttons">
    <ul>
      <li><a rel="nofollow" class="nav-mobile-button nav-mobile-button-filled">Entre</a></li>
      <li><a rel="nofollow" class="nav-mobile-button nav-mobile-button-outline">Crie a sua conta</a></li>
    </ul>
  </div>
</div>`;

const getLoggedUserInfoHTML = (firstName: string, initials: string) => `
<div id="nav-header-menu-mobile-user-info" class="nav-header-menu-mobile-with-loyalty--evolution" style="height:auto">
    <div style="min-height:auto"><a class="nav-header-mobile-profile-evolution" role="button" aria-label="Imagem do perfil, ${firstName}, Meu perfil">
            <div class="nav-header-mobile-profile-evolution__image-container">
                <div class="nav-header-mobile-profile-evolution__user-initials">${initials}</div>
            </div>
            <div class="nav-header-mobile-profile-evolution__user-greeting">${firstName}</div><span
                class="nav-header-mobile-profile-evolution__action-label">Meu perfil<svg
                    class="nav-header-mobile-profile-evolution-link-icon" xmlns="http://www.w3.org/2000/svg" width="7"
                    height="10" viewBox="0 0 7 10">
                    <path class="nav-header-mobile-profile-evolution__arrow-right" fill="none" fill-rule="evenodd"
                        stroke-width="1.5" d="M1.017 9.032l4.015-4.024L1.017.983"></path>
                </svg></span>
        </a>
        <div style="margin-top:18px"><a
                href="//www.mercadolivre.com.br/assinaturas/melimais?origin=drawer_pill#origin=drawer_pill"><img
                    style="width:100%;height:100%;max-height:100px;object-fit:cover" decoding="async"
                    src="https://http2.mlstatic.com/resources/frontend/statics/loyal/partners/meliplus/drawer/pill_drawer_melimas_mp_mlb_no_price_large_new_value_prop@3x.png"
                    alt="DRAWER_PILL_PROMOTIONAL_ADQUISITION"></a></div>
    </div>
</div>`;

const getHeaderHTML = (isLoggedIn: boolean, firstName: string, initials: string, cartCount: number, isSpaActive: boolean) => {
  const userInfoBlock = isLoggedIn ? getLoggedUserInfoHTML(firstName, initials) : getGuestUserInfoHTML();

  const searchPlaceholder = isSpaActive ? "Buscar no Mercado Livre" : "Buscar produtos, marcas e muito mais";
  const shippingLabel = isSpaActive ? "Digite seu CEP" : "Enviar para";
  const cartIconHTML = isSpaActive 
    ? `<i class="nav-icon-notifications"><span>Avisos</span></i>`
    : `<i class="nav-icon-cart"></i>`;

  return `
<header role="banner" data-siteid="MLB" class="nav-header nav-header-plus ui-navigation-v2" style="display: revert;">
  <div class="nav-bounds nav-bounds-with-cart">
    <a class="nav-logo" style="background-image: url(https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/logo__small@2x.png) !important;">Mercado Livre</a>
    <div class="nav-header-menu-wrapper">
      <button class="nav-header-menu-switch" aria-label="Menu do usuário" aria-expanded="false">
        <span>
          <span class="hamburger-top-bread"></span>
          <span class="hamburger-patty"></span>
          <span class="hamburger-bottom-bread"></span>
        </span>
      </button>
      <nav id="nav-header-menu-mobile" class="${isLoggedIn ? 'nav-header-menu-mobile-logged' : 'nav-header-menu-mobile-guest'}" aria-label="Menu do usuário" aria-modal="true" role="dialog">
        <div id="nav-header-menu-mobile-content">
          ${userInfoBlock}
          <ul>
            <li><a><i class="nav-icon-home"></i><span>Início</span></a></li>
            <li><a><i class="nav-icon-deals-mobile"></i><span>Ofertas</span></a></li>
            <li><a><i class="nav-icon-mplay-mobile"></i><span>Mercado Play</span><span class="nav-link-tag mplay">GRÁTIS</span></a></li>
            <li><a><i class="nav-icon-history-mobile"></i><span>Histórico</span></a></li>
            <li><a><i class="nav-icon-help-mobile"></i><span>Contato</span></a></li>
          </ul>
          <ul>
            <li><a><i class="nav-icon-supermercado"></i><span>Supermercado</span></a></li>
            <li><a><i class="nav-icon-moda-mobile"></i><span>Moda</span></a></li>
            <li><a><i class="nav-icon-best-sellers-mobile"></i><span>Mais vendidos</span><span class="nav-link-tag bestSellers">Novo</span></a></li>
            <li><a><i class="nav-icon-compra-internacional"></i><span>Compra Internacional</span><span class="nav-link-tag compraInternacional">Novo</span></a></li>
            <li><a><i class="nav-icon-stores-mobile"></i><span>Lojas oficiais</span></a></li>
            <li>
              <details>
                <summary><i class="nav-icon-categories-mobile"></i>Categorias</summary>
                <ul class="nav-categs-departments-mobile">
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Veículos</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Supermercado</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--dynamic">
                    <details class="nav-categs-departments-mobile__details">
                      <summary class="nav-categs-departments-mobile__summary">Tecnologia</summary>
                      <ul class="nav-categs-departments-mobile__categories">
                        <li class="nav-categs-departments-mobile-item"><a>Celulares e Telefones</a></li>
                        <li class="nav-categs-departments-mobile-item"><a>Informática</a></li>
                        <li class="nav-categs-departments-mobile-item"><a>Câmeras e Acessórios</a></li>
                        <li class="nav-categs-departments-mobile-item"><a>Eletrônicos, Áudio e Vídeo</a></li>
                        <li class="nav-categs-departments-mobile-item"><a>Games</a></li>
                        <li class="nav-categs-departments-mobile-item"><a>Televisores</a></li>
                      </ul>
                    </details>
                  </li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Casa, Móveis e Decoração</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Eletrodomésticos</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Esportes e Fitness</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Ferramentas</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Construção</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Indústria e Comércio</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Agro</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Animais de Estimação</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Saúde</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Acessórios para Veículos</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Beleza e Cuidado Pessoal</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Calçados, Roupas e Bolsas</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Bebês</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Brinquedos e Hobbies</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Imóveis</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Compra Internacional</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Produtos Sustentáveis</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Mais vendidos</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Lojas oficiais</a></li>
                  <li class="nav-categs-departments-mobile__list nav-categs-departments-mobile__list--static"><a>Ver mais categorias</a></li>
                </ul>
              </details>
            </li>
          </ul>
          <ul>
            <li><a><i class="nav-icon-summary-mobile"></i><span>Resumo</span></a></li>
            <li><a><i class="nav-icon-vender-mobile"></i><span>Vender</span></a></li>
          </ul>
          <ul>
            <li><a id="nav-header-menu-download-mobile"><i class="nav-icon-download-mobile"></i><span>Baixe o app do Mercado Livre</span></a></li>
          </ul>
        </div>
      </nav>
    </div>
    <form class="nav-search" role="search">
      <label class="nav-header-visually-hidden" for="cb1-edit-mobile">Buscar por produtos, marcas e muito mais...</label>
      <input type="text" class="nav-search-input" id="cb1-edit-mobile" placeholder="${searchPlaceholder}" maxlength="120" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" name="as_word" value="" role="combobox" />
      <button class="nav-search-clear-btn" type="button" title="Limpar"></button>
      <button class="nav-search-close-btn" type="button" title="Fechar"></button>
      <button type="submit" class="nav-search-btn"><div role="img" aria-label="Buscar" class="nav-icon-search"></div></button>
    </form>
    ${cartCount > 0
      ? `<a title="Carrinho" class="nav-cart nav-cart-full" id="nav-cart-mobile">${cartIconHTML}<span class="nav-header-visually-hidden">${cartCount} itens no carrinho</span><span class="nav-icon-cart-quantity" aria-hidden="true">${cartCount}</span></a>`
      : `<a title="Carrinho" class="nav-cart nav-cart-empty" id="nav-cart-mobile">${cartIconHTML}<span class="nav-header-visually-hidden">Carrinho vazio</span><span class="nav-icon-cart-quantity" aria-hidden="true"></span></a>`
    }
    <a class="nav-header-cp-anchor nav-menu-cp nav-menu-cp-logged" role="button" rel="nofollow">
      <span class="nav-menu-cp-send">${shippingLabel}</span>
      <span class="nav-menu-link-cp"> Informe seu CEP</span>
    </a>
</header>`;
};

const MOBILE_CSS_URL = "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-mobile.css";

interface StoreMobileHeaderProps {
  mascara?: MascaraSettings;
  isSpaActive?: boolean;
}

const StoreMobileHeader = ({ mascara, isSpaActive = false }: StoreMobileHeaderProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [initials, setInitials] = useState("");
  const [cartCount, setCartCount] = useState(() => parseInt(localStorage.getItem('store_cart_count') || '0', 10));

  // Check login state
  useEffect(() => {
    const checkLogin = () => {
      const logged = localStorage.getItem('store_logged_in') === 'true';
      setIsLoggedIn(logged);
      if (logged) {
        const name = localStorage.getItem('store_user_name') || '';
        const parts = name.trim().split(/\\s+/);
        setFirstName(parts[0] || '');
        const ini = parts.length >= 2
          ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
          : (parts[0]?.[0] || '').toUpperCase();
        setInitials(ini);
      }
    };
    checkLogin();
    const handler = () => checkLogin();
    const cartHandler = () => setCartCount(parseInt(localStorage.getItem('store_cart_count') || '0', 10));
    window.addEventListener('store_login_changed', handler);
    window.addEventListener('storage', handler);
    window.addEventListener('store_cart_changed', cartHandler);
    return () => {
      window.removeEventListener('store_login_changed', handler);
      window.removeEventListener('storage', handler);
      window.removeEventListener('store_cart_changed', cartHandler);
    };
  }, []);

  useEffect(() => {
    const id = "ml-nav-mobile-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = MOBILE_CSS_URL;
      link.media = "(max-width: 767px)";
      document.head.appendChild(link);
    }

    const logo = containerRef.current?.querySelector('.nav-logo') as HTMLElement;
    const logoHandler = (e: Event) => { e.preventDefault(); navigate('/store'); };
    logo?.addEventListener('click', logoHandler);

    // Wire up cart icon click
    const cartIcon = containerRef.current?.querySelector('#nav-cart-mobile') as HTMLElement;
    const cartHandler = (e: Event) => { e.preventDefault(); navigate('/store/cart'); };
    cartIcon?.addEventListener('click', cartHandler);

    // Wire up search form
    const searchForm = containerRef.current?.querySelector('.nav-search') as HTMLFormElement;
    const searchHandler = (e: Event) => {
      e.preventDefault();
      const input = searchForm?.querySelector('.nav-search-input') as HTMLInputElement;
      const q = input?.value?.trim();
      if (q) navigate(`/store/search?q=${encodeURIComponent(q)}`);
    };
    searchForm?.addEventListener('submit', searchHandler);

    // Wire up "Entre" and "Crie a sua conta" buttons (guest only)
    const enterBtn = containerRef.current?.querySelector('.nav-mobile-button-filled');
    const createBtn = containerRef.current?.querySelector('.nav-mobile-button-outline');
    const loginHandlers: Array<{ el: Element; handler: (e: Event) => void }> = [];
    if (enterBtn) {
      const handler = (e: Event) => {
        e.preventDefault();
        sessionStorage.setItem('store_login_referrer', window.location.pathname + window.location.search);
        navigate('/store/login');
      };
      enterBtn.addEventListener('click', handler);
      loginHandlers.push({ el: enterBtn, handler });
    }
    if (createBtn) {
      const handler = (e: Event) => {
        e.preventDefault();
        sessionStorage.setItem('store_login_referrer', window.location.pathname + window.location.search);
        navigate('/store/login?register');
      };
      createBtn.addEventListener('click', handler);
      loginHandlers.push({ el: createBtn, handler });
    }

    // Wire up hamburger menu toggle
    const header = containerRef.current?.querySelector('.nav-header') as HTMLElement;
    let switchHandler: (() => void) | null = null;
    if (header) {
      const switchBtn = header.querySelector('.nav-header-menu-switch') as HTMLButtonElement;
      if (switchBtn) {
        switchHandler = () => {
          const expanded = switchBtn.getAttribute('aria-expanded') === 'true';
          if (expanded) {
            header.classList.remove('nav-header-menu-mobile-open');
            switchBtn.setAttribute('aria-expanded', 'false');
          } else {
            header.classList.add('nav-header-menu-mobile-open');
            switchBtn.setAttribute('aria-expanded', 'true');
          }
        };
        switchBtn.addEventListener('click', switchHandler);
      }
    }

    return () => {
      logo?.removeEventListener('click', logoHandler);
      cartIcon?.removeEventListener('click', cartHandler);
      searchForm?.removeEventListener('submit', searchHandler);
      loginHandlers.forEach(({ el, handler }) => el.removeEventListener('click', handler));
      if (header && switchHandler) {
        const switchBtn = header.querySelector('.nav-header-menu-switch');
        switchBtn?.removeEventListener('click', switchHandler);
      }
    };
  }, [navigate, isLoggedIn, firstName, cartCount]);

  let html = getHeaderHTML(isLoggedIn, firstName, initials, cartCount, isSpaActive);
  if (mascara) {
    html = sanitizeStoreHTML(html, mascara);
  }

  return (
    <div ref={containerRef} className="md:hidden" dangerouslySetInnerHTML={{ __html: html }} />
  );
};

export default StoreMobileHeader;
