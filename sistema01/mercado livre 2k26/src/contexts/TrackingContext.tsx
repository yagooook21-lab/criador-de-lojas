import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TrackingSettings {
  meta_enabled: boolean;
  meta_pixel_ids: string[];
  google_enabled: boolean;
  google_analytics_ids: string[];
  utmfy_enabled: boolean;
  utmfy_ids: string[];
}

interface TrackingContextType {
  trackEvent: (name: string, params?: any) => void;
  trackPurchase: (total: number, currency: string, items?: any[]) => void;
}

declare global {
  interface Window {
    fbq: any;
    _fbq: any;
    gtag: any;
    dataLayer: any[];
  }
}

const TrackingContext = createContext<TrackingContextType | undefined>(undefined);

const normalizeIds = (raw: any, legacy: any): string[] => {
  const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? [raw] : []);
  if (arr.length === 0 && typeof legacy === "string" && legacy) arr.push(legacy);
  return arr.map(s => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
};

export const TrackingProvider = ({ children }: { children: React.ReactNode }) => {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase.from("settings").select("*").eq("key", "tracking_settings").maybeSingle();
      if (!data?.value) return;
      const v: any = data.value;
      setSettings({
        meta_enabled: !!v.meta_enabled,
        meta_pixel_ids: normalizeIds(v.meta_pixel_ids, v.meta_pixel_id),
        google_enabled: !!v.google_enabled,
        google_analytics_ids: normalizeIds(v.google_analytics_ids, v.google_analytics_id),
        utmfy_enabled: !!v.utmfy_enabled,
        utmfy_ids: normalizeIds(v.utmfy_ids, v.utmfy_id),
      });
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    if (!settings) return;

    // --- Meta Pixel injection (suporta múltiplos IDs) ---
    if (settings.meta_enabled && settings.meta_pixel_ids.length > 0) {
      if (!window.fbq) {
        (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
          if (f.fbq) return; n = f.fbq = function() {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
          };
          if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0';
          n.queue = []; t = b.createElement(e); t.async = !0;
          t.src = v; s = b.getElementsByTagName(e)[0];
          s.parentNode.insertBefore(t, s);
        })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      }
      const initedSet: Set<string> = (window as any).__fbqInited || new Set<string>();
      settings.meta_pixel_ids.forEach(id => {
        if (!initedSet.has(id)) {
          window.fbq('init', id);
          initedSet.add(id);
        }
      });
      (window as any).__fbqInited = initedSet;
    }

    // --- GA4 injection (suporta múltiplos measurement IDs) ---
    if (settings.google_enabled && settings.google_analytics_ids.length > 0) {
      if (!window.gtag) {
        const firstId = settings.google_analytics_ids[0];
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${firstId}`;
        document.head.appendChild(script);
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { window.dataLayer.push(arguments); };
        window.gtag('js', new Date());
      }
      const configuredSet: Set<string> = (window as any).__gaConfigured || new Set<string>();
      settings.google_analytics_ids.forEach(id => {
        if (!configuredSet.has(id)) {
          window.gtag('config', id);
          configuredSet.add(id);
        }
      });
      (window as any).__gaConfigured = configuredSet;
    }

    // --- UTMfy injection (um script por ID) ---
    if (settings.utmfy_enabled && settings.utmfy_ids.length > 0) {
      settings.utmfy_ids.forEach(id => {
        const scriptId = `utmfy-pixel-${id}`;
        if (!document.getElementById(scriptId)) {
          const script = document.createElement('script');
          script.id = scriptId;
          script.async = true;
          script.src = `https://cdn.utmfy.com/pixel/${id}.js`;
          document.head.appendChild(script);
        }
      });
    }
  }, [settings]);

  // PageView observer — fires ONLY on view/browse routes.
  // Cart, payment_pix and pix/success pages dispatch their own conversion events
  // (AddToCart / InitiateCheckout / Purchase) and must NOT also send PageView.
  useEffect(() => {
    const path = location.pathname;
    const isViewPage =
      path === "/store" ||
      path === "/store/" ||
      path.startsWith("/store/search") ||
      path.startsWith("/store/product/") ||
      path.startsWith("/store/collection/");
    if (!isViewPage) return;

    if (settings?.meta_enabled && window.fbq && settings.meta_pixel_ids.length > 0) {
      settings.meta_pixel_ids.forEach(id => window.fbq('trackSingle', id, 'PageView'));
    }

    if (settings?.google_enabled && window.gtag && settings.google_analytics_ids.length > 0) {
      settings.google_analytics_ids.forEach(id => {
        window.gtag('event', 'page_view', {
          send_to: id,
          page_path: location.pathname,
          page_location: window.location.href,
          page_title: document.title,
        });
      });
    }
  }, [location.pathname, settings]);

  const trackEvent = (name: string, params: any = {}) => {
    if (!settings) return;

    const metaEventMap: Record<string, string> = {
      'view_item': 'ViewContent',
      'view_content': 'ViewContent',
      'view_item_list': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'initiate_checkout': 'InitiateCheckout',
      'purchase': 'Purchase',
    };
    const metaName = metaEventMap[name] || name;

    if (settings.meta_enabled && window.fbq && settings.meta_pixel_ids.length > 0) {
      settings.meta_pixel_ids.forEach(id => window.fbq('trackSingle', id, metaName, params));
    }

    if (settings.google_enabled && window.gtag && settings.google_analytics_ids.length > 0) {
      settings.google_analytics_ids.forEach(id => {
        window.gtag('event', name, { ...params, send_to: id });
      });
    }
  };

  const trackPurchase = (total: number, currency: string = "BRL", items: any[] = []) => {
    if (!settings) return;

    if (settings.meta_enabled && window.fbq && settings.meta_pixel_ids.length > 0) {
      const payload = {
        value: total,
        currency,
        contents: items.map(i => ({
          id: i.id || i.product_id,
          product_id: i.product_id,
          quantity: i.quantity || 1,
        })),
        content_type: 'product',
      };
      settings.meta_pixel_ids.forEach(id => window.fbq('trackSingle', id, 'Purchase', payload));
    }

    if (settings.google_enabled && window.gtag && settings.google_analytics_ids.length > 0) {
      const transactionId = `T_${Math.floor(Date.now() / 1000)}_${Math.random().toString(36).substr(2, 5)}`;
      settings.google_analytics_ids.forEach(id => {
        window.gtag('event', 'purchase', {
          send_to: id,
          transaction_id: transactionId,
          value: total,
          currency,
          items: items.map(i => ({
            item_id: i.id || i.product_id,
            item_name: i.name || i.title,
            quantity: i.quantity || 1,
            price: i.price,
          })),
        });
      });
    }
  };

  return (
    <TrackingContext.Provider value={{ trackEvent, trackPurchase }}>
      {children}
    </TrackingContext.Provider>
  );
};

export const useTracking = () => {
  const context = useContext(TrackingContext);
  if (context === undefined) {
    throw new Error("useTracking must be used within a TrackingProvider");
  }
  return context;
};
