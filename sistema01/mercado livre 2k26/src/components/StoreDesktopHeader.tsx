import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import type { MascaraSettings } from "@/hooks/useMascara";

const getGuestNavHTML = () => `<nav id="nav-header-menu" aria-label="Menu do usuário"><ul class="nav-header-menu-list"><li class="user-menu-guest-item"><a data-link-id="registration" rel="nofollow">Crie a sua conta</a></li><li class="user-menu-guest-item"><a data-link-id="login" rel="nofollow">Entre</a></li><li class="user-menu-guest-item"><a data-link-id="purchases" rel="nofollow">Compras</a></li></ul></nav>`;

const getLoggedNavHTML = (firstName: string, initials: string) => `<nav id="nav-header-menu" aria-label="Menu do usuário">
        <ul class="nav-header-menu-list">
            <li class="nav-header-menu-list__item">
                <div class="nav-header-user"><label for="nav-header-user-switch"><a
                            class="nav-header-user-myml"
                            aria-expanded="false" role="button" aria-label="${firstName}, menu"><span
                                class="nav-header-usermenu-wrapper"><span aria-hidden="true"
                                    class="nav-header-avatar-user" data-js="user-menu:nav-header-avatar-user">
                                    <div class="nav-header-profile-evolution__container">
                                        <div class="nav-header-profile-evolution__user-initials">${initials}</div>
                                    </div>
                                </span><span class="nav-header-username">${firstName}</span><span
                                    class="nav-header-username-chevron"></span></span></a></label><input type="checkbox"
                        id="nav-header-user-switch">
                    <nav class="nav-header-user-layer user-menu user-menu--rounded-4 user-menu__one-column user-menu--hidden"
                        tabindex="-1" aria-label="${firstName}, menu" aria-modal="true" role="dialog"
                        style="right: -97.3333px;" hidden="hidden">
                        <div class="user-menu__main">

                            <div class="user-menu__user-info-outer-container user-menu__user-with-loyalty">
                                <div class="user-menu__user-info-inner-container">

                                    <div class="user-menu__user-badge user-menu__user-badge--center">

                                        <a class="user-menu-evolution" role="button"
                                            aria-label="Imagem do perfil, ${firstName}, Meu perfil">
                                            <div class="user-menu-evolution__user-badge-image">
                                                <div class="user-menu-evolution__user-initials">${initials}</div>

                                            </div>

                                            <div class="user-menu-evolution__user-badge-title">${firstName}</div>
                                            <div class="user-menu-evolution__user-action-label">Meu perfil<span
                                                    class="user-menu-evolution__user-badge-email-chevron"></span></div>
                                        </a>

                                    </div>

                                    <div class="user-menu__user-pill--evolution">
                                        <a class="user-menu__user-pill-anchor">
                                            <img src="https://http2.mlstatic.com/resources/frontend/statics/loyal/partners/meliplus/drawer/pill_drawer_melimas_mp_mlb_no_price_large_new_value_prop@3x.png"
                                                alt="DRAWER_PILL_PROMOTIONAL_ADQUISITION" decoding="async"
                                                class="user-menu__user-pill-image">
                                        </a>
                                    </div>
                                </div>
                            </div>




                            <ul class="user-menu__shortcuts">
                                <li><span class="user-menu__shortcuts-separator"></span>
                                    <a data-id="purchases" rel="nofollow">
                                        Minhas compras

                                    </a>
                                </li>
                                <li>
                                    <a data-id="navigation" rel="nofollow">
                                        Histórico

                                    </a>
                                </li>
                                <li>
                                    <a data-id="questions" rel="nofollow">
                                        Perguntas

                                    </a>
                                </li>
                                <li>
                                    <a data-id="my-reviews" rel="nofollow">
                                        Opiniões

                                    </a>
                                </li>
                                <li><span class="user-menu__shortcuts-separator"></span>
                                    <a data-id="credits" rel="nofollow">
                                        Empréstimos

                                    </a>
                                </li>
                                <li>
                                    <a data-id="subscriptions" rel="nofollow">
                                        Assinaturas

                                    </a>
                                </li>
                                <li>
                                    <a data-id="mplay" rel="nofollow">
                                        Mercado Play
                                        <span class="user-menu__shortcuts-tag mplay">GRÁTIS</span>
                                    </a>
                                </li>
                                <li><span class="user-menu__shortcuts-separator"></span>
                                    <a data-id="sell" rel="nofollow">
                                        Vender

                                    </a>
                                </li>
                                <li><span class="user-menu__shortcuts-separator"></span>
                                    <a data-id="logout" rel="nofollow">
                                        Sair

                                    </a>
                                </li>
                            </ul>

                        </div>
                        <div class="user-menu__old">
                            <a rel="nofollow">Minha conta</a><a rel="nofollow">Sair</a>
                        </div>
                        <span class="user-menu__chevron" style="right: 93px;"></span>
                    </nav>
                </div>
            </li>
            <li class="nav-header-menu-list__item">
                <a data-link-id="purchases" rel="nofollow">Minhas compras</a>
            </li>
            <li class="nav-header-menu-list__item">
                <a data-link-id="favorites" rel="nofollow">Favoritos</a>
            </li>
        </ul>
    </nav>`;

