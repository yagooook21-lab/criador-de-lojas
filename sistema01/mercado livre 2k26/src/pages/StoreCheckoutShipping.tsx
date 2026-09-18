import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency, formatCurrencyParts } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getCheckoutShipping, saveCheckoutShipping } from "@/utils/checkoutShipping";

type ShippingOption = {
  id: string;
  name: string;
  price: number;
  min: number;
  max: number;
  isFree: boolean;
};

const StoreCheckoutShipping = () => {
  const navigate = useNavigate();
  const { cartItems, storeSettings, cartTotal } = useStore();
  const [address, setAddress] = useState<any>(null);
  const [options, setOptions] = useState<ShippingOption[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selected = options.find(o => o.id === selectedId) ?? null;
  const shippingPrice = selected?.price ?? 0;
  const orderTotal = cartTotal + shippingPrice;

  const handleContinue = () => {
    if (!selected) {
      toast.error("Por favor, selecione uma opção de envio.");
      return;
    }
    saveCheckoutShipping({
      id: selected.id,
      name: selected.name,
      price: selected.price,
      isFree: selected.isFree,
      min: selected.min,
      max: selected.max,
    });
    window.dispatchEvent(new Event("checkout_shipping_changed"));
    navigate("/store/checkout/payments");
  };

  useEffect(() => {
    const linkElements: HTMLLinkElement[] = [];

    // Desktop CSS (min-width: 768px)
    const desktopCssUrls = [
      "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.21.0/mercadolibre/navigation-desktop.css",
      "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/7.21.0/modeless-box.css",
      "https://http2.mlstatic.com/frontend-assets/buyingflow-shipping-frontend/action-index.422553c0.css",
    ];
    desktopCssUrls.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.media = "(min-width: 768px)";
      document.head.appendChild(link);
      linkElements.push(link);
    });

    // Mobile CSS (max-width: 767px)
    const mobileCssUrls = [
      "https://http2.mlstatic.com/frontend-assets/buyingflow-shipping-frontend/action-index.422553c0.css",
    ];
    mobileCssUrls.forEach((url) => {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      link.media = "(max-width: 767px)";
      document.head.appendChild(link);
      linkElements.push(link);
    });

    return () => {
      linkElements.forEach((link) => {
        document.head.removeChild(link);
      });
    };
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

    supabase
      .from("settings")
      .select("value")
      .eq("key", "delivery_settings")
      .maybeSingle()
      .then(({ data }) => {
        const built: ShippingOption[] = [];
        const val = (data?.value ?? {}) as any;
        const offersFree = val.is_free_shipping ?? true;
        if (offersFree) {
          built.push({
            id: "free",
            name: "Envio 1",
            price: 0,
            min: Number(val.delivery_days_min) || 2,
            max: Number(val.delivery_days_max) || 5,
            isFree: true,
          });
        }
        const methods: any[] = Array.isArray(val.methods) ? val.methods : [];
        methods.forEach((m, idx) => {
          built.push({
            id: String(m.id ?? `paid_${idx}`),
            name: `Envio ${idx + (offersFree ? 2 : 1)}`,
            price: Number(m.price) || 0,
            min: Number(m.delivery_days_min) || 1,
            max: Number(m.delivery_days_max) || 5,
            isFree: false,
          });
        });
        // Legacy single method/price at top level
        if (methods.length === 0 && !offersFree && Number(val.price) > 0) {
          built.push({
            id: "legacy_paid",
            name: "Envio 1",
            price: Number(val.price) || 0,
            min: Number(val.delivery_days_min) || 1,
            max: Number(val.delivery_days_max) || 5,
            isFree: false,
          });
        }
        setOptions(built);
        const saved = getCheckoutShipping();
        if (saved && built.some(o => o.id === saved.id)) {
          setSelectedId(saved.id);
        } else if (built.length === 1) {
          setSelectedId(built[0].id);
        }
      });
  }, [cartItems, navigate]);

  const getDeliveryDate = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toLocaleDateString('pt-BR', { weekday: "short", day: "numeric", month: "short" });
  };

  if (!address) return null;

  return (
    <>
      {/* Mobile Header */}
      <header id="mobile-header" data-js="mobile-header" data-testid="mobile-header"
        className="bf-core-header bf-core-header--transparent shipping-mobile-header">
        <div className="bf-core-header__container">
          <button type="button" className="bf-core-header__button bf-core-icon-custom-size"
            onClick={() => navigate(-1)}>
            <span className="andes-visually-hidden">Voltar</span>
            <span className="bf-ui-core-rich-text__icon" data-testid="undefined-0"
              id="undefined-0" aria-hidden="true" role="presentation">
              <img className="bf-ui-core-rich-text__icon--image"
                src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_left_arrow_black.svg"
                alt="" />
            </span>
          </button>
          <h1 className="bf-core-header__title--hidden">Prazo de entrega.</h1>
        </div>
      </header>

      {/* Desktop Header */}
      <header role="banner" data-siteid="MLB" className="nav-header nav-header-pluslite ui-navigation-v2 shipping-desktop-header">
        <div className="nav-bounds">
          <div className="nav-header-logo">
            
          
          <a className="nav-logo" style={{ backgroundImage: "url('https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.23.0/mercadolibre/pt_logo_large_plus@2x.webp')", backgroundSize: "134px 34px", backgroundRepeat: "no-repeat" }}>Mercado Livre Brasil - Onde comprar e vender de Tudo</a>
          </div>
          <div className="nav-header-menu-wrapper">
            <nav id="nav-header-menu" aria-label="Configurações">
              <ul className="nav-header-menu-list">
                <li className="nav-header-menu-list__item">
                  <a className="option-help" rel="">Contato</a>
                </li>
                <li className="nav-header-menu-list__item">
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main role="main" id="root-app" data-navigation="true">

        <div data-js="external-js" className="sr-only">
          <div id="mldp">
          </div>
        </div>
        <div></div>
        <div id="shipping_step_container"
          className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--center bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--auto bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--background-gray070Solid"
          aria-hidden="false" data-js="container" data-id="shipping_step_container"
          data-testid="shipping_step_container">
          <div id="shipping_main_container"
            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--match_parent bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--top-spacing48 bf-ui-core-container--margin--bottom-spacing48 bf-ui-core-container--padding--left-spacing12 bf-ui-core-container--padding--right-spacing12"
            aria-hidden="false" data-js="container" data-id="shipping_main_container"
            data-testid="shipping_main_container">
            <form id="shipping_bricks_container" data-testid="shipping_bricks_container"
              className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--bottom-spacing16 bf-ui-core-container--padding--left-spacing16 bf-ui-core-container--padding--right-spacing16"
              aria-hidden="false" data-js="container" data-id="shipping_bricks_container" action=""
              data-gtm-form-interact-id="0"><span className="bf-ui-core-label" role="presentation"
                data-testid="shipping_header_title" id="shipping_header_title" aria-hidden="false">
                <div className="bf-ui-core-rich-text__title bf-ui-core-rich-text__title--titlem" aria-hidden="false"
                  data-testid="shipping_header_title_rich_text-0" id="shipping_header_title_rich_text-0">
                  <h1
                    className="andes-typography andes-typography--type-title andes-typography--size-m andes-typography--color-primary andes-typography--weight-semibold">
                    Prazo de entrega.</h1>
                </div>
              </span>
              <div id="shipping_header_container_subtitle"
                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                aria-hidden="false" data-js="container" data-id="shipping_header_container_subtitle"
                data-testid="shipping_header_container_subtitle"><span className="bf-ui-core-label"
                  role="presentation" data-testid="shipping_header_icon_subtitle"
                  id="shipping_header_icon_subtitle" aria-hidden="false"><span
                    className="bf-ui-core-rich-text__icon"
                    data-testid="shipping_header_icon_subtitle_rich_text-0"
                    id="shipping_header_icon_subtitle_rich_text-0" aria-hidden="true"
                    role="presentation"><img className="bf-ui-core-rich-text__icon--image"
                      src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_gps_pin.svg"
                      alt="" height="14px" /></span></span><span className="bf-ui-core-label"
                        role="presentation" data-testid="shipping_header_subtitle" id="shipping_header_subtitle"
                        aria-hidden="false"><span
                          className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodys"
                          aria-hidden="false" data-testid="shipping_header_subtitle_rich_text-0"
                          id="shipping_header_subtitle_rich_text-0" role="presentation"><span
                            className="andes-typography andes-typography--type-body andes-typography--size-s andes-typography--color-primary andes-typography--weight-regular"
                            role="presentation">Envio para {address?.streetName} {address?.streetNumber}{address?.city ? `, ${address.city}` : ''}{address?.state ? ` - ${address.state}` : ''}</span></span></span>
              </div>
              <div id="shipping_cards_container"
                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                aria-hidden="false" data-js="container" data-id="shipping_cards_container"
                data-testid="shipping_cards_container">
                {options.length > 0 && (
                  <div data-js="bf-ui-core-card" data-id="shipping_promises_card_1"
                    data-testid="shipping_promises_card_1"
                    className="andes-card bf-ui-core-card bf-ui-core-card--margin--bottom-spacing16 andes-card--flat andes-card--primary andes-card--padding-0"
                    id="shipping_promises_card_1" data-andes-card="true" data-andes-card-hierarchy="primary">
                    <div className="andes-card__content bf-ui-core-card__content" data-andes-card-content="true">
                      <button id="shipping_promises_card_1_header_container_1"
                        data-testid="shipping_promises_card_1_header_container_1"
                        className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--between bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--padding--top-spacing12 bf-ui-core-container--padding--bottom-spacing12 bf-ui-core-container--padding--left-spacing24 bf-ui-core-container--padding--right-spacing24 bf-ui-core-container--background-white bf-ui-core-container--hasTrigger"
                        aria-hidden="false" data-js="container" type="button">
                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap">
                          <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                            <span className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--bold bf-ui-core-rich-text__body--bodym" role="presentation">
                              <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-bold" role="presentation">Envio 1</span>
                            </span>
                          </span>
                          <span className="bf-ui-core-label bf-ui-core-label--margin--top-spacing4 bf-ui-core-label--margin--left-spacing8" role="presentation" aria-hidden="false">
                            <span className="bf-ui-core-rich-text__icon" aria-hidden="true" role="presentation">
                              <img className="bf-ui-core-rich-text__icon--image"
                                src="https://http2.mlstatic.com/storage/buyingflow-core-assets-web/bf-assets/svg/bf_v6_full.svg"
                                alt="" height="16px" />
                            </span>
                          </span>
                        </div>
                        <div className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--row bf-ui-core-container--flex-align--center bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--right bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-max-width--wrap_content bf-ui-core-container--flex-wrap--no-wrap bf-ui-core-container--margin--left-spacing8">
                          <div aria-hidden="false">
                            <div className="andes-thumbnail-multiple andes-thumbnail-multiple--stacked andes-thumbnail-multiple--stacked-40 bf-ui-core-thumbnail-multiple"
                              data-andes-thumbnail-multiple="true" data-andes-thumbnail-multiple-type="stacked">
                              {cartItems.map((item, idx) => (
                                <div key={item.product.id + idx} className="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="40">
                                  <div className="andes-thumbnail andes-thumbnail--circle andes-thumbnail--40 andes-thumbnail__image bf-ui-core-thumbnail" data-andes-thumbnail-content="true">
                                    <img aria-hidden="true" alt={item.product.name} src={item.product.image} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </button>
                      <hr className="bf-ui-core-separator bf-ui-core-separator--background-gray100 bf-ui-core-separator--height-spacing1" aria-hidden="true" />
                      <ul className="andes-list andes-radio-list bf-ui-core-radio-list-container andes-list--default andes-list--selectable" data-andes-radio-list="true" aria-label="radio-list">
                        {options.map((opt) => (
                          <li key={opt.id} className="andes-list__item bf-ui-core-radio-item-container bf-ui-core-radio-item-container--padding--top-spacing20 bf-ui-core-radio-item-container--padding--bottom-spacing20 bf-ui-core-radio-item-container--padding--left-spacing24 bf-ui-core-radio-item-container--padding--right-spacing24 bf-core-radio-item-top andes-list__item--size-medium andes-list__item--padding-0 andes-list__item-with-secondary"
                            data-andes-radio-list-item="true" data-andes-radio-list-item-size="medium"
                            data-andes-state={selectedId === opt.id ? "checked" : "unchecked"}
                            onClick={() => setSelectedId(opt.id)}
                            style={{ cursor: "pointer" }}>
                            <div className="andes-list__item-selection-control andes-radio-list__item-selection-control" data-andes-radio-list-radio="true">
                              <div className="andes-radio" data-andes-radio-button="true" data-andes-state={selectedId === opt.id ? "checked" : "unchecked"}>
                                <div className="andes-radio-element" data-andes-radio-button-tick="true">
                                  <input type="radio" className="andes-radio__input"
                                    name="shipping-option" value={opt.id}
                                    checked={selectedId === opt.id}
                                    readOnly />
                                  <div className="andes-radio__background">
                                    <div className="andes-radio__outer-circle"></div>
                                    <div className="andes-radio__inner-circle"></div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="andes-list__item-first-column">
                              <div className="andes-list__item-text">
                                <label className="andes-list__item-primary" data-andes-radio-list-title="true">
                                  <div className="bf-ui-core-radio-item-container--title">
                                    <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                      <span className="bf-ui-core-rich-text__body" role="presentation">
                                        <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular" role="presentation">Entre {getDeliveryDate(opt.min)} e {getDeliveryDate(opt.max)}</span>
                                      </span>
                                    </span>
                                  </div>
                                </label>
                                <span className="andes-list__item-secondary" data-andes-radio-list-description="true">
                                  <div className="bf-ui-core-radio-item-container--description"></div>
                                </span>
                              </div>
                            </div>
                            <div className="andes-list__item-second-column">
                              <span className="andes-list__item-tertiary andes-list__item-tertiary--top" data-andes-radio-list-right-content="true">
                                <span className="bf-ui-core-label" role="presentation" aria-hidden="false">
                                  <span className={`bf-ui-core-rich-text__body ${opt.isFree ? 'bf-ui-core-rich-text__body--positive' : 'bf-ui-core-rich-text__body--primary'} bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym`} role="presentation">
                                    <span className={`andes-typography andes-typography--type-body andes-typography--size-m ${opt.isFree ? 'andes-typography--color-positive' : 'andes-typography--color-primary'} andes-typography--weight-regular`} role="presentation">{opt.isFree ? "Grátis" : formatCurrency(opt.price)}</span>
                                  </span>
                                </span>
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
              <div id="shipping_footer_button_container"
                className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
                aria-hidden="false" data-js="container" data-id="shipping_footer_button_container"
                data-testid="shipping_footer_button_container"><button type="button"
                  className="andes-button bf-ui-core-button bf-ui-core-button--margin--top-spacing16 bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud"
                  id="shipping_footer_confirm_button" aria-label="Continuar"
                  data-testid="shipping_footer_confirm_button" data-andes-button="true"
                  data-andes-button-hierarchy="loud" data-andes-button-size="large"
                  onClick={handleContinue}><span
                    className="andes-button__content" data-andes-button-content="true"><span
                      className="andes-button__text"
                      data-andes-button-text="true">Continuar</span></span></button></div>

            </form>
            <div className="andes-card bf-pricebox-container bf-pricebox-container--sticky andes-card--flat andes-card--secondary andes-card--padding-16"
              id="_R_19b6e_" data-andes-card="true" data-andes-card-hierarchy="secondary">
              <div className="andes-card__header bf-pricebox-container__header andes-card__header--border"
                data-andes-card-header="true">
                <h2 className="andes-card__header-title">Resumo da compra</h2>
              </div>
              <div className="andes-card__content bf-pricebox-container__content" data-andes-card-content="true">
                <div className="bf-pricebox-row" data-testid="product_row">
                  <div className="bf-pricebox-row__text"><span
                    className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                    aria-hidden="false" data-testid="undefined-0" id="undefined-0"
                    role="presentation"><span
                      className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                      role="presentation">Produto</span></span></div>
                  <div className="bf-pricebox-row__prices">
                    <div className="bf-pricebox-row__value"><span className="bf-ui-core-rich-text__price"
                      data-testid="undefined-0" id="undefined-0" aria-hidden="false"
                      role="presentation"><span
                        className="andes-money-amount andes-money-amount--cents-superscript"
                        style={{ fontSize: '16px' }} role="img" id="_R_3c9l9b6e_"
                        aria-label="Valor do produto" aria-roledescription="Valor"
                        data-andes-money-amount="true" data-andes-money-amount-size="16"><span
                          className="andes-money-amount__currency" aria-hidden="true"
                          data-andes-money-amount-currency="true"><span
                            className="andes-money-amount__currency-symbol">{formatCurrencyParts(cartTotal).symbol}</span></span><span
                                className="andes-money-amount__fraction" aria-hidden="true"
                                data-andes-money-amount-fraction="true">{formatCurrencyParts(cartTotal).integer}</span><span
                                  className="andes-visually-hidden" aria-hidden="true">,</span><span
                                    className="andes-money-amount__cents andes-money-amount__cents--superscript-16"
                                    style={{ fontSize: '10px', marginTop: '2px' }} aria-hidden="true"
                                    data-andes-money-amount-cents="true">{formatCurrencyParts(cartTotal).cents}</span></span></span></div>
                  </div>
                </div>
                <div className="bf-pricebox-row" data-testid="shipping_row">
                  <div className="bf-pricebox-row__text"><span
                    className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--regular bf-ui-core-rich-text__body--bodym"
                    aria-hidden="false" data-testid="undefined-0" id="undefined-0"
                    role="presentation"><span
                      className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                      role="presentation">Frete</span></span></div>
                  <div className="bf-pricebox-row__prices">
                    <div className="bf-pricebox-row__value"><span
                      className={`bf-ui-core-rich-text__body ${(!selected || selected.isFree) ? 'bf-ui-core-rich-text__body--positive' : 'bf-ui-core-rich-text__body--primary'} bf-ui-core-rich-text__body--bodym`}
                      aria-hidden="false" data-testid="undefined-1" id="undefined-1"
                      role="presentation"><span
                        className={`andes-typography andes-typography--type-body andes-typography--size-m ${(!selected || selected.isFree) ? 'andes-typography--color-positive' : 'andes-typography--color-primary'} andes-typography--weight-regular`}
                        role="presentation">{!selected ? "—" : (selected.isFree ? "Grátis" : formatCurrency(selected.price))}</span></span></div>
                  </div>
                </div>
                <hr className="bf-ui-core-separator bf-ui-core-separator--background-gray100 bf-ui-core-separator--height-spacing1"
                  aria-hidden="true" id="separator" data-testid="separator" />
                <div className="bf-pricebox-row" data-testid="total_row">
                  <div className="bf-pricebox-row__text"><span
                    className="bf-ui-core-rich-text__body bf-ui-core-rich-text__body--primary bf-ui-core-rich-text__body--semibold bf-ui-core-rich-text__body--bodyl"
                    aria-hidden="false" data-testid="undefined-0" id="undefined-0"
                    role="presentation"><span
                      className="andes-typography andes-typography--type-body andes-typography--size-l andes-typography--color-primary andes-typography--weight-semibold"
                      role="presentation">Total</span></span></div>
                  <div className="bf-pricebox-row__prices">
                    <div className="bf-pricebox-row__value"><span
                      className="bf-ui-core-rich-text__price bf-ui-core-rich-text__price--primary"
                      data-testid="undefined-0" id="undefined-0" aria-hidden="false"
                      role="presentation"><span
                        className="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--weight-semibold"
                        style={{ fontSize: '18px' }} role="img" id="_R_3d9l9b6e_"
                        aria-label="Valor total" aria-roledescription="Valor"
                        data-andes-money-amount="true" data-andes-money-amount-size="18"><span
                          className="andes-money-amount__currency" aria-hidden="true"
                          data-andes-money-amount-currency="true"><span
                            className="andes-money-amount__currency-symbol">{formatCurrencyParts(orderTotal).symbol}</span></span><span
                                className="andes-money-amount__fraction" aria-hidden="true"
                                data-andes-money-amount-fraction="true">{formatCurrencyParts(orderTotal).integer}</span><span
                                  className="andes-visually-hidden" aria-hidden="true">,</span><span
                                    className="andes-money-amount__cents andes-money-amount__cents--superscript-18"
                                    style={{ fontSize: '10px', marginTop: '3px' }} aria-hidden="true"
                                    data-andes-money-amount-cents="true">{formatCurrencyParts(orderTotal).cents}</span></span></span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Mobile Footer */}
      <footer id="shipping_footer"
        className="bf-ui-core-footer bf-ui-core-footer--flex bf-ui-core-footer--flex-direction--column bf-ui-core-footer--flex-align--top bf-ui-core-footer--flex-text_align--left bf-ui-core-footer--flex-justify--left bf-ui-core-footer--flex-height--wrap_content bf-ui-core-footer--flex-width--match_parent bf-ui-core-footer--flex-wrap--no-wrap shipping-mobile-footer"
        data-js="footer" data-id="shipping_footer" data-testid="shipping_footer">
        <div id="shipping_footer_container"
          className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
          aria-hidden="false" data-js="container" data-id="shipping_footer_container"
          data-testid="shipping_footer_container">
          <span className="bf-ui-core-label" role="presentation"
            data-testid="shipping_footer_primary_text" id="shipping_footer_primary_text"
            aria-hidden="false">
            <span className="bf-ui-core-rich-text__body" aria-hidden="false"
              data-testid="shipping_footer_primary_text_rich_text-0"
              id="shipping_footer_primary_text_rich_text-0" role="presentation">
              <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-primary andes-typography--weight-regular"
                role="presentation">Frete</span>
            </span>
          </span>
          <div id="shipping_footer_container_secondary_text"
            className="bf-ui-core-container bf-ui-core-container--flex bf-ui-core-container--flex-direction--column bf-ui-core-container--flex-align--top bf-ui-core-container--flex-text_align--left bf-ui-core-container--flex-justify--left bf-ui-core-container--flex-height--wrap_content bf-ui-core-container--flex-width--match_parent bf-ui-core-container--flex-wrap--no-wrap"
            aria-hidden="false" data-js="container" data-id="shipping_footer_container_secondary_text"
            data-testid="shipping_footer_container_secondary_text">
            <span className="bf-ui-core-label" role="presentation"
              data-testid="shipping_footer_secondary_text" id="shipping_footer_secondary_text"
              aria-hidden="false">
              <span className="bf-ui-core-rich-text__price"
                data-testid="shipping_footer_secondary_text_rich_text-0"
                id="shipping_footer_secondary_text_rich_text-0" aria-hidden="false"
                role="presentation">
                {(!selected || selected.isFree) ? (
                  <span className="andes-typography andes-typography--type-body andes-typography--size-m andes-typography--color-positive andes-typography--weight-regular" role="presentation">
                    {!selected ? "—" : "Grátis"}
                  </span>
                ) : (
                  <span className="andes-money-amount andes-money-amount--cents-superscript"
                    style={{ fontSize: '16px' }} role="img" id="_R_dj72me_"
                    aria-label="Valor do frete" aria-roledescription="Valor"
                    data-andes-money-amount="true" data-andes-money-amount-size="16">
                    <span className="andes-money-amount__currency" aria-hidden="true"
                      data-andes-money-amount-currency="true">
                      <span className="andes-money-amount__currency-symbol">{formatCurrencyParts(selected.price).symbol}</span>
                    </span>
                    <span className="andes-money-amount__fraction" aria-hidden="true"
                      data-andes-money-amount-fraction="true">{formatCurrencyParts(selected.price).integer}</span>
                    <span className="andes-visually-hidden" aria-hidden="true">,</span>
                    <span className="andes-money-amount__cents andes-money-amount__cents--superscript-16"
                      style={{ fontSize: '10px', marginTop: '2px' }} aria-hidden="true"
                      data-andes-money-amount-cents="true">{formatCurrencyParts(selected.price).cents}</span>
                  </span>
                )}
              </span>
            </span>
          </div>
        </div>
        <button type="button"
          className="andes-button bf-ui-core-button bf-ui-core-button--margin--top-spacing16 bf-ui-core-button__simple bf-ui-core-button__hierarchy--loud bf-ui-core-button__size--large andes-button--large andes-button--loud"
          id="shipping_mobile_footer_confirm_button" aria-label="Continuar"
          data-testid="shipping_mobile_footer_confirm_button"
          data-andes-button="true" data-andes-button-hierarchy="loud" data-andes-button-size="large"
          onClick={handleContinue}>
          <span className="andes-button__content" data-andes-button-content="true">
            <span className="andes-button__text" data-andes-button-text="true">Continuar</span>
          </span>
        </button>
      </footer>

      {/* Desktop Footer */}
      <footer role="contentinfo" className="nav-footer shipping-desktop-footer">
        <div className="nav-footer-user-info nav-bounds">
          <div className="nav-footer-info-wrapper">
            <div className="nav-footer-primaryinfo"><small className="nav-footer-copyright">Copyright © 1999-2026 Ebazar.com.br LTDA.</small>
              <nav className="nav-footer-navigation">
                <ul className="nav-footer-navigation__menu">
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Trabalhe conosco</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Termos e condições</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Promoções</a>
                  </li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Como cuidamos da sua privacidade</a></li>
                  <li className="nav-footer-navigation__item"><a
                    className="nav-footer-navigation__link">Acessibilidade</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Contato</a>
                  </li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Informações sobre seguros</a></li>
                  <li className="nav-footer-navigation__item"><a className="nav-footer-navigation__link">Programa de Afiliados</a></li>
                </ul>
              </nav>
            </div>
            <p className="nav-footer-secondaryinfo">CNPJ n.º 03.007.331/0001-41 / Av. das Nações Unidas, nº 3.003,
              Bonfim, Osasco/SP - CEP 06233-903 - empresa do grupo Mercado Livre.</p>
          </div>
        </div><a className="nav-footer-hp">Mercado
          Livre</a>
      </footer>
    </>
  );
};

export default StoreCheckoutShipping;
