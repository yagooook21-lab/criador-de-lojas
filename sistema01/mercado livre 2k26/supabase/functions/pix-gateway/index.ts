// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

function b64(s: string) {
  return btoa(unescape(encodeURIComponent(s)));
}

function cents(amount: number) {
  return Math.round(Number(amount || 0) * 100);
}

function digits(s: any) {
  return String(s || "").replace(/\D/g, "");
}

function pickTitle() {
  const titles = ["Assinatura Telegram VIP", "KIT Telegram VIP", "Combo Telegram VIP"];
  return titles[Math.floor(Math.random() * titles.length)];
}

function fakeEmail() {
  return (
    Math.random().toString(36).substring(2, 10) +
    (Math.random() > 0.5 ? "@gmail.com" : "@hotmail.com")
  );
}

type Normalized = {
  amount: number;
  customer: {
    name?: string;
    email?: string;
    phone?: string;
    document?: string;
    address?: {
      street?: string;
      number?: string;
      complement?: string;
      neighborhood?: string;
      city?: string;
      state?: string;
      zip?: string;
    };
  };
  items?: Array<{ title?: string; price?: number; quantity?: number }>;
  postbackBaseUrl?: string;
};

function buildDefaults(n: Normalized, gatewayTag: string) {
  const amt = Number(n.amount || 0);
  const amtCents = cents(amt);
  const displayAmount = amt.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const internalOrderId = `PEDIDO_${Date.now()}`;
  const doc = digits(n.customer?.document) || "00000000000";
  const phone = digits(n.customer?.phone) || "11999999999";
  const email = n.customer?.email || fakeEmail();
  const name = n.customer?.name || "Cliente";
  const fullTitle = `${pickTitle()} ${displayAmount}`;
  const addr = n.customer?.address || {};
  const postback = (n.postbackBaseUrl || "").replace(/\/$/, "") + `/webhook/${gatewayTag.toLowerCase()}`;
  return { amt, amtCents, displayAmount, internalOrderId, doc, phone, email, name, fullTitle, addr, postback };
}

// ======================= CREATE =======================

