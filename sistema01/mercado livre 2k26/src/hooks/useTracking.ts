import { useEffect, useRef, useCallback } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface TrackingSettings {
  meta_pixel_ids: string[];
  google_analytics_ids: string[];
  utmfy_ids: string[];
  meta_enabled: boolean;
  google_enabled: boolean;
  utmfy_enabled: boolean;
}

let trackingLoaded = false;
let trackingSettings: TrackingSettings | null = null;
let eventQueue: { eventName: string; data?: any }[] = [];

const normalizeIds = (raw: any, legacy: any): string[] => {
  const arr = Array.isArray(raw) ? raw : (typeof raw === "string" ? [raw] : []);
  if (arr.length === 0 && typeof legacy === "string" && legacy) arr.push(legacy);
  return arr.map((s: any) => (typeof s === "string" ? s.trim() : "")).filter(Boolean);
};

// Load Meta Pixel base + init all IDs (idempotente)
function loadMetaPixel(pixelIds: string[]) {
  if (pixelIds.length === 0) return;
  if (!document.getElementById("fb-pixel-script")) {
    const script = document.createElement("script");
    script.id = "fb-pixel-script";
    script.innerHTML = `
      !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
      n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
      (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
    `;
    document.head.appendChild(script);
  }
  const inited: Set<string> = (window as any).__fbqInited || new Set<string>();
  pixelIds.forEach(id => {
    if (!inited.has(id)) {
      (window as any).fbq && (window as any).fbq("init", id);
      inited.add(id);
      // noscript fallback per pixel
      const ns = document.createElement("noscript");
      ns.innerHTML = `<img height="1" width="1" style="display:none" src="https://www.facebook.com/tr?id=${id}&ev=PageView&noscript=1"/>`;
      document.body.appendChild(ns);
    }
  });
  (window as any).__fbqInited = inited;
  // initial PageView broadcast
  pixelIds.forEach(id => (window as any).fbq && (window as any).fbq("trackSingle", id, "PageView"));
}

// Load Google Analytics (carrega gtag uma vez, configura cada ID)
function loadGoogleAnalytics(gaIds: string[]) {
  if (gaIds.length === 0) return;
  if (!document.getElementById("ga-script")) {
    const firstId = gaIds[0];
    const script = document.createElement("script");
    script.id = "ga-script";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${firstId}`;
    document.head.appendChild(script);

    const inlineScript = document.createElement("script");
    inlineScript.innerHTML = `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      window.gtag = gtag;
      gtag('js', new Date());
    `;
    document.head.appendChild(inlineScript);
  }
  const configured: Set<string> = (window as any).__gaConfigured || new Set<string>();
  gaIds.forEach(id => {
    if (!configured.has(id)) {
      (window as any).gtag && (window as any).gtag("config", id);
      configured.add(id);
    }
  });
  (window as any).__gaConfigured = configured;
}

// Load UTMfy (um script por ID)
function loadUtmfy(utmfyIds: string[]) {
  utmfyIds.forEach(id => {
    const scriptId = `utmfy-script-${id}`;
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.async = true;
      script.src = `https://cdn.utmfy.com/pixel/${id}.js`;
      document.head.appendChild(script);
    }
  });
}

// Track events
function trackEvent(eventName: string, data?: Record<string, any>) {
  if (!trackingSettings) {
    eventQueue.push({ eventName, data });
    return;
  }

  const eventMap: Record<string, { meta: string; ga: string; utmfy: string }> = {
    page_view: { meta: "PageView", ga: "page_view", utmfy: "PageView" },
    view_content: { meta: "ViewContent", ga: "view_item", utmfy: "ViewContent" },
    view_item: { meta: "ViewContent", ga: "view_item", utmfy: "ViewContent" },
    view_item_list: { meta: "ViewContent", ga: "view_item_list", utmfy: "ViewContent" },
    add_to_cart: { meta: "AddToCart", ga: "add_to_cart", utmfy: "AddToCart" },
    initiate_checkout: { meta: "InitiateCheckout", ga: "begin_checkout", utmfy: "InitiateCheckout" },
    begin_checkout: { meta: "InitiateCheckout", ga: "begin_checkout", utmfy: "InitiateCheckout" },
    purchase: { meta: "Purchase", ga: "purchase", utmfy: "Purchase" },
  };

  const mapped = eventMap[eventName];

  // Meta Pixel (múltiplos IDs)
  if (trackingSettings.meta_enabled && trackingSettings.meta_pixel_ids.length > 0 && (window as any).fbq) {
    const metaName = mapped?.meta || eventName;
    trackingSettings.meta_pixel_ids.forEach(id => {
      (window as any).fbq("trackSingle", id, metaName, data);
    });
  }

  // Google Analytics (múltiplos measurement IDs)
  if (trackingSettings.google_enabled && trackingSettings.google_analytics_ids.length > 0 && (window as any).gtag) {
    const gaName = mapped?.ga || eventName;
    trackingSettings.google_analytics_ids.forEach(id => {
      (window as any).gtag("event", gaName, { ...(data || {}), send_to: id });
    });
  }

  // UTMfy (múltiplas integrações)
  if (trackingSettings.utmfy_enabled && trackingSettings.utmfy_ids.length > 0 && (window as any).utmfy) {
    const utmName = mapped?.utmfy || eventName;
    trackingSettings.utmfy_ids.forEach(() => {
      (window as any).utmfy("track", utmName, data);
    });
  }
}

// Expose globally for use outside React
(window as any).__trackEvent = trackEvent;

export function useTracking() {
  const location = useLocation();
  const initialized = useRef(false);

  useEffect(() => {
    if (!location.pathname.startsWith("/store")) return;

    const loadSettings = async () => {
      const { data } = await (supabase as any)
        .from("settings")
        .select("value")
        .eq("key", "tracking_settings")
        .maybeSingle();

      if (!data?.value) return;
      const raw: any = data.value;
      trackingSettings = {
        meta_enabled: !!raw.meta_enabled,
        meta_pixel_ids: normalizeIds(raw.meta_pixel_ids, raw.meta_pixel_id),
        google_enabled: !!raw.google_enabled,
        google_analytics_ids: normalizeIds(raw.google_analytics_ids, raw.google_analytics_id),
        utmfy_enabled: !!raw.utmfy_enabled,
        utmfy_ids: normalizeIds(raw.utmfy_ids, raw.utmfy_id),
      };
      trackingLoaded = true;

      if (trackingSettings.meta_enabled) loadMetaPixel(trackingSettings.meta_pixel_ids);
      if (trackingSettings.google_enabled) loadGoogleAnalytics(trackingSettings.google_analytics_ids);
      if (trackingSettings.utmfy_enabled) loadUtmfy(trackingSettings.utmfy_ids);

      // Flush queue
      const queue = [...eventQueue];
      eventQueue = [];
      queue.forEach((q) => trackEvent(q.eventName, q.data));
    };

    if (!trackingLoaded && !initialized.current) {
        initialized.current = true;
        loadSettings();
    } else if (trackingLoaded) {
        trackEvent("page_view", { page: location.pathname });
    }
  }, [location.pathname]);

  const track = useCallback((eventName: string, data?: Record<string, any>) => {
    trackEvent(eventName, data);
  }, []);

  return { track };
}
