import { Link, useNavigate } from "react-router-dom";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { useIsMobile } from "@/hooks/use-mobile";
import { getCheckoutShipping, type CheckoutShipping } from "@/utils/checkoutShipping";

import { useMascara } from "@/hooks/useMascara";
import { useMemo, useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useTracking } from "@/contexts/TrackingContext";

const CART_MOBILE_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/cart-frontend/v3-index.mobile.7b9dfd68.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/7.19.0/modeless-box.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-mobile.css",
];

const CART_DESKTOP_CSS_URLS = [
  "https://http2.mlstatic.com/frontend-assets/cart-frontend/v3-index.desktop.312a74a4.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/widgets/7.19.0/modeless-box.css",
  "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-desktop.css",
];

const CART_MOBILE_STYLES = `
@media screen and (max-width: 767px) {
  .poly-fw-light{font-weight:300 !important}.poly-fw-regular{font-weight:400 !important}.poly-fw-semibold{font-weight:600 !important}.poly-fw-bold{font-weight:700 !important}.poly-fst-normal{font-style:normal !important}.poly-fst-italic{font-style:italic !important}.poly-fs-xxs{font-size:10px !important}.poly-fs-xs{font-size:12px !important}.poly-fs-s{font-size:14px !important}.poly-fs-xm{font-size:16px !important}.poly-fs-m{font-size:18px !important}.poly-fs-l{font-size:20px !important}.poly-fs-xl{font-size:24px !important}.poly-fs-xxl{font-size:28px !important}.poly-fs-xxxl{font-size:32px !important}.poly-fs-huge{font-size:44px !important}.poly-lh-xxs{line-height:1 !important}.poly-lh-xs{line-height:1.15 !important}.poly-lh-s{line-height:1.25 !important}.poly-lh-xm{line-height:1.35 !important}.poly-lh-m{line-height:1.45 !important}.poly-lh-l{line-height:1.56 !important}.poly-lh-xl{line-height:1.79 !important}.poly-lh-xxl{line-height:2.03 !important}.poly-lh-xxxl{line-height:2.26 !important}.poly-lh-huge{line-height:2.5 !important}.poly-tt-capitalize{text-transform:capitalize !important}.poly-tt-uppercase{text-transform:uppercase !important}.poly-tt-lowercase{text-transform:lowercase !important}.poly-tt-none{text-transform:none !important}.poly-jc-start{justify-content:flex-start !important}.poly-jc-end{justify-content:flex-end !important}.poly-jc-center{justify-content:center !important}.poly-jc-between{justify-content:space-between !important}.poly-jc-around{justify-content:space-around !important}.poly-jc-evenly{justify-content:space-evenly !important}.poly-jc-stretch{justify-content:stretch !important}.poly-jc-baseline{justify-content:baseline !important}.poly_empty_star{stroke:var(--andes-color-blue-500, #3483fa);fill:rgba(0,0,0,0)}s.poly-phrase-price{display:inline-flex}.poly-phrase-price.andes-money-amount:not(.andes-money-amount--previous),.poly-phrase-price.andes-money-amount:not(.andes-money-amount--previous) *{display:inline-flex;color:inherit}.poly-phrase-price.andes-money-amount:not(.andes-money-amount--weight-regular):not(.andes-money-amount--weight-semibold),.poly-phrase-price.andes-money-amount:not(.andes-money-amount--weight-regular):not(.andes-money-amount--weight-semibold) *{font-weight:inherit}.poly-phrase-pill{-webkit-box-decoration-break:clone;align-items:center;background-color:var(--poly-phrase-pill-background-color, var(--andes-color-blue-200, rgba(65, 137, 230, 0.2)));border-radius:2px;box-decoration-break:clone;color:var(--poly-phrase-pill-color, var(--andes-color-blue-500, #3483fa));cursor:pointer;display:inline;font-size:var(--poly-phrase-pill-font-size, 14px);font-weight:var(--poly-phrase-pill-font-weight, 600);line-height:var(--poly-phrase-pill-line-height, 18px);padding:var(--poly-phrase-pill-padding, 0 4px);text-decoration:none}.poly-phrase-pill svg{transform:translateY(2px);vertical-align:text-top}

  .andes-money-amount .andes-money-amount__currency-symbol { padding-right: 0; }
  .poly-phrase-price.andes-money-amount:not(.andes-money-amount--previous) .andes-money-amount__currency .andes-money-amount__currency-symbol { color: inherit; }

  .andes-card {
    background-repeat: no-repeat, no-repeat;
    background-position: center top, center center;
    background-size: 50px 50px, cover;
    border-radius: 6px;
    border: none;
    box-sizing: border-box;
    display: block;
    font-size: 16px;
    margin: 0;
    outline: none;
    padding: 0;
    position: relative;
    text-decoration: none;
  }
  .andes-card--flat { box-shadow: 0 1px 2px 0 rgba(0,0,0,0.12); }
  .andes-card--elevated { box-shadow: 0 6px 16px 0 rgba(0,0,0,0.1); }
  .andes-card--outline { border: 1px solid #ededed; }
  .andes-card--primary { background-color: #fff; }
  .andes-card--secondary { background-color: #f5f5f5; }
  .andes-card--padding-0 > .andes-card__header,
  .andes-card--padding-0 > .andes-card__content,
  .andes-card--padding-0 > .andes-card__footer { padding: 0; }
  .andes-card--padding-16 > .andes-card__header,
  .andes-card--padding-16 > .andes-card__content,
  .andes-card--padding-16 > .andes-card__footer { padding: 16px; }
  .andes-card--padding-24 > .andes-card__header,
  .andes-card--padding-24 > .andes-card__content,
  .andes-card--padding-24 > .andes-card__footer { padding: 24px; }

  .andes-card > :first-child { border-top-left-radius: 6px; border-top-right-radius: 6px; }
  .andes-card > :last-child { border-bottom-left-radius: 6px; border-bottom-right-radius: 6px; }

  .cl-empty-cart__card {
    align-items: center;
    background: #fff;
    box-shadow: none;
    display: flex;
    gap: 16px;
    justify-content: center;
    min-height: auto;
    padding: 32px 24px;
  }
  .cl-empty-cart__image { flex-shrink: 0; width: 63px; }
  .cl-empty-cart__content { display: flex; flex-direction: column; gap: 4px; max-width: 233px; }
  .cl-empty-cart__title { color: rgba(0,0,0,.9); font-size: 16px; font-weight: 600; line-height: 20px; margin: 0; }
  .cl-empty-cart__subtitle { color: rgba(0,0,0,.55); font-size: 14px; line-height: 18px; margin: 0; }

  s.andes-money-amount.andes-money-amount--previous.andes-money-amount--cents-superscript {
      display: none !important;
  }
}

.cart-list .cl-item-card .poly-card__portada {
  overflow: hidden;
  flex-shrink: 0;
  width: 80px !important;
  height: 80px !important;
  min-width: 80px !important;
  min-height: 80px !important;
  max-width: 80px !important;
  max-height: 80px !important;
  display: flex;
  align-items: center;
  justify-content: center;
}
.cart-list .cl-item-card .poly-card__portada a {
  position: unset;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}
.cart-list .cl-item-card .poly-card__portada img.poly-component__picture {
  display: block;
  max-width: 100% !important;
  max-height: 100% !important;
  width: auto !important;
  height: auto !important;
  object-fit: contain;
}
@media screen and (min-width: 768px) {
  .cart-list .cl-item-card .poly-card__portada {
    width: 100px !important;
    height: 100px !important;
    min-width: 100px !important;
    min-height: 100px !important;
    max-width: 100px !important;
    max-height: 100px !important;
    overflow: hidden !important;
  }
  .cart-list .cl-item-card .poly-card__portada img.poly-component__picture {
    width: 70% !important;
  }
  .cart-list .cl-item-card .poly-card__portada a {
    align-items: center !important;
    justify-content: center !important;
    display: flex !important;
    width: 100% !important;
    height: 100% !important;
  }
  div.poly-card--no-highlight.poly-card--highlight-component.poly-card.poly-card--list.poly-card--xlarge.poly-card--checkbox div.poly-card__portada a {
    justify-content: center !important;
    align-items: center !important;
    display: inherit !important;
  }
  div.poly-card--no-highlight.poly-card--highlight-component.poly-card.poly-card--list.poly-card--xlarge.poly-card--checkbox div.poly-card__portada a img.poly-component__picture {
    max-width: 70% !important;
  }
}

  .cart-list .cl-card-footer__info-row__description {
    display: none !important;
  }
  .cart-list .cl-card-footer__info-row {
    display: none !important;
  }
`;