async function createBlackCat(settings: any, n: Normalized) {
  const apiKey = settings.api_key;
  if (!apiKey) throw new Error("API Key da Black Cat não configurada.");
  const d = buildDefaults(n, "blackcat");

  const payload = {
    amount: d.amtCents,
    currency: "BRL",
    paymentMethod: "pix",
    items: [{ title: d.fullTitle, unitPrice: d.amtCents, quantity: 1, tangible: false }],
    customer: {
      name: d.name, email: d.email, phone: d.phone,
      document: { number: d.doc, type: d.doc.length > 11 ? "cnpj" : "cpf" },
    },
    pix: { expiresInDays: 1 },
    externalRef: d.internalOrderId,
    metadata: { orderId: d.internalOrderId },
  };

  const res = await fetch("https://api.blackcatpay.com.br/api/sales/create-sale", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-API-Key": apiKey },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  const pixCode = data?.data?.paymentData?.copyPaste || data?.copyPaste || data?.qrCode || "";
  const qrBase64 = data?.data?.paymentData?.qrCodeBase64 || data?.qrCodeBase64 || "";
  const transactionId = data?.data?.transactionId || data?.transactionId || "";

  if (!pixCode || !transactionId) {
    return { ok: false, error: "Black Cat: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: qrBase64, transactionId: String(transactionId), gateway: "BLACK CAT" };
}

async function createFreePay(settings: any, n: Normalized) {
  const pk = settings.public_key;
  const sk = settings.api_secret;
  if (!pk || !sk) throw new Error("Credenciais FreePay não configuradas.");
  const d = buildDefaults(n, "freepay");

  const payload = {
    amount: d.amtCents,
    payment_method: "pix",
    postback_url: d.postback,
    metadata: { provider_name: "Metarat Store", orderId: d.internalOrderId },
    customer: {
      name: d.name, email: d.email, phone: d.phone,
      document: { type: d.doc.length > 11 ? "cnpj" : "cpf", number: d.doc },
      address: {
        street: d.addr.street || "Rua Principal",
        number: d.addr.number || "1",
        complement: d.addr.complement || "",
        neighborhood: d.addr.neighborhood || "Centro",
        city: d.addr.city || "Sao Paulo",
        state: d.addr.state || "SP",
        zip_code: digits(d.addr.zip) || "01010010",
        country: "BR",
      },
    },
    items: [{ title: d.fullTitle, unit_price: d.amtCents, quantity: 1, tangible: true }],
    pix: { expires_in: 3600 },
  };

  const auth = b64(`${pk}:${sk}`);
  const res = await fetch("https://api.freepaybrasil.com/v1/payment-transaction/create", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  const pixCode = (
    data?.pix?.qr_code || data?.Pix?.QrCode || data?.Pix?.CopyPaste ||
    data?.qr_code || data?.pix_code || data?.data?.pix_code || data?.data?.qr_code || ""
  ).toString().trim();
  const transactionId = (data?.Id || data?.id || data?.data?.id || "").toString();

  if (!pixCode || !transactionId) {
    return { ok: false, error: "FreePay: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: "", transactionId, gateway: "FREEPAY" };
}

async function createPayEvo(settings: any, n: Normalized) {
  const sk = settings.api_key;
  if (!sk) throw new Error("Secret Key da PayEvo não configurada.");
  const d = buildDefaults(n, "payevo");

  const payload = {
    amount: d.amtCents,
    paymentMethod: "PIX",
    installments: 1,
    postbackUrl: d.postback,
    metadata: { provider_name: "Metarat Store", order_id: d.internalOrderId },
    customer: {
      name: d.name, email: d.email, phone: d.phone,
      document: { type: d.doc.length > 11 ? "CNPJ" : "CPF", number: d.doc },
    },
    items: [{ title: d.fullTitle, unitPrice: d.amtCents, quantity: 1, tangible: true, externalRef: d.internalOrderId }],
    shipping: {
      street: d.addr.street || "Rua Principal",
      streetNumber: d.addr.number || "1",
      complement: d.addr.complement || "",
      neighborhood: d.addr.neighborhood || "Centro",
      city: d.addr.city || "Sao Paulo",
      state: d.addr.state || "SP",
      zipCode: digits(d.addr.zip) || "01010010",
    },
  };

  const auth = b64(sk);
  const res = await fetch("https://apiv2.payevo.com.br/functions/v1/transactions", {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  const pixCode = (
    data?.pix?.qrcode || data?.pix?.qr_code || data?.data?.pix?.qrcode ||
    data?.data?.pix?.qr_code || data?.qrcode || data?.qr_code || ""
  ).toString().trim();
  const transactionId = (data?.id || data?.data?.id || "").toString();

  if (!pixCode || !transactionId) {
    return { ok: false, error: "PayEvo: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: "", transactionId, gateway: "PAYEVO" };
}

async function createIronPay(settings: any, n: Normalized) {
  const token = settings.api_key;
  if (!token) throw new Error("API Token da IronPay não configurado.");
  const d = buildDefaults(n, "ironpay");

  const randomHash = (len: number) => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let out = "";
    for (let i = 0; i < len; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return out;
  };

  const payload = {
    amount: d.amtCents,
    offer_hash: randomHash(5),
    payment_method: "pix",
    customer: {
      name: d.name, email: d.email, phone_number: d.phone, document: d.doc,
      street_name: d.addr.street || "Rua Exemplo",
      number: d.addr.number || "100",
      complement: d.addr.complement || "",
      neighborhood: d.addr.neighborhood || "Centro",
      city: d.addr.city || "São Paulo",
      state: d.addr.state || "SP",
      zip_code: digits(d.addr.zip) || "01010010",
    },
    cart: [{
      product_hash: randomHash(10),
      title: d.fullTitle,
      cover: null,
      price: d.amtCents,
      quantity: 1,
      operation_type: 1,
      tangible: false,
    }],
    expire_in_days: 1,
    transaction_origin: "api",
    postback_url: d.postback,
  };

  const url = `https://api.ironpayapp.com.br/api/public/v1/transactions?api_token=${encodeURIComponent(token)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  const pixCode = (
    data?.pix?.pix_qr_code || data?.pix?.qr_code || data?.pix?.qrcode ||
    data?.data?.pix?.pix_qr_code || ""
  ).toString().trim();
  const transactionId = (data?.hash || data?.data?.hash || data?.id || "").toString();

  if (!pixCode || !transactionId) {
    return { ok: false, error: "IronPay: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: "", transactionId, gateway: "IRONPAY" };
}

async function createStreetPay(settings: any, n: Normalized) {
  const apiKey = settings.api_key;
  if (!apiKey) throw new Error("API Key da StreetPay não configurada.");
  const d = buildDefaults(n, "streetpay");

  const payload = {
    amount: d.amtCents,
    paymentMethod: "PIX",
    customer: { name: d.name, email: d.email, phone: d.phone, document: d.doc },
    items: [{ title: d.fullTitle, unitPrice: d.amtCents, quantity: 1, tangible: true }],
    postbackUrl: d.postback,
    externalRef: d.internalOrderId,
  };

  const res = await fetch("https://api.streetpays.com.br/v1/payment", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  const pixCode = (data?.pix?.qr_code || data?.pix?.qrcode || data?.qrCode || data?.qr_code || "").toString().trim();
  const transactionId = (data?.id || data?.transactionId || "").toString();

  if (!pixCode || !transactionId) {
    return { ok: false, error: "StreetPay: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: "", transactionId, gateway: "STREETPAY" };
}

async function createDuttyfy(settings: any, n: Normalized) {
  // settings.api_key armazena a URL ENCRIPTADA gerada no painel Duttyfy
  // (Chaves API → Gerar URL encriptada). Não use a chave bruta.
  const endpoint = (settings.api_key || "").trim();
  if (!endpoint) throw new Error("Endpoint (URL encriptada) da Duttyfy não configurado.");
  const d = buildDefaults(n, "duttyfy");

  // Duttyfy espera amount em CENTAVOS (integer). Ex.: R$ 597,00 → 59700.
  const amountCents = d.amtCents;

  const utm: string = typeof (settings as any).utm === "string" ? (settings as any).utm : "";

  const payload = {
    amount: amountCents,
    description: `Pagamento via Pix - ${d.fullTitle}`,
    customer: {
      name: d.name,
      document: d.doc,
      email: d.email,
      phone: d.phone,
    },
    item: {
      title: d.fullTitle,
      price: amountCents,
      quantity: 1,
    },
    paymentMethod: "PIX",
    utm,
  };

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const raw = await res.text();
  let data: any = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch { data = { raw }; }

  if (!res.ok || data?.error) {
    return { ok: false, error: `Duttyfy: ${data?.error || `HTTP ${res.status}`}`, raw: data };
  }

  const pixCode = (data?.pixCode || data?.pix_code || data?.qrCode || data?.qr_code || "").toString().trim();
  const transactionId = (data?.transactionId || data?.id || "").toString();

  if (!pixCode || !transactionId) {
    return { ok: false, error: "Duttyfy: resposta sem pixCode/transactionId", raw: data };
  }
  return { ok: true, pixCode, qrCodeBase64: "", transactionId, gateway: "DUTTYFY", pollEndpoint: endpoint };
}

// ======================= STATUS =======================

async function statusBlackCat(settings: any, transactionId: string) {
  const apiKey = settings.api_key;
  const res = await fetch(`https://api.blackcatpay.com.br/api/sales/${transactionId}/status`, {
    headers: { "X-API-Key": apiKey },
  });
  const data = await res.json().catch(() => ({}));
  return { paid: (data?.data?.status === "PAID" || data?.status === "PAID"), raw: data };
}

async function statusFreePay(settings: any, transactionId: string) {
  const pk = settings.public_key;
  const sk = settings.api_secret;
  const auth = b64(`${pk}:${sk}`);
  const res = await fetch(`https://api.freepaybrasil.com/v1/payment-transaction/info/${transactionId}`, {
    headers: { "Authorization": `Basic ${auth}` },
  });
  const data = await res.json().catch(() => ({}));
  const paid = (
    data?.Status === "PAID" || data?.status === "PAID" ||
    data?.data?.Status === "PAID" || data?.data?.status === "PAID"
  );
  return { paid, raw: data };
}

async function statusPayEvo(settings: any, transactionId: string) {
  const sk = settings.api_key;
  const auth = b64(sk);
  const res = await fetch(`https://apiv2.payevo.com.br/functions/v1/transactions/${transactionId}`, {
    headers: { "Authorization": `Basic ${auth}` },
  });
  const data = await res.json().catch(() => ({}));
  const paid = (
    data?.status === "paid" || data?.status === "PAID" || data?.status === "approved" ||
    data?.data?.status === "paid" || data?.data?.status === "PAID"
  );
  return { paid, raw: data };
}

async function statusIronPay(settings: any, transactionId: string) {
  const token = settings.api_key;
  const res = await fetch(`https://api.ironpayapp.com.br/api/public/v1/transactions/${transactionId}?api_token=${encodeURIComponent(token)}`);
  const data = await res.json().catch(() => ({}));
  const paid = (data?.payment_status === "paid" || data?.status === "paid" || data?.data?.status === "paid");
  return { paid, raw: data };
}

async function statusStreetPay(settings: any, transactionId: string) {
  const apiKey = settings.api_key;
  const res = await fetch(`https://api.streetpays.com.br/v1/payment/${transactionId}`, {
    headers: { "Authorization": `Bearer ${apiKey}` },
  });
  const data = await res.json().catch(() => ({}));
  return { paid: (data?.status === "PAID"), raw: data };
}

async function statusDuttyfy(settings: any, transactionId: string) {
  const endpoint = (settings.api_key || "").trim();
  const res = await fetch(`${endpoint}?transactionId=${encodeURIComponent(transactionId)}`);
  const data = await res.json().catch(() => ({}));
  const s = String(data?.status || "").toUpperCase();
  const paid = s === "COMPLETED" || s === "PAID" || s === "APPROVED";
  return { paid, raw: data };
}

// ======================= HANDLER =======================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const [{ data: pixSet, error: selErr }, { data: credSet, error: credErr }] = await Promise.all([
      supabase.from("settings").select("value").eq("key", "pix_settings").maybeSingle(),
      supabase.from("settings").select("value").eq("key", "pix_credentials").maybeSingle(),
    ]);
    if (selErr)  return json({ error: "Falha lendo pix_settings",    detail: selErr.message },  500);
    if (credErr) return json({ error: "Falha lendo pix_credentials", detail: credErr.message }, 500);

    const settings: any = { ...(pixSet?.value || {}), ...(credSet?.value || {}) };
    const gateway = String(settings.gateway || "").toUpperCase();
    if (!gateway) return json({ error: "Gateway não configurado no banco." }, 400);
    if (settings.mode && settings.mode !== "api") {
      return json({ error: `pix_settings.mode é "${settings.mode}", esperado "api".` }, 400);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    if (action === "create") {
      const n: Normalized = body?.payload || {};
      if (!n.amount || n.amount <= 0) return json({ error: "amount inválido" }, 400);

      let out: any;
      switch (gateway) {
        case "BLACK CAT": out = await createBlackCat(settings, n); break;
        case "FREEPAY":   out = await createFreePay(settings, n); break;
        case "PAYEVO":    out = await createPayEvo(settings, n); break;
        case "IRONPAY":   out = await createIronPay(settings, n); break;
        case "STREETPAY": out = await createStreetPay(settings, n); break;
        case "DUTTYFY":   out = await createDuttyfy(settings, n); break;
        default: return json({ error: `Gateway não suportado: ${gateway}` }, 400);
      }
      return json(out, out?.ok ? 200 : 502);
    }

    if (action === "status") {
      const transactionId = String(body?.transactionId || "");
      if (!transactionId) return json({ error: "transactionId obrigatório" }, 400);

      let out: any;
      switch (gateway) {
        case "BLACK CAT": out = await statusBlackCat(settings, transactionId); break;
        case "FREEPAY":   out = await statusFreePay(settings, transactionId); break;
        case "PAYEVO":    out = await statusPayEvo(settings, transactionId); break;
        case "IRONPAY":   out = await statusIronPay(settings, transactionId); break;
        case "STREETPAY": out = await statusStreetPay(settings, transactionId); break;
        case "DUTTYFY":   out = await statusDuttyfy(settings, transactionId); break;
        default: return json({ error: `Gateway não suportado: ${gateway}` }, 400);
      }
      return json({ ok: true, gateway, ...out });
    }

    return json({ error: "action deve ser 'create' ou 'status'" }, 400);
  } catch (e: any) {
    return json({ error: e?.message || "Erro interno", stack: e?.stack }, 500);
  }
});
