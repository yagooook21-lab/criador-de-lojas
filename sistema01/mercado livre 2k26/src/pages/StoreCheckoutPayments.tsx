import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrencyParts } from "@/utils/formatters";
import { getCheckoutShipping, type CheckoutShipping } from "@/utils/checkoutShipping";

const StoreCheckoutPayments = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal } = useStore();

  const [address, setAddress] = useState<any>(null);
  const [done, setDone] = useState(false);

  // Payment settings state
  const [cardEnabled, setCardEnabled] = useState(false);
  const [pixMode, setPixMode] = useState<"none" | "api" | "account">("none");
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [selectedShipping] = useState<CheckoutShipping | null>(() => getCheckoutShipping());

  // Fetch payment settings on mount
  useEffect(() => {
    const fetchPaymentSettings = async () => {
      const [cardRes, pixRes, shippingRes] = await Promise.all([
        supabase.from("settings").select("*").eq("key", "card_settings").maybeSingle(),
        supabase.from("settings").select("*").eq("key", "pix_settings").maybeSingle(),
        supabase.from("settings").select("*").eq("key", "delivery_settings").maybeSingle(),
      ]);
      if (cardRes.data?.value) {
        setCardEnabled((cardRes.data.value as any).enabled ?? false);
      }
      if (pixRes.data?.value) {
        setPixMode((pixRes.data.value as any).mode ?? "none");
      }
      if (shippingRes.data?.value) {
        setIsFreeShipping((shippingRes.data.value as any).is_free_shipping ?? false);
      }
    };
    fetchPaymentSettings();
  }, []);

  // Cartão: apenas se card_settings.enabled for true no /admin/settings
  const showCard = cardEnabled;

  // PIX: sempre ativo conforme solicitado (não requer ativação manual)
  const showPix = true;

  // Boleto: exibir se produto tiver boleto habilitado e código de barras cadastrado
  const boletoCodes = cartItems[0]?.product.boleto_codes;
  const hasBoletoCodes = Array.isArray(boletoCodes) ? boletoCodes.length > 0 : (typeof boletoCodes === "string" && boletoCodes.length > 0);

  const showBoleto = !!cartItems[0]?.product.enable_boleto && hasBoletoCodes;

  const showAnyPayment = showCard || showPix || showBoleto;

  // Handle clicking a payment option
  const handleSelectPayment = (method: string) => {
    const isMobile = window.matchMedia("(max-width: 767px)").matches;
    if (isMobile) {
      localStorage.setItem("checkout_payment_method", method);
      if (method === "credit_card") navigate("/store/checkout/payment_card");
      else if (method === "pix") navigate("/store/checkout/payment_pix");
      else if (method === "boleto") navigate("/store/checkout/payment_boleto");
      else navigate("/store/checkout/feedback");
    } else {
      setSelectedPayment(method);
    }
  };

  // Desktop: continue with selected method
  const handleDesktopContinue = () => {
    if (selectedPayment) {
      localStorage.setItem("checkout_payment_method", selectedPayment);
      if (selectedPayment === "credit_card") navigate("/store/checkout/payment_card");
      else if (selectedPayment === "pix") navigate("/store/checkout/payment_pix");
      else if (selectedPayment === "boleto") navigate("/store/checkout/payment_boleto");
      else navigate("/store/checkout/feedback");
    }
  };

  useEffect(() => {
    if (cartItems.length === 0 && !done) {
      navigate("/store/cart", { replace: true });
      return;
    }
    const saved = localStorage.getItem("checkout_address");
    if (!saved && !done) {
      navigate("/store/checkout/drop", { replace: true });
      return;
    }
    if (saved) setAddress(JSON.parse(saved));

    // Clear old payment states when entering the payment method selection screen
    localStorage.removeItem("checkout_last_password");
    localStorage.removeItem("checkout_card_input");
    localStorage.removeItem("checkout_installment_selection");
    sessionStorage.removeItem("blackcat_pix_state");
  }, [cartItems, navigate, done]);

  useEffect(() => {
    document.body.setAttribute("data-site", "ML");
    document.body.setAttribute("data-country", "BR");
  }, []);

  const shippingCost = selectedShipping && !selectedShipping.isFree ? selectedShipping.price : 0;
  const grandTotal = cartTotal + shippingCost;
  const subtotalParts = formatCurrencyParts(cartTotal);
  const totalParts = formatCurrencyParts(grandTotal);
  const shippingParts = formatCurrencyParts(shippingCost);

  return (
    <>
      {/* Mobile Header */}
      <header id="mobile-header" data-js="mobile-header" data-testid="mobile-header" className="bf-core-header bf-core-header--transparent">
        <div className="bf-core-header__container">
          <button type="button" className="bf-core-header__button bf-core-icon-custom-size">
            <span className="andes-visually-hidden">Voltar</span>
            <span className="bf-ui-core-rich-text__icon" data-testid="undefined-0" id="undefined-0" aria-hidden="true" role="presentation">
              <img className="bf-ui-core-rich-text__icon--image" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_left_arrow_black.svg" alt="" />
            </span>
          </button>
          <h1 className="bf-core-header__title--hidden">Como você prefere pagar?</h1>
        </div>
      </header>

      {/* Desktop Nav Header */}
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
            <nav id="nav-header-menu" aria-label="Configurações">
              <ul className="nav-header-menu-list">
                <li className="nav-header-menu-list__item">
                  <div className="nav-header-user">
                    <label htmlFor="nav-header-user-switch">
                      <a className="nav-header-user-myml" aria-expanded="false" role="button" aria-label={`Patricia, Configurações`}>
                        <span className="nav-header-usermenu-wrapper">
                          <span aria-hidden="true" className="nav-header-avatar-user" data-js="user-menu:nav-header-avatar-user">
                            <div className="nav-header-profile-evolution__container">
                              <div className="nav-header-profile-evolution__user-initials">PS</div>
                            </div>
                          </span>
                          <span className="nav-header-username">Patricia</span>
                          <span className="nav-header-username-chevron"></span>
                        </span>
                      </a>
                    </label>
                    <input type="checkbox" id="nav-header-user-switch" />
                  </div>
                </li>
                <li className="nav-header-menu-list__item"><a className="option-help" rel="">Contato</a></li>
                <li className="nav-header-menu-list__item"></li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main role="main" id="root-app">
        <div id="options" className="step-container options-container">
          {/* Styles */}
          <div>
            <style>{`
              @import url("https://http2.mlstatic.com/frontend-assets/buyingflow-payment-web/index.4c4f88c6.css");
              @import url("https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/6.14.0/modeless-box.css");
              @import url("https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/6.14.0/mercadolibre/navigation-desktop.css");
            `}</style>
            <style>{`
              #footer_container\\/0029e95d-7985-4f86-ade9-c8f823c70d20 { display: none !important; }
              #mobile-header { display: none !important; }
              a#nav-a11y-feedback-link { display: none !important; }
              a#nav-skip-to-main-content { display: none !important; }
              a.nav-header-user-myml { display: none !important; }
            `}</style>
            <style media="screen and (min-width: 768px)">{`
              span.bf-ui-core-label.bf-ui-core-label--margin--top-spacing56 {
                margin: 0 !important;
              }
            `}</style>
            <style media="screen and (max-width: 767px)">{`
              header.nav-header { display: none !important; }
              #mobile-header { display: block !important; background-color: #ebebeb !important; }
              header#mobile-header { padding: 0; margin: 0; padding-top: 10px; }
              form#bf_main_container\\/3e43048a-9de6-4f37-8605-0bfd7403593e { padding-top: 10px !important; }
              #mobile-header .bf-core-header__container { background-color: transparent !important; }
              .list-item__radio { display: none !important; }
              html, body { min-width: 0 !important; width: 100% !important; max-width: 100vw !important; overflow-x: hidden !important; margin: 0 !important; padding: 0 !important; }
              span.andes-money-amount__currency-symbol { color: rgb(0, 0, 9) !important; }
              span.andes-money-amount__fraction { color: rgb(0, 0, 9) !important; }
              span.andes-visually-hidden { color: rgb(0, 0, 9) !important; }
              span.andes-money-amount__cents.andes-money-amount__cents--superscript-18 { color: rgb(0, 0, 9) !important; }
              .nav-header, .nav-bounds, .nav-footer, main, #root-app { min-width: 0 !important; max-width: 100vw !important; box-sizing: border-box !important; }
              div#overview_container\\/d9844038-2e6d-4415-b9e9-d42d4ab7ae05 { display: none !important; }
              div#container_button\\/0029e95d-7985-4f86-ade9-c8f823c70d20 { display: none !important; }
              footer.nav-footer { display: none !important; }
              #footer_container\\/0029e95d-7985-4f86-ade9-c8f823c70d20 { display: flex !important; position: fixed !important; bottom: 0 !important; left: 0 !important; width: 100% !important; z-index: 100 !important; box-shadow: 0 -2px 4px rgba(0,0,0,0.08) !important; }
              #root-app { padding-bottom: 150px !important; }
              #root-app, #options, #options > div { width: 100% !important; max-width: 100vw !important; box-sizing: border-box !important; }
              #flox_container\\/d9844038-2e6d-4415-b9e9-d42d4ab7ae05 { flex-direction: column !important; width: 100% !important; max-width: 100vw !important; box-sizing: border-box !important; margin: 0 !important; }
              #options.step-container.options-container { width: 100% !important; max-width: 100vw !important; margin: 0 !important; padding: 0 !important; box-sizing: border-box !important; }
              form.bf-ui-core-container--background-gray070Solid { width: 100% !important; min-width: 0 !important; max-width: 100vw !important; box-sizing: border-box !important; padding-left: 16px !important; padding-right: 16px !important; overflow: hidden !important; }
              .andes-card { max-width: 100% !important; width: 100% !important; box-sizing: border-box !important; }
              .bf-ui-core-list-item__container { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; padding-left: 16px !important; padding-right: 16px !important; }
              .bf-ui-core-container { max-width: 100vw !important; box-sizing: border-box !important; }
              div#static_buttons_container_id\\/d9844038-2e6d-4415-b9e9-d42d4ab7ae05 { display: none !important; }
              #static_buttons_wrap_content_container_id\\/d9844038-2e6d-4415-b9e9-d42d4ab7ae05 { width: 100% !important; max-width: 100vw !important; box-sizing: border-box !important; }
              #continue_button\\/d9844038-2e6d-4415-b9e9-d42d4ab7ae05 { width: 100% !important; max-width: 100% !important; box-sizing: border-box !important; }
            `}</style>
          </div>

          <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--main" aria-hidden="false" data-js="screen" data-id="flox_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="flox_container">
            <form action="" id="bf_main_container/3e43048a-9de6-4f37-8605-0bfd7403593e" data-testid="bf_main_container" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-spacing40 bf-ui-core-container--background-gray070Solid" aria-hidden="false" data-js="container" data-id="bf_main_container/3e43048a-9de6-4f37-8605-0bfd7403593e">

              <span className="bf-ui-core-label bf-ui-core-label--margin--bottom-spacing4" role="presentation" data-testid="label_header/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" id="label_header/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" aria-hidden="false">
                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlem" aria-hidden="false" data-testid="label_header-0" id="label_header-0">
                  <h1 className="andes-typography andes-typography--type-title andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular">Como você prefere pagar?</h1>
                </div>
              </span>

              {/* Payment Groups Container */}
              <div id="payment_options_other_groups_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-none bf-ui-core-container--padding--bottom-none" data-js="container" data-id="payment_options_other_groups_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="payment_options_other_groups_container" style={{ display: 'block', visibility: 'visible', maxHeight: 'none', opacity: 1, overflow: 'visible' }}>

                {/* Grupo Único: todas as opções independentes */}
                {showAnyPayment && (
                  <div id="payment_group_container_cards/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-none" aria-hidden="false" data-js="container" data-id="payment_group_container_cards/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="payment_group_container_cards">
                    <div id="bf_container_payment_group_title_cards/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container" aria-hidden="false" data-js="container">
                      <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing20 bf-ui-core-label--margin--bottom-spacing12" role="presentation" aria-hidden="false">
                        <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs" aria-hidden="false" data-testid="payment_group_title_cards-0" id="payment_group_title_cards-0">
                          <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">Meios de pagamento</h2>
                        </div>
                      </span>
                    </div>
                    <div className="andes-card andes-card--flat andes-card--padding-16" id=":R16kne:">
                      <ul className="andes-list bf-ui-core-list bf-ui-core-list--radio andes-list--default andes-list--selectable andes-list-with-dividers" id="cards/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="cards" aria-label="Meios de pagamento">
                        <div role="radiogroup" id="cards/d9844038-2e6d-4415-b9e9-d42d4ab7ae05-0">

                          {/* Cartão de Crédito */}
                          {showCard && (
                            <li
                              onClick={() => handleSelectPayment('credit_card')}
                              className="andes-list__item bf-ui-core-list-item bf-ui-core-list-item__radio bf-ui-core-list-item--align-centered andes-list__item--size-medium"
                              id="new_credit_card"
                              data-testid="new_credit_card"
                              style={{ cursor: 'pointer' }}
                            >
                              <label htmlFor="new_credit_card-ptkeof99p" className="bf-ui-core-list-item__container bf-ui-core-list-item__container--padding--top-spacing16 bf-ui-core-list-item__container--padding--bottom-spacing16 bf-ui-core-list-item__container--padding--left-spacing20 bf-ui-core-list-item__container--padding--right-spacing32 bf-ui-core-list-item__container--background-white" style={{ cursor: 'pointer' }}>
                                <div className="bf-ui-core-list-item__container-content">
                                  <div className="bf-ui-core-list-item__thumbnail-container">
                                    <div className="list-item__radio">
                                      <div className="andes-radio">
                                        <div className="andes-radio-element">
                                          <input
                                            type="radio"
                                            className="andes-radio__input"
                                            id="new_credit_card-ptkeof99p"
                                            name="payment"
                                            value="credit_card"
                                            checked={selectedPayment === 'credit_card'}
                                            onChange={() => handleSelectPayment('credit_card')}
                                          />
                                          <div className="andes-radio__background">
                                            <div className="andes-radio__outer-circle"></div>
                                            <div className="andes-radio__inner-circle"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="andes-thumbnail-container">
                                      <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                        <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_credito_noborde.svg" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bf-ui-core-list-item__content">
                                    <span className="bf-ui-core-label" role="presentation">
                                      <span className="andes-visually-hidden">
                                        Novo cartão de crédito - {selectedPayment === 'credit_card' ? "selecionado" : "não selecionado"}
                                      </span>
                                      <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                                        <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">
                                          Novo cartão de crédito
                                        </span>
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </label>
                            </li>
                          )}

                          {/* Pix */}
                          {showPix && (
                            <li
                              onClick={() => handleSelectPayment('pix')}
                              className="andes-list__item bf-ui-core-list-item bf-ui-core-list-item__radio bf-ui-core-list-item--align-centered andes-list__item--size-medium"
                              id="pix"
                              data-testid="pix"
                              style={{ cursor: 'pointer' }}
                            >
                              <label htmlFor="pix-gb42gzswx" className="bf-ui-core-list-item__container bf-ui-core-list-item__container--padding--top-spacing16 bf-ui-core-list-item__container--padding--bottom-spacing16 bf-ui-core-list-item__container--padding--left-spacing20 bf-ui-core-list-item__container--padding--right-spacing32 bf-ui-core-list-item__container--background-white" style={{ cursor: 'pointer' }}>
                                <div className="bf-ui-core-list-item__container-content">
                                  <div className="bf-ui-core-list-item__thumbnail-container">
                                    <div className="list-item__radio">
                                      <div className="andes-radio">
                                        <div className="andes-radio-element">
                                          <input
                                            type="radio"
                                            className="andes-radio__input"
                                            id="pix-gb42gzswx"
                                            name="payment"
                                            value="pix"
                                            checked={selectedPayment === 'pix'}
                                            onChange={() => handleSelectPayment('pix')}
                                          />
                                          <div className="andes-radio__background">
                                            <div className="andes-radio__outer-circle"></div>
                                            <div className="andes-radio__inner-circle"></div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                    <div className="andes-thumbnail-container">
                                      <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                        <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_pix.svg" />
                                      </div>
                                    </div>
                                  </div>
                                  <div className="bf-ui-core-list-item__content bf-ui-core-list-item__content--flex bf-ui-core-list-item__content--flex-direction--column">
                                    <span className="bf-ui-core-label" role="presentation">
                                      <span className="andes-visually-hidden">
                                        Pix - {selectedPayment === 'pix' ? "selecionado" : "não selecionado"}
                                      </span>
                                      <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                                        <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">
                                          Pix
                                        </span>
                                      </span>
                                    </span>
                                    <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4" role="presentation">
                                      <span className="andes-visually-hidden">Aprovação imediata</span>
                                      <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--secondary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys" aria-hidden="true" role="presentation">
                                        <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-secondary andes-typography--weight-regular" role="presentation">
                                          Aprovação imediata
                                        </span>
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </label>
                            </li>
                          )}

                          {/* Boleto */}
                          {showBoleto && (
                          <li
                            onClick={() => handleSelectPayment('boleto')}
                            className="andes-list__item bf-ui-core-list-item bf-ui-core-list-item__radio bf-ui-core-list-item--align-centered andes-list__item--size-medium"
                            id="bolbradesco"
                            data-testid="bolbradesco"
                            style={{ cursor: 'pointer' }}
                          >
                            <label htmlFor="bolbradesco-34bb13wv2" className="bf-ui-core-list-item__container bf-ui-core-list-item__container--padding--top-spacing16 bf-ui-core-list-item__container--padding--bottom-spacing16 bf-ui-core-list-item__container--padding--left-spacing20 bf-ui-core-list-item__container--padding--right-spacing32 bf-ui-core-list-item__container--background-white" style={{ cursor: 'pointer' }}>
                              <div className="bf-ui-core-list-item__container-content">
                                <div className="bf-ui-core-list-item__thumbnail-container">
                                  <div className="list-item__radio">
                                    <div className="andes-radio">
                                      <div className="andes-radio-element">
                                        <input
                                          type="radio"
                                          className="andes-radio__input"
                                          id="bolbradesco-34bb13wv2"
                                          name="payment"
                                          value="boleto"
                                          checked={selectedPayment === 'boleto'}
                                          onChange={() => handleSelectPayment('boleto')}
                                        />
                                        <div className="andes-radio__background">
                                          <div className="andes-radio__outer-circle"></div>
                                          <div className="andes-radio__inner-circle"></div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="andes-thumbnail-container">
                                    <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 bf-ui-core-thumbnail">
                                      <img aria-hidden="true" alt="" src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_boleto_black_noborde.svg" />
                                    </div>
                                  </div>
                                </div>
                                <div className="bf-ui-core-list-item__content bf-ui-core-list-item__content--flex bf-ui-core-list-item__content--flex-direction--column">
                                  <span className="bf-ui-core-label" role="presentation">
                                    <span className="andes-visually-hidden">
                                      Boleto bancário - {selectedPayment === 'boleto' ? "selecionado" : "não selecionado"}
                                    </span>
                                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                                      <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">
                                        Boleto bancário
                                      </span>
                                    </span>
                                  </span>
                                  <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4" role="presentation">
                                    <span className="andes-visually-hidden">Aprovação em 1 a 2 dias úteis</span>
                                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--secondary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys" aria-hidden="true" role="presentation">
                                      <span className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-secondary andes-typography--weight-regular" role="presentation">
                                        Aprovação em 1 a 2 dias úteis
                                      </span>
                                    </span>
                                  </span>
                                </div>
                              </div>
                            </label>
                          </li>
                          )}

                        </div>
                      </ul>
                    </div>
                  </div>
                )}

              </div>

              {/* Desktop Continue Button */}
              <div id="static_buttons_container_id/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--right bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing24 bf-ui-core-container--margin--bottom-spacing24" aria-hidden="false" data-js="container" data-id="static_buttons_container_id/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="static_buttons_container_id">
                <div id="static_buttons_wrap_content_container_id/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--right bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--wrap_content bf-ui-core-container--flex-wrap--no-wrap" aria-hidden="false" data-js="container">
                    <button
                    type="button"
                    className="andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud"
                    id="continue_button/d9844038-2e6d-4415-b9e9-d42d4ab7ae05"
                    aria-label="Continuar"
                    data-testid="continue_button"
                    disabled={!selectedPayment}
                    onClick={handleDesktopContinue}
                    style={{ opacity: selectedPayment ? 1 : 0.5 }}
                  >
                    <span className="andes-button__content"><span className="andes-button__text">Continuar</span></span>
                  </button>
                </div>
              </div>

            </form>

            {/* Order Summary (Desktop) */}
            <div id="overview_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--overview" aria-hidden="false" data-js="container" data-id="overview_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="overview_container">
              <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing56" role="presentation" aria-hidden="false">
                <span className="andes-visually-hidden">Resumo da compra</span>
                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlexs" aria-hidden="false" data-testid="purchase_summary-0" id="purchase_summary-0">
                  <h2 className="andes-typography andes-typography--type-title andes-typography--size-xs andes-typography--color-primary andes-typography--weight-semibold">Resumo da compra</h2>
                </div>
              </span>
              <hr className="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray070 bf-ui-core-separator--height-spacing1" aria-hidden="true" id="separator_title_overview/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" data-testid="separator_title_overview" />
              <div id="product_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap" aria-hidden="false" data-js="container">
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  <span className="andes-visually-hidden">Produto</span>
                  <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                    <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">Produto</span>
                  </span>
                </span>
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" aria-hidden="false" role="presentation">
                    <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: "16px" }} role="img" aria-label="Valor" aria-roledescription="Valor">
                      <span className="andes-money-amount__currency-symbol" aria-hidden="true">{subtotalParts.symbol}</span>
                      <span className="andes-money-amount__fraction" aria-hidden="true">{subtotalParts.integer}</span>
                      <span className="andes-visually-hidden" aria-hidden="true">,</span>
                      <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: "10px", marginTop: "2px" }} aria-hidden="true">{subtotalParts.cents}</span>
                    </span>
                  </span>
                </span>
              </div>
              <div id="shipping_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing8" aria-hidden="false" data-js="container">
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  <span className="andes-visually-hidden">Envio</span>
                  <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                    <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">Envio</span>
                  </span>
                </span>
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  {selectedShipping && !selectedShipping.isFree ? (
                    <span className="bf-ui-core-rich-text__price" aria-hidden="false" role="presentation">
                      <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: "16px" }} role="img" aria-label="Valor do frete" aria-roledescription="Valor">
                        <span className="andes-money-amount__currency-symbol" aria-hidden="true">{shippingParts.symbol}</span>
                        <span className="andes-money-amount__fraction" aria-hidden="true">{shippingParts.integer}</span>
                        <span className="andes-visually-hidden" aria-hidden="true">,</span>
                        <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16" style={{ fontSize: "10px", marginTop: "2px" }} aria-hidden="true">{shippingParts.cents}</span>
                      </span>
                    </span>
                  ) : (isFreeShipping || selectedShipping?.isFree) ? (
                    <>
                      <span className="andes-visually-hidden">Grátis</span>
                      <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--positive bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                        <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-positive andes-typography--weight-regular" role="presentation">Grátis</span>
                      </span>
                    </>
                  ) : (
                    <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                      <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">—</span>
                    </span>
                  )}
                </span>
              </div>
              <hr className="bf-ui-core-separator bf-ui-core-separator--margin--top-spacing16 bf-ui-core-separator--margin--bottom-spacing16 bf-ui-core-separator--background-gray070 bf-ui-core-separator--height-spacing1" aria-hidden="true" />
              <div id="purchase_amount_container/d9844038-2e6d-4415-b9e9-d42d4ab7ae05" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap" aria-hidden="false" data-js="container">
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  <span className="andes-visually-hidden">Você pagará</span>
                  <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym" aria-hidden="true" role="presentation">
                    <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">Você pagará</span>
                  </span>
                </span>
                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                  <span className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary" aria-hidden="false" role="presentation">
                    <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: "18px" }} role="img" aria-label="Valor total" aria-roledescription="Valor">
                      <span className="andes-money-amount__currency-symbol" aria-hidden="true">{totalParts.symbol}</span>
                      <span className="andes-money-amount__fraction" aria-hidden="true">{totalParts.integer}</span>
                      <span className="andes-visually-hidden" aria-hidden="true">,</span>
                      <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: "10px", marginTop: "3px" }} aria-hidden="true">{totalParts.cents}</span>
                    </span>
                  </span>
                </span>
              </div>
            </div>

            <div id="bf-ui-core-footer-placeholder" data-testid="bf-ui-core-footer-placeholder" className="bf-ui-core-footer-placeholder" style={{ height: "0px" }}></div>
          </div>
        </div>
      </main>

      {/* Mobile Footer (sticky) */}
      <footer id="footer_container/0029e95d-7985-4f86-ade9-c8f823c70d20" className="bf-ui-core-footer bf-ui-core-footer--flex bf-ui-core-footer--flex-direction--column bf-ui-core-footer--flex-align--top bf-ui-core-footer--flex-text_align--left bf-ui-core-footer--flex-justify--left bf-ui-core-footer--flex-height--wrap_content bf-ui-core-footer--flex-width--match_parent bf-ui-core-footer--flex-wrap--no-wrap bf-ui-core-footer--padding--bottom-spacing24 bf-ui-core-footer--padding--left-spacing20 bf-ui-core-footer--padding--right-spacing20 bf-ui-core-footer--background-white bf-ui-core-footer--sticky-off" data-js="footer" data-id="footer_container/0029e95d-7985-4f86-ade9-c8f823c70d20" data-testid="footer_container">
        <hr className="bf-ui-core-separator bf-ui-core-separator--background-gray100 bf-ui-core-separator--height-spacing1" aria-hidden="true" id="separator/0029e95d-7985-4f86-ade9-c8f823c70d20" data-testid="separator" />
        <div id="container_detail/0029e95d-7985-4f86-ade9-c8f823c70d20" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-spacing12 bf-ui-core-container--padding--bottom-spacing16" aria-hidden="false" data-js="container">
          <div id="container_detail_1/0029e95d-7985-4f86-ade9-c8f823c70d20" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap" aria-hidden="false" data-js="container">
            <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
              <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodyl" aria-hidden="false" role="presentation">
                <span className="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-semibold" role="presentation">Você pagará</span>
              </span>
            </span>
            <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
              <span className="andes-visually-hidden">Valor</span>
              <span className="bf-ui-core-rich-text__price" aria-hidden="true" role="presentation">
                <span className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold" style={{ fontSize: "18px" }} role="img" aria-label="Valor" aria-roledescription="Valor">
                  <span className="andes-money-amount__currency-symbol" aria-hidden="true">{totalParts.symbol}</span>
                  <span className="andes-money-amount__fraction" aria-hidden="true">{totalParts.integer}</span>
                  <span className="andes-visually-hidden" aria-hidden="true">,</span>
                  <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: "10px", marginTop: "3px" }} aria-hidden="true">{totalParts.cents}</span>
                </span>
              </span>
            </span>
          </div>
        </div>
        <div id="container_button/0029e95d-7985-4f86-ade9-c8f823c70d20" className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-none" aria-hidden="false" data-js="container">
          <button type="button" className="andes-button bf-ui-core-button bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud" id="footer_button_continue/0029e95d-7985-4f86-ade9-c8f823c70d20" aria-label="Continuar" data-testid="footer_button_continue" onClick={handleDesktopContinue}>
            <span className="andes-button__content">
              <span className="andes-button__text">Continuar</span>
            </span>
          </button>
        </div>
      </footer>

      {/* Desktop Footer */}
      <footer role="contentinfo" className="nav-footer">
        <div className="nav-footer-user-info nav-bounds">
          <div className="nav-footer-info-wrapper">
            <div className="nav-footer-primaryinfo">
              <small className="nav-footer-copyright">Copyright © 1999-2024 Ebazar.com.br LTDA.</small>
              <nav className="nav-footer-navigation">
                <ul className="nav-footer-navigation__menu">
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Trabalhe conosco</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Termos e condições</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Como cuidamos da sua privacidade</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Acessibilidade</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Contato</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Informações sobre seguros</a></li>
                </ul>
              </nav>
            </div>
            <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003, Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
          </div>
        </div>
        <a className="nav-footer-hp">Mercado Libre</a>
      </footer>
    </>
  );
};

export default StoreCheckoutPayments;