const formatPriceParts = (value: number) => {
  const currencyString = formatCurrency(value);
  const parts = currencyString.replace('R$', '').replace(/\s/g, '').trim().split(',');
  return {
    symbol: 'R$',
    integer: parts[0],
    cents: parts.length > 1 ? parts[1] : '00'
  };
};

const StoreCart = () => {
  const { cartItems: rawCartItems, updateCartQuantity, removeFromCart, cartTotal, products, cartLoading } = useStore();
  const cartItems = rawCartItems.filter(i => i && i.product != null && typeof i.product.price === 'number');
  const { mascara } = useMascara();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { trackEvent } = useTracking();
  const addToCartFiredRef = useRef(false);
  const [openQtyDropdown, setOpenQtyDropdown] = useState<string | null>(null);
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [selectedShipping, setSelectedShipping] = useState<CheckoutShipping | null>(() => getCheckoutShipping());

  useEffect(() => {
    const fetchShipping = async () => {
      const { data } = await supabase.from('settings').select('*').eq('key', 'delivery_settings').maybeSingle();
      if (data?.value) {
        setIsFreeShipping((data.value as any).is_free_shipping ?? false);
      }
    };
    fetchShipping();

    const reload = () => setSelectedShipping(getCheckoutShipping());
    window.addEventListener("checkout_shipping_changed", reload);
    window.addEventListener("storage", reload);
    return () => {
      window.removeEventListener("checkout_shipping_changed", reload);
      window.removeEventListener("storage", reload);
    };
  }, []);

  // Coupon state — persisted in localStorage so it survives page refreshes
  const [couponPopup, setCouponPopup] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [appliedCoupon, setAppliedCouponState] = useState<{ code: string; discount: number; type: string } | null>(() => {
    try {
      const saved = localStorage.getItem('cart_applied_coupon');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });

  const setAppliedCoupon = (coupon: { code: string; discount: number; type: string } | null) => {
    setAppliedCouponState(coupon);
    if (coupon) {
      localStorage.setItem('cart_applied_coupon', JSON.stringify(coupon));
    } else {
      localStorage.removeItem('cart_applied_coupon');
    }
  };

  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, cartTotal - discountAmount);

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Digite um código de cupom.'); return; }
    setCouponLoading(true);
    setCouponError('');
    try {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', code)
        .eq('status', 'active')
        .maybeSingle();

      if (error || !data) {
        setCouponError('Cupom inválido ou inativo.');
        setCouponLoading(false);
        return;
      }

      // Check expiry
      if (data.expires_at && new Date(data.expires_at) < new Date()) {
        setCouponError('Este cupom está expirado.');
        setCouponLoading(false);
        return;
      }

      // Check max uses
      if (data.max_uses !== null && data.used_count >= data.max_uses) {
        setCouponError('Este cupom atingiu o limite de usos.');
        setCouponLoading(false);
        return;
      }

      // Check min purchase
      if (data.min_purchase && cartTotal < data.min_purchase) {
        setCouponError(`Compra mínima de ${formatCurrency(data.min_purchase)} para usar este cupom.`);
        setCouponLoading(false);
        return;
      }

      let discount = 0;
      if (data.type === 'percentage') {
        discount = (cartTotal * data.value) / 100;
      } else if (data.type === 'fixed') {
        discount = data.value;
      } else if (data.type === 'free_shipping') {
        discount = 0; // shipping is already free in this store
      }

      setAppliedCoupon({ code: data.code, discount, type: data.type });
      setCouponPopup(false);
      setCouponInput('');
    } catch {
      setCouponError('Erro ao verificar cupom. Tente novamente.');
    }
    setCouponLoading(false);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null); // also clears localStorage via wrapper
    setCouponInput('');
    setCouponError('');
  };

  // Auto-clear coupon if cart becomes empty
  useEffect(() => {
    if (!cartLoading && cartItems.length === 0 && appliedCoupon) {
      setAppliedCoupon(null);
    }
  }, [cartItems.length, cartLoading]);

  useEffect(() => {
    document.title = "Loja Online";
  }, []);

  // Pixel: AddToCart on cart page (fires once per mount, after cart finishes loading with items)
  useEffect(() => {
    if (cartLoading || addToCartFiredRef.current || cartItems.length === 0) return;
    addToCartFiredRef.current = true;
    trackEvent("add_to_cart", {
      value: cartTotal,
      currency: "BRL",
      content_type: "product",
      contents: cartItems.map(i => ({
        id: i.product.id,
        product_id: i.product.id,
        quantity: i.quantity,
        item_price: i.product.price,
      })),
      content_ids: cartItems.map(i => i.product.id),
    });
  }, [cartLoading, cartItems, cartTotal, trackEvent]);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openQtyDropdown) return;
    const handleClick = () => setOpenQtyDropdown(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [openQtyDropdown]);

  const handleCheckout = () => {
    if ((window as any).__trackEvent) {
      (window as any).__trackEvent("initiate_checkout", {
        value: cartTotal,
        currency: "BRL",
        items: cartItems.map(item => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        }))
      });
    }
    navigate("/store/checkout");
  };

  // Inject mobile CSS for cart page
  useEffect(() => {
    if (!isMobile) return;
    const links: HTMLLinkElement[] = [];
    CART_MOBILE_CSS_URLS.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
      links.push(link);
    });
    const style = document.createElement("style");
    style.setAttribute("data-cart-mobile", "true");
    style.textContent = CART_MOBILE_STYLES;
    document.head.appendChild(style);
    return () => {
      links.forEach((l) => l.remove());
      style.remove();
    };
  }, [isMobile]);

  // Inject desktop CSS for cart page
  useEffect(() => {
    if (isMobile) return;
    const links: HTMLLinkElement[] = [];
    CART_DESKTOP_CSS_URLS.forEach((url) => {
      const existing = document.querySelector(`link[href="${url}"]`);
      if (existing) return;
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = url;
      document.head.appendChild(link);
      links.push(link);
    });
    const style = document.createElement("style");
    style.setAttribute("data-cart-desktop", "true");
    style.textContent = `
      @media screen and (min-width: 768px) {
        footer { display: revert !important; }
        s.andes-money-amount.andes-money-amount--previous.andes-money-amount--cents-superscript {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      links.forEach((l) => l.remove());
      style.remove();
    };
  }, [isMobile]);

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const compareTotal = cartItems.reduce((sum, i) => sum + i.product.compare_price * i.quantity, 0);
  const hasDiscount = compareTotal > cartTotal;

  const formatPriceParts = (value: number) => {
    const formatted = formatCurrency(value);
    const match = formatted.match(/^([^\d]*)([\d.,]+?)(\d{2})$/);
    if (match) {
      return { symbol: match[1], integer: match[2], cents: match[3] };
    }
    const parts = formatted.split(/[.,]/);
    const cents = parts.length > 1 ? parts[parts.length - 1] : "00";
    const intPart = formatted.replace(/[.,]\d{2}$/, "").replace(/[^\d.,]/g, "");
    const sym = formatted.replace(/[\d.,\s]/g, "");
    return { symbol: sym, integer: intPart, cents };
  };

  // Get recommended products based on tags from cart items (or all products if cart empty)
  const recommendedProducts = useMemo(() => {
    const cartProductIds = new Set(cartItems.map(i => i.product.id));
    const cartTags = new Set(cartItems.flatMap(i => i.product.tags || []));

    if (cartTags.size === 0) {
      // If no tags or empty cart, show random products
      return products.filter(p => !cartProductIds.has(p.id)).slice(0, 12);
    }

    return products
      .filter(p => !cartProductIds.has(p.id))
      .filter(p => (p.tags || []).some(tag => cartTags.has(tag)))
      .slice(0, 12);
  }, [products, cartItems]);

  if (cartLoading) {
    return (
      <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ backgroundColor: '#fff159' }}>
        <div style={{
          width: 48, height: 48,
          border: '4px solid transparent',
          borderTop: '4px solid #3483fa',
          borderRadius: '50%',
          animation: 'store-loader-spin 0.8s linear infinite',
        }} />
        <style>{`@keyframes store-loader-spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (isMobile) {
    const emptyCartWithRecommendations = (
      <div id="/v2" className="cart-list">
        <div className="main-container main-container--empty-cart" data-js="main-container" data-id="main-container">
          <section className="cl-empty-cart" data-js="empty-cart">
            <div className="andes-card cl-empty-cart__card andes-card--flat andes-card--primary andes-card--padding-0" data-andes-card="true" data-andes-card-hierarchy="primary">
              <img className="cl-empty-cart__image" alt="Seu carrinho está vazio" loading="eager" src="https://http2.mlstatic.com/frontend-assets/cart-frontend/empty-cart.svg" />
              <div className="cl-empty-cart__content">
                <div>
                  <p className="cl-empty-cart__title"><span>Seu carrinho está vazio</span></p>
                  <p className="cl-empty-cart__subtitle"><span>Temos milhões de ofertas, encontre a sua!</span></p>
                </div>
              </div>
            </div>
          </section>
        </div>
        {recommendedProducts.length > 0 && (
          <div className="recommendations-wrapper" data-testid="recommendations-wrapper">
            <div className="recommendations-container" data-testid="recommendations-container">
              <section className="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background">
                <div className="ui-recommendations-carousel-free" style={{ "--carousel-free-padding": "12px" } as React.CSSProperties}>
                  <div className="ui-recommendations-carousel-free__header">
                    <div className="ui-recommendations-title">
                      <h2 className="ui-recommendations-title-link">Recomendações para você</h2>
                    </div>
                  </div>
                  <div className="andes-carousel-free">
                    <ul aria-label="Recomendações para você" className="andes-carousel-free__list andes-carousel-free__list--spacing-12">
                      {recommendedProducts.map(rp => {
                        const rpPrice = formatPriceParts(rp.price);
                        return (
                          <li key={rp.id} className="andes-carousel-free__slide">
                            <div className="andes-card poly-card poly-card--grid-card poly-card--xlarge andes-card--flat andes-card--primary andes-card--padding-0" data-andes-card="true" data-andes-card-hierarchy="primary">
                              <div className="poly-card__portada">
                                <span className="poly-component__image-overlay"></span>
                                <Link to={`/store/product/${rp.slug}`}>
                                  <img className="poly-component__picture" alt={rp.name} loading="lazy" decoding="async" src={rp.image} style={{ objectFit: "contain" }} />
                                </Link>
                              </div>
                              <div className="poly-card__content">
                                <Link to={`/store/product/${rp.slug}`} className="poly-component__title">{rp.name}</Link>
                                <div className="poly-component__price">
                                  <div className="poly-price__current">
                                    <span className="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label={formatCurrency(rp.price)} aria-roledescription="Valor" style={{ fontSize: 24 }}>
                                      <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{rpPrice.symbol}</span></span>
                                      <span className="andes-money-amount__fraction" aria-hidden="true">{rpPrice.integer}</span>
                                      <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                      <span className="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" style={{ fontSize: 12, marginTop: 4 }}>{rpPrice.cents}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
    );

    if (cartItems.length === 0) {
      return emptyCartWithRecommendations;
    }

    return (
      <>
        <div id="/v2" className="cart-list">
        <div className="main-container" data-js="main-container" data-id="main-container">
          <section className="cl-grouped-items__container">
            <section className="cl-cards-list" data-testid="card-list" data-id="card-list">
              <div className="andes-card cl-grouped-card andes-card--flat andes-card--primary andes-card--padding-16" id="full" data-andes-card="true" data-andes-card-hierarchy="primary">
                {/* Card Header - Produtos FULL (shown once) */}
                <div className="andes-card__header cl-card-header cl-card-header--no-highlight" data-andes-card-header="true">
                  <div style={{ display: "contents" }}>
                    <div className="cl-card-header__checkbox-wrapper cl-card-header__checkbox-wrapper--no-highlight">
                      <div className="andes-checkbox cl-card-header__checkbox cl-card-header__checkbox--no-highlight" data-andes-checkbox="true" data-andes-state="checked">
                        <span className="andes-checkbox__checkbox" data-andes-checkbox-container="true">
                          <input autoComplete="off" className="andes-checkbox__input" id="checkbox-full" type="checkbox" aria-labelledby="checkbox-full-srLabel" defaultChecked readOnly />
                          <span className="andes-checkbox__icon">
                            <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                              <path d="M6.78786 9.39574L11.3645 4.81909L12.393 5.84761L6.78786 11.4528L3.60693 8.27185L4.63545 7.24333L6.78786 9.39574Z" fill="currentColor"></path>
                            </svg>
                          </span>
                        </span>
                        <span className="andes-visually-hidden" id="checkbox-full-srLabel">Produtos FULL</span>
                      </div>
                      <h2 className="cl-card-header__checkbox-wrapper cl-card-header__checkbox-wrapper--no-highlight">
                        <span></span>
                      </h2>
                    </div>
                    <div className="cl-card-header__text-wrapper">
                      <div className="cl-card-header__title-container">
                        <h3 className="cl-card-header__title">
                          <Link to="/store/products" className="cl-card-header__title" aria-label="Produtos FULL">
                            Produtos{" "}
                            <svg className="cl-card-header__title--icon" width="41" height="13" viewBox="0 0 41 13"><use href="#poly_full"></use></svg>
                            {" "}
                            <svg className="cl-card-header__title--icon" width="8" height="8" viewBox="0 0 16 16"><path d="M5.5 2L11 8l-5.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                          </Link>
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Content - All Items */}
                <div className="andes-card__content cl-grouped-card__content" data-andes-card-content="true">
                  {cartItems.map((item) => {
                    const price = formatPriceParts(item.product.price * item.quantity);
                    const comparePrice = formatPriceParts(item.product.compare_price * item.quantity);
                    const hasItemDiscount = item.product.compare_price > item.product.price;
                    const discountPct = hasItemDiscount ? Math.round((1 - item.product.price / item.product.compare_price) * 100) : 0;

                    return (
                      <div key={item.product.id} className="cl-item-card">
                        <section className="cl-item-card__polycard">
                          <div className="poly-card--checkbox poly-card--no-highlight poly-card--highlight-component poly-card poly-card--list poly-card--large poly-card--mobile">
                            <div className="poly-card__checkbox">
                              <div className="andes-checkbox" data-andes-checkbox="true" data-andes-state="checked">
                                <span className="andes-checkbox__checkbox" data-andes-checkbox-container="true">
                                  <input className="andes-checkbox__input" type="checkbox" aria-labelledby={`item-label-${item.product.id}`} defaultChecked readOnly />
                                  <span className="andes-checkbox__icon">
                                    <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                      <path d="M6.78786 9.39574L11.3645 4.81909L12.393 5.84761L6.78786 11.4528L3.60693 8.27185L4.63545 7.24333L6.78786 9.39574Z" fill="currentColor"></path>
                                    </svg>
                                  </span>
                                </span>
                                <span className="andes-visually-hidden" id={`item-label-${item.product.id}`}>{item.product.name}</span>
                              </div>
                            </div>
                            <div className="poly-card__portada">
                              <span className="poly-component__image-overlay"></span>
                              <Link to={`/store/product/${item.product.slug}`}>
                                <img
                                  className="poly-component__picture poly-component__picture--contain"
                                  src={item.product.image}
                                  alt={item.product.name}
                                  loading="lazy"
                                  decoding="async"
                                />
                              </Link>
                            </div>
                            <div className="poly-card__content">
                              <h4 className="poly-component__title-wrapper">
                                <Link to={`/store/product/${item.product.slug}`} className="poly-component__title">
                                  {item.product.name}
                                </Link>
                              </h4>
                            </div>
                          </div>
                          <div className="cl-item-card__quantity-container">
                            <div className="cl-item-card__quantity-selector" style={{ position: 'relative' }}>
                              <div className="cl-item-card__quantity-controls">
                                <div className="add-to-cart__dynamic add-to-cart__dynamic--enabled">
                                  <button
                                    className="add-to-cart-trigger-button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setOpenQtyDropdown(openQtyDropdown === item.product.id ? null : item.product.id);
                                    }}
                                  >
                                    <span>{item.quantity} un.</span>
                                    <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" data-testid="chevron-down-icon">
                                      <path d="M4.40175 5.35519L7.99814 8.95157L11.5983 5.35144L12.4468 6.19997L7.99814 10.6486L3.55322 6.20371L4.40175 5.35519Z" fill="#3483fa"></path>
                                    </svg>
                                  </button>
                                  {openQtyDropdown === item.product.id && (
                                    <div
                                      style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        zIndex: 100,
                                        background: '#fff',
                                        borderRadius: 6,
                                        boxShadow: '0 4px 16px rgba(0,0,0,.16)',
                                        minWidth: 120,
                                        marginTop: 4,
                                        overflow: 'hidden',
                                      }}
                                    >
                                      {[1, 2, 3, 4, 5, 6].map((qty) => (
                                        <button
                                          key={qty}
                                          onClick={() => {
                                            updateCartQuantity(item.product.id, qty);
                                            setOpenQtyDropdown(null);
                                          }}
                                          style={{
                                            display: 'block',
                                            width: '100%',
                                            padding: '10px 16px',
                                            border: 'none',
                                            background: item.quantity === qty ? '#f0f0f0' : 'transparent',
                                            textAlign: 'left',
                                            fontSize: 14,
                                            cursor: 'pointer',
                                            color: item.quantity === qty ? '#3483fa' : 'rgba(0,0,0,.8)',
                                            fontWeight: item.quantity === qty ? 600 : 400,
                                          }}
                                        >
                                          {qty} un.
                                        </button>
                                      ))}
                                      <div style={{ height: 1, background: '#eee', margin: '0' }} />
                                      <button
                                        onClick={() => {
                                          removeFromCart(item.product.id);
                                          setOpenQtyDropdown(null);
                                        }}
                                        style={{
                                          display: 'block',
                                          width: '100%',
                                          padding: '10px 16px',
                                          border: 'none',
                                          background: 'transparent',
                                          textAlign: 'left',
                                          fontSize: 14,
                                          cursor: 'pointer',
                                          color: '#3483fa',
                                          fontWeight: 400,
                                        }}
                                      >
                                        Excluir
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <div className="cl-price">
                              {hasItemDiscount && (
                                <div className="cl-price__content-ds-prev">
                                  <div className="cl-price__previous-wrapper">
                                    <s className="andes-money-amount andes-money-amount--previous andes-money-amount--cents-superscript" style={{ fontSize: 12 }} role="img" aria-label={`Antes: ${formatCurrency(item.product.compare_price * item.quantity)}`} aria-roledescription="Valor">
                                      <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{comparePrice.symbol}</span></span>
                                      <span className="andes-money-amount__fraction" aria-hidden="true">{comparePrice.integer}</span>
                                      <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                      <span className="andes-money-amount__cents andes-money-amount__cents--superscript-12" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{comparePrice.cents}</span>
                                    </s>
                                    <span className="cl-price__previous-label" style={{ color: "#00a650", fontSize: 12, fontWeight: 600, marginLeft: 4 }}>{discountPct}% OFF</span>
                                  </div>
                                </div>
                              )}
                              <div className="cl-price__current">
                                <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: 18 }} role="img" aria-label={formatCurrency(item.product.price * item.quantity)} aria-roledescription="Valor">
                                  <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{price.symbol}</span></span>
                                  <span className="andes-money-amount__fraction" aria-hidden="true">{price.integer}</span>
                                  <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                  <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: 10, marginTop: 3 }} aria-hidden="true">{price.cents}</span>
                                </span>
                              </div>
                            </div>
                          </div>
                        </section>
                        <button
                          type="button"
                          className="andes-button cl-item-card__remove andes-button--large andes-button--mute"
                          aria-label="Excluir"
                          data-testid="remove-button"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <span className="andes-button__content" data-andes-button-content="true">
                            <svg className="cl-item-card__remove-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                              <use href="#delete_bin"></use>
                            </svg>
                          </span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Card Footer - Frete + Incentive (shown once) */}
                <div className="andes-card__footer cl-card-footer andes-card__footer--border" data-andes-card-footer="true">
                  <section className="cl-card-footer__ticket-row ticket-row--free" data-testid="ticket-row">
                    <div className="cl-card-footer__ticket-row--left-column"><span>Frete</span></div>
                    <div className="cl-card-footer__ticket-row--right-column">
                      {isFreeShipping
                        ? <span style={{ color: "#00a650" }} className="text-container poly-fw-semibold">Grátis</span>
                        : <span className="text-container poly-fw-semibold">—</span>}
                    </div>
                  </section>
                  <div className="cl-card-footer__info-row">
                    <div className="cl-card-footer__info-row__description">
                      <span className="cl-card-footer__info-row__description--info">Adicione mais produtos do mesmo vendedor e tenha frete grátis em </span>
                      <span className="cl-card-footer__info-row__description--seller-container" aria-hidden="true">
                        <svg className="cl-card-footer__info-row__description--seller-icon" width="41" height="13" viewBox="0 0 41 13"><use href="#poly_full"></use></svg>
                        {" "}
                      </span>
                      <span className="andes-visually-hidden">Produtos FULL</span>
                      <span className="cl-card-footer__info-row__description--ending-info">.</span>
                    </div>
                    <div className="cl-card-footer__info-row__action-link__container">
                      <Link to="/store/products" className="cl-card-footer__info-row__action-link">
                        Ver mais produtos{" "}
                        <svg className="cl-card-footer__info-row__action-link--icon" width="8" height="8" viewBox="0 0 16 16"><path d="M5.5 2L11 8l-5.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          </section>

          {/* Summary */}
          <section className="cl-summary cl-summary--visible" data-js="summary">
            <div className="andes-card cl-summary__card andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary">
              <span className="andes-visually-hidden"><h2>Resumo da compra</h2></span>
              <div className="andes-card__content cl-summary__content" data-andes-card-content="true">
                <div className="cl-summary__list">
                  <div className="cl-summary__container-rows">
                    <div className="cl-summary__row">
                      <span className="cl-summary__label">Produtos</span>
                      <span className="cl-summary__value">
                        {hasDiscount && (
                          <>
                            <s className="andes-money-amount poly-phrase-price andes-money-amount--previous andes-money-amount--cents-superscript" style={{ fontSize: 12 }} role="img" aria-label={`Antes: ${formatCurrency(compareTotal)}`}>
                              <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(compareTotal).symbol}</span></span>
                              <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(compareTotal).integer}</span>
                              <span className="andes-visually-hidden" aria-hidden="true">,</span>
                              <span className="andes-money-amount__cents andes-money-amount__cents--superscript-12" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{formatPriceParts(compareTotal).cents}</span>
                            </s>{" "}
                          </>
                        )}
                        <span className="andes-money-amount poly-phrase-price andes-money-amount--cents-superscript" style={{ fontSize: 14 }} role="img" aria-label={formatCurrency(cartTotal)}>
                          <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(cartTotal).symbol}</span></span>
                          <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(cartTotal).integer}</span>
                          <span className="andes-visually-hidden" aria-hidden="true">,</span>
                          <span className="andes-money-amount__cents andes-money-amount__cents--superscript-14" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{formatPriceParts(cartTotal).cents}</span>
                        </span>
                      </span>
                    </div>
                    <div className="cl-summary__row cl-summary__row--shipping">
                      <span className="cl-summary__label">Frete</span>
                      <span style={{ color: "#00a650" }} className="cl-summary__value poly-fw-semibold">Grátis</span>
                    </div>
                  </div>
                  {/* Coupon row - mobile */}
                  <div className="cl-summary__row cl-summary__row--coupon" style={{ cursor: 'pointer' }} onClick={() => { if (!appliedCoupon) { setCouponPopup(true); setCouponError(''); } }}>
                    {appliedCoupon ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                        <span style={{ color: '#00a650', fontWeight: 600, fontSize: 14 }}>✓ {appliedCoupon.code} aplicado</span>
                        <button onClick={(e) => { e.stopPropagation(); handleRemoveCoupon(); }} style={{ color: '#3483FA', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remover</button>
                      </div>
                    ) : (
                      <span style={{ color: "#3483FA" }} className="cl-summary__coupon-label poly-fw-semibold">Inserir código de cupom</span>
                    )}
                  </div>
                  {appliedCoupon && (
                    <div className="cl-summary__row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="cl-summary__label" style={{ color: '#00a650', fontSize: 13 }}>Desconto ({appliedCoupon.code})</span>
                      <span style={{ color: '#00a650', fontWeight: 600, fontSize: 13 }}>- {formatCurrency(discountAmount)}</span>
                    </div>
                  )}
                  <div>
                    <div className="cl-summary__row cl-summary__row--total">
                      <div className="cl-summary__label--total"><span>Total</span></div>
                      <span>
                        <span className="andes-money-amount poly-phrase-price andes-money-amount--cents-superscript" style={{ fontSize: 18 }} role="img" aria-label={formatCurrency(finalTotal)}>
                          <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(finalTotal).symbol}</span></span>
                          <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(finalTotal).integer}</span>
                          <span className="andes-visually-hidden" aria-hidden="true">,</span>
                          <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: 10, marginTop: 3 }} aria-hidden="true">{formatPriceParts(finalTotal).cents}</span>
                        </span>
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleCheckout}
                  className="andes-button cl-summary__button andes-button--large andes-button--loud"
                  style={{ width: "100%", cursor: "pointer" }}
                >
                  <span className="andes-button__content" data-andes-button-content="true">Continuar compra</span>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* Recommendations */}
        {recommendedProducts.length > 0 && (
          <div className="recommendations-wrapper" data-testid="recommendations-wrapper">
            <div className="recommendations-container" data-testid="recommendations-container">
              <section className="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background">
                <div className="ui-recommendations-carousel-free" style={{ "--carousel-free-padding": "12px" } as React.CSSProperties}>
                  <div className="ui-recommendations-carousel-free__header">
                    <div className="ui-recommendations-title">
                      <h2 className="ui-recommendations-title-link">Recomendações para você</h2>
                    </div>
                  </div>
                  <div className="andes-carousel-free">
                    <ul aria-label="Recomendações para você" className="andes-carousel-free__list andes-carousel-free__list--spacing-12">
                      {recommendedProducts.map(rp => {
                        const rpPrice = formatPriceParts(rp.price);
                        const rpComparePrice = formatPriceParts(rp.compare_price);
                        const rpHasDiscount = rp.compare_price > rp.price;
                        const rpDiscountPct = rpHasDiscount ? Math.round((1 - rp.price / rp.compare_price) * 100) : 0;
                        return (
                          <li key={rp.id} className="andes-carousel-free__slide">
                            <div className="andes-card poly-card poly-card--grid-card poly-card--xlarge andes-card--flat andes-card--primary andes-card--padding-0" data-andes-card="true" data-andes-card-hierarchy="primary">
                              <div className="poly-card__portada">
                                <span className="poly-component__image-overlay"></span>
                                <Link to={`/store/product/${rp.slug}`}>
                                  <img className="poly-component__picture" alt={rp.name} loading="lazy" decoding="async" src={rp.image} style={{ objectFit: "contain" }} />
                                </Link>
                              </div>
                              <div className="poly-card__content">
                                <Link to={`/store/product/${rp.slug}`} className="poly-component__title">{rp.name}</Link>
                                <div className="poly-component__price">
                                  {rpHasDiscount && (
                                    <s className="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label={`Antes: ${formatCurrency(rp.compare_price)}`} style={{ fontSize: 12 }}>
                                      <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{rpComparePrice.symbol}</span></span>
                                      <span className="andes-money-amount__fraction" aria-hidden="true">{rpComparePrice.integer}</span>
                                      <span aria-hidden="true">,</span>
                                      <span className="andes-money-amount__cents" aria-hidden="true">{rpComparePrice.cents}</span>
                                    </s>
                                  )}
                                  <div className="poly-price__current">
                                    <span className="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label={formatCurrency(rp.price)} aria-roledescription="Valor" style={{ fontSize: 24 }}>
                                      <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{rpPrice.symbol}</span></span>
                                      <span className="andes-money-amount__fraction" aria-hidden="true">{rpPrice.integer}</span>
                                      <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                      <span className="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" style={{ fontSize: 12, marginTop: 4 }}>{rpPrice.cents}</span>
                                    </span>
                                    {rpHasDiscount && <span className="andes-money-amount__discount poly-price__disc--pill" style={{ fontSize: 14 }}>{rpDiscountPct}% OFF</span>}
                                  </div>
                                </div>
                                {isFreeShipping && <div className="poly-component__shipping">Frete grátis</div>}
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>
      {/* Coupon Popup - mobile */}
      {couponPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }} onClick={() => setCouponPopup(false)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 480, borderRadius: '14px 14px 0 0', padding: '24px 20px 32px', boxSizing: 'border-box' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'rgba(0,0,0,0.9)', margin: 0 }}>Inserir código de cupom</h3>
              <button onClick={() => setCouponPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(0,0,0,0.45)', lineHeight: 1 }}>✕</button>
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Ex: DESCONTO10"
                autoFocus
                style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: couponError ? '1.5px solid #f23d4f' : '1.5px solid #e8e8e8', fontSize: 15, fontWeight: 600, letterSpacing: 1, color: 'rgba(0,0,0,0.9)', background: '#fafafa', outline: 'none', textTransform: 'uppercase', fontFamily: 'monospace', boxSizing: 'border-box' }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{ padding: '12px 18px', borderRadius: 8, border: 'none', background: '#3483fa', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponLoading ? 0.7 : 1 }}
              >{couponLoading ? '...' : 'Aplicar'}</button>
            </div>
            {couponError && <p style={{ color: '#f23d4f', fontSize: 13, margin: 0, fontWeight: 500 }}>{couponError}</p>}
          </div>
        </div>
      )}
      </>
    );
  }
  // Desktop version
  return (
    <>
      <div id="/v2" className="cart-list">
        <div className="main-container" data-js="main-container" data-id="main-container">
          {cartItems.length === 0 ? (
            <section className="cl-empty-cart" data-js="empty-cart">
              <div className="andes-card cl-empty-cart__card andes-card--flat andes-card--primary andes-card--padding-0">
                <img className="cl-empty-cart__image" alt="Seu carrinho está vazio" loading="eager" src="https://http2.mlstatic.com/frontend-assets/cart-frontend/empty-cart.svg" />
                <div className="cl-empty-cart__content">
                  <p className="cl-empty-cart__title">Seu carrinho está vazio</p>
                  <p className="cl-empty-cart__subtitle">Temos milhões de ofertas, encontre a sua!</p>
                </div>
              </div>
            </section>
          ) : (
            <section className="cl-grouped-items__container">
              <section className="cl-cards-list" data-testid="card-list" data-id="card-list">
                <div className="andes-card cl-grouped-card andes-card--flat andes-card--primary andes-card--padding-16" id="full" data-andes-card="true" data-andes-card-hierarchy="primary">
                  {/* Card Header */}
                  <div className="andes-card__header cl-card-header cl-card-header--no-highlight" data-andes-card-header="true">
                    <div style={{ display: "contents" }}>
                      <div className="cl-card-header__checkbox-wrapper cl-card-header__checkbox-wrapper--no-highlight">
                        <div className="andes-checkbox cl-card-header__checkbox cl-card-header__checkbox--no-highlight" data-andes-checkbox="true" data-andes-state="checked">
                          <span className="andes-checkbox__checkbox" data-andes-checkbox-container="true">
                            <input autoComplete="off" className="andes-checkbox__input" type="checkbox" defaultChecked readOnly />
                            <span className="andes-checkbox__icon">
                              <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M6.78786 9.39574L11.3645 4.81909L12.393 5.84761L6.78786 11.4528L3.60693 8.27185L4.63545 7.24333L6.78786 9.39574Z" fill="currentColor"></path>
                              </svg>
                            </span>
                          </span>
                          <span className="andes-visually-hidden">Produtos FULL</span>
                        </div>
                        <h2 className="cl-card-header__checkbox-wrapper cl-card-header__checkbox-wrapper--no-highlight"><span></span></h2>
                      </div>
                      <div className="cl-card-header__text-wrapper">
                        <div className="cl-card-header__title-container">
                          <h3 className="cl-card-header__title">
                            <span className="cl-card-header__title" aria-label="Produtos FULL">
                              Produtos{" "}
                              <svg className="cl-card-header__title--icon" width="41" height="13" viewBox="0 0 41 13"><use href="#poly_full"></use></svg>
                              {" "}
                              <svg className="cl-card-header__title--icon" width="8" height="8" viewBox="0 0 16 16"><path d="M5.5 2L11 8l-5.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                            </span>
                          </h3>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Content - All Items */}
                  <div className="andes-card__content cl-grouped-card__content" data-andes-card-content="true">
                    {cartItems.map((item) => {
                      const price = formatPriceParts(item.product.price * item.quantity);
                      const comparePrice = formatPriceParts(item.product.compare_price * item.quantity);
                      const hasItemDiscount = item.product.compare_price > item.product.price;
                      const discountPct = hasItemDiscount ? Math.round((1 - item.product.price / item.product.compare_price) * 100) : 0;

                      return (
                        <div key={item.product.id} className="cl-item-card">
                          <div className="cl-item-card__two-columns-layout">
                            <div className="cl-item-card__main-column">
                              <section className="cl-item-card__polycard">
                                <div className="poly-card--no-highlight poly-card--highlight-component poly-card poly-card--list poly-card--xlarge poly-card--checkbox">
                                  <div className="poly-card__checkbox">
                                    <div className="andes-checkbox" data-andes-checkbox="true" data-andes-state="checked">
                                      <span className="andes-checkbox__checkbox" data-andes-checkbox-container="true">
                                        <input className="andes-checkbox__input" type="checkbox" defaultChecked readOnly aria-labelledby={`item-label-${item.product.id}`} />
                                        <span className="andes-checkbox__icon">
                                          <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                            <path d="M6.78786 9.39574L11.3645 4.81909L12.393 5.84761L6.78786 11.4528L3.60693 8.27185L4.63545 7.24333L6.78786 9.39574Z" fill="currentColor"></path>
                                          </svg>
                                        </span>
                                      </span>
                                      <span className="andes-visually-hidden" id={`item-label-${item.product.id}`}>{item.product.name}</span>
                                    </div>
                                  </div>
                                  <div className="poly-card__portada">
                                    <span className="poly-component__image-overlay"></span>
                                    <Link to={`/store/product/${item.product.slug}`} style={{ justifyContent: 'center', alignItems: 'center', display: 'flex', width: '100%', height: '100%' }}>
                                      <img className="poly-component__picture" src={item.product.image} alt={item.product.name} aria-hidden="true" loading="lazy" decoding="async" style={{ maxWidth: '70%', objectFit: 'contain' }} />
                                    </Link>
                                  </div>
                                  <div className="poly-card__content">
                                    <h4 className="poly-component__title-wrapper">
                                      <Link to={`/store/product/${item.product.slug}`} className="poly-component__title">{item.product.name}</Link>
                                    </h4>
                                  </div>
                                </div>
                                <button type="button" className="andes-button cl-item-card__remove andes-button--large andes-button--mute" aria-label="Excluir" data-testid="remove-button" onClick={() => removeFromCart(item.product.id)}>
                                  <span className="andes-button__content" data-andes-button-content="true">
                                    <svg className="cl-item-card__remove-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                                      <path d="M9 3V4H4V6H5V19C5 20.1 5.9 21 7 21H17C18.1 21 19 20.1 19 19V6H20V4H15V3H9ZM7 6H17V19H7V6ZM9 8V17H11V8H9ZM13 8V17H15V8H13Z" fill="currentColor" />
                                    </svg>
                                  </span>
                                </button>
                              </section>
                              <div className="cl-item-card__quantity-container">
                                <div className="cl-item-card__quantity-selector">
                                  <div className="cl-item-card__quantity-controls">
                                    <div className="add-to-cart__dynamic add-to-cart__dynamic--enabled">
                                      <div className="andes-input-stepper add-to-cart__stepper" data-andes-input-stepper="true" data-andes-input-stepper-size="small">
                                        <div className="andes-input-stepper__wrapper andes-input-stepper__wrapper--small" data-andes-input-stepper-input="true">
                                          <div className="andes-input-stepper__container">
                                            <button type="button" className="andes-input-stepper__button andes-input-stepper__button--decrement andes-input-stepper__button--small" disabled={item.quantity <= 1} onClick={() => { if (item.quantity > 1) updateCartQuantity(item.product.id, item.quantity - 1); }}>
                                              <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M1.99902 8.6007H13.999V7.4007H1.99902V8.6007Z" fill="currentColor"></path>
                                              </svg>
                                            </button>
                                            <div aria-atomic="true" aria-live="assertive" className="andes-input-stepper__content" role="alert">
                                              <span className="andes-input-stepper__value" data-andes-input-stepper-value="true">{item.quantity}</span>
                                            </div>
                                            <button type="button" className="andes-input-stepper__button andes-input-stepper__button--increment andes-input-stepper__button--small" onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}>
                                              <svg aria-hidden="true" color="currentColor" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                                <path d="M7.39902 7.40067V2.00067H8.59902V7.40067H13.999V8.60067H8.59902V14.0007H7.39902V8.60067H1.99902V7.40067H7.39902Z" fill="currentColor"></path>
                                              </svg>
                                            </button>
                                          </div>
                                        </div>
                                      </div>
                                      <span aria-label={`+${item.product.stock} disponíveis`} className="add-to-cart__label andes-input-stepper__helper">+{item.product.stock} disponíveis</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="cl-item-card__second-column">
                              <div className="cl-price">
                                {hasItemDiscount && (
                                  <div className="cl-price__content-ds-prev">
                                    <div className="cl-price__previous-wrapper">
                                      <s className="andes-money-amount andes-money-amount--previous andes-money-amount--cents-superscript" style={{ fontSize: 12 }} role="img" aria-label={`Antes: ${formatCurrency(item.product.compare_price * item.quantity)}`} aria-roledescription="Valor">
                                        <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{comparePrice.symbol}</span></span>
                                        <span className="andes-money-amount__fraction" aria-hidden="true">{comparePrice.integer}</span>
                                        <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                        <span className="andes-money-amount__cents andes-money-amount__cents--superscript-12" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{comparePrice.cents}</span>
                                      </s>
                                      <span className="cl-price__previous-label">{discountPct}% OFF</span>
                                    </div>
                                  </div>
                                )}
                                <div className="cl-price__current">
                                  <span className="andes-money-amount andes-money-amount--cents-superscript" style={{ fontSize: 20 }} role="img" aria-label={formatCurrency(item.product.price * item.quantity)} aria-roledescription="Valor">
                                    <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{price.symbol}</span></span>
                                    <span className="andes-money-amount__fraction" aria-hidden="true">{price.integer}</span>
                                    <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                    <span className="andes-money-amount__cents andes-money-amount__cents--superscript-20" style={{ fontSize: 10, marginTop: 4 }} aria-hidden="true">{price.cents}</span>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Card Footer */}
                  <div className="andes-card__footer cl-card-footer andes-card__footer--border" data-andes-card-footer="true">
                    <section className="cl-card-footer__ticket-row ticket-row--free" data-testid="ticket-row">
                      <div className="cl-card-footer__ticket-row--left-column"><span>Frete</span></div>
                      <div className="cl-card-footer__ticket-row--right-column">
                        {isFreeShipping
                          ? <span style={{ color: "#00a650" }} className="text-container poly-fw-semibold">Grátis</span>
                          : <span className="text-container poly-fw-semibold">—</span>}
                      </div>
                    </section>
                    <div className="cl-card-footer__info-row">
                      <div className="cl-card-footer__info-row__description">
                        <span className="cl-card-footer__info-row__description--info">Adicione mais produtos do mesmo vendedor e tenha frete grátis em </span>
                        <span className="cl-card-footer__info-row__description--seller-container" aria-hidden="true">
                          <svg className="cl-card-footer__info-row__description--seller-icon" width="41" height="13" viewBox="0 0 41 13"><use href="#poly_full"></use></svg>
                          {" "}
                        </span>
                        <span className="andes-visually-hidden">Produtos FULL</span>
                        <span className="cl-card-footer__info-row__description--ending-info">.</span>
                      </div>
                      <div className="cl-card-footer__info-row__action-link__container">
                        <Link to="/store/products" className="cl-card-footer__info-row__action-link">
                          Ver mais produtos{" "}
                          <svg className="cl-card-footer__info-row__action-link--icon" width="8" height="8" viewBox="0 0 16 16"><path d="M5.5 2L11 8l-5.5 6" stroke="currentColor" strokeWidth="1.5" fill="none" /></svg>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            </section>
          )}

          {/* Summary */}
          {cartItems.length > 0 && (
            <section className="cl-summary cl-summary--visible" data-js="summary">
              <div className="andes-card cl-summary__card andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary">
                <div className="andes-card__header cl-summary__header andes-card__header--border" data-andes-card-header="true">
                  <h2 tabIndex={0} className="andes-card__header-title">Resumo da compra</h2>
                </div>
                <div className="andes-card__content cl-summary__content" data-andes-card-content="true">
                  <div className="cl-summary__list">
                    <div className="cl-summary__container-rows">
                      <div className="cl-summary__row">
                        <span className="cl-summary__label">Produtos</span>
                        <span className="cl-summary__value">
                          {hasDiscount && (
                            <>
                              <s className="andes-money-amount poly-phrase-price andes-money-amount--previous andes-money-amount--cents-superscript" style={{ fontSize: 12 }} role="img" aria-label={`Antes: ${formatCurrency(compareTotal)}`} aria-roledescription="Valor">
                                <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(compareTotal).symbol}</span></span>
                                <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(compareTotal).integer}</span>
                                <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                <span className="andes-money-amount__cents andes-money-amount__cents--superscript-12" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{formatPriceParts(compareTotal).cents}</span>
                              </s>{" "}
                            </>
                          )}
                          <span className="andes-money-amount poly-phrase-price andes-money-amount--cents-superscript" style={{ fontSize: 14 }} role="img" aria-label={formatCurrency(cartTotal)} aria-roledescription="Valor">
                            <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(cartTotal).symbol}</span></span>
                            <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(cartTotal).integer}</span>
                            <span className="andes-visually-hidden" aria-hidden="true">,</span>
                            <span className="andes-money-amount__cents andes-money-amount__cents--superscript-14" style={{ fontSize: 8, marginTop: 2 }} aria-hidden="true">{formatPriceParts(cartTotal).cents}</span>
                          </span>
                        </span>
                      </div>
                      <div className="cl-summary__row cl-summary__row--shipping">
                        <span className="cl-summary__label">Frete</span>
                        <span style={{ color: "#00a650" }} className="cl-summary__value poly-fw-semibold">Grátis</span>
                      </div>
                    </div>
                    {/* Coupon row - desktop */}
                    <div className="cl-summary__row cl-summary__row--coupon" style={{ cursor: 'pointer' }} onClick={() => { if (!appliedCoupon) { setCouponPopup(true); setCouponError(''); } }}>
                      {appliedCoupon ? (
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
                          <span style={{ color: '#00a650', fontWeight: 600, fontSize: 14 }}>✓ {appliedCoupon.code} aplicado</span>
                          <button onClick={(e) => { e.stopPropagation(); handleRemoveCoupon(); }} style={{ color: '#3483FA', fontSize: 12, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Remover</button>
                        </div>
                      ) : (
                        <span style={{ color: "#3483FA" }} className="cl-summary__coupon-label poly-fw-semibold">Inserir código de cupom</span>
                      )}
                    </div>
                    {appliedCoupon && (
                      <div className="cl-summary__row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="cl-summary__label" style={{ color: '#00a650', fontSize: 13 }}>Desconto ({appliedCoupon.code})</span>
                        <span style={{ color: '#00a650', fontWeight: 600, fontSize: 13 }}>- {formatCurrency(discountAmount)}</span>
                      </div>
                    )}
                    <div>
                      <div className="cl-summary__row cl-summary__row--total">
                        <div className="cl-summary__label--total"><span>Total</span></div>
                        <span>
                          <span className="andes-money-amount poly-phrase-price andes-money-amount--cents-superscript" style={{ fontSize: 18 }} role="img" aria-label={formatCurrency(finalTotal)} aria-roledescription="Valor">
                            <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{formatPriceParts(finalTotal).symbol}</span></span>
                            <span className="andes-money-amount__fraction" aria-hidden="true">{formatPriceParts(finalTotal).integer}</span>
                            <span className="andes-visually-hidden" aria-hidden="true">,</span>
                            <span className="andes-money-amount__cents andes-money-amount__cents--superscript-18" style={{ fontSize: 10, marginTop: 3 }} aria-hidden="true">{formatPriceParts(finalTotal).cents}</span>
                          </span>
                        </span>
                      </div>
                    </div>
                    <button onClick={handleCheckout} className="andes-button cl-summary__button andes-button--large andes-button--loud" data-andes-button="true" data-andes-button-hierarchy="loud" data-andes-button-size="large" style={{ cursor: "pointer" }}>
                      <span className="andes-button__content" data-andes-button-content="true">Continuar compra</span>
                    </button>
                  </div>
                </div>
              </div>
            </section>
          )}
        </div>

        {/* Recommendations */}
        {recommendedProducts.length > 0 && (
          <div className="recommendations-wrapper" data-testid="recommendations-wrapper">
            <div className="recommendations-container" data-testid="recommendations-container">
              <section className="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background">
                <div className="ui-recommendations-carousel-snapped">
                  <div className="ui-recommendations-carousel-snapped__header">
                    <div className="ui-recommendations-carousel-snapped__header-titles">
                      <div className="ui-recommendations-title">
                        <h2 className="ui-recommendations-title-link">Recomendações para você</h2>
                      </div>
                    </div>
                  </div>
                  <section aria-label="Recomendações para você" aria-roledescription="Carrossel" className="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--arrows-visible">
                    <div className="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true">
                      <div className="andes-carousel-snapped andes-carousel-snapped--scroll-hidden">
                        <div className="andes-carousel-snapped__wrapper" style={{ display: "flex", flexDirection: "row", gap: 12, overflowX: "auto" }}>
                          {recommendedProducts.map((rp) => {
                            const rpPrice = formatPriceParts(rp.price);
                            const rpComparePrice = formatPriceParts(rp.compare_price);
                            const rpHasDiscount = rp.compare_price > rp.price;
                            const rpDiscountPct = rpHasDiscount ? Math.round((1 - rp.price / rp.compare_price) * 100) : 0;

                            return (
                              <div key={rp.id} role="group" className="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12" style={{ width: 230, marginRight: 12, flexShrink: 0 }}>
                                <div className="andes-card poly-card poly-card--grid-card poly-card--xlarge andes-card--flat andes-card--primary andes-card--padding-0" data-andes-card="true" data-andes-card-hierarchy="primary">
                                  <div className="poly-card__portada">
                                    <span className="poly-component__image-overlay"></span>
                                    <Link to={`/store/product/${rp.slug}`}>
                                      <img className="poly-component__picture" alt={rp.name} loading="lazy" decoding="async" src={rp.image} style={{ objectFit: "contain" }} />
                                    </Link>
                                  </div>
                                  <div className="poly-card__content">
                                    <Link to={`/store/product/${rp.slug}`} className="poly-component__title">{rp.name}</Link>
                                    <div className="poly-component__price">
                                      {rpHasDiscount && (
                                        <s className="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label={`Antes: ${formatCurrency(rp.compare_price)}`} style={{ fontSize: 12 }}>
                                          <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{rpComparePrice.symbol}</span></span>
                                          <span className="andes-money-amount__fraction" aria-hidden="true">{rpComparePrice.integer}</span>
                                          <span aria-hidden="true">,</span>
                                          <span className="andes-money-amount__cents" aria-hidden="true">{rpComparePrice.cents}</span>
                                        </s>
                                      )}
                                      <div className="poly-price__current">
                                        <span className="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label={formatCurrency(rp.price)} style={{ fontSize: 24 }}>
                                          <span className="andes-money-amount__currency" aria-hidden="true"><span className="andes-money-amount__currency-symbol">{rpPrice.symbol}</span></span>
                                          <span className="andes-money-amount__fraction" aria-hidden="true">{rpPrice.integer}</span>
                                          <span className="andes-visually-hidden" aria-hidden="true">,</span>
                                          <span className="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" style={{ fontSize: 12, marginTop: 4 }}>{rpPrice.cents}</span>
                                        </span>
                                        {rpHasDiscount && <span className="andes-money-amount__discount poly-price__disc--pill" style={{ fontSize: 14 }}>{rpDiscountPct}% OFF</span>}
                                      </div>
                                    </div>
                                    {isFreeShipping && <div className="poly-component__shipping"><span>Frete grátis</span></div>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          </div>
        )}
      </div>

      {/* Coupon Popup - desktop */}
      {couponPopup && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)' }} onClick={() => setCouponPopup(false)}>
          <div style={{ background: '#fff', width: '100%', maxWidth: 420, borderRadius: 12, padding: '28px 28px 24px', boxSizing: 'border-box', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <h3 style={{ fontSize: 17, fontWeight: 700, color: 'rgba(0,0,0,0.9)', margin: 0 }}>Cupom de desconto</h3>
              <button onClick={() => setCouponPopup(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'rgba(0,0,0,0.4)', lineHeight: 1 }}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: '0 0 18px' }}>Insira o código do cupom para aplicar o desconto</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                value={couponInput}
                onChange={e => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                placeholder="Ex: DESCONTO10"
                autoFocus
                style={{ flex: 1, padding: '12px 14px', borderRadius: 8, border: couponError ? '1.5px solid #f23d4f' : '1.5px solid #e8e8e8', fontSize: 15, fontWeight: 600, letterSpacing: 1, color: 'rgba(0,0,0,0.9)', background: '#fafafa', outline: 'none', textTransform: 'uppercase', fontFamily: 'monospace', boxSizing: 'border-box', transition: 'border-color .15s' }}
              />
              <button
                onClick={handleApplyCoupon}
                disabled={couponLoading}
                style={{ padding: '12px 20px', borderRadius: 8, border: 'none', background: '#3483fa', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', opacity: couponLoading ? 0.7 : 1, transition: 'opacity .15s' }}
              >{couponLoading ? 'Verificando...' : 'Aplicar'}</button>
            </div>
            {couponError && <p style={{ color: '#f23d4f', fontSize: 13, margin: 0, fontWeight: 500 }}>{couponError}</p>}
          </div>
        </div>
      )}
    </>
  );
};

export default StoreCart;