const getBaseHeaderStart = () => `<header role="banner" data-siteid="MLB" class="nav-header nav-header-plus ui-navigation-v2"><div class="nav-bounds nav-bounds-with-cart"><div class="nav-header-plus-logo nav-area nav-top-area nav-left-area"><style type="text/css">.nav-assistant{border:0;border-radius:8px;position:absolute;color:#0f1111;text-decoration:none;background:#fff;left:-10000px;width:1px;height:1px;overflow:hidden;z-index:-999}.nav-assistant:focus,.nav-assistant:focus-within,.nav-assistant.nav-assistant-visible{border:1px solid #d5d9d9;box-shadow:0 2px 5px rgba(15,17,17,.15);position:fixed;left:16px;top:16px;width:360px;height:auto;z-index:999;overflow:visible}.nav-assistant-heading{font-size:14px;font-weight:700;margin:16px 24px 8px;color:#0f1111}.nav-assistant-links-container{list-style:none;margin:0;padding:0 24px}.nav-assistant-list-item{margin:4px 0}.nav-assistant-link{color:black;text-decoration:none;display:block;padding:8px 16px;border-radius:8px;position:relative}.nav-assistant-link:hover{text-decoration:underline;background:#f7f7f7}.nav-assistant-link:focus{outline:2px solid #3484fa;outline-offset:-2px;background:#f7f7f7;text-decoration:none}.nav-assistant-separator{margin:16px 0;border:none;border-top:1px solid #d5d9d9}.keyboard-shortcuts-list-container{list-style:none;margin:0;padding:0 24px 16px}.keyboard-shortcut-container{display:flex;justify-content:space-between;align-items:center}.shortcut-name{color:#0f1111}.shortcut-keys-container{display:flex;align-items:center;gap:4px}.shortcut-key{background:#f0f2f2;border:1px solid #d5d9d9;border-radius:3px;padding:1px 4px;font-size:12px}.plus-sign-color{color:#565959}.shortcut-help-container{padding:8px 24px;background:#f7fafa;border-top:1px solid #d5d9d9}.shortcut-help-item-container{display:flex;gap:8px;align-items:flex-start}.shortcut-help-text{font-size:12px;color:#565959} .nav-assistant a:hover, .nav-assistant button:hover {text-decoration: none;}.shortcut-name:hover, .nav-assistant-link:hover {text-decoration: underline;} .shortcut-name {color: #3483FA;align-self: stretch;width: 100%;text-align: left;}</style><nav id="shortcut-menu" class="nav-assistant" aria-label="Menú de métodos abreviados" role="navigation" data-skip-link-target-text="Inicio del contenido principal" aria-hidden="false"><div id="nav-assistant-links-heading" class="nav-assistant-heading" role="heading" aria-level="2">Pular para</div><ul aria-labelledby="nav-assistant-links-heading" class="nav-assistant-links-container"><li class="nav-assistant-list-item"><a id="nav-assist-skip-to-main-content" aria-describedby="nav-assist-shortcut-help" class="nav-assistant-link"><span class="shortcut-name">Pular para o conteúdo</span></a></li><li class="nav-assistant-list-item"><a id="nav-assist-add-comment" aria-describedby="nav-assist-shortcut-help" tabindex="-1" class="nav-assistant-link"><span class="shortcut-name">Comentar sobre acessibilidade</span></a></li></ul><hr class="nav-assistant-separator" aria-hidden="true"><div id="nav-assist-shortcuts-heading" class="nav-assistant-heading" role="heading" aria-level="2">Atalhos do teclado</div><ul class="keyboard-shortcuts-list-container" id="nav-assist-shortcuts-container" aria-labelledby="nav-assist-shortcuts-heading"><li class="nav-assistant-list-item"><a id="nav-assist-search" tabindex="-1" class="nav-assistant-menu-item nav-assistant-link" data-shortcut-code="/"><div class="keyboard-shortcut-container"><span class="shortcut-name">Buscar</span><div class="shortcut-keys-container"><span class="shortcut-key">/</span></div></div></a></li><li class="nav-assistant-list-item"><a id="nav-assist-search" tabindex="-1" class="nav-assistant-menu-item nav-assistant-link" data-shortcut-code="P"><div class="keyboard-shortcut-container"><span class="shortcut-name">Minhas compras</span><div class="shortcut-keys-container"><span class="shortcut-key">P</span></div></div></a></li><li class="nav-assistant-list-item"><a id="nav-assist-search" tabindex="-1" class="nav-assistant-menu-item nav-assistant-link" data-shortcut-code="C"><div class="keyboard-shortcut-container"><span class="shortcut-name">Carrinho</span><div class="shortcut-keys-container"><span class="shortcut-key">C</span></div></div></a></li><li class="nav-assistant-list-item"><a id="nav-assist-search" tabindex="-1" class="nav-assistant-menu-item nav-assistant-link" data-shortcut-code="Z"><div class="keyboard-shortcut-container"><span class="shortcut-name">Abrir/fechar o menu de atalhos</span><div class="shortcut-keys-container"><span class="shortcut-key">Z</span></div></div></a></li></ul><div id="nav-assist-shortcut-help"><div class="shortcut-help-container"><div class="shortcut-help-item-container"><div class="icon-container"><i class="a-icon a-icon-info a-icon-mini shortcut-help-icon"></i></div><div class="help-text-container"><span class="shortcut-help-text">Para navegar entre os elementos, use as setas para cima ou para baixo do teclado.</span></div></div></div></div></nav><a class="nav-logo" style="background-image: url(https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp) !important;">Mercado Livre Brasil - Onde comprar e vender de Tudo</a></div><div class="nav-area nav-top-area nav-center-area"><form class="nav-search" role="search" method="GET"><label class="nav-header-visually-hidden" for="cb1-edit">Digite o que você quer encontrar</label><input type="text" class="nav-search-input" id="cb1-edit" placeholder="Buscar produtos, marcas e muito mais…" maxlength="120" autocapitalize="off" autocorrect="off" spellcheck="false" autocomplete="off" name="as_word" value="" aria-activedescendant="" aria-controls="sb-suggestions-1" aria-autocomplete="list" aria-expanded="false" role="combobox"><button type="submit" class="nav-search-btn"><div role="img" aria-label="Buscar" class="nav-icon-search"></div></button><div role="listbox" class="sb-suggestions" id="sb-suggestions-1" aria-hidden="true" style="top: 40px; width: 543px; position: absolute;"><ul role="group" class="sb-suggestions__list" id="cb1-list"></ul><div role="group" class="sb-suggestions__wrapper--additional" aria-label="lojas oficiais"><ul role="presentation" class="sb-suggestions__list--additional"></ul></div></div></form></div><div class="nav-area nav-top-area nav-right-area"><a class="exhibitor__picture"><img src="https://http2.mlstatic.com/D_NQ_818238-MLA109888870887_032026-OO.webp" alt="Meli+. Cashback com cartão de crédito Mercado Pago. Planos a partir de R$9,90 por mês."></a></div><div class="nav-header-plus-cp-wrapper nav-area nav-bottom-area nav-left-area"><a class="nav-header-cp-anchor" data-js="cp" data-modal-action="true" role="button" rel="nofollow"><span class="nav-menu-cp-send">Informe seu</span><span class="nav-menu-link-cp"> CEP</span></a><div class="nav-menu-item"><a class="nav-menu-cp nav-menu-cp-logged" data-js="cp" data-modal-action="true" role="button" rel="nofollow" aria-expanded="false" aria-haspopup="true"><span class="nav-menu-cp-send">Informe seu</span><span class="nav-menu-link-cp"> CEP</span></a></div></div><div class="nav-area nav-bottom-area nav-center-area"><div class="nav-menu"><ul class="nav-menu-list"><li class="nav-menu-item"><a class="nav-menu-categories-link" data-js="nav-menu-categories-trigger" role="button" aria-expanded="false" rel="">Categorias</a><div class="nav-categs" data-js="nav-categs" aria-label="Categorias" aria-modal="true" tabindex="-1" role="dialog" hidden="hidden"><ul class="nav-categs-departments" data-js="nav-categs-departments"><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Veículos</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Supermercado</a></li><li class="nav-categs-departments__list nav-categs-departments__list--dynamic"><a data-order="0" role="button" aria-expanded="false">Tecnologia</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Casa e Móveis</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Eletrodomésticos</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Esportes e Fitness</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Ferramentas</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Construção</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Indústria e Comércio</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Para seu Negócio</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Pet Shop</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Saúde</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Acessórios para Veículos</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Beleza e Cuidado Pessoal</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Moda</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Bebês</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Brinquedos</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Imóveis</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Internacional</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Produtos Sustentaveis</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Mais vendidos</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Lojas oficiais</a></li><li class="nav-categs-departments__list nav-categs-departments__list--static"><a>Ver mais categorias</a></li></ul><div class="nav-categs-detail" data-js="nav-categs-detail" aria-modal="true" data-order="0" tabindex="-1" role="dialog" aria-label="Tecnologia" hidden="hidden"><div class="nav-categs-detail__header"><div role="heading" aria-level="1">Tecnologia</div></div><div class="nav-categs-detail__body"><div class="nav-categs-detail__body-content"><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Celulares e Telefones</a></div><ul class="nav-categs-detail__categ-list"><li><a>Acessórios para Celulares</a></li><li><a>Peças para Celular</a></li></ul></div><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Informática</a></div><ul class="nav-categs-detail__categ-list"><li><a>Componentes para PC</a></li><li><a>Impressão</a></li><li><a>Acessórios para Notebook</a></li><li><a>Conectividade e Redes</a></li><li><a>Software</a></li><li><a>Computadores</a></li><li><a>Tablets e Acessórios</a></li></ul></div><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Câmeras e Acessórios</a></div><ul class="nav-categs-detail__categ-list"><li><a>Acessórios para Câmeras</a></li><li><a>Câmeras</a></li><li><a>Filmadoras</a></li></ul></div><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Eletrônicos, Áudio e Vídeo</a></div><ul class="nav-categs-detail__categ-list"><li><a>Acessórios para Áudio e Vídeo</a></li><li><a>Áudio Portátil e Acessórios</a></li><li><a>Componentes Eletrônicos</a></li><li><a>Equipamento para DJs</a></li><li><a>Som Automotivo</a></li><li><a>Drones e Acessórios</a></li><li><a>Acessórios para TV</a></li><li><a>Fones de Ouvido</a></li><li><a>Áudio</a></li><li><a>Projetores e Telas</a></li></ul></div><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Games</a></div><ul class="nav-categs-detail__categ-list"><li><a>Video Games</a></li><li><a>Fliperamas e Arcade</a></li><li><a>Digitais</a></li></ul></div><div class="nav-categs-detail__categ" data-type="undefined"><div class="nav-categs-detail__title" role="heading" aria-level="2"><a>Televisores</a></div><ul class="nav-categs-detail__categ-list"></ul></div></div></div></div></div></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Ofertas</a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="nofollow">Cupons</a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Supermercado</a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Moda</a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Mercado Play<span class="nav-link-tag nav-link-tag--small mplay">Grátis</span></a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Vender</a></li><li class="nav-menu-item"><a class="nav-menu-item-link" rel="">Contato</a></li></ul></div></div><div class="nav-header-plus-menu-wrapper nav-area nav-bottom-area nav-right-area">`;

