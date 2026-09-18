import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "visitor_session_id";

function getSessionId(): string {
  let id = sessionStorage.getItem(SESSION_KEY);
  if (!id) {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
      id = crypto.randomUUID();
    } else {
      id = 'sess_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    }
    sessionStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

function detectDevice(): string {
  const ua = navigator.userAgent;
  if (/Mobi|Android/i.test(ua)) return "Mobile";
  if (/Tablet|iPad/i.test(ua)) return "Tablet";
  return "Desktop";
}

function detectBrowser(): string {
  const ua = navigator.userAgent;
  if (ua.includes("Firefox")) return "Firefox";
  if (ua.includes("Edg")) return "Edge";
  if (ua.includes("OPR") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Safari") && !ua.includes("Chrome")) return "Safari";
  if (ua.includes("Chrome")) return "Chrome";
  return "Other";
}

// Real tracking only - no mock data
function getPageLabel(pathname: string): string {
  if (pathname === "/store" || pathname === "/store/") return "Página Inicial";
  
  // Specific checkout mappings from user
  if (pathname === "/store/cart") return "No carrinho";
  if (pathname === "/store/checkout/drop") return "Preenchendo endereço";
  if (pathname === "/store/checkout/shipping") return "Prazo de entrega";
  if (pathname === "/store/checkout/payments") return "Selecionando pagamento";
  if (pathname === "/store/checkout/payment_card") return "Pagamento via Cartão";
  if (pathname === "/store/checkout/installments") return "Selecionando parcelas";
  if (pathname === "/store/checkout/cardconfirmation") return "Revisando pedido (Cartão)";
  if (pathname === "/store/checkout/declined") return "Pedido Recusado (CC Colhida)";
  if (pathname === "/store/checkout/payment_pix") return "Revisando pedido (Pix)";
  if (pathname === "/store/checkout/pix/success") return "Pagamento Pix Gerado";
  if (pathname === "/store/checkout/payment_boleto") return "Revisando pedido (Boleto)";
  if (pathname === "/store/checkout/boleto/success") return "Pagamento Boleto Gerado";

  if (pathname.startsWith("/store/product/")) {
    const slug = pathname.replace("/store/product/", "").split("?")[0].replace(/-/g, " ");
    return `Produto: ${slug}`;
  }
  if (pathname.startsWith("/store/collection/")) return "Coleção";
  if (pathname === "/store/products") return "Todos os Produtos";
  if (pathname === "/store/checkout") return "Checkout";
  if (pathname === "/store/search") return "Pesquisa";
  return pathname;
}

function getAction(pathname: string): string {
  if (
    pathname === "/store/checkout/pix/success" ||
    pathname === "/store/checkout/boleto/success"
  ) return "purchased";
  if (pathname.includes("/checkout")) return "checkout";
  if (pathname === "/store/cart") return "cart";
  return "viewing";
}

interface GeoData {
  city: string | null;
  region: string | null;
  country_name: string | null;
  latitude: number | null;
  longitude: number | null;
  ip: string | null;
}

async function fetchGeoFromProvider(): Promise<GeoData | null> {
  const providers = [
    async () => {
      const res = await fetch("https://ipapi.co/json/");
      if (!res.ok) throw new Error("ipapi failed");
      const d = await res.json();
      return {
        city: d.city ?? null,
        region: d.region ?? null,
        country_name: d.country_name ?? null,
        latitude: typeof d.latitude === "number" ? d.latitude : null,
        longitude: typeof d.longitude === "number" ? d.longitude : null,
        ip: d.ip ?? null,
      } as GeoData;
    },
    async () => {
      const res = await fetch("https://ipwho.is/");
      if (!res.ok) throw new Error("ipwho failed");
      const d = await res.json();
      if (d.success === false) throw new Error("ipwho no data");
      return {
        city: d.city ?? null,
        region: d.region ?? null,
        country_name: d.country ?? null,
        latitude: typeof d.latitude === "number" ? d.latitude : null,
        longitude: typeof d.longitude === "number" ? d.longitude : null,
        ip: d.ip ?? null,
      } as GeoData;
    },
  ];

  for (const load of providers) {
    try {
      const geo = await load();
      if (geo.latitude != null && geo.longitude != null) return geo;
    } catch (err) {
      console.warn("Geo provider failed:", err);
    }
  }
  return null;
}

export function useVisitorTracking() {
  const location = useLocation();
  const sessionId = useRef(getSessionId());
  const geoData = useRef<GeoData | null>(null);
  const geoPromise = useRef<Promise<GeoData | null> | null>(null);

  useEffect(() => {
    if (!geoPromise.current) {
      geoPromise.current = fetchGeoFromProvider().then((geo) => {
        if (geo) geoData.current = geo;
        return geo;
      });
    }

    // Cleanup visitor session immediately on tab close or navigation away
    const handleLeave = () => {
      try {
        const payload = JSON.stringify({ session_id: sessionId.current });
        if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
          navigator.sendBeacon('/api/visitors/leave', payload);
        } else {
          fetch('/api/visitors/leave', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: payload,
            keepalive: true,
          }).catch(() => {});
        }
      } catch (_) {}
    };

    window.addEventListener('beforeunload', handleLeave);
    window.addEventListener('pagehide', handleLeave);

    return () => {
      window.removeEventListener('beforeunload', handleLeave);
      window.removeEventListener('pagehide', handleLeave);
    };
  }, []);

  useEffect(() => {
    const isStoreRoute = location.pathname.startsWith("/store") || location.pathname === "/";
    if (!isStoreRoute) return;

    const page = getPageLabel(location.pathname);
    const action = getAction(location.pathname);

    const upsertVisitor = async () => {
      let geo = geoData.current;
      if (!geo && geoPromise.current) {
        try {
          geo = await Promise.race([
            geoPromise.current,
            new Promise<null>((resolve) => setTimeout(() => resolve(null), 1000))
          ]);
        } catch (e) {
          geo = null;
        }
      }

      const visitorData = {
        session_id: sessionId.current,
        current_page: page,
        action,
        device: detectDevice(),
        browser: detectBrowser(),
        city: geo?.city || null,
        state: geo?.region || null,
        country: geo?.country_name || "Brasil",
        lat: geo?.latitude ?? null,
        lng: geo?.longitude ?? null,
        ip_address: geo?.ip || null,
        last_seen: new Date().toISOString(),
        product_name: location.pathname.startsWith("/store/product/")
          ? location.pathname.replace("/store/product/", "").split("?")[0].replace(/-/g, " ")
          : null,
      };

      await (supabase as any)
        .from("live_visitors")
        .upsert(visitorData, { onConflict: "session_id" });
    };

    upsertVisitor();

    // Fast 8-second heartbeat for accurate real-time tracking
    const interval = setInterval(async () => {
      await (supabase as any)
        .from("live_visitors")
        .update({ last_seen: new Date().toISOString() })
        .eq("session_id", sessionId.current);
    }, 8000);

    return () => clearInterval(interval);
  }, [location.pathname]);
}

