import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import { useMascara } from "@/hooks/useMascara";
import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useStore, type Product } from "@/contexts/StoreContext";
import { formatCurrencyParts } from "@/utils/formatters";
import CrawlerCaptcha from "@/components/CrawlerCaptcha";
import StoreLoader from "@/components/StoreLoader";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTracking } from "@/contexts/TrackingContext";
import PolySvgSprites from "@/components/PolySvgSprites";
import { supabase } from "@/integrations/supabase/client";

const StoreCollection = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { mascara } = useMascara();
  const { collections, products, storeSettings, loading: storeLoading } = useStore();
  const collection = collections.find(c => c.slug === slug);
  const [crawlerSolved, setCrawlerSolved] = useState(false);
  const isMobile = useIsMobile();
  const { trackEvent } = useTracking();
  const mainRef = useRef<HTMLDivElement>(null);
  const [collectionProducts, setCollectionProducts] = useState<Product[]>([]);
  const [preparing, setPreparing] = useState(true);
  
  useEffect(() => {
    if (collection?.name) {
      document.title = "Loja Online";
    }
  }, [collection]);

  useEffect(() => {
    if (!collection) {
      if (!storeLoading) setPreparing(false);
      return;
    }
    const load = async () => {
      setPreparing(true);
      const { data: links } = await supabase.from('product_collections').select('product_id').eq('collection_id', collection.id);
      const productIds = (links || []).map((l: any) => l.product_id as string);
      const filtered = products.filter(p => productIds.includes(p.id) && p.status === 'active');
      setCollectionProducts(filtered);
      setPreparing(false);
    };
    load();
  }, [collection, products, storeLoading]);

  useEffect(() => {
    if (collection && collectionProducts.length > 0) {
      trackEvent("view_item_list", {
        item_list_id: collection.id,
        item_list_name: collection.name,
        items: collectionProducts.map((p, idx) => ({
          item_id: p.id,
          item_name: p.name,
          index: idx + 1,
          price: p.price
        }))
      });
    }
  }, [collection?.id, collectionProducts.length]);


  // Event delegation for desktop
  useEffect(() => {
    if (isMobile || !mainRef.current || collectionProducts.length === 0) return;

    const container = mainRef.current;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const card = target.closest("[data-product-slug]") as HTMLElement | null;
      if (card) {
        e.preventDefault();
        const productSlug = card.getAttribute("data-product-slug");
        if (productSlug) navigate(`/store/product/${productSlug}`);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [isMobile, collectionProducts, navigate]);

  // Event delegation for mobile
  const mobileRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!isMobile || !mobileRef.current || collectionProducts.length === 0) return;

    const container = mobileRef.current;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      const card = target.closest("[data-product-slug]") as HTMLElement | null;
      if (card) {
        e.preventDefault();
        const productSlug = card.getAttribute("data-product-slug");
        if (productSlug) navigate(`/store/product/${productSlug}`);
      }
    };

    container.addEventListener("click", handleClick);
    return () => container.removeEventListener("click", handleClick);
  }, [isMobile, collectionProducts, navigate]);



  if (storeLoading || (preparing && collection)) return <StoreLoader />;

  if (!collection) return null;
  if (collection.status === "inactive") return null;

  const isCrawler = collection.status === "anti-crawler-v1";
  if (isCrawler && !crawlerSolved) {
    return <CrawlerCaptcha onSolved={() => setCrawlerSolved(true)} />;
  }

  const formatPriceMobile = (price: number) => {
    const parts = formatCurrencyParts(price);
    return { fraction: parts.integer, cents: parts.cents, symbol: parts.symbol };
  };

  if (isMobile) {
    const buildMobileProductCards = () => {
      return collectionProducts.map((p, index) => {
        const current = formatPriceMobile(p.price);
        const compare = formatPriceMobile(p.compare_price);
        const hasDiscount = p.compare_price > p.price;
        const discountPercent = hasDiscount ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
        const installmentValue = formatPriceMobile(p.price / 10);

        return `
          <li class="ui-search-layout__item">
            <div class="ui-search-result" data-product-slug="${p.slug}" style="cursor:pointer">
              <div class="poly-card poly-card--list poly-card--large poly-card--mobile poly-card--CORE">
                <div class="poly-card__portada poly-card__portada--list-height">
                  <figure class="poly-component__image-wrapper poly-component__image-wrapper--image-height"><img
                      class="poly-component__picture poly-component__picture--contain"
                      src="${p.image || '/placeholder.svg'}"
                      alt="${p.name}"
                      loading="${index < 4 ? 'eager' : 'lazy'}"
                      decoding="async"></figure>
                </div>
                <div class="poly-card__content">
                  <h3 class="poly-component__title-wrapper"><a
                      class="poly-component__title">${p.name}</a></h3>
                  ${p.fake_orders > 0 ? `<span class="poly-component__review-compacted"><svg aria-hidden="true" width="10" height="10" viewBox="0 0 15 15"><use href="#poly_star_fill"></use></svg> <span class="poly-phrase-label">4.${Math.floor(Math.random() * 3) + 7}</span></span>` : ''}
                  <div class="poly-component__price">
                    ${hasDiscount ? `
                    <s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: ${compare.fraction} reais" aria-roledescription="Valor">
                      <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${compare.symbol}</span></span>
                      <span class="andes-money-amount__fraction" aria-hidden="true">${compare.fraction}</span>
                    </s>` : ''}
                    <div class="poly-price__current">
                      <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:20px" role="img" aria-label="${current.fraction} reais${current.cents !== '00' ? ' com ' + current.cents + ' centavos' : ''}" aria-roledescription="Valor">
                        <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${current.symbol}</span></span>
                        <span class="andes-money-amount__fraction" aria-hidden="true">${current.fraction}</span>
                        ${current.cents !== '00' ? `<span aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" style="font-size:10px;margin-top:4px" aria-hidden="true">${current.cents}</span>` : ''}
                      </span>
                      ${hasDiscount ? `<span class="poly-price__disc_label andes-money-amount__discount">${discountPercent}% OFF</span>` : ''}
                    </div>
                    <span style="color:#00a650" class="poly-price__installments"><span style="color:#000000e6" class="poly-phrase-label">ou</span> <span style="color:#000000e6"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="${installmentValue.fraction} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${installmentValue.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${installmentValue.fraction}</span></span></span> <span style="color:#000000e6" class="poly-phrase-label">em</span> 10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="${installmentValue.fraction} reais com ${installmentValue.cents} centavos" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${installmentValue.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${installmentValue.fraction}</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">${installmentValue.cents}</span></span> sem juros</span>
                  </div>
                  ${storeSettings.is_free_shipping ? '<div class="poly-component__shipping"><span class="poly-shipping--free">Frete grátis</span></div>' : ''}
                </div>
              </div>
            </div>
          </li>`;
      }).join('');
    };

    const mobileMainHTML = `
      <style>
        @import url("https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-mobile.css");
        @import url("https://http2.mlstatic.com/frontend-assets/search-nordic/search.mobile.395765f6.css");
        @import url("https://http2.mlstatic.com/frontend-assets/search-nordic/search.card.polycard.54483f98.css");
      </style>
      <main role="main" id="root-app" data-navigation="true">
        <div class="ui-search">
          <div class="ui-search-toolbar ui-search-toolbar--border">
            <ul class="ui-search-toolbar__actions">
              <li class="ui-search-toolbar__action"><a class="ui-search-sort sort-option-menu--link ui-search-link" title="Ordenar"><svg class="ui-search-icon ui-search-icon--order" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6.857 23.527l-3.705-3.705-1.616 1.616 6.464 6.464 6.464-6.462-1.616-1.616-3.705 3.701v-18.953h-2.286v18.955zM22.857 8.473l-3.705 3.705-1.616-1.616 6.464-6.464 0.809 0.807 5.655 5.657-1.616 1.616-3.705-3.703v18.953h-2.286v-18.955z"></path></svg>Ordenar</a></li>
              <li class="ui-search-toolbar__action ui-search-toolbar__action--filter"><a class="filter-option-menu--link ui-search-link"><svg class="ui-search-icon ui-search-icon--filter" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15.9 22h16.1v2h-16.1c-0.479 2.301-2.491 4.005-4.9 4.005s-4.42-1.704-4.894-3.973l-0.006-0.032h-6.1v-2h6.1c0.479-2.301 2.491-4.005 4.9-4.005s4.421 1.704 4.894 3.973l0.006 0.032zM18.1 8c0.48-2.301 2.491-4.005 4.9-4.005s4.421 1.704 4.894 3.973l0.006 0.032h4.1v2h-4.1c-0.48 2.301-2.491 4.005-4.9 4.005s-4.421-1.704-4.894-3.973l-0.006-0.033h-18.1v-2h18.1zM23 12c1.657 0 3-1.343 3-3s-1.343-3-3-3v0c-1.657 0-3 1.343-3 3s1.343 3 3 3v0zM11 26c1.657 0 3-1.343 3-3s-1.343-3-3-3v0c-1.657 0-3 1.343-3 3s1.343 3 3 3v0z"></path></svg>Filtrar</a></li>
            </ul>
          </div>
          <ol class="ui-search-layout ui-search-layout--stack">
            ${buildMobileProductCards()}
          </ol>
        </div>
      </main>`;

    return (
      <div ref={mobileRef}>
        <PolySvgSprites />
        <div dangerouslySetInnerHTML={{ __html: sanitizeStoreHTML(mobileMainHTML, mascara) }} />
      </div>
    );
  }

  const formatPrice = (price: number) => {
    const parts = formatCurrencyParts(price);
    return { fraction: parts.integer, cents: parts.cents, symbol: parts.symbol };
  };

  const buildProductCards = () => {
    return collectionProducts.map((p, index) => {
      const current = formatPrice(p.price);
      const compare = formatPrice(p.compare_price);
      const hasDiscount = p.compare_price > p.price;
      const discountPercent = hasDiscount ? Math.round((1 - p.price / p.compare_price) * 100) : 0;
      const installmentValue = formatPrice(p.price / 10);

      return `
        <li class="ui-search-layout__item">
          <div class="ui-search-result__wrapper" data-product-slug="${p.slug}" style="cursor:pointer">
            <div class="andes-card poly-card poly-card--grid-card poly-card--xlarge poly-card--CORE andes-card--flat andes-card--primary andes-card--padding-0">
              <div class="poly-card__portada">
                <img class="poly-component__picture poly-component__picture--single"
                  src="${p.image || '/placeholder.svg'}"
                  alt="${p.name}"
                  loading="${index < 4 ? 'eager' : 'lazy'}"
                  decoding="async">
              </div>
              <div class="poly-card__content">
                <h3 class="poly-component__title-wrapper">
                  <a class="poly-component__title">${p.name}</a>
                </h3>
                ${p.fake_orders > 0 ? `
                <span class="poly-component__review-compacted" aria-hidden="true">
                  <svg aria-hidden="true" width="10" height="10" viewBox="0 0 15 15">
                    <use href="#poly_star_fill"></use>
                  </svg>
                  <span class="poly-phrase-label">4.${Math.floor(Math.random() * 3) + 7}</span>
                  <span style="color:#737373" class="poly-phrase-label">| +${p.fake_orders > 1000 ? Math.floor(p.fake_orders / 1000) + 'mil' : p.fake_orders} vendidos</span>
                </span>` : ''}
                <div class="poly-component__price">
                  ${hasDiscount ? `
                  <s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: ${compare.fraction} reais" aria-roledescription="Valor">
                    <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${compare.symbol}</span></span>
                    <span class="andes-money-amount__fraction" aria-hidden="true">${compare.fraction}</span>
                  </s>` : ''}
                  <div class="poly-price__current">
                    <span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="${current.fraction} reais${current.cents !== '00' ? ' com ' + current.cents + ' centavos' : ''}" aria-roledescription="Valor">
                      <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${current.symbol}</span></span>
                      <span class="andes-money-amount__fraction" aria-hidden="true">${current.fraction}</span>
                      ${current.cents !== '00' ? `<span aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-24" style="font-size:12px;margin-top:4px" aria-hidden="true">${current.cents}</span>` : ''}
                    </span>
                    ${hasDiscount ? `<span class="poly-price__disc_label andes-money-amount__discount">${discountPercent}% OFF</span>` : ''}
                  </div>
                  <span class="poly-price__installments"><span style="color:rgba(0,0,0,0.9)">em</span> <span style="color:#00a650">10x
                    <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="${installmentValue.fraction} reais com ${installmentValue.cents} centavos" aria-roledescription="Valor">
                      <span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${installmentValue.symbol}</span></span>
                      <span class="andes-money-amount__fraction" aria-hidden="true">${installmentValue.fraction}</span>
                      <span aria-hidden="true">,</span>
                      <span class="andes-money-amount__cents" aria-hidden="true">${installmentValue.cents}</span>
                    </span> sem juros</span>
                  </span>
                </div>
                ${storeSettings.is_free_shipping ? `<div class="poly-component__shipping">
                  <span class="poly-shipping--free">Frete grátis</span>
                </div>` : ''}
              </div>
            </div>
          </div>
        </li>`;
    }).join('');
  };

  const mainHTML = `
    <main role="main" id="root-app" data-navigation="true">
      <div class="ui-search">
        <div class="ui-search-main ui-search-main--without-header ui-search-main--only-products ui-search-main--4x">
          <section class="ui-search-results ui-search-results--without-disclaimer">
            <div class="ui-search-view-options__container">
              <h2 class="ui-label-builder screen-reader-only" id="results">Resultados</h2>
              <div class="ui-search-view-options">
                <div class="ui-search-view-options__content">
                  <div class="ui-search-view-options__group">
                    <div class="ui-search-view-options__title">Ordenar por</div>
                    <div class="ui-search-sort-filter">
                      <div class="andes-dropdown andes-dropdown--standalone ui-search-sort-filter__dropdown andes-dropdown--small andes-dropdown--bottom">
                        <div class="andes-floating-menu">
                          <button aria-label="Mais relevantes" class="andes-dropdown__trigger" type="button" role="combobox" aria-expanded="false" aria-haspopup="listbox">
                            <span class="andes-dropdown__display-values">Mais relevantes</span>
                            <span class="andes-dropdown__arrow" aria-hidden="true">
                              <svg aria-hidden="true" color="currentColor" width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                                <path d="M9.35229 3.70447L6.00004 7.05672L2.64779 3.70447L1.85229 4.49996L6.00004 8.64771L10.1478 4.49996L9.35229 3.70447Z" fill="currentColor"></path>
                              </svg>
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <ol class="ui-search-layout ui-search-layout--grid" data-cols="3">
              ${buildProductCards()}
            </ol>
          </section>
        </div>
      </div>
    </main>`;



  return (
    <div ref={mainRef}>
      <PolySvgSprites />
      <div dangerouslySetInnerHTML={{ __html: sanitizeStoreHTML(mainHTML, mascara) }} />

    </div>
  );
};

export default StoreCollection;
