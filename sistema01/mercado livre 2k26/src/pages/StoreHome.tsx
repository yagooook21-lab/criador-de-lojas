import { useEffect, useCallback, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { supabase } from "@/integrations/supabase/client";
import { useMascara } from "@/hooks/useMascara";
import { sanitizeStoreHTML } from "@/lib/mascaraSanitizer";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency, formatCurrencyParts } from "@/utils/formatters";

const StoreHome = () => {
  const { storeSettings } = useStore();
  
  const [viewedProducts, setViewedProducts] = useState<any[]>([]);
  const [featuredCollections, setFeaturedCollections] = useState<{collection: any, products: any[]}[]>([]);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const { mascara } = useMascara();

  // Track viewport changes to re-run injection logic
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);



  // Fetch viewed products from localStorage + DB
  useEffect(() => {
    const slugs: string[] = JSON.parse(localStorage.getItem('viewed_products') || '[]').slice(0, 3);
    if (slugs.length === 0) return;
    const fetchViewed = async () => {
      const { data } = await supabase.from('products').select('name, slug, price, compare_price, image, enable_pix').in('slug', slugs);
      if (data) {
        const sorted = slugs.map(s => data.find(p => p.slug === s)).filter(Boolean);
        setViewedProducts(sorted);
      }
    };
    fetchViewed();
  }, []);

  // Fetch featured collections WITH their products
  useEffect(() => {
    const fetchFeatured = async () => {
      const { data: collections } = await supabase.from('collections').select('id, name, slug, image').eq('is_featured', true).limit(3);
      if (!collections || collections.length === 0) {
        setFeaturedCollections([]);
        window.dispatchEvent(new CustomEvent('store-home-data-ready'));
        return;
      }
      
      const results: {collection: any, products: any[]}[] = [];
      for (const col of collections) {
        const { data: links } = await supabase.from('product_collections').select('product_id').eq('collection_id', col.id);
        const productIds = (links || []).map((l: any) => l.product_id);
        let products: any[] = [];
        if (productIds.length > 0) {
          const { data } = await supabase
            .from('products')
            .select('name, slug, price, compare_price, image, status')
            .in('id', productIds)
            .eq('status', 'active')
            .limit(24);
          products = data || [];
        }
        results.push({ collection: col, products });
      }
      setFeaturedCollections(results);
      window.dispatchEvent(new CustomEvent('store-home-data-ready'));
    };
    fetchFeatured();
  }, []);

  // Desktop: inject/remove viewed product blocks in dynamic-access carousel
  useEffect(() => {
    if (isMobile) return;

    const timeout = setTimeout(() => {
      const carousel = document.querySelector('section.dynamic-access .carousel-dynamic-access-desktop .andes-carousel-snapped__wrapper') as HTMLElement;
      if (!carousel) return;

      // Remove existing product blocks (data-slider 1, 4, 5 are the static product recommendation cards)
      const staticProductSliders = ['1', '4', '5'];
      staticProductSliders.forEach(idx => {
        const slide = carousel.querySelector(`[data-slider="${idx}"]`);
        if (slide) slide.remove();
      });

      // Inject viewed products
      const titles = ["Visto recentemente", "Também pode lhe interessar", "O que você quer"];
      viewedProducts.forEach((p, i) => {
        if (i >= 3) return;
        const price = Math.floor(p.price);
        const comparePrice = p.compare_price > p.price ? Math.floor(p.compare_price) : 0;
        const discount = comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

        const fCurrent = formatCurrencyParts(price);
        const fCompare = formatCurrencyParts(comparePrice);

        const priceHTML = comparePrice > 0
          ? `<s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:12px" role="img" aria-label="Antes: ${fCompare.integer}" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCompare.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCompare.integer}</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" aria-label="Agora: ${fCurrent.integer}" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCurrent.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCurrent.integer}</span></span><span class="andes-money-amount__discount" style="font-size:12px">${discount}% OFF</span></div>`
          : `<div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" aria-label="Agora: ${fCurrent.integer}" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCurrent.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCurrent.integer}</span></span></div>`;

        const descClass = comparePrice > 0 ? 'dynamic-access-card-item__item-description dynamic-access-card-item__item-description--with-discount' : 'dynamic-access-card-item__item-description';

        const freeShippingHTML = storeSettings.is_free_shipping ? `<div class="dynamic-access-card-item__container-shipping-free"><span class="font-color--GREEN font-size--XSMALL font-family--SEMIBOLD ui-styled-label-formated">Frete grátis<span class="andes-visually-hidden">Frete grátis</span> <span class="dynamic-access-card-item__subtext font-size--XSMALL"></span></span></div>` : ``;

        const slideHTML = `<div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" style="width: 183.333px; margin-right: 16px;" data-slider="viewed-${i}" data-viewed-product="true"><div><div class="andes-card dynamic-access-card dynamic-access-card__medium dynamic-access-card-item andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-item-header"><h2 class="dynamic-access-card-item__title">${titles[i]}</h2></div><div class="dynamic-access-card-item__image" aria-hidden="true"><img src="${p.image || '/placeholder.svg'}" width="100%" height="100%" alt="${p.name}" loading="eager" decoding="sync"></div><div class="${descClass}"><a class="dynamic-access-card-item__item-title" data-product-slug="${p.slug}" style="cursor:pointer">${p.name}</a><div class="andes-money-amount-combo dynamic-access-card-item__price">${priceHTML}</div>${freeShippingHTML}</div></div></div></div>`;

        const temp = document.createElement('div');
        temp.innerHTML = slideHTML;
        const slideEl = temp.firstElementChild;
        if (slideEl) {
          // Insert after first static card (data-slider="0")
          const firstSlide = carousel.querySelector('[data-slider="0"]');
          if (firstSlide && firstSlide.nextSibling) {
            carousel.insertBefore(slideEl, firstSlide.nextSibling);
          } else {
            carousel.appendChild(slideEl);
          }
        }
      });

      // Add click handlers for viewed product cards
      carousel.querySelectorAll('[data-product-slug]').forEach(el => {
        el.addEventListener('click', () => {
          const slug = el.getAttribute('data-product-slug');
          if (slug && (window as any).spaNavigate) {
            (window as any).spaNavigate(`/store/product/${slug}?bypass`);
          }
        });
      });

      // Re-number remaining slides
      const allSlides = carousel.querySelectorAll('.andes-carousel-snapped__slide');
      allSlides.forEach((s, idx) => {
        s.setAttribute('aria-label', `${idx + 1} de ${allSlides.length}`);
      });
    }, 500);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewedProducts, isMobile]);

  // Desktop: inject featured collection products into blocks _R_166j6e_, _r_7d_, _R_266j6e_
  useEffect(() => {
    if (isMobile) return;

    const blockIds = ['_R_166j6e_', '_r_7d_', '_R_266j6e_'];

    const timeout = setTimeout(() => {
      // Hide all blocks first
      blockIds.forEach(id => {
        const container = document.getElementById(id);
        if (!container) return;
        const section = container.closest('.ui-recommendations-snapped-section') as HTMLElement;
        if (section) section.style.display = featuredCollections.length > 0 ? '' : 'none';
      });

      if (featuredCollections.length === 0) return;

      featuredCollections.forEach((fc, i) => {
        if (i >= 3) return;
        const blockId = blockIds[i];
        const container = document.getElementById(blockId);
        if (!container) return;
        const section = container.closest('.ui-recommendations-snapped-section') as HTMLElement;
        if (section) section.style.display = '';

        // Update title
        const titleEl = container.closest('.ui-recommendations-carousel-snapped')?.querySelector('.ui-recommendations-title-link');
        if (titleEl) titleEl.textContent = fc.collection.name;

        // Replace slides with products
        const wrapper = container.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement;
        if (!wrapper) return;
        wrapper.innerHTML = '';

        fc.products.forEach((p: any, pi: number) => {
          const price = Math.floor(p.price);
          const comparePrice = p.compare_price > p.price ? Math.floor(p.compare_price) : 0;
          const discount = comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

          const fCurrentCol = formatCurrencyParts(price);
          const fCompareCol = formatCurrencyParts(comparePrice);

          const comparePriceHTML = comparePrice > 0
            ? `<s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: ${fCompareCol.integer} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCompareCol.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCompareCol.integer}</span></s>`
            : '';

          const discountHTML = discount > 0
            ? `<span class="andes-money-amount__discount poly-price__disc--pill" style="font-size:12px">${discount}% OFF</span>`
            : '';

          const freeShippingHTML = storeSettings.is_free_shipping ? `<div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div>` : ``;

          const slideHTML = `<div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20 ${pi === 0 ? 'andes-carousel-snapped__slide--active' : ''}" aria-label="${pi + 1} de ${fc.products.length}" style="width: 173.333px; margin-right: 20px;" data-slider="${pi}" data-dynamic="true"><div class="poly-card poly-card--grid poly-card--xlarge" style="cursor:pointer" data-product-slug="${p.slug}"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="${p.image || '/placeholder.svg'}" alt="${p.name}" loading="lazy" decoding="async"></div><div class="poly-card__content"><a target="_self" class="poly-component__title">${p.name}</a><div class="poly-component__price">${comparePriceHTML}<div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="${fCurrentCol.integer} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCurrentCol.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCurrentCol.integer}</span></span>${discountHTML}</div></div>${freeShippingHTML}</div></div></div>`;

          const temp = document.createElement('div');
          temp.innerHTML = slideHTML;
          if (temp.firstElementChild) wrapper.appendChild(temp.firstElementChild);
        });

        // Add click handlers
        wrapper.querySelectorAll('[data-product-slug]').forEach(el => {
          el.addEventListener('click', () => {
            const slug = el.getAttribute('data-product-slug');
            if (slug && (window as any).spaNavigate) {
              (window as any).spaNavigate(`/store/product/${slug}?bypass`);
            }
          });
        });

        // Hide block if no products
        if (fc.products.length === 0 && section) {
          section.style.display = 'none';
        }
      });

      // Hide unused blocks
      for (let i = featuredCollections.length; i < 3; i++) {
        const container = document.getElementById(blockIds[i]);
        if (!container) continue;
        const section = container.closest('.ui-recommendations-snapped-section') as HTMLElement;
        if (section) section.style.display = 'none';
      }

      // Inject random product from 2nd featured collection into "Oferta do dia" (_r_78_)
      const ofertaDoDiaContainer = document.getElementById('_r_78_');
      if (ofertaDoDiaContainer) {
        const dualSection = ofertaDoDiaContainer.closest('.ui-recommendations-carousel-dual') as HTMLElement;
        if (featuredCollections.length >= 2 && featuredCollections[1].products.length > 0) {
          const products2 = featuredCollections[1].products;
          const randomProduct = products2[Math.floor(Math.random() * products2.length)];
          const p = randomProduct;
          const price = Math.floor(p.price);
          const comparePrice = p.compare_price > p.price ? Math.floor(p.compare_price) : 0;
          const discount = comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

          const fCurrentDay = formatCurrencyParts(price);
          const fCompareDay = formatCurrencyParts(comparePrice);

          const comparePriceHTML = comparePrice > 0
            ? `<s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: ${fCompareDay.integer} reais" aria-roledescription="Valor" style="font-size: 16px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCompareDay.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCompareDay.integer}</span></s>`
            : '';
          const discountHTML = discount > 0
            ? `<span class="poly-price__disc_label andes-money-amount__discount">${discount}% OFF</span>`
            : '';

          const freeShippingHTML = storeSettings.is_free_shipping ? `<div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div>` : ``;

          const wrapper = ofertaDoDiaContainer.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement;
          if (wrapper) {
            wrapper.innerHTML = `<div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20 andes-carousel-snapped__slide--active" aria-label="1 de 1" data-slider="0" data-dynamic="true" style="width: 298px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge" style="cursor:pointer" data-product-slug="${p.slug}"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="${p.name}" loading="lazy" decoding="async" src="${p.image || '/placeholder.svg'}"></div><div class="poly-card__content"><a target="_self" class="poly-component__title">${p.name}</a><div class="poly-component__price">${comparePriceHTML}<div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="${fCurrentDay.integer} reais" aria-roledescription="Valor" style="font-size: 32px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">${fCurrentDay.symbol}</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${fCurrentDay.integer}</span></span>${discountHTML}</div></div>${freeShippingHTML}</div></div></div>`;

            // Add click handler
            wrapper.querySelectorAll('[data-product-slug]').forEach(el => {
              el.addEventListener('click', () => {
                const slug = el.getAttribute('data-product-slug');
                if (slug && (window as any).spaNavigate) {
                  (window as any).spaNavigate(`/store/product/${slug}?bypass`);
                }
              });
            });
          }
          // Update title to collection name
          const titleEl = ofertaDoDiaContainer.closest('.ui-recommendations-carousel-snapped')?.querySelector('.ui-recommendations-title-link');
          if (titleEl) titleEl.textContent = featuredCollections[1].collection.name;
        } else if (dualSection) {
          dualSection.style.display = 'none';
        }
      }
    }, 600);

    return () => clearTimeout(timeout);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [featuredCollections, isMobile]);

  useEffect(() => {
    const style = document.createElement("style");
    style.id = "hide-cp-home";
    style.textContent = `.nav-header-cp-anchor.nav-menu-cp { display: none !important; } @media (max-width: 767px) { .nav-header, .nav-header::after, .nav-header::before { box-shadow: none !important; border-bottom: none !important; } } .carousel-dynamic-access-desktop .andes-carousel-snapped__slide { margin-right: 26px !important; }
/* Hide static placeholder products until dynamic data replaces them */
.carousel-dynamic-access-desktop .andes-carousel-snapped__slide[data-slider="1"],
.carousel-dynamic-access-desktop .andes-carousel-snapped__slide[data-slider="4"],
.carousel-dynamic-access-desktop .andes-carousel-snapped__slide[data-slider="5"] { display: none !important; }
.carousel-dynamic-access-desktop .andes-carousel-snapped__slide[data-viewed-product="true"] { display: block !important; }
#_R_166j6e_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide,
#_r_7d_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide,
#_R_266j6e_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide,
#_r_78_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide { display: none !important; }
#_R_166j6e_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide[data-dynamic="true"],
#_r_7d_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide[data-dynamic="true"],
#_R_266j6e_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide[data-dynamic="true"],
#_r_78_ .andes-carousel-snapped__wrapper > .andes-carousel-snapped__slide[data-dynamic="true"] { display: block !important; }
@media (max-width: 767px) {
  .carousel-dynamic-access-mobile .dynamic-access-card-item .dynamic-access-card-item__image,
  .carousel-dynamic-access-mobile .dynamic-access-card-item .dynamic-access-card-item__item-title,
  .carousel-dynamic-access-mobile .dynamic-access-card-item .dynamic-access-card-item__item-container,
  .carousel-dynamic-access-mobile .dynamic-access-card-item .dynamic-access-card-item__item-description { visibility: hidden; }
  .carousel-dynamic-access-mobile .dynamic-access-card-item[data-dynamic="true"] .dynamic-access-card-item__image,
  .carousel-dynamic-access-mobile .dynamic-access-card-item[data-dynamic="true"] .dynamic-access-card-item__item-title,
  .carousel-dynamic-access-mobile .dynamic-access-card-item[data-dynamic="true"] .dynamic-access-card-item__item-container,
  .carousel-dynamic-access-mobile .dynamic-access-card-item[data-dynamic="true"] .dynamic-access-card-item__item-description { visibility: visible; }
  .ui-recommendations-list-section [class*="ui-recommendations-list__items-wrapper"] > * { display: none !important; }
  .ui-recommendations-list-section [class*="ui-recommendations-list__items-wrapper"] > [data-dynamic="true"] { display: block !important; }
}`;
    document.head.appendChild(style);

    const linkId = "ml-home-mobile-css";
    if (!document.getElementById(linkId)) {
      const link = document.createElement("link");
      link.id = linkId;
      link.rel = "stylesheet";
      link.href = "https://http2.mlstatic.com/frontend-assets/homes-palpatine/home.mobile.fa68d261.css";
      link.media = "(max-width: 767px)";
      document.head.appendChild(link);
    }

    const linkId2 = "ml-home-polycard-css";
    if (!document.getElementById(linkId2)) {
      const link2 = document.createElement("link");
      link2.id = linkId2;
      link2.rel = "stylesheet";
      link2.href = "https://http2.mlstatic.com/frontend-assets/homes-palpatine/polycard-web-lib.12496df4.css";
      link2.media = "(max-width: 767px)";
      document.head.appendChild(link2);
    }

    const andesCssFiles = [
      { id: "ml-andes-common-css", href: "https://http2.mlstatic.com/frontend-assets/andes-common-styles/andes-common.min.css" },
      { id: "ml-andes-card-css", href: "https://http2.mlstatic.com/frontend-assets/andes-card/andes-card.min.css" },
      { id: "ml-andes-button-css", href: "https://http2.mlstatic.com/frontend-assets/andes-button/andes-button.min.css" },
      { id: "ml-andes-badge-css", href: "https://http2.mlstatic.com/frontend-assets/andes-badge/andes-badge.min.css" },
      { id: "ml-andes-money-css", href: "https://http2.mlstatic.com/frontend-assets/andes-money-amount/andes-money-amount.min.css" },
      { id: "ml-andes-carousel-snapped-css", href: "https://http2.mlstatic.com/frontend-assets/andes-carousel-snapped/andes-carousel-snapped.min.css" },
      { id: "ml-andes-carousel-free-css", href: "https://http2.mlstatic.com/frontend-assets/andes-carousel-free/andes-carousel-free.min.css" },
      { id: "ml-andes-dropdown-css", href: "https://http2.mlstatic.com/frontend-assets/andes-dropdown/andes-dropdown.min.css" },
      { id: "ml-andes-floating-menu-css", href: "https://http2.mlstatic.com/frontend-assets/andes-floating-menu/andes-floating-menu.min.css" },
      { id: "ml-andes-list-css", href: "https://http2.mlstatic.com/frontend-assets/andes-list/andes-list.min.css" },
    ];

    andesCssFiles.forEach(({ id, href }) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        link.media = "(max-width: 767px)";
        document.head.appendChild(link);
      }
    });

    // Desktop-only CSS files
    const desktopCssFiles = [
      { id: "ml-home-desktop-css", href: "https://http2.mlstatic.com/frontend-assets/homes-palpatine/home.desktop.70b25685.css" },
      { id: "ml-home-polycard-desktop-css", href: "https://http2.mlstatic.com/frontend-assets/homes-palpatine/polycard-web-lib.12496df4.css" },
      { id: "ml-nav-desktop-css", href: "https://http2.mlstatic.com/frontend-assets/ml-web-navigation/ui-navigation/7.19.0/mercadolibre/navigation-desktop.css" },
    ];

    desktopCssFiles.forEach(({ id, href }) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.id = id;
        link.rel = "stylesheet";
        link.href = href;
        link.media = "(min-width: 768px)";
        document.head.appendChild(link);
      }
    });

    return () => {
      style.remove();
      const el = document.getElementById(linkId);
      if (el) el.remove();
      const el2 = document.getElementById(linkId2);
      if (el2) el2.remove();
      andesCssFiles.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
      desktopCssFiles.forEach(({ id }) => {
        const el = document.getElementById(id);
        if (el) el.remove();
      });
    };
  }, []);

  // Auto-slide carousel (mobile) - target the hero banner specifically
  useEffect(() => {
    if (!isMobile) return;

    let currentSlide = 0;
    const initTimeout = setTimeout(() => {
      const heroSection = document.querySelector('.andes-carousel-snapped__new-home') as HTMLElement;
      if (!heroSection) return;
      const wrapper = heroSection.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement;
      if (!wrapper) return;
      const slides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
      if (slides.length <= 1) return;

      const interval = setInterval(() => {
        const currentSlides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
        if (currentSlides.length === 0) return;

        currentSlide = (currentSlide + 1) % currentSlides.length;
        const slideWidth = (currentSlides[0] as HTMLElement).offsetWidth + 12;
        wrapper.style.transition = 'transform 275ms ease-out';
        wrapper.style.transform = `translate3d(-${currentSlide * slideWidth}px, 0px, 0px)`;
      }, 4000);

      // Store interval for cleanup
      (wrapper as any).__autoSlideInterval = interval;
    }, 600);

    return () => {
      clearTimeout(initTimeout);
      const heroSection = document.querySelector('.andes-carousel-snapped__new-home');
      const wrapper = heroSection?.querySelector('.andes-carousel-snapped__wrapper') as any;
      if (wrapper?.__autoSlideInterval) clearInterval(wrapper.__autoSlideInterval);
    };
  }, [isMobile]);

  // Auto-slide desktop hero carousel
  useEffect(() => {
    if (isMobile) return;

    let currentSlide = 0;
    let interval: ReturnType<typeof setInterval>;

    const goToSlide = (index: number) => {
      const wrapper = document.getElementById('desktop-hero-wrapper') as HTMLElement;
      if (!wrapper) return;
      const slides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
      if (slides.length === 0) return;

      currentSlide = index;
      wrapper.style.transition = 'transform 500ms ease';
      wrapper.style.transform = `translate3d(-${currentSlide * 100}%, 0px, 0px)`;

      slides.forEach((s, i) => {
        s.classList.toggle('andes-carousel-snapped__slide--active', i === currentSlide);
      });

      const container = document.getElementById('desktop-hero-carousel');
      if (container) {
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-item]');
        dots.forEach((dot, i) => {
          dot.setAttribute('data-andes-carousel-snapped-pagination-item-active', i === currentSlide ? 'true' : 'false');
        });
      }
    };

    const startAutoSlide = () => {
      interval = setInterval(() => {
        const wrapper = document.getElementById('desktop-hero-wrapper') as HTMLElement;
        if (!wrapper) return;
        const total = wrapper.querySelectorAll('.andes-carousel-snapped__slide').length;
        goToSlide((currentSlide + 1) % total);
      }, 5000);
    };

    const initTimeout = setTimeout(() => {
      goToSlide(0);
      startAutoSlide();

      // Prev/Next buttons
      const container = document.getElementById('desktop-hero-carousel');
      if (container) {
        const prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]');
        const nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]');
        const total = container.querySelectorAll('.andes-carousel-snapped__slide').length;

        prevBtn?.addEventListener('click', () => {
          clearInterval(interval);
          goToSlide((currentSlide - 1 + total) % total);
          startAutoSlide();
        });
        nextBtn?.addEventListener('click', () => {
          clearInterval(interval);
          goToSlide((currentSlide + 1) % total);
          startAutoSlide();
        });

        // Pagination dots
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-action]');
        dots.forEach((dot, i) => {
          dot.addEventListener('click', () => {
            clearInterval(interval);
            goToSlide(i);
            startAutoSlide();
          });
        });
      }
    }, 300);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(interval);
    };
  }, [isMobile]);

  // Desktop dynamic-access carousel with bounded prev/next controls
  useEffect(() => {
    if (isMobile) return;

    let removeListeners: (() => void) | undefined;

    const initTimeout = setTimeout(() => {
      const container = document.querySelector('section.dynamic-access [data-andes-carousel-snapped-main="true"]') as HTMLElement | null;
      if (!container) return;

      const wrapper = container.querySelector('.carousel-dynamic-access-desktop .andes-carousel-snapped__wrapper') as HTMLElement | null;
      const prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]') as HTMLButtonElement | null;
      const nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]') as HTMLButtonElement | null;
      if (!wrapper || !prevBtn || !nextBtn) return;

      const slides = Array.from(wrapper.querySelectorAll('.andes-carousel-snapped__slide')) as HTMLElement[];
      if (slides.length === 0) return;

      let currentPage = 0;

      const getMetrics = () => {
        const firstSlide = slides[0];
        const slideWidth = firstSlide.getBoundingClientRect().width;
        const marginRight = Number.parseFloat(window.getComputedStyle(firstSlide).marginRight || '0') || 0;
        const slideStride = Math.max(0, slideWidth + marginRight);
        const visibleWidth = wrapper.parentElement?.getBoundingClientRect().width || 0;
        const contentWidth = slideStride > 0 ? Math.max(0, slideStride * slides.length - marginRight) : wrapper.scrollWidth;
        const maxOffset = Math.max(0, contentWidth - visibleWidth);
        const slidesPerPage = slideStride > 0 ? Math.max(1, Math.floor((visibleWidth + marginRight + 1) / slideStride)) : 1;
        const pageStride = slideStride > 0 ? slideStride * slidesPerPage : 0;
        const maxPage = pageStride > 0 ? Math.ceil(maxOffset / pageStride) : 0;

        return { pageStride, maxOffset, maxPage };
      };

      const updateButtonState = (isAtStart: boolean, isAtEnd: boolean, hasOverflow: boolean) => {
        const disablePrev = !hasOverflow || isAtStart;
        const disableNext = !hasOverflow || isAtEnd;

        prevBtn.disabled = disablePrev;
        nextBtn.disabled = disableNext;
        prevBtn.classList.toggle('andes-carousel-snapped__control--disabled', disablePrev);
        nextBtn.classList.toggle('andes-carousel-snapped__control--disabled', disableNext);
        prevBtn.setAttribute('data-andes-state', disablePrev ? 'visible disabled' : 'visible enabled');
        nextBtn.setAttribute('data-andes-state', disableNext ? 'visible disabled' : 'visible enabled');
      };

      const goToPage = (page: number) => {
        const { pageStride, maxOffset, maxPage } = getMetrics();

        currentPage = Math.max(0, Math.min(page, maxPage));
        const rawOffset = pageStride > 0 ? currentPage * pageStride : 0;
        const offset = Math.min(rawOffset, maxOffset);
        const isAtStart = offset <= 1;
        const isAtEnd = maxOffset <= 1 || offset >= maxOffset - 1;

        wrapper.style.transition = 'transform 400ms ease';
        wrapper.style.transform = `translate3d(-${offset}px, 0px, 0px)`;

        updateButtonState(isAtStart, isAtEnd, maxOffset > 1);
      };

      const handlePrev = () => goToPage(currentPage - 1);
      const handleNext = () => goToPage(currentPage + 1);
      const handleResize = () => goToPage(currentPage);

      prevBtn.addEventListener('click', handlePrev);
      nextBtn.addEventListener('click', handleNext);
      window.addEventListener('resize', handleResize);

      removeListeners = () => {
        prevBtn.removeEventListener('click', handlePrev);
        nextBtn.removeEventListener('click', handleNext);
        window.removeEventListener('resize', handleResize);
      };

      goToPage(0);
    }, 400);

    return () => {
      clearTimeout(initTimeout);
      removeListeners?.();
    };
  }, [isMobile]);

  // Desktop "${t("home.inspired_by_last_viewed")}" carousel navigation
  useEffect(() => {
    if (isMobile) return;

    let removeListeners: (() => void) | undefined;

    const initTimeout = setTimeout(() => {
      const container = document.getElementById('_R_166j6e_') as HTMLElement | null;
      if (!container) return;

      const wrapper = container.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement | null;
      const prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]') as HTMLButtonElement | null;
      const nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]') as HTMLButtonElement | null;
      if (!wrapper || !prevBtn || !nextBtn) return;

      const getSlides = () => Array.from(wrapper.querySelectorAll('.andes-carousel-snapped__slide[data-dynamic="true"]')) as HTMLElement[];
      if (getSlides().length === 0) return;

      let currentPage = 0;

      const getMetrics = () => {
        const slides = getSlides();
        if (slides.length === 0) return { pageStride: 0, maxOffset: 0, maxPage: 0 };
        const firstSlide = slides[0];
        const slideWidth = firstSlide.getBoundingClientRect().width;
        const marginRight = Number.parseFloat(window.getComputedStyle(firstSlide).marginRight || '0') || 0;
        const slideStride = Math.max(0, slideWidth + marginRight);
        const visibleWidth = wrapper.parentElement?.getBoundingClientRect().width || 0;
        const contentWidth = slideStride > 0 ? Math.max(0, slideStride * slides.length - marginRight) : wrapper.scrollWidth;
        const maxOffset = Math.max(0, contentWidth - visibleWidth);
        const slidesPerPage = slideStride > 0 ? Math.max(1, Math.floor((visibleWidth + marginRight + 1) / slideStride)) : 1;
        const pageStride = slideStride > 0 ? slideStride * slidesPerPage : 0;
        const maxPage = pageStride > 0 ? Math.ceil(maxOffset / pageStride) : 0;
        return { pageStride, maxOffset, maxPage };
      };

      const updateButtonState = (isAtStart: boolean, isAtEnd: boolean, hasOverflow: boolean) => {
        const disablePrev = !hasOverflow || isAtStart;
        const disableNext = !hasOverflow || isAtEnd;
        prevBtn.disabled = disablePrev;
        nextBtn.disabled = disableNext;
        prevBtn.classList.toggle('andes-carousel-snapped__control--disabled', disablePrev);
        nextBtn.classList.toggle('andes-carousel-snapped__control--disabled', disableNext);
        prevBtn.setAttribute('data-andes-state', disablePrev ? 'visible disabled' : 'visible enabled');
        nextBtn.setAttribute('data-andes-state', disableNext ? 'visible disabled' : 'visible enabled');
      };

      const updatePagination = () => {
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-item]');
        const { maxPage } = getMetrics();
        const totalPages = maxPage + 1;
        dots.forEach((dot, i) => {
          const pageIndex = Math.min(i, totalPages - 1);
          dot.setAttribute('data-andes-carousel-snapped-pagination-item-active', pageIndex === currentPage ? 'true' : 'false');
        });
      };

      const goToPage = (page: number) => {
        const { pageStride, maxOffset, maxPage } = getMetrics();
        currentPage = Math.max(0, Math.min(page, maxPage));
        const rawOffset = pageStride > 0 ? currentPage * pageStride : 0;
        const offset = Math.min(rawOffset, maxOffset);
        const isAtStart = offset <= 1;
        const isAtEnd = maxOffset <= 1 || offset >= maxOffset - 1;
        wrapper.style.transition = 'transform 400ms ease';
        wrapper.style.transform = `translate3d(-${offset}px, 0px, 0px)`;
        updateButtonState(isAtStart, isAtEnd, maxOffset > 1);
        updatePagination();
      };

      const handlePrev = () => goToPage(currentPage - 1);
      const handleNext = () => goToPage(currentPage + 1);
      const handleResize = () => goToPage(currentPage);

      prevBtn.addEventListener('click', handlePrev);
      nextBtn.addEventListener('click', handleNext);
      window.addEventListener('resize', handleResize);

      const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-action]');
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToPage(i));
      });

      removeListeners = () => {
        prevBtn.removeEventListener('click', handlePrev);
        nextBtn.removeEventListener('click', handleNext);
        window.removeEventListener('resize', handleResize);
      };

      goToPage(0);
    }, 900);

    return () => {
      clearTimeout(initTimeout);
      removeListeners?.();
    };
  }, [isMobile, featuredCollections]);

  // Desktop "Ofertas" dual carousel navigation
  useEffect(() => {
    if (isMobile) return;

    let removeListeners: (() => void) | undefined;

    const initTimeout = setTimeout(() => {
      const container = document.getElementById('_r_7d_') as HTMLElement | null;
      if (!container) return;

      const wrapper = container.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement | null;
      const prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]') as HTMLButtonElement | null;
      const nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]') as HTMLButtonElement | null;
      if (!wrapper || !prevBtn || !nextBtn) return;

      const getSlides = () => Array.from(wrapper.querySelectorAll('.andes-carousel-snapped__slide[data-dynamic="true"]')) as HTMLElement[];
      if (getSlides().length === 0) return;

      let currentPage = 0;

      const getMetrics = () => {
        const slides = getSlides();
        if (slides.length === 0) return { pageStride: 0, maxOffset: 0, maxPage: 0 };
        const firstSlide = slides[0];
        const slideWidth = firstSlide.getBoundingClientRect().width;
        const marginRight = Number.parseFloat(window.getComputedStyle(firstSlide).marginRight || '0') || 0;
        const slideStride = Math.max(0, slideWidth + marginRight);
        const visibleWidth = wrapper.parentElement?.getBoundingClientRect().width || 0;
        const contentWidth = slideStride > 0 ? Math.max(0, slideStride * slides.length - marginRight) : wrapper.scrollWidth;
        const maxOffset = Math.max(0, contentWidth - visibleWidth);
        const slidesPerPage = slideStride > 0 ? Math.max(1, Math.floor((visibleWidth + marginRight + 1) / slideStride)) : 1;
        const pageStride = slideStride > 0 ? slideStride * slidesPerPage : 0;
        const maxPage = pageStride > 0 ? Math.ceil(maxOffset / pageStride) : 0;
        return { pageStride, maxOffset, maxPage };
      };

      const updateButtonState = (isAtStart: boolean, isAtEnd: boolean, hasOverflow: boolean) => {
        const disablePrev = !hasOverflow || isAtStart;
        const disableNext = !hasOverflow || isAtEnd;
        prevBtn.disabled = disablePrev;
        nextBtn.disabled = disableNext;
        prevBtn.classList.toggle('andes-carousel-snapped__control--disabled', disablePrev);
        nextBtn.classList.toggle('andes-carousel-snapped__control--disabled', disableNext);
        prevBtn.setAttribute('data-andes-state', disablePrev ? 'visible disabled' : 'visible enabled');
        nextBtn.setAttribute('data-andes-state', disableNext ? 'visible disabled' : 'visible enabled');
      };

      const updatePagination = () => {
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-item]');
        const { maxPage } = getMetrics();
        const totalPages = maxPage + 1;
        dots.forEach((dot, i) => {
          const pageIndex = Math.min(i, totalPages - 1);
          dot.setAttribute('data-andes-carousel-snapped-pagination-item-active', pageIndex === currentPage ? 'true' : 'false');
        });
      };

      const goToPage = (page: number) => {
        const { pageStride, maxOffset, maxPage } = getMetrics();
        currentPage = Math.max(0, Math.min(page, maxPage));
        const rawOffset = pageStride > 0 ? currentPage * pageStride : 0;
        const offset = Math.min(rawOffset, maxOffset);
        const isAtStart = offset <= 1;
        const isAtEnd = maxOffset <= 1 || offset >= maxOffset - 1;
        wrapper.style.transition = 'transform 400ms ease';
        wrapper.style.transform = `translate3d(-${offset}px, 0px, 0px)`;
        updateButtonState(isAtStart, isAtEnd, maxOffset > 1);
        updatePagination();
      };

      const handlePrev = () => goToPage(currentPage - 1);
      const handleNext = () => goToPage(currentPage + 1);
      const handleResize = () => goToPage(currentPage);

      prevBtn.addEventListener('click', handlePrev);
      nextBtn.addEventListener('click', handleNext);
      window.addEventListener('resize', handleResize);

      const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-action]');
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToPage(i));
      });

      removeListeners = () => {
        prevBtn.removeEventListener('click', handlePrev);
        nextBtn.removeEventListener('click', handleNext);
        window.removeEventListener('resize', handleResize);
      };

      goToPage(0);
    }, 1000);

    return () => {
      clearTimeout(initTimeout);
      removeListeners?.();
    };
  }, [isMobile, featuredCollections]);

  // Desktop second "${t("home.inspired_by_last_viewed")}" carousel navigation (after dual carousel)
  useEffect(() => {
    if (isMobile) return;

    let removeListeners: (() => void) | undefined;

    const initTimeout = setTimeout(() => {
      const container = document.getElementById('_R_266j6e_') as HTMLElement | null;
      if (!container) return;

      const wrapper = container.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement | null;
      const prevBtn = container.querySelector('[data-andes-carousel-snapped-control="previous"]') as HTMLButtonElement | null;
      const nextBtn = container.querySelector('[data-andes-carousel-snapped-control="next"]') as HTMLButtonElement | null;
      if (!wrapper || !prevBtn || !nextBtn) return;

      const getSlides = () => Array.from(wrapper.querySelectorAll('.andes-carousel-snapped__slide[data-dynamic="true"]')) as HTMLElement[];
      if (getSlides().length === 0) return;

      let currentPage = 0;

      const getMetrics = () => {
        const slides = getSlides();
        if (slides.length === 0) return { pageStride: 0, maxOffset: 0, maxPage: 0 };
        const firstSlide = slides[0];
        const slideWidth = firstSlide.getBoundingClientRect().width;
        const marginRight = Number.parseFloat(window.getComputedStyle(firstSlide).marginRight || '0') || 0;
        const slideStride = Math.max(0, slideWidth + marginRight);
        const visibleWidth = wrapper.parentElement?.getBoundingClientRect().width || 0;
        const contentWidth = slideStride > 0 ? Math.max(0, slideStride * slides.length - marginRight) : wrapper.scrollWidth;
        const maxOffset = Math.max(0, contentWidth - visibleWidth);
        const slidesPerPage = slideStride > 0 ? Math.max(1, Math.floor((visibleWidth + marginRight + 1) / slideStride)) : 1;
        const pageStride = slideStride > 0 ? slideStride * slidesPerPage : 0;
        const maxPage = pageStride > 0 ? Math.ceil(maxOffset / pageStride) : 0;
        return { pageStride, maxOffset, maxPage };
      };

      const updateButtonState = (isAtStart: boolean, isAtEnd: boolean, hasOverflow: boolean) => {
        const disablePrev = !hasOverflow || isAtStart;
        const disableNext = !hasOverflow || isAtEnd;
        prevBtn.disabled = disablePrev;
        nextBtn.disabled = disableNext;
        prevBtn.classList.toggle('andes-carousel-snapped__control--disabled', disablePrev);
        nextBtn.classList.toggle('andes-carousel-snapped__control--disabled', disableNext);
        prevBtn.setAttribute('data-andes-state', disablePrev ? 'visible disabled' : 'visible enabled');
        nextBtn.setAttribute('data-andes-state', disableNext ? 'visible disabled' : 'visible enabled');
      };

      const updatePagination = () => {
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-item]');
        const { maxPage } = getMetrics();
        const totalPages = maxPage + 1;
        dots.forEach((dot, i) => {
          const pageIndex = Math.min(i, totalPages - 1);
          dot.setAttribute('data-andes-carousel-snapped-pagination-item-active', pageIndex === currentPage ? 'true' : 'false');
        });
      };

      const goToPage = (page: number) => {
        const { pageStride, maxOffset, maxPage } = getMetrics();
        currentPage = Math.max(0, Math.min(page, maxPage));
        const rawOffset = pageStride > 0 ? currentPage * pageStride : 0;
        const offset = Math.min(rawOffset, maxOffset);
        const isAtStart = offset <= 1;
        const isAtEnd = maxOffset <= 1 || offset >= maxOffset - 1;
        wrapper.style.transition = 'transform 400ms ease';
        wrapper.style.transform = `translate3d(-${offset}px, 0px, 0px)`;
        updateButtonState(isAtStart, isAtEnd, maxOffset > 1);
        updatePagination();
      };

      const handlePrev = () => goToPage(currentPage - 1);
      const handleNext = () => goToPage(currentPage + 1);
      const handleResize = () => goToPage(currentPage);

      prevBtn.addEventListener('click', handlePrev);
      nextBtn.addEventListener('click', handleNext);
      window.addEventListener('resize', handleResize);

      const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-action]');
      dots.forEach((dot, i) => {
        dot.addEventListener('click', () => goToPage(i));
      });

      removeListeners = () => {
        prevBtn.removeEventListener('click', handlePrev);
        nextBtn.removeEventListener('click', handleNext);
        window.removeEventListener('resize', handleResize);
      };

      goToPage(0);
    }, 1100);

    return () => {
      clearTimeout(initTimeout);
      removeListeners?.();
    };
  }, [isMobile, featuredCollections]);

  // Mobile: inject viewed products into dynamic-access cards
  useEffect(() => {
    if (!isMobile) return;
    if (viewedProducts.length === 0) return;

    const timeout = setTimeout(() => {
      const carousel = document.querySelector('.carousel-dynamic-access-mobile') as HTMLElement;
      if (!carousel) return;

      const slides = carousel.querySelectorAll('.andes-carousel-free__slide');
      const titles = ['Visto recentemente', 'O que você quer', 'Também te interessa'];

      viewedProducts.forEach((p: any, i: number) => {
        if (i >= 3 || !slides[i]) return;
        const card = slides[i].querySelector('.dynamic-access-card-item') as HTMLElement;
        if (!card) return;

        const price = Math.floor(p.price);
        const comparePrice = p.compare_price > p.price ? Math.floor(p.compare_price) : 0;
        const discount = comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

        // Update title
        const titleEl = card.querySelector('.dynamic-access-card-item__title');
        if (titleEl) titleEl.textContent = titles[i];
        const titleHidden = card.querySelector('.dynamic-access-card-item__title-hidden');
        if (titleHidden) titleHidden.textContent = titles[i];

        // Update image
        const img = card.querySelector('.dynamic-access-card-item__image') as HTMLImageElement;
        if (img) img.src = p.image || '/placeholder.svg';

        // Update product title
        const itemTitle = card.querySelector('.dynamic-access-card-item__item-title');
        if (itemTitle) {
          itemTitle.textContent = p.name;
          itemTitle.setAttribute('data-product-slug', p.slug);
          (itemTitle as HTMLElement).style.cursor = 'pointer';
        }

        // Update price
        const priceContainer = card.querySelector('.andes-money-amount-combo.dynamic-access-card-item__price');
        if (priceContainer) {
          if (comparePrice > 0) {
            priceContainer.innerHTML = `<s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Antes: ${comparePrice.toLocaleString('pt-BR')} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${comparePrice.toLocaleString('pt-BR')}</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: ${price.toLocaleString('pt-BR')} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${price.toLocaleString('pt-BR')}</span></span><span class="andes-money-amount__discount" style="font-size:10px">${discount}% OFF</span></div>`;
          } else {
            priceContainer.innerHTML = `<div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: ${price.toLocaleString('pt-BR')} reais" aria-roledescription="Valor"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${price.toLocaleString('pt-BR')}</span></span></div>`;
          }
        }

        // Mark as dynamic and add click handler
        card.setAttribute('data-dynamic', 'true');
        card.style.cursor = 'pointer';
        card.onclick = () => {
          if ((window as any).spaNavigate) {
            (window as any).spaNavigate(`/store/product/${p.slug}?bypass`);
          } else {
            window.location.href = `/store/product/${p.slug}?bypass`;
          }
        };
      });

      // Hide extra slides if fewer viewed products
      for (let i = viewedProducts.length; i < slides.length; i++) {
        (slides[i] as HTMLElement).style.display = 'none';
      }
      // Hide entire section if no viewed products
      if (viewedProducts.length === 0) {
        const section = carousel.closest('section.dynamic-access');
        if (section) (section as HTMLElement).style.display = 'none';
      }
    }, 400);

    return () => clearTimeout(timeout);
  }, [viewedProducts, isMobile]);

  // Mobile: inject featured collection products into recommendation grids
  useEffect(() => {
    if (!isMobile) return;

    const timeout = setTimeout(() => {
      // Map: mobile grid sections to inject into
      const gridSections = document.querySelectorAll('.ui-recommendations-list-section');
      // recommendationsGridHTML = first grid (Inspirado no último que você viu)
      // relatedRecommendationsHTML = second grid ("Você também pode estar interessado")
      // topSalesHTML = third section ("Mais vendidos em Televisores")

      const gridContainers: HTMLElement[] = [];
      gridSections.forEach(s => {
        const container = s.querySelector('.ui-recommendations-list') as HTMLElement;
        if (container) gridContainers.push(container);
      });

      if (featuredCollections.length === 0) {
        // Hide all recommendation grids if no collections
        gridContainers.forEach(c => {
          const section = c.closest('.ui-recommendations-list-section') as HTMLElement;
          if (section) section.style.display = 'none';
        });
        return;
      }

      featuredCollections.forEach((fc, i) => {
        if (i >= gridContainers.length) return;
        const container = gridContainers[i];
        const section = container.closest('.ui-recommendations-list-section') as HTMLElement;

        if (fc.products.length === 0) {
          if (section) section.style.display = 'none';
          return;
        }

        if (section) section.style.display = '';

        // Update title
        const titleEl = container.querySelector('.ui-recommendations-title-link');
        if (titleEl) titleEl.textContent = fc.collection.name;

        // Replace product cards
        const itemsWrapper = container.querySelector('[class*="items-wrapper"]') as HTMLElement;
        if (!itemsWrapper) return;

        // Force grid layout for all collection blocks on mobile (2 per row)
        // Remove list-related classes and ensure grid layout
        itemsWrapper.className = 'ui-recommendations-list__items-wrapper ui-recommendations-list__items-wrapper--grid';

        itemsWrapper.innerHTML = '';

        // Limit to 4 products on mobile
        const limitedProducts = fc.products.slice(0, 4);

        limitedProducts.forEach((p: any) => {
          const price = Math.floor(p.price);
          const comparePrice = p.compare_price > p.price ? Math.floor(p.compare_price) : 0;
          const discount = comparePrice > 0 ? Math.round(((comparePrice - price) / comparePrice) * 100) : 0;

          const comparePriceHTML = comparePrice > 0
            ? `<s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: ${comparePrice.toLocaleString('pt-BR')} reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${comparePrice.toLocaleString('pt-BR')}</span></s>`
            : '';

          const discountHTML = discount > 0
            ? `<span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">${discount}% OFF</span>`
            : '';

          const cardHTML = `<div class="poly-card poly-card--grid poly-card--large poly-card--mobile" style="cursor:pointer" data-product-slug="${p.slug}" data-dynamic="true"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="${p.name}" loading="lazy" decoding="async" src="${p.image || '/placeholder.svg'}"></div><div class="poly-card__content"><a class="poly-component__title">${p.name}</a><div class="poly-component__price">${comparePriceHTML}<div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="${price.toLocaleString('pt-BR')} reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">${price.toLocaleString('pt-BR')}</span></span>${discountHTML}</div></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div>`;

          const temp = document.createElement('div');
          temp.innerHTML = cardHTML;
          if (temp.firstElementChild) itemsWrapper.appendChild(temp.firstElementChild);
        });

        // Update "Ver mais" link to redirect to collection page
        const footerLinks = (section || container).querySelectorAll('.ui-recommendations-footer__link');
        footerLinks.forEach(fl => {
          const link = fl as HTMLAnchorElement;
          link.setAttribute('href', `/store/collection/${fc.collection.slug}?bypass`);
          link.style.cursor = 'pointer';
          link.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if ((window as any).spaNavigate) {
              (window as any).spaNavigate(`/store/collection/${fc.collection.slug}?bypass`);
            } else {
              window.location.href = `/store/collection/${fc.collection.slug}?bypass`;
            }
          });
        });

        // Add click handlers
        itemsWrapper.querySelectorAll('[data-product-slug]').forEach(el => {
          el.addEventListener('click', () => {
            const slug = el.getAttribute('data-product-slug');
            if (slug) {
              if ((window as any).spaNavigate) {
                (window as any).spaNavigate('/store/product/' + slug + '?bypass');
              } else {
                window.location.href = '/store/product/' + slug + '?bypass';
              }
            }
          });
        });
      });

      // Hide unused grid sections
      for (let i = featuredCollections.length; i < gridContainers.length; i++) {
        const section = gridContainers[i].closest('.ui-recommendations-list-section') as HTMLElement;
        if (section) section.style.display = 'none';
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [featuredCollections, isMobile]);

  useEffect(() => {
    if (!isMobile) return;

    let shoppingSlide = 0;
    let shoppingInterval: ReturnType<typeof setInterval>;

    const goToSlide = (index: number) => {
      const container = document.getElementById('_r_5r_');
      if (!container) return;
      const wrapper = container.querySelector('.andes-carousel-snapped__wrapper') as HTMLElement;
      if (!wrapper) return;
      const slides = wrapper.querySelectorAll('.andes-carousel-snapped__slide');
      if (slides.length === 0) return;

      shoppingSlide = index;
      const slideWidth = (slides[0] as HTMLElement).offsetWidth + 12;
      wrapper.style.transition = 'transform 350ms ease-out';
      wrapper.style.transform = `translate3d(-${shoppingSlide * slideWidth}px, 0px, 0px)`;

      slides.forEach((s, i) => {
        s.classList.remove('andes-carousel-snapped__slide--active', 'andes-carousel-snapped__slide--previous');
        if (i === shoppingSlide) s.classList.add('andes-carousel-snapped__slide--active');
        if (i === (shoppingSlide - 1 + slides.length) % slides.length) s.classList.add('andes-carousel-snapped__slide--previous');
      });

      const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-item]');
      dots.forEach((dot, i) => {
        dot.setAttribute('data-andes-carousel-snapped-pagination-item-active', i === shoppingSlide ? 'true' : 'false');
      });
    };

    const startAutoSlide = () => {
      shoppingInterval = setInterval(() => {
        const container = document.getElementById('_r_5r_');
        if (!container) return;
        const slides = container.querySelectorAll('.andes-carousel-snapped__slide');
        goToSlide((shoppingSlide + 1) % slides.length);
      }, 4000);
    };

    const initTimeout = setTimeout(() => {
      goToSlide(0);
      startAutoSlide();

      const container = document.getElementById('_r_5r_');
      if (container) {
        const dots = container.querySelectorAll('[data-andes-carousel-snapped-pagination-action]');
        dots.forEach((dot, i) => {
          dot.addEventListener('click', () => {
            clearInterval(shoppingInterval);
            goToSlide(i);
            startAutoSlide();
          });
        });
      }
    }, 500);

    return () => {
      clearTimeout(initTimeout);
      clearInterval(shoppingInterval);
    };
  }, [isMobile]);

  const carouselHTML = `
<div class="andes-carousel-snapped__exhibitor-wrapper andes-carousel-snapped__new-home">
  <section aria-label="Novidades principais" aria-roledescription="Carrossel"
    class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--strict-boundaries"
    id="_R_22j6e_" data-andes-carousel-snapped-main="true">
    <div class="andes-carousel-snapped__header"></div>
    <div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true">
      <div class="andes-carousel-snapped andes-carousel-snapped--scroll-visible">
        <div class="andes-carousel-snapped__wrapper"
          style="display: flex; will-change: transform; flex-direction: row; transition: transform 275ms; transform: translate3d(0px, 0px, 0px);">
          <div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12"
            aria-label="1 de 2" style="width: 100%; margin-right: 12px;" data-slider="0">
            <a class="exhibitor-carousel-item-0">
              <img
                src="https://http2.mlstatic.com/D_NQ_661358-MLA107470151816_032026-F.webp"
                alt="Frete grátis na sua primeira compra. Exclusivo no APP. Consulte os termos e condições."
                decoding="async" loading="eager" />
            </a>
          </div>
          <div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12"
            aria-label="2 de 2" style="width: 100%; margin-right: 12px;" data-slider="1">
            <a class="exhibitor-carousel-item-6">
              <img
                alt="Casa confortável. Até 21x sem juros com cartão Mercado Pago. Até 60% off. Consulte termos e condições."
                decoding="async" loading="eager"
                src="https://http2.mlstatic.com/D_NQ_957026-MLA107632889060_032026-F.webp" />
            </a>
          </div>
        </div>
      </div>
    </div>
  </section>
  <div class="gradient"></div>
</div>`;

  const newsRowHTML = `
<section class="news-row">
  <div class="andes-card container andes-card--flat andes-card--primary andes-card--padding-16" id="_R_4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary">
    <p class="font-color--BLACK font-size--XXSMALL font-family--REGULAR ui-styled-label-formated">
      <svg class="ui-homes-icon ui-homes-icon--truck_icon" viewBox="0 0 16 13" fill="none" xmlns="http://www.w3.org/2000/svg"><use href="#truck_icon"></use></svg>
      <span class="font-color--GREEN font-size--XXSMALL font-family--SEMIBOLD">Frete grátis</span> em milhões de produtos a partir de
      <span class="andes-money-amount andes-money-amount--cents-superscript andes-money-amount--compact" style="font-size:16px" role="img" aria-label="19 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="16">
        <span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span>
        <span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">19</span>
      </span>.
    </p>
  </div>
</section>`;

  const quickAccessHTML = `
<div><section class="button-row-carousel" type="button-row-carousel"><div class="andes-carousel-free" id="_R_6j6e_"><ul aria-label="Acesso rápido" class="andes-carousel-free__list andes-carousel-free__list--spacing-16 carousel-quick-access"><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_mercado_pago_carousel_mobile.webp" class="quick-access-item__image" alt="Mercado Pago" loading="eager" title="Mercado Pago" decoding="async"><span class="andes-visually-hidden">Mercado Pago</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Mercado Pago</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_ofertas_carousel_mobile.webp" class="quick-access-item__image" alt="Ofertas" loading="eager" title="Ofertas" decoding="async"><span class="andes-visually-hidden">Ofertas</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Ofertas</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__badge andes-thumbnail__badge-green andes-thumbnail__image quick-access-item__icon tag tag--green" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_mplay_qa_nuevo_6_carousel_mobile.webp" class="quick-access-item__image" alt="Mercado Play" loading="eager" title="Mercado Play" decoding="async"><span class="andes-visually-hidden">Mercado Play</span></div><div class="andes-badge andes-badge--pill andes-badge--green quick-access-item__pill andes-badge--small andes-badge--rounded-top-left andes-badge--rounded-top-right andes-badge--rounded-bottom-left andes-badge--rounded-bottom-right" data-andes-badge="true" data-andes-badge-type="pill" data-andes-badge-hierarchy="loud" data-andes-badge-size="small"><p class="andes-badge__content">Grátis</p></div></div></div><p class="quick-access-item__label tag"><a class="quick-access-item-anchor">Mercado Play</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_supermercado_carousel_mobile.webp" class="quick-access-item__image" alt="Mercado" loading="eager" title="Mercado" decoding="async"><span class="andes-visually-hidden">Mercado</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Mercado</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_cbt_quick_access_carousel_rebranding_v5_mobile.webp" class="quick-access-item__image" alt="Internacional" loading="eager" title="Internacional" decoding="async"><span class="andes-visually-hidden">Internacional</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Internacional</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_style_summer_female_v1_carousel_mobile.webp" class="quick-access-item__image" alt="Moda" loading="eager" title="Moda" decoding="async"><span class="andes-visually-hidden">Moda</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Moda</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_celulares_carousel_mobile.webp" class="quick-access-item__image" alt="Celulares" loading="eager" title="Celulares" decoding="async"><span class="andes-visually-hidden">Celulares</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Celulares</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_vehiculos_carousel_red2_mobile.webp" class="quick-access-item__image" alt="Veículos" loading="eager" title="Veículos" decoding="async"><span class="andes-visually-hidden">Veículos</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Veículos</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_armchair_carousel_mobile.webp" class="quick-access-item__image" alt="Lar" loading="eager" title="Lar" decoding="async"><span class="andes-visually-hidden">Lar</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Lar</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_computacion_carousel_mobile.webp" class="quick-access-item__image" alt="Computação" loading="eager" title="Computação" decoding="async"><span class="andes-visually-hidden">Computação</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Computação</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_tv_carousel_mobile.webp" class="quick-access-item__image" alt="Televisores" loading="eager" title="Televisores" decoding="async"><span class="andes-visually-hidden">Televisores</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Televisores</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_best_sellers_carousel_mobile.webp" class="quick-access-item__image" alt="Mais vendidos" loading="eager" title="Mais vendidos" decoding="async"><span class="andes-visually-hidden">Mais vendidos</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Mais vendidos</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_inmuebles_carousel_mobile.webp" class="quick-access-item__image" alt="Imóveis" loading="eager" title="Imóveis" decoding="async"><span class="andes-visually-hidden">Imóveis</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Imóveis</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_universal_affiliated_ganhe_carousel_v9_mobile.webp" class="quick-access-item__image" alt="Afiliados" loading="eager" title="Afiliados" decoding="async"><span class="andes-visually-hidden">Afiliados</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Afiliados</a></p></div></li><li class="andes-carousel-free__slide"><div class="quick-access-item"><div class="quick-access-item__content" aria-hidden="true"><div class="andes-thumbnail-container" data-andes-thumbnail="true" data-andes-thumbnail-hierarchy="mute" data-andes-thumbnail-size="48"><div class="andes-thumbnail andes-thumbnail--circle andes-thumbnail--48 andes-thumbnail__image quick-access-item__icon" data-andes-thumbnail-content="true"><img src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/quick_access/home_row_ver_mas_carousel_mobile.webp" class="quick-access-item__image" alt="Ver mais" loading="eager" title="Ver mais" decoding="async"><span class="andes-visually-hidden">Ver mais</span></div></div></div><p class="quick-access-item__label"><a class="quick-access-item-anchor">Ver mais</a></p></div></li></ul></div></section></div>`;
  const dynamicAccessHTML = `
<div><section type="dynamic-access" class="dynamic-access"><div class="andes-carousel-free" id="_R_8j6e_"><ul aria-label="Acessos dinâmicos" class="andes-carousel-free__list andes-carousel-free__list--spacing-12 carousel-dynamic-access-mobile"><li class="andes-carousel-free__slide"><div><div class="andes-card dynamic-access-card dynamic-access-card-item dynamic-access-card--with-discount andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary"><h2 class="dynamic-access-card-item__title">Visto recentemente</h2><a class="dynamic-access-card-item__title-hidden">Visto recentemente</a><img src="https://http2.mlstatic.com/D_Q_NP_2X_747617-MLA94556160281_102025-AB.webp" alt="" loading="eager" class="dynamic-access-card-item__image" decoding="sync"><a class="dynamic-access-card-item__item-title">Smart Tv Philips 32 Hd 32phg6910/78 Wi-fi</a><div class="dynamic-access-card-item__item-container"><div class="andes-money-amount-combo dynamic-access-card-item__price"><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 1139 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.139</span></span></div></div><div class="font-color--GREEN font-size--XXXSMALL font-family--SEMIBOLD ui-styled-label-formated dynamic-access-card-item__shipping">Frete grátis </div></div></div></div></li><li class="andes-carousel-free__slide"><div><div class="andes-card dynamic-access-card dynamic-access-card-item dynamic-access-card--with-discount andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary"><h2 class="dynamic-access-card-item__title">O que você quer</h2><a class="dynamic-access-card-item__title-hidden">O que você quer</a><img src="https://http2.mlstatic.com/D_Q_NP_2X_638445-MLA100187155155_122025-AB.webp" alt="" loading="eager" class="dynamic-access-card-item__image" decoding="sync"><a class="dynamic-access-card-item__item-title">Celular Samsung Galaxy A56 5g 128gb 8gb Ram Preto</a><div class="dynamic-access-card-item__item-container"><div class="andes-money-amount-combo dynamic-access-card-item__price"><s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Antes: 2855 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.855</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 1999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.999</span></span><span class="andes-money-amount__discount" style="font-size:10px" data-andes-money-amount-discount="true">29% OFF</span></div></div><div class="font-color--GREEN font-size--XXXSMALL font-family--SEMIBOLD ui-styled-label-formated dynamic-access-card-item__shipping">Frete grátis <svg class="ui-homes-icon ui-homes-icon--full" role="img" width="41" height="13" viewBox="0 0 41 13" xmlns="http://www.w3.org/2000/svg"><use href="#full_icon"></use></svg> </div></div></div></div></li><li class="andes-carousel-free__slide"><div><div class="andes-card dynamic-access-card dynamic-access-card-item dynamic-access-card--with-discount andes-card--flat andes-card--primary andes-card--padding-16" data-andes-card="true" data-andes-card-hierarchy="primary"><h2 class="dynamic-access-card-item__title">Também te interessa</h2><a class="dynamic-access-card-item__title-hidden">Também te interessa</a><img src="https://http2.mlstatic.com/D_Q_NP_2X_926181-MLA106965198532_022026-AB.webp" alt="" loading="eager" class="dynamic-access-card-item__image" decoding="sync"><a class="dynamic-access-card-item__item-title">Conj De Panelas 8 Peças Ceramic Life Smart Plus Vanilla - Brinox Baunilha</a><div class="dynamic-access-card-item__item-container"><div class="andes-money-amount-combo dynamic-access-card-item__price"><s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Antes: 1099 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.099</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 599 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">599</span></span><span class="andes-money-amount__discount" style="font-size:10px" data-andes-money-amount-discount="true">45% OFF</span></div></div><div class="font-color--GREEN font-size--XXXSMALL font-family--SEMIBOLD ui-styled-label-formated dynamic-access-card-item__shipping">Frete grátis <svg class="ui-homes-icon ui-homes-icon--full" role="img" width="41" height="13" viewBox="0 0 41 13" xmlns="http://www.w3.org/2000/svg"><use href="#full_icon"></use></svg> </div></div></div></div></li></ul></div></section></div>`;

  const recommendationsGridHTML = `<div><section data-testid="navigation-recommendations-grid" class="ui-recommendations-list-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img alt="" loading="lazy" class="ui-recommendations-carousel-container-img" decoding="async" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div class="ui-recommendations-list ui-recommendations-list__container--grid" style="--list-padding: 0px;"><div class="ui-recommendations-list__header"><div class="ui-recommendations-list__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Inspirado no último que você viu</h2></div></div></div><ul class="ui-recommendations-list__items-wrapper--grid" aria-label="Inspirado no último que você viu"><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv Aiwa 32 Android Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-32-bl-02-a" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_690159-MLA99542831560_122025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv Aiwa 32 Android Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-32-bl-02-a</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 1399 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.399</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 884 reais com 03 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">884</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">03</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">36% OFF</span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="88 reais com 40 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">88</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">40</span></span> sem juros</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv 32 Philco Ptv32k34rkgb Roku Tv Led Dolby Audio" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_681053-MLA99382614472_112025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv 32 Philco Ptv32k34rkgb Roku Tv Led Dolby Audio</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="918 reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">918</span></span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="91 reais com 80 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">91</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">80</span></span> sem juros</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv 32 Philco Led Roku Tv Hd Dolby Audio Bivolt P32cra" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_942875-MLA99952102899_112025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv 32 Philco Led Roku Tv Hd Dolby Audio Bivolt P32cra</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 1198 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.198</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 934 reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">934</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">22% OFF</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="90 reais com 67 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">90</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">67</span></span></span></div><div class="poly-component__shipping">Frete grátis</div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv Semp 32 Led Hd Android Tv Wifi Bluetooth 2 Hdmi Google Tv 60hz Hdr10 32s42" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_678540-MLA103737233598_012026-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv Semp 32 Led Hd Android Tv Wifi Bluetooth 2 Hdmi Google Tv 60hz Hdr10 32s42</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 1020 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.020</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 989 reais com 99 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">989</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">99</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">3% OFF</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="96 reais com 10 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">96</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">10</span></span></span></div><div class="poly-component__shipping">Frete grátis</div></div></div></ul><a class="ui-recommendations-footer__link" rel="nofollow"><div class="ui-recommendations-footer__wrapper"><div class="ui-recommendations-footer__text">Ver mais</div><div class="ui-recommendations-footer__chevron"><svg class="ui-homes-icon ui-homes-icon--chevron ui-recommendations-footer-icon" viewBox="0 0 9 14" xmlns="http://www.w3.org/2000/svg"><use href="#chevron_icon"></use></svg></div></div></a></div></section></section></div>`;

  const relatedRecommendationsHTML = `<div><section data-testid="navigation-related-recommendations-grid" class="ui-recommendations-list-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img alt="" loading="lazy" class="ui-recommendations-carousel-container-img" decoding="async" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div class="ui-recommendations-list ui-recommendations-list__container--grid" style="--list-padding: 0px;"><div class="ui-recommendations-list__header"><div class="ui-recommendations-list__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Também te interessa</h2></div></div></div><ul class="ui-recommendations-list__items-wrapper--grid" aria-label="Também te interessa"><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Painel Ripado Para Tv Até 50 Polegadas Com Nicho Prateleira Cor Ripado/off White" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_615975-MLA98366533614_112025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Painel Ripado Para Tv Até 50 Polegadas Com Nicho Prateleira Cor Ripado/off White</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 389 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">389</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 218 reais com 99 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">218</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">99</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">43% OFF</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="21 reais com 68 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">21</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">68</span></span></span></div><div class="poly-component__shipping">Frete grátis</div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Suporte Tv Tri-articulado Braço Longo Reforçado Regulável E Inclinável Lcd Led Plasmas 14 A 55 Polegadas Até 25kg Cor Preto Preto" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_881252-MLA106747513752_022026-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Suporte Tv Tri-articulado Braço Longo Reforçado Regulável E Inclinável Lcd Led Plasmas 14 A 55 Polegadas Até 25kg Cor Preto Preto</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 69 reais com 90 centavos" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">69</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">90</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 49 reais com 90 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">49</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">90</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">28% OFF</span></div></div><div class="poly-component__shipping">Frete grátis</div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Tv Stick Wi-fi Smart Tv Android Hdmi Tv Fire Tv Stick Preto Padrão" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_795377-MLA99915284167_112025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Tv Stick Wi-fi Smart Tv Android Hdmi Tv Fire Tv Stick Preto Padrão</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="110 reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">110</span></span></div></div><div class="poly-component__shipping">Frete grátis</div></div></div><div class="poly-card poly-card--grid poly-card--large poly-card--mobile"><div class="poly-card__portada poly-card__portada--grid-height"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Suporte De Tv Universal Fixo 10'' A 100'' Polegadas - Compacto - Sing Nature - Sing-03 Preto" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_712042-MLA99598947126_122025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Suporte De Tv Universal Fixo 10'' A 100'' Polegadas - Compacto - Sing Nature - Sing-03 Preto</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 19 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">19</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 17 reais com 10 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">17</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">10</span></span><span class="poly-price__disc_label andes-money-amount__discount">10% OFF no Pix</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">ou <span style="color: rgba(0, 0, 0, 0.9);"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="19 reais" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">19</span></span></span> em outros meios</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div></ul><a class="ui-recommendations-footer__link" rel="nofollow"><div class="ui-recommendations-footer__wrapper"><div class="ui-recommendations-footer__text">Ver mais</div><div class="ui-recommendations-footer__chevron"><svg class="ui-homes-icon ui-homes-icon--chevron ui-recommendations-footer-icon" viewBox="0 0 9 14" xmlns="http://www.w3.org/2000/svg"><use href="#chevron_icon"></use></svg></div></div></a></div></section></section></div>`;

  const topSalesHTML = `<div><section data-testid="top-sales-first-recommendations-list" class="ui-recommendations-list-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img alt="" loading="lazy" class="ui-recommendations-carousel-container-img" decoding="async" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div class="ui-recommendations-list ui-recommendations-list__container--default" style="--list-padding: 0px;"><div class="ui-recommendations-list__header"><div class="ui-recommendations-list__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Mais vendidos em Televisores</h2></div></div></div><ul class="ui-recommendations-list__items-wrapper--default" aria-label="Mais vendidos em Televisores"><div class="poly-card poly-card--list poly-card--large poly-card--mobile"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv 32 Philco Ptv32k34rkgb Roku Tv Led Dolby Audio" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_681053-MLA99382614472_112025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv 32 Philco Ptv32k34rkgb Roku Tv Led Dolby Audio</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="918 reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">918</span></span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="91 reais com 80 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">91</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">80</span></span> sem juros</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div><div class="poly-card poly-card--list poly-card--large poly-card--mobile"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv Aiwa 32 Android Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-32-bl-02-a" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_690159-MLA99542831560_122025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv Aiwa 32 Android Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-32-bl-02-a</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 1399 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.399</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 884 reais com 03 centavos" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">884</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-20" aria-hidden="true" style="font-size: 10px; margin-top: 4px;">03</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">36% OFF</span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="88 reais com 40 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">88</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">40</span></span> sem juros</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div><div class="poly-card poly-card--list poly-card--large poly-card--mobile"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture poly-component__picture--contain" alt="Smart Tv Aiwa 43 Android Full Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-43-bl-02-a" aria-hidden="true" loading="lazy" decoding="async" src="https://http2.mlstatic.com/D_Q_NP_2X_994322-MLA99533174096_122025-T.webp"></div><div class="poly-card__content"><a class="poly-component__title">Smart Tv Aiwa 43 Android Full Hd Borda Ultrafina Hdr10 Dolby Áudio Aws-tv-43-bl-02-a</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" aria-label="Antes: 1899 reais" aria-roledescription="Valor" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.899</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" aria-label="Agora: 1369 reais" aria-roledescription="Valor" style="font-size: 20px;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">1.369</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size: 12px;">27% OFF</span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" aria-label="136 reais com 90 centavos" aria-roledescription="Valor" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true">136</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true">90</span></span> sem juros</span></div><div class="poly-component__shipping"><span>Frete grátis</span></div></div></div></ul><a class="ui-recommendations-footer__link" rel="nofollow"><div class="ui-recommendations-footer__wrapper"><div class="ui-recommendations-footer__text">Ver todos os mais vendidos</div><div class="ui-recommendations-footer__chevron"><svg class="ui-homes-icon ui-homes-icon--chevron ui-recommendations-footer-icon" viewBox="0 0 9 14" xmlns="http://www.w3.org/2000/svg"><use href="#chevron_icon"></use></svg></div></div></a></div></section></section></div>`;

  const shoppingInfoHTML = `<div><section data-testid="site-shopping-info" class="site-shopping-info" type="site-shopping-info"><section aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--strict-boundaries" id="_r_5r_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="display: flex; will-change: transform; flex-direction: row; transition: transform 350ms; transform: translate3d(-774px, 0px, 0px);"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12" aria-label="1 de 3" data-slider="0" style="width: 375px; margin-right: 12px;"><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/payment.svg"></div><h2>Pague com cartão, boleto ou Pix</h2><p><span>Com o Mercado Pago, você tem frete grátis e parcelamento sem juros.</span> </p><a>Como pagar com Mercado Pago</a></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12 andes-carousel-snapped__slide--previous" aria-label="2 de 3" data-slider="1" style="width: 375px; margin-right: 12px;"><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/shipping.svg"></div><h2>Frete grátis a partir de R$ 19</h2><p><span>Benefício por ser sua primeira compra no app e pelo valor do produto.</span> </p></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-12 andes-carousel-snapped__slide--active" aria-label="3 de 3" data-slider="2" style="width: 375px; margin-right: 12px;"><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/protected.svg"></div><h2>Compra Garantida com o Mercado Pago</h2><p><span>Receba o produto que está esperando ou devolvemos o seu dinheiro.</span> </p><a>Como te protegemos</a></div></div></div></div></div><ul class="andes-carousel-snapped__pagination andes-carousel-snapped__pagination--light andes-carousel-snapped__pagination--position-bottom" aria-hidden="true" data-andes-carousel-snapped-pagination="true"><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 1</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 2</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="true"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 3</span></button></li></ul></section></section></div>`;


  const desktopShoppingInfoDesktopHTML = `<div><section data-testid="site-shopping-info" class="site-shopping-info" type="site-shopping-info"><div class="container"><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/payment.svg"></div><h2>Pague com cartão, boleto ou Pix</h2><p><span>Com o Mercado Pago, você tem frete grátis e parcelamento sem juros.</span> </p><a>Como pagar com Mercado Pago</a></div><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/shipping.svg"></div><h2>Frete grátis acima de R$ 19.</h2><p><span>Benefício por ser sua primeira compra no app e pelo valor do produto.</span> </p></div><div class="info-slide"><div class="img-container"><img class="img-container" alt="" loading="eager" decoding="async" src="https://http2.mlstatic.com/storage/homes-korriban/assets/images/ecosystem/protected.svg"></div><h2>Compra Garantida com o Mercado Pago</h2><p><span>Receba o produto que está esperando ou devolvemos o seu dinheiro.</span> </p><a>Como te protegemos</a></div></div></section></div>`;
  const desktopSeoHTML = `<div class="nav-footer-seo"><div class="nav-bounds nav-bounds-seo"><div class="nav-footer-seo__wrapper"><h3 class="nav-footer-seo__title">Mais buscados</h3><ul class="nav-footer-seo__menu"><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="apple watch">apple watch</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ar condicionado">ar condicionado</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ar condicionado inverter">ar condicionado inverter</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="bicicletas">bicicletas</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="cafeteira">cafeteira</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="carros novos">carros novos</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="computador">computador</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="fogao 4 boca">fogao 4 boca</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="fone de ouvido bluetooth">fone de ouvido bluetooth</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="freezer vertical">freezer vertical</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="geladeira frost free">geladeira frost free</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="guarda roupa casal">guarda roupa casal</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="guarda roupa solteiro">guarda roupa solteiro</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ipad">ipad</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone">iphone</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 8 plus">iphone 8 plus</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 11">iphone 11</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 13">iphone 13</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 13 pro max">iphone 13 pro max</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 14">iphone 14</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 14 pro">iphone 14 pro</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 14 pro max">iphone 14 pro max</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 15">iphone 15</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 16">iphone 16</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 16 plus">iphone 16 plus</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 16 pro">iphone 16 pro</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="iphone 16 pro max">iphone 16 pro max</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="jbl">jbl</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="microondas">microondas</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="monitor">monitor</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="motorola">motorola</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="nintendo switch">nintendo switch</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="notebook">notebook</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="notebook dell">notebook dell</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="painel para tv">painel para tv</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="penteadeira">penteadeira</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="poco x5 pro">poco x5 pro</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ps4">ps4</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ps5">ps5</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="redmi note 12">redmi note 12</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="s22 ultra">s22 ultra</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="samsung a54">samsung a54</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="samsung s23">samsung s23</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="smartwatch">smartwatch</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tablets samsung">tablets samsung</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tenis masculino">tenis masculino</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tennis feminino">tennis feminino</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tv 32 polegadas">tv 32 polegadas</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tv 50 4k">tv 50 4k</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="tv 50 polegadas">tv 50 polegadas</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="ventilador">ventilador</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="xbox">xbox</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="xbox series x">xbox series x</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="xdj">xdj</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="xiaomi">xiaomi</a></li><li class="nav-footer-seo__item"><a class="nav-footer-seo__link nav-footer-seo__link--capitalized" aria-label="comparador de celulares">comparador de celulares</a></li></ul></div></div></div>`;
  





  const desktopMainHTML = `<div class="home" data-banner-download-hydrate="now">
        <div>
            <div>
                <div class="andes-carousel-snapped__exhibitor-wrapper andes-carousel-snapped__hero--desktop">
                    <section aria-label="novidades principais" aria-roledescription="Carrossel"
                        class="andes-carousel-snapped__container andes-carousel-snapped__container--full andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--strict-boundaries"
                        id="desktop-hero-carousel" data-andes-carousel-snapped-main="true">
                        <div class="andes-carousel-snapped__header"></div>
                        <div class="andes-carousel-snapped__controls-wrapper"
                            data-andes-carousel-snapped-component="true"><button
                                class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large"
                                data-andes-carousel-snapped-control="previous" data-andes-state="" type="button"
                                aria-label="Anterior" name="andes-carousel-snapped_control"><svg aria-hidden="true"
                                    color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="24" height="24"
                                    viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M14.0656 4.9325L15.1263 5.99316L9.12254 11.9969L15.1325 18.0069L14.0719 19.0676L7.00122 11.9969L14.0656 4.9325Z"
                                        fill="currentColor"></path>
                                </svg></button>
                            <div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden">
                                <div class="andes-carousel-snapped__wrapper" id="desktop-hero-wrapper"
                                    style="display: flex; will-change: transform; flex-direction: row; transition: transform 500ms ease; transform: translate3d(0px, 0px, 0px);">
                                    <div role="group"
                                        class="andes-carousel-snapped__slide andes-carousel-snapped__slide--active"
                                        aria-label="1 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="0">
                                        <a class="exhibitor-carousel-item-0" tabindex="-1"><img
                                            alt="Ofertas do BBB. Meli Music. Mercado livre."
                                            decoding="sync" loading="eager"
                                            src="https://http2.mlstatic.com/D_NQ_997192-MLA108657718075_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="2 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="1">
                                        <a class="exhibitor-carousel-item-1" tabindex="-1"><img
                                            alt="Frete grátis na sua primeira compra."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_850887-MLA107526598556_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="3 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="2">
                                        <a class="exhibitor-carousel-item-2" tabindex="-1"><img
                                            alt="Casa confortável. Até 60% off."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_654795-MLA107642310506_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="4 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="3">
                                        <a class="exhibitor-carousel-item-3" tabindex="-1"><img
                                            alt="Meli+. Disney+. A partir de R$10,90 por mês."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_934012-MLA108569102883_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="5 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="4">
                                        <a class="exhibitor-carousel-item-4" tabindex="-1"><img
                                            alt="Tecnologia. Até 40% off."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_725717-MLA107402888712_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="6 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="5">
                                        <a class="exhibitor-carousel-item-5" tabindex="-1"><img
                                            alt="Supermercado. Até 50% off."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_803289-MLA108118723781_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                    <div role="group"
                                        class="andes-carousel-snapped__slide"
                                        aria-label="7 de 7" style="width: 100%; flex-shrink: 0; margin-right: 0px;" data-slider="6">
                                        <a class="exhibitor-carousel-item-6" tabindex="-1"><img
                                            alt="Moda. Até 70% off."
                                            decoding="async" loading="lazy"
                                            src="https://http2.mlstatic.com/D_NQ_600095-MLA107401460770_032026-OO.webp"
                                            style="width:100%;display:block;"
                                            tabindex="-1"></a>
                                    </div>
                                </div>
                            </div><button
                                class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large"
                                data-andes-carousel-snapped-control="next" data-andes-state="" type="button"
                                aria-label="Próximo" name="andes-carousel-snapped_control"><svg aria-hidden="true"
                                    color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="24" height="24"
                                    viewBox="0 0 24 24" fill="currentColor">
                                    <path
                                        d="M14.0656 4.9325L15.1263 5.99316L9.12254 11.9969L15.1325 18.0069L14.0719 19.0676L7.00122 11.9969L14.0656 4.9325Z"
                                        fill="currentColor"></path>
                                </svg></button>
                        </div>
                        <ul class="andes-carousel-snapped__pagination andes-carousel-snapped__pagination--dark andes-carousel-snapped__pagination--position-inner"
                            aria-hidden="true" data-andes-carousel-snapped-pagination="true">
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="true"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 1</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 2</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 3</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 4</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 5</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 6</span></button></li>
                            <li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 7</span></button></li>
                        </ul>
                    </section>
                    <div class="gradient"></div>
                </div>
            </div>
            <div>
                <section type="dynamic-access" class="dynamic-access"><div class="container row"><section aria-label="Seus acessos dinâmicos" aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--strict-boundaries andes-carousel-snapped__container--arrows-visible" id="_R_4j6e_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><button class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" data-andes-carousel-snapped-control="previous" data-andes-state="visible disabled" type="button" aria-label="Anterior" name="andes-carousel-snapped_control" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg></button><div class="andes-carousel-snapped carousel-dynamic-access-desktop andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="transition: transform; transform: translate3d(0px, 0px, 0px); display: flex; will-change: transform; flex-direction: row;"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16 andes-carousel-snapped__slide--active" aria-label="1 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="0"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_13a4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Frete grátis</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-new-buyer font-color--HOME-DA-FS-NB" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/new-buyer.svg" alt="Frete grátis" loading="eager" data-id="_R_b3a4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Benefício .</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action">Mostrar produtos<span class="andes-visually-hidden">Frete grátis</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16 andes-carousel-snapped__slide--next" aria-label="2 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="1"><div><div class="andes-card dynamic-access-card dynamic-access-card__medium dynamic-access-card-item andes-card--flat andes-card--primary andes-card--padding-16" id="_R_15a4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-item-header"><h2 class="dynamic-access-card-item__title">Visto recentemente</h2></div><div class="dynamic-access-card-item__image" aria-hidden="true"><img src="https://http2.mlstatic.com/D_Q_NP_2X_638445-MLA100187155155_122025-AB.webp" width="100%" height="100%" alt="Celular Samsung Galaxy A56 5g 128gb 8gb Ram Preto" loading="eager" data-id="_R_1f5a4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-item__item-description dynamic-access-card-item__item-description--with-discount"><a class="dynamic-access-card-item__item-title">Celular Samsung Galaxy A56 5g 128gb 8gb Ram Preto</a><div class="andes-money-amount-combo dynamic-access-card-item__price"><s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:12px" role="img" id="_R_1ef5a4j6e_" aria-label="Antes: 2999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.999</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" id="_R_6ef5a4j6e_" aria-label="Agora: 1998 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="18"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.998</span></span><span class="andes-money-amount__discount" style="font-size:12px" data-andes-money-amount-discount="true">33% OFF</span></div></div><div class="dynamic-access-card-item__container-shipping-free"><span class="font-color--GREEN font-size--XSMALL font-family--SEMIBOLD ui-styled-label-formated">Frete grátis<span class="andes-visually-hidden">Frete grátis</span> <span class="dynamic-access-card-item__subtext font-size--XSMALL"></span></span></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="3 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="2"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-icon andes-card--flat andes-card--primary andes-card--padding-16" id="_R_17a4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Entre na sua conta</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-registration font-color--HOME-DA-REGISTRATION" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/registration-da.svg" alt="Entre na sua conta" loading="eager" data-id="_R_b7a4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Aproveite ofertas para comprar tudo que quiser.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action">Entrar na sua conta<span class="andes-visually-hidden">Entre na sua conta</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="4 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="3"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-icon andes-card--flat andes-card--primary andes-card--padding-16" id="_R_19a4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Insira sua localização</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-location font-color--HOME-DA-LOCATION" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/location.svg" alt="Insira sua localização" loading="eager" data-id="_R_b9a4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Confira os custos e prazos de entrega.</span></div><div class="dynamic-access-card-ecosistemic-footer"><button type="button" class="andes-button dynamic-access-card-ecosistemic__action andes-button--small andes-button--mute andes-button--full-width" id="_R_j9a4j6e_" label="Informar localização" data-andes-button="true" data-andes-button-hierarchy="mute" data-andes-button-size="small"><span class="andes-button__content" data-andes-button-content="true">Informar localização<span class="andes-visually-hidden">Insira sua localização</span></span></button></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="5 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="4"><div><div class="andes-card dynamic-access-card dynamic-access-card__medium dynamic-access-card-item andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1ba4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-item-header"><h2 class="dynamic-access-card-item__title">Também te interessa</h2></div><div class="dynamic-access-card-item__image" aria-hidden="true"><img src="https://http2.mlstatic.com/D_Q_NP_2X_747617-MLA94556160281_102025-AB.webp" width="100%" height="100%" alt="Smart Tv Philips 32 Hd 32phg6910/78 Wi-fi" loading="eager" data-id="_R_1fba4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-item__item-description"><a class="dynamic-access-card-item__item-title">Smart Tv Philips 32 Hd 32phg6910/78 Wi-fi</a><div class="andes-money-amount-combo dynamic-access-card-item__price"><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" id="_R_6efba4j6e_" aria-label="Agora: 1139 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="18"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.139</span></span></div></div><div class="dynamic-access-card-item__container-shipping-free"><span class="font-color--GREEN font-size--XSMALL font-family--SEMIBOLD ui-styled-label-formated">Frete grátis<span class="andes-visually-hidden">Frete grátis</span> <span class="dynamic-access-card-item__subtext font-size--XSMALL"></span></span></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="6 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="5"><div><div class="andes-card dynamic-access-card dynamic-access-card__medium dynamic-access-card-item andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1da4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-item-header"><h2 class="dynamic-access-card-item__title">O que você quer</h2></div><div class="dynamic-access-card-item__image" aria-hidden="true"><img src="https://http2.mlstatic.com/D_Q_NP_2X_926181-MLA106965198532_022026-AB.webp" width="100%" height="100%" alt="Conj De Panelas 8 Peças Ceramic Life Smart Plus Vanilla - Brinox Baunilha" loading="eager" data-id="_R_1fda4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-item__item-description dynamic-access-card-item__item-description--with-discount"><a class="dynamic-access-card-item__item-title">Conj De Panelas 8 Peças Ceramic Life Smart Plus Vanilla - Brinox Baunilha</a><div class="andes-money-amount-combo dynamic-access-card-item__price"><s class="andes-money-amount andes-money-amount-combo__previous-value andes-money-amount--previous andes-money-amount--cents-superscript" style="font-size:12px" role="img" id="_R_1efda4j6e_" aria-label="Antes: 1099 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.099</span></s><div class="andes-money-amount-combo__main-container"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:18px" role="img" id="_R_6efda4j6e_" aria-label="Agora: 599 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="18"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">599</span></span><span class="andes-money-amount__discount" style="font-size:12px" data-andes-money-amount-discount="true">45% OFF</span></div></div><div class="dynamic-access-card-item__container-shipping-free"><span class="font-color--GREEN font-size--XSMALL font-family--SEMIBOLD ui-styled-label-formated">Frete grátis<span class="andes-visually-hidden">Frete grátis</span> <span class="dynamic-access-card-item__subtext font-size--XSMALL"></span></span></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="7 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="6" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1fa4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Meios de pagamento</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-payment-methods font-color--HOME-DA-PAYMENT-METHODS" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/payment-methods.svg" alt="Meios de pagamento" loading="eager" data-id="_R_bfa4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Pague suas compras com rapidez e segurança.</span></div><div class="dynamic-access-card-ecosistemic-footer"><button type="button" class="andes-button dynamic-access-card-ecosistemic__action andes-button--small andes-button--mute andes-button--full-width" id="_R_1jfa4j6e_" label="Mostrar meios" data-andes-button="true" data-andes-button-hierarchy="mute" data-andes-button-size="small" tabindex="-1"><span class="andes-button__content" data-andes-button-content="true">Mostrar meios<span class="andes-visually-hidden">Meios de pagamento</span></span></button></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="8 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="7" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1ha4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Menos de R$100</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-mlb-low-price-products font-color--HOME-DA-NEW-MLB-LOWPRICEPRODUCTS" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/mlb-low-price-product.svg" alt="Menos de R$100" loading="eager" data-id="_R_bha4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Confira produtos com preços baixos.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action" tabindex="-1">Mostrar produtos<span class="andes-visually-hidden">Menos de R$100</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="9 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="8" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1ja4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Mais vendidos</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-top-sales font-color--HOME-DA-TOP-SALES" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/top-sale.svg" alt="Mais vendidos" loading="eager" data-id="_R_bja4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Explore os produtos que são tendência.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action" tabindex="-1">Ir para Mais vendidos<span class="andes-visually-hidden">Mais vendidos</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="10 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="9" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1la4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Compra garantida</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-protected-buy font-color--HOME-DA-NEW-PROTECTED-BUY" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/buy-protected.svg" alt="Compra garantida" loading="eager" data-id="_R_bla4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Você pode devolver sua compra grátis.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action" tabindex="-1">Como funciona<span class="andes-visually-hidden">Compra garantida</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="11 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="10" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1na4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Lojas oficiais</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-official-stores font-color--HOME-DA-NEW-OFFICIAL-STORES" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/store-official.svg" alt="Lojas oficiais" loading="eager" data-id="_R_bna4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Suas marcas preferidas.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action" tabindex="-1">Mostrar lojas<span class="andes-visually-hidden">Lojas oficiais</span></a></div></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-16" aria-label="12 de 12" style="width: 183.333px; margin-right: 16px;" data-slider="11" aria-hidden="true" tabindex="-1"><div><div class="andes-card dynamic-access-card dynamic-access-card-common dynamic-access-card__medium dynamic-access-card-ilustrator andes-card--flat andes-card--primary andes-card--padding-16" id="_R_1pa4j6e_" data-andes-card="true" data-andes-card-hierarchy="primary"><div class="dynamic-access-card-ecosistemic"><div class="dynamic-access-card-ecosistemic-header"><h2 class="dynamic-access-card-ecosistemic__title">Nossas categorias</h2></div><div class="dynamic-access-card-ecosistemic-icon" aria-hidden="true"><img class="ui-homes-icon ui-homes-icon--da-categories font-color--HOME-DA-CATEGORIES" src="https://http2.mlstatic.com/frontend-assets/homes-palpatine/dynamic-access-desktop/categories.svg" alt="Nossas categorias" loading="eager" data-id="_R_bpa4j6e_" decoding="sync" is="n-img"></div><div class="dynamic-access-card-ecosistemic-description"><span class="dynamic-access-card-ecosistemic__description">Encontre celulares, roupas, imóveis e muito mais.</span></div><div class="dynamic-access-card-ecosistemic-footer"><a class="dynamic-access-card-ecosistemic__action" tabindex="-1">Ir para Categorias<span class="andes-visually-hidden">Nossas categorias</span></a></div></div></div></div></div></div></div><button class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large" data-andes-carousel-snapped-control="next" data-andes-state="" type="button" aria-label="Próximo" name="andes-carousel-snapped_control"><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M11.943 6.99999L20.9383 15.9953L11.9336 25L12.9943 26.0607L23.0596 15.9953L13.0036 5.93933L11.943 6.99999Z" fill="currentColor"></path></svg></button></div></section></div></section>
            </div>
            <div><section class="ui-recommendations-snapped-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" loading="lazy" class="ui-recommendations-carousel-container-img" data-id="_R_26j6e_" decoding="async" is="n-img"><div class="ui-recommendations-carousel-snapped new-carousel"><div class="ui-recommendations-carousel-snapped__header"><div class="ui-recommendations-carousel-snapped__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Inspirado no último que você viu</h2></div></div></div><section aria-label="Inspirado no último que você viu" aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--arrows-visible andes-carousel-snapped__container--pagination-position-top" id="_R_166j6e_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"><ul class="andes-carousel-snapped__pagination andes-carousel-snapped__pagination--light andes-carousel-snapped__pagination--position-top" aria-hidden="true" data-andes-carousel-snapped-pagination="true"><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="true"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 1</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 2</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 3</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 4</span></button></li></ul></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><button class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="previous" data-andes-state="visible disabled" type="button" aria-label="Anterior" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg></button><div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="display: flex; will-change: transform; flex-direction: row; transition: transform; transform: translate3d(0px, 0px, 0px);"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20 andes-carousel-snapped__slide--active" aria-label="1 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="0"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_645152-MLA99943507023_112025-T.webp" alt="Smartphone Samsung Galaxy A36 5g 256gb 8gb Ram Preto" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4m3b66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title">Smartphone Samsung Galaxy A36 5g 256gb 8gb Ram Preto</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" id="_R_175m3b66j6e_" aria-label="Antes: 2999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.999</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_295m3b66j6e_" aria-label="Agora: 1716 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.716</span></span><span class="poly-price__disc_label andes-money-amount__discount">42% OFF no Pix ou Saldo no Mercado Pago</span></div><span style="color:#00a650" class="poly-price__installments"><span style="color:#000000e6" class="poly-phrase-label">ou</span> <span style="color:#000000e6"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_df5m3b66j6e_" aria-label="1907 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.907</span></span></span> <span style="color:#000000e6" class="poly-phrase-label">em</span> 10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_tf5m3b66j6e_" aria-label="190 reais com 77 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">190</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">77</span></span> sem juros</span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="20 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="19"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_847424-MLA99457124620_112025-T.webp" alt="Smartphone Samsung Galaxy A05s 4g 128gb 6gb Ram Câmera Traseira Tripla 50mp + 2mp + 2mp + Selfie 13mp Tela 6.7  Preto" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4n9b66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Samsung Galaxy A05s 4g 128gb 6gb Ram Câmera Traseira Tripla 50mp + 2mp + 2mp + Selfie 13mp Tela 6.7  Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_295n9b66j6e_" aria-label="929 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">929</span></span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_9f5n9b66j6e_" aria-label="90 reais com 18 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">90</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">18</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="21 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="20"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_676429-MLA96422991201_102025-T.webp" alt="Xiaomi Poco X7 Pro 256gb 8gb Ram 5g Nfc Dual - Preto" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4nbb66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Xiaomi Poco X7 Pro 256gb 8gb Ram 5g Nfc Dual - Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_4h5nbb66j6e_" aria-label="2270 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.270</span></span></div><span style="color:#00a650" class="poly-price__installments">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_it5nbb66j6e_" aria-label="227 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">227</span></span> sem juros</span></div><div class="poly-component__rebates"><div class="poly-rebates__wrapper"><span class="poly-rebates__pill">10% OFF Saldo no Mercado Pago</span></div></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="22 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="21"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_624374-MLA99985081117_112025-T.webp" alt="Smartphone Motorola Edge 60 5g - 512gb 24gb (12gb Ram+12gb Ram Boost) Tela Quad-curve Moto Ai 50mp Sony Camera Ultrarresistencia Militar Ip68 + Ip69 - Azul Marinho" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4ndb66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Motorola Edge 60 5g - 512gb 24gb (12gb Ram+12gb Ram Boost) Tela Quad-curve Moto Ai 50mp Sony Camera Ultrarresistencia Militar Ip68 + Ip69 - Azul Marinho</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" id="_R_175ndb66j6e_" aria-label="Antes: 2499 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.499</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_295ndb66j6e_" aria-label="Agora: 1999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.999</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size:14px" data-andes-money-amount-discount="true">20% OFF</span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_9f5ndb66j6e_" aria-label="192 reais com 14 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">192</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">14</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="23 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="22"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_961479-MLA99460854090_112025-T.webp" alt="Samsung Galaxy A14 5g 128gb 4gb Ram Preto" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4nfb66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Samsung Galaxy A14 5g 128gb 4gb Ram Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_295nfb66j6e_" aria-label="899 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">899</span></span></div><span style="color:#00a650" class="poly-price__installments">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_9f5nfb66j6e_" aria-label="89 reais com 90 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">89</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">90</span></span> sem juros</span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="24 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="23"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_918430-MLA99498691720_112025-T.webp" alt="Smartphone Motorola Moto G86 5g + Moto Buds - 256gb 24gb (8gb Ram+16gb Ram Boost) Tela 1.5k Poled, 50mp Sony Camera Ois Moto Ai, Videos Em 4k, Ip68 + Ip69 - Vermelho" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_R_1f4nhb66j6e_" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Motorola Moto G86 5g + Moto Buds - 256gb 24gb (8gb Ram+16gb Ram Boost) Tela 1.5k Poled, 50mp Sony Camera Ois Moto Ai, Videos Em 4k, Ip68 + Ip69 - Vermelho</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" id="_R_175nhb66j6e_" aria-label="Antes: 2299 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.299</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" id="_R_295nhb66j6e_" aria-label="Agora: 1709 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.709</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size:14px" data-andes-money-amount-discount="true">25% OFF</span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" id="_R_9f5nhb66j6e_" aria-label="164 reais com 26 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">164</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">26</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div></div></div><button class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="next" data-andes-state="" type="button" aria-label="Próximo"><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M11.943 6.99999L20.9383 15.9953L11.9336 25L12.9943 26.0607L23.0596 15.9953L13.0036 5.93933L11.943 6.99999Z" fill="currentColor"></path></svg></button></div></section></div></section></section></div>
            <div><section class="ui-recommendations-carousel-dual" style="--carousel-dual-height: 436.4765625px;"><div class="ui-recommendations-carousel-dual__first-card"><div><section data-testid="today-promotions-recommendations" class="ui-recommendations-snapped-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img alt="" loading="lazy" class="ui-recommendations-carousel-container-img" data-id="_r_2_" decoding="async" is="n-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div class="ui-recommendations-carousel-snapped new-carousel"><div class="ui-recommendations-carousel-snapped__header"><div class="ui-recommendations-carousel-snapped__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Oferta do dia</h2></div></div></div><section aria-label="Oferta do dia" aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--arrows-visible" id="_r_78_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><button class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="previous" data-andes-state="visible disabled" type="button" aria-label="Anterior" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg></button><div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="display: flex; will-change: transform; flex-direction: row; transition: transform; transform: translate3d(0px, 0px, 0px);"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20 andes-carousel-snapped__slide--active" aria-label="1 de 1" data-slider="0" style="width: 298px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="Celular Samsung Galaxy A26 5g 256gb, 8gb Ram, Câmera De 50mp, Ip67, Tela Super Amoled 6.7 , Nfc - Branco" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_r_79_" decoding="async" is="n-img" src="https://http2.mlstatic.com/D_Q_NP_2X_657456-MLA100074445249_122025-V.webp"></div><div class="poly-card__content"><a target="_self" class="poly-component__title">Celular Samsung Galaxy A26 5g 256gb, 8gb Ram, Câmera De 50mp, Ip67, Tela Super Amoled 6.7 , Nfc - Branco</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" id="_r_7a_" aria-label="Antes: 2284 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="16" style="font-size: 16px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.284</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" id="_r_7b_" aria-label="Agora: 1394 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="32" style="font-size: 32px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.394</span></span><span class="poly-price__disc_label andes-money-amount__discount">38% OFF no Pix</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">ou <span style="color: rgba(0, 0, 0, 0.9);"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" id="_r_7c_" aria-label="1549 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.549</span></span></span> em outros meios</span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div></div></div><button class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="next" data-andes-state="visible disabled" type="button" aria-label="Próximo" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M11.943 6.99999L20.9383 15.9953L11.9336 25L12.9943 26.0607L23.0596 15.9953L13.0036 5.93933L11.943 6.99999Z" fill="currentColor"></path></svg></button></div></section></div></section></section></div></div><div class="ui-recommendations-carousel-dual__carousel"><div><section data-testid="promotions-recommendations" class="ui-recommendations-snapped-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img alt="" loading="lazy" class="ui-recommendations-carousel-container-img" data-id="_r_3_" decoding="async" is="n-img" src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7"><div class="ui-recommendations-carousel-snapped new-carousel"><div class="ui-recommendations-carousel-snapped__header"><div class="ui-recommendations-carousel-snapped__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Ofertas</h2></div><div class="ui-recommendations-subtitle"><a rel="nofollow" class="ui-recommendations-subtitle-link">Mostrar todas as ofertas <span class="andes-visually-hidden">Ofertas</span></a></div></div></div><section aria-label="Ofertas" aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--arrows-visible andes-carousel-snapped__container--pagination-position-top" id="_r_7d_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"><ul class="andes-carousel-snapped__pagination andes-carousel-snapped__pagination--light andes-carousel-snapped__pagination--position-top" aria-hidden="true" data-andes-carousel-snapped-pagination="true"><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="true"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 1</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 2</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 3</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 4</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 5</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 6</span></button></li></ul></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><button class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="previous" data-andes-state="visible disabled" type="button" aria-label="Anterior" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg></button><div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="display: flex; will-change: transform; flex-direction: row; transition: transform; transform: translate3d(0px, 0px, 0px);"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="18 de 21" data-slider="17" style="width: 181.5px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="Jogo De Panelas Indução Tuut Ecoglid 4 Peças Cor Cream" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_r_9p_" decoding="async" is="n-img" src="https://http2.mlstatic.com/D_Q_NP_2X_662295-MLA101420785356_122025-AB.webp"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Jogo De Panelas Indução Tuut Ecoglid 4 Peças Cor Cream</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" id="_r_9q_" aria-label="Antes: 499 reais com 99 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">499</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">99</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" id="_r_9r_" aria-label="Agora: 219 reais com 99 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24" style="font-size: 24px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">219</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" data-andes-money-amount-cents="true" style="font-size: 12px; margin-top: 4px;">99</span></span><span class="andes-money-amount__discount poly-price__disc--pill" data-andes-money-amount-discount="true" style="font-size: 14px;">56% OFF</span></div><span class="poly-price__installments" style="color: rgba(0, 0, 0, 0.9);">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" id="_r_9s_" aria-label="21 reais com 78 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">21</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">78</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="19 de 21" data-slider="18" style="width: 181.5px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="Projetor Hy300 Smart Portátil Pholex Full Hd 4k Android 11 Wifi Bluetooth Mini Projetor Home Theater Branco Imagem... 127/220v" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_r_9t_" decoding="async" is="n-img" src="https://http2.mlstatic.com/D_Q_NP_2X_851707-MLA98471490071_112025-AB.webp"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Projetor Hy300 Smart Portátil Pholex Full Hd 4k Android 11 Wifi Bluetooth Mini Projetor Home Theater Branco Imagem... 127/220v</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" id="_r_9u_" aria-label="Antes: 249 reais com 90 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">249</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">90</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" id="_r_9v_" aria-label="Agora: 150 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24" style="font-size: 24px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">150</span></span><span class="poly-price__disc_label andes-money-amount__discount">39% OFF no Pix</span></div><span class="poly-price__installments" style="color: rgb(0, 166, 80);"><span class="poly-phrase-label" style="color: rgba(0, 0, 0, 0.9);">ou</span> <span style="color: rgba(0, 0, 0, 0.9);"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" id="_r_a0_" aria-label="157 reais com 90 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">157</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">90</span></span></span> <span class="poly-phrase-label" style="color: rgba(0, 0, 0, 0.9);">em</span> 5x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" id="_r_a1_" aria-label="31 reais com 58 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">31</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">58</span></span> sem juros</span></div><div class="poly-component__rebates"><div class="poly-rebates__wrapper"><span class="poly-rebates__pill">7% OFF Linha de crédito</span></div></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="20 de 21" data-slider="19" style="width: 181.5px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="Caminhão Dinossauro Pista Com Carrinhos Maleta Transporte Cor Azul" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_r_a2_" decoding="async" is="n-img" src="https://http2.mlstatic.com/D_Q_NP_2X_983572-MLA99489106572_112025-AB.webp"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Caminhão Dinossauro Pista Com Carrinhos Maleta Transporte Cor Azul</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" id="_r_a3_" aria-label="Antes: 309 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">309</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" id="_r_a4_" aria-label="Agora: 85 reais com 50 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24" style="font-size: 24px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">85</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" data-andes-money-amount-cents="true" style="font-size: 12px; margin-top: 4px;">50</span></span><span class="andes-money-amount__discount poly-price__disc--pill" data-andes-money-amount-discount="true" style="font-size: 14px;">72% OFF</span></div></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="21 de 21" data-slider="20" style="width: 181.5px; margin-right: 20px;"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" alt="Garrafa Térmica 1 Litro Com Termômetro Led Para Chás / Café" aria-hidden="true" data-testid="picture" loading="lazy" data-id="_r_a5_" decoding="async" is="n-img" src="https://http2.mlstatic.com/D_Q_NP_2X_658148-MLB89993492671_082025-AB-garrafa-termica-1-litro-com-termmetro-led-para-chas-cafe.webp"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Garrafa Térmica 1 Litro Com Termômetro Led Para Chás / Café</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" role="img" id="_r_a6_" aria-label="Antes: 75 reais com 70 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12" style="font-size: 12px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">75</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">70</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" role="img" id="_r_a7_" aria-label="Agora: 48 reais com 45 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24" style="font-size: 24px;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">48</span><span class="andes-visually-hidden" aria-hidden="true">,</span><span class="andes-money-amount__cents andes-money-amount__cents--superscript-24" aria-hidden="true" data-andes-money-amount-cents="true" style="font-size: 12px; margin-top: 4px;">45</span></span><span class="andes-money-amount__discount poly-price__disc--pill" data-andes-money-amount-discount="true" style="font-size: 14px;">36% OFF</span></div></div><div class="poly-component__coupons"><div class="poly-coupons__wrapper"><span class="poly-coupons__pill"><svg class="poly-coupons__icon" width="13" height="11" viewBox="0 0 13 11"><use href="#poly_coupon"></use></svg> Cupom <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" role="img" id="_r_a8_" aria-label="10 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit" style="font-size: inherit;"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">10</span></span> OFF</span></div></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div></div></div><button class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="next" data-andes-state="" type="button" aria-label="Próximo"><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M11.943 6.99999L20.9383 15.9953L11.9336 25L12.9943 26.0607L23.0596 15.9953L13.0036 5.93933L11.943 6.99999Z" fill="currentColor"></path></svg></button></div></section></div></section></section></div></div></section></div>
            <div><section class="ui-recommendations-snapped-section"><section class="ui-recommendations-carousel-wrapper-ref ui-recommendations-over-white-background"><img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7" alt="" loading="lazy" class="ui-recommendations-carousel-container-img" decoding="async" is="n-img"><div class="ui-recommendations-carousel-snapped new-carousel"><div class="ui-recommendations-carousel-snapped__header"><div class="ui-recommendations-carousel-snapped__header-titles"><div class="ui-recommendations-title"><h2 class="ui-recommendations-title-link">Inspirado no último que você viu</h2></div></div></div><section aria-label="Inspirado no último que você viu" aria-roledescription="Carrossel" class="andes-carousel-snapped__container andes-carousel-snapped__container--content andes-carousel-snapped__container--with-controls andes-carousel-snapped__container--arrows-visible andes-carousel-snapped__container--pagination-position-top" id="_R_266j6e_" data-andes-carousel-snapped-main="true"><div class="andes-carousel-snapped__header"><ul class="andes-carousel-snapped__pagination andes-carousel-snapped__pagination--light andes-carousel-snapped__pagination--position-top" aria-hidden="true" data-andes-carousel-snapped-pagination="true"><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="true"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 1</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 2</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 3</span></button></li><li data-andes-carousel-snapped-pagination-item="true" data-andes-carousel-snapped-pagination-item-active="false"><button data-andes-carousel-snapped-pagination-action="true" tabindex="-1" type="button"><span class="andes-visually-hidden">Página 4</span></button></li></ul></div><div class="andes-carousel-snapped__controls-wrapper" data-andes-carousel-snapped-component="true"><button class="andes-carousel-snapped__control andes-carousel-snapped__control--previous andes-carousel-snapped__control--size-large andes-carousel-snapped__control--disabled" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="previous" data-andes-state="visible disabled" type="button" aria-label="Anterior" disabled=""><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M20.0549 6.99999L11.0596 15.9953L20.0642 25L19.0036 26.0607L8.93823 15.9953L18.9942 5.93933L20.0549 6.99999Z" fill="currentColor"></path></svg></button><div class="andes-carousel-snapped andes-carousel-snapped--scroll-hidden"><div class="andes-carousel-snapped__wrapper" style="display: flex; will-change: transform; flex-direction: row; transition: transform; transform: translate3d(0px, 0px, 0px);"><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20 andes-carousel-snapped__slide--active" aria-label="1 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="0"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_645152-MLA99943507023_112025-T.webp" alt="Smartphone Samsung Galaxy A36 5g 256gb 8gb Ram Preto" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title">Smartphone Samsung Galaxy A36 5g 256gb 8gb Ram Preto</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: 2999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.999</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 1716 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.716</span></span><span class="poly-price__disc_label andes-money-amount__discount">42% OFF no Pix ou Saldo no Mercado Pago</span></div><span style="color:#00a650" class="poly-price__installments"><span style="color:#000000e6" class="poly-phrase-label">ou</span> <span style="color:#000000e6"><span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="1907 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.907</span></span></span> <span style="color:#000000e6" class="poly-phrase-label">em</span> 10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="190 reais com 77 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">190</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">77</span></span> sem juros</span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="20 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="19"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_847424-MLA99457124620_112025-T.webp" alt="Smartphone Samsung Galaxy A05s 4g 128gb 6gb Ram Câmera Traseira Tripla 50mp + 2mp + 2mp + Selfie 13mp Tela 6.7  Preto" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Samsung Galaxy A05s 4g 128gb 6gb Ram Câmera Traseira Tripla 50mp + 2mp + 2mp + Selfie 13mp Tela 6.7  Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="929 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">929</span></span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="90 reais com 18 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">90</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">18</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="21 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="20"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_676429-MLA96422991201_102025-T.webp" alt="Xiaomi Poco X7 Pro 256gb 8gb Ram 5g Nfc Dual - Preto" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Xiaomi Poco X7 Pro 256gb 8gb Ram 5g Nfc Dual - Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="2270 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.270</span></span></div><span style="color:#00a650" class="poly-price__installments">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="227 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">227</span></span> sem juros</span></div><div class="poly-component__rebates"><div class="poly-rebates__wrapper"><span class="poly-rebates__pill">10% OFF Saldo no Mercado Pago</span></div></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="22 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="21"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_624374-MLA99985081117_112025-T.webp" alt="Smartphone Motorola Edge 60 5g - 512gb 24gb (12gb Ram+12gb Ram Boost) Tela Quad-curve Moto Ai 50mp Sony Camera Ultrarresistencia Militar Ip68 + Ip69 - Azul Marinho" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Motorola Edge 60 5g - 512gb 24gb (12gb Ram+12gb Ram Boost) Tela Quad-curve Moto Ai 50mp Sony Camera Ultrarresistencia Militar Ip68 + Ip69 - Azul Marinho</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: 2499 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.499</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 1999 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.999</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size:14px" data-andes-money-amount-discount="true">20% OFF</span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="192 reais com 14 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">192</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">14</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="23 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="22"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_961479-MLA99460854090_112025-T.webp" alt="Samsung Galaxy A14 5g 128gb 4gb Ram Preto" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Samsung Galaxy A14 5g 128gb 4gb Ram Preto</a><div class="poly-component__price"><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="899 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">899</span></span></div><span style="color:#00a650" class="poly-price__installments">10x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="89 reais com 90 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">89</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">90</span></span> sem juros</span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div><div role="group" class="andes-carousel-snapped__slide andes-carousel-snapped__slide--spacing-20" aria-hidden="true" tabindex="-1" aria-label="24 de 24" style="width: 173.333px; margin-right: 20px;" data-slider="23"><div class="poly-card poly-card--grid poly-card--xlarge"><div class="poly-card__portada"><span class="poly-component__image-overlay"></span><img class="poly-component__picture" src="https://http2.mlstatic.com/D_Q_NP_2X_918430-MLA99498691720_112025-T.webp" alt="Smartphone Motorola Moto G86 5g + Moto Buds - 256gb 24gb (8gb Ram+16gb Ram Boost) Tela 1.5k Poled, 50mp Sony Camera Ois Moto Ai, Videos Em 4k, Ip68 + Ip69 - Vermelho" aria-hidden="true" data-testid="picture" loading="lazy" decoding="async" is="n-img"></div><div class="poly-card__content"><a target="_self" class="poly-component__title" tabindex="-1">Smartphone Motorola Moto G86 5g + Moto Buds - 256gb 24gb (8gb Ram+16gb Ram Boost) Tela 1.5k Poled, 50mp Sony Camera Ois Moto Ai, Videos Em 4k, Ip68 + Ip69 - Vermelho</a><div class="poly-component__price"><s class="andes-money-amount andes-money-amount--previous andes-money-amount--cents-comma" style="font-size:12px" role="img" aria-label="Antes: 2299 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="12"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">2.299</span></s><div class="poly-price__current"><span class="andes-money-amount andes-money-amount--cents-superscript" style="font-size:24px" role="img" aria-label="Agora: 1709 reais" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="24"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">1.709</span></span><span class="andes-money-amount__discount poly-price__disc--pill" style="font-size:14px" data-andes-money-amount-discount="true">25% OFF</span></div><span style="color:#000000e6" class="poly-price__installments">12x <span class="andes-money-amount poly-phrase-price andes-money-amount--cents-comma" style="font-size:inherit" role="img" aria-label="164 reais com 26 centavos" aria-roledescription="Valor" data-andes-money-amount="true" data-andes-money-amount-size="inherit"><span class="andes-money-amount__currency" aria-hidden="true" data-andes-money-amount-currency="true"><span class="andes-money-amount__currency-symbol">R$</span></span><span class="andes-money-amount__fraction" aria-hidden="true" data-andes-money-amount-fraction="true">164</span><span aria-hidden="true">,</span><span class="andes-money-amount__cents" aria-hidden="true" data-andes-money-amount-cents="true">26</span></span></span></div><div class="poly-component__shipping">Frete grátis<span class="poly-shipping__additional_text"></span></div></div></div></div></div></div><button class="andes-carousel-snapped__control andes-carousel-snapped__control--next andes-carousel-snapped__control--size-large" name="andes-carousel-snapped_control" data-andes-carousel-snapped-control="next" data-andes-state="" type="button" aria-label="Próximo"><svg aria-hidden="true" color="var(--andes-color-icon-primary, rgba(0, 0, 0, 0.9))" width="32" height="32" viewBox="0 0 32 32" fill="currentColor"><path d="M11.943 6.99999L20.9383 15.9953L11.9336 25L12.9943 26.0607L23.0596 15.9953L13.0036 5.93933L11.943 6.99999Z" fill="currentColor"></path></svg></button></div></section></div></section></section></div>
        </div>
    
    </div>`;

  const processShipping = (htmlStr: string) => {
    let sanitized = sanitizeStoreHTML(htmlStr, mascara);
    if (storeSettings.is_free_shipping) return sanitized;
    
    if (typeof document === 'undefined') return sanitized;

    const temp = document.createElement('div');
    temp.innerHTML = sanitized;

    temp.querySelectorAll('.poly-component__shipping, .dynamic-access-card-item__shipping, .dynamic-access-card-item__container-shipping-free').forEach(el => el.remove());

    temp.querySelectorAll('.info-slide').forEach(slide => {
      if (slide.textContent && slide.textContent.includes('Frete grátis')) {
        const parentSlide = slide.closest('.andes-carousel-snapped__slide');
        if (parentSlide) parentSlide.remove();
        else slide.remove();
      }
    });

    temp.querySelectorAll('.dynamic-access-card-ecosistemic').forEach(eco => {
      if (eco.textContent && eco.textContent.includes('Frete grátis')) {
        const parentSlide = eco.closest('.andes-carousel-snapped__slide');
        if (parentSlide) parentSlide.remove();
        else eco.remove();
      }
    });

    return temp.innerHTML;
  };

  return (
    <>
      {/* Desktop */}
      <div className="hidden md:contents" dangerouslySetInnerHTML={{ __html: processShipping(desktopMainHTML) }} />
      {/* Desktop Footer - rendered OUTSIDE main via portal */}

      {/* Mobile */}
      <div className="home md:hidden" data-banner-download-hydrate="now">
        <h1 className="clipped">{mascara.active && mascara.name ? mascara.name : 'Mercado Livre'}</h1>
        <div>
          <div dangerouslySetInnerHTML={{ __html: processShipping(carouselHTML) }} />
          <div dangerouslySetInnerHTML={{ __html: processShipping(newsRowHTML) }} />
          <div dangerouslySetInnerHTML={{ __html: processShipping(quickAccessHTML) }} />
          {viewedProducts.length > 0 && <div dangerouslySetInnerHTML={{ __html: processShipping(dynamicAccessHTML) }} />}
          <div dangerouslySetInnerHTML={{ __html: processShipping(recommendationsGridHTML) }} />
          <div dangerouslySetInnerHTML={{ __html: processShipping(relatedRecommendationsHTML) }} />
          <div dangerouslySetInnerHTML={{ __html: processShipping(topSalesHTML) }} />
          <div dangerouslySetInnerHTML={{ __html: processShipping(shoppingInfoHTML) }} />
        </div>
      </div>
    </>
  );
};

export default StoreHome;