const getBaseHeaderEnd = (cartCount: number) => {
  if (cartCount > 0) {
    return `<a title="Carrinho" class="nav-cart nav-cart-full" id="nav-cart"><i class="nav-icon-cart"></i><span class="nav-header-visually-hidden">${cartCount} itens no carrinho</span><span class="nav-icon-cart-quantity" aria-hidden="true">${cartCount}</span></a></div></div></header>`;
  }
  return `<a title="Carrinho" class="nav-cart nav-cart-empty" id="nav-cart"><i class="nav-icon-cart"></i><span class="nav-header-visually-hidden">Carrinho vazio</span><span class="nav-icon-cart-quantity" aria-hidden="true"></span></a></div></div></header>`;
};

const getHeaderHTML = (isLoggedIn: boolean, firstName: string, initials: string, cartCount: number) => {
  const navBlock = isLoggedIn ? getLoggedNavHTML(firstName, initials) : getGuestNavHTML();
  return getBaseHeaderStart() + navBlock + getBaseHeaderEnd(cartCount);
};

const CSS_URL = "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.21.0/mercadolibre/navigation-desktop.css";

import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import type { MascaraSettings } from "@/hooks/useMascara";

interface StoreDesktopHeaderProps {
  mascara?: MascaraSettings;
}

const StoreDesktopHeader = ({ mascara }: StoreDesktopHeaderProps) => {
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('store_logged_in') === 'true');
  const [userName, setUserName] = useState(() => localStorage.getItem('store_user_name') || '');
  const [cartCount, setCartCount] = useState(() => parseInt(localStorage.getItem('store_cart_count') || '0', 10));

  useEffect(() => {
    const handler = () => {
      setIsLoggedIn(localStorage.getItem('store_logged_in') === 'true');
      setUserName(localStorage.getItem('store_user_name') || '');
    };
    const cartHandler = () => {
      setCartCount(parseInt(localStorage.getItem('store_cart_count') || '0', 10));
    };
    window.addEventListener('storage', handler);
    window.addEventListener('store_login_changed', handler);
    window.addEventListener('store_cart_changed', cartHandler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('store_login_changed', handler);
      window.removeEventListener('store_cart_changed', cartHandler);
    };
  }, []);

  const normalizedFirstName = userName.trim().split(/\\s+/)[0] || 'celso';
  const firstName = normalizedFirstName;
  const initials = firstName.length >= 2
    ? `${firstName[0]}${firstName[firstName.length - 1]}`.toUpperCase()
    : 'CO';

  useEffect(() => {
    const id = "ml-nav-css";
    if (!document.getElementById(id)) {
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = CSS_URL;
      link.media = "(min-width: 768px)";
      document.head.appendChild(link);
    }

    const logo = containerRef.current?.querySelector('.nav-logo') as HTMLElement;
    const logoHandler = (e: Event) => { e.preventDefault(); navigate('/store'); };
    logo?.addEventListener('click', logoHandler);

    // Wire up cart icon click
    const cartIcon = containerRef.current?.querySelector('#nav-cart') as HTMLElement;
    const cartHandler = (e: Event) => { e.preventDefault(); navigate('/store/cart'); };
    cartIcon?.addEventListener('click', cartHandler);

    const searchForm = containerRef.current?.querySelector('.nav-search') as HTMLFormElement;
    const searchHandler = (e: Event) => {
      e.preventDefault();
      const input = searchForm?.querySelector('.nav-search-input') as HTMLInputElement;
      const q = input?.value?.trim();
      if (q) navigate(`/store/search?q=${encodeURIComponent(q)}`);
    };
    searchForm?.addEventListener('submit', searchHandler);

    const handlers: Array<{ el: Element; handler: (e: Event) => void }> = [];

    if (isLoggedIn) {
      // Wire up logout links
      const logoutLinks = containerRef.current?.querySelectorAll('[data-id="logout"]');
      logoutLinks?.forEach((link) => {
        const handler = (e: Event) => {
          e.preventDefault();
          localStorage.removeItem('store_logged_in');
          localStorage.removeItem('store_user_name');
          localStorage.removeItem('store_user_email');
          window.dispatchEvent(new Event('store_login_changed'));
          navigate('/store');
        };
        link.addEventListener('click', handler);
        handlers.push({ el: link, handler });
      });

      // Wire up logout in user-menu__old
      const oldLogoutLinks = containerRef.current?.querySelectorAll('.user-menu__old a');
      oldLogoutLinks?.forEach((link) => {
        if (link.textContent?.trim() === 'Sair') {
          const handler = (e: Event) => {
            e.preventDefault();
            localStorage.removeItem('store_logged_in');
            localStorage.removeItem('store_user_name');
            localStorage.removeItem('store_user_email');
            window.dispatchEvent(new Event('store_login_changed'));
            navigate('/store');
          };
          link.addEventListener('click', handler);
          handlers.push({ el: link, handler });
        }
      });

      // Wire up user menu toggle via checkbox
      const userSwitch = containerRef.current?.querySelector('#nav-header-user-switch') as HTMLInputElement;
      const userLayer = containerRef.current?.querySelector('.nav-header-user-layer') as HTMLElement;
      if (userSwitch && userLayer) {
        const toggleHandler = () => {
          if (userSwitch.checked) {
            userLayer.removeAttribute('hidden');
            userLayer.classList.remove('user-menu--hidden');
          } else {
            userLayer.setAttribute('hidden', 'hidden');
            userLayer.classList.add('user-menu--hidden');
          }
        };
        userSwitch.addEventListener('change', toggleHandler);
        handlers.push({ el: userSwitch, handler: toggleHandler });
      }
    } else {
      const loginLinks = containerRef.current?.querySelectorAll('[data-link-id="login"]');
      const regLinks = containerRef.current?.querySelectorAll('[data-link-id="registration"]');
      loginLinks?.forEach((link) => {
        const handler = (e: Event) => {
          e.preventDefault();
          sessionStorage.setItem('store_login_referrer', window.location.pathname + window.location.search);
          navigate('/store/login');
        };
        link.addEventListener('click', handler);
        handlers.push({ el: link, handler });
      });
      regLinks?.forEach((link) => {
        const handler = (e: Event) => {
          e.preventDefault();
          sessionStorage.setItem('store_login_referrer', window.location.pathname + window.location.search);
          navigate('/store/login?register');
        };
        link.addEventListener('click', handler);
        handlers.push({ el: link, handler });
      });
    }

    return () => {
      logo?.removeEventListener('click', logoHandler);
      cartIcon?.removeEventListener('click', cartHandler);
      searchForm?.removeEventListener('submit', searchHandler);
      handlers.forEach(({ el, handler }) => el.removeEventListener('click', handler));
      const el = document.getElementById(id);
      if (el) el.remove();
    };
  }, [navigate, isLoggedIn, userName, cartCount]);

  let headerHTML = getHeaderHTML(isLoggedIn, firstName, initials, cartCount);
  if (mascara) {
    headerHTML = sanitizeStoreHTML(headerHTML, mascara);
  }

  return (
    <div ref={containerRef} className="hidden md:contents" dangerouslySetInnerHTML={{ __html: headerHTML }} />
  );
};

export default StoreDesktopHeader;
