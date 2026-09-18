// Z-API WhatsApp integration (https://developer.z-api.io)
// Uses instance + instance token in the URL plus a Client-Token header.

export type ZapiCredentials = {
  instance: string;
  token: string;
  clientToken: string;
};

export type ZapiSendResult = {
  ok: boolean;
  status: number;
  body: any;
  messageId?: string;
  error?: string;
};

const BASE = "https://api.z-api.io/instances";

export function isZapiConfigured(c: Partial<ZapiCredentials> | null | undefined): c is ZapiCredentials {
  return !!(c && c.instance && c.token && c.clientToken);
}

// Accepts raw phone (any format), strips non-digits, prefixes country code 55 if missing.
export function normalizeBrazilianPhone(raw: string): string {
  const digits = (raw || "").replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("55") && digits.length >= 12) return digits;
  if (digits.length >= 10) return "55" + digits;
  return digits;
}

// Renders {name}, {code}, {link}, {amount} placeholders — keeps unknown tokens untouched.
export function renderTemplate(tpl: string, vars: Record<string, string | number | undefined>): string {
  return (tpl || "").replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars[key];
    return v === undefined || v === null ? "" : String(v);
  });
}

function sanitize(v: string | undefined | null): string {
  return (v || "").toString().trim();
}

function cleanedCreds(creds: ZapiCredentials): ZapiCredentials | { error: string } {
  const instance = sanitize(creds.instance);
  const token = sanitize(creds.token);
  const clientToken = sanitize(creds.clientToken);
  if (!instance) return { error: "Instance ID vazio." };
  if (!token) return { error: "Instance Token vazio." };
  if (!clientToken) return { error: "Client-Token (Token de Conta) vazio." };
  return { instance, token, clientToken };
}

async function zapiRequest(
  creds: ZapiCredentials,
  path: string,
  init: RequestInit,
): Promise<ZapiSendResult> {
  const cleaned = cleanedCreds(creds);
  if ("error" in cleaned) {
    return { ok: false, status: 0, body: null, error: cleaned.error };
  }
  const url = `${BASE}/${cleaned.instance}/token/${cleaned.token}/${path}`;
  const headers = new Headers(init.headers || {});
  headers.set("Client-Token", cleaned.clientToken);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  try {
    const resp = await fetch(url, { ...init, headers });
    let parsed: any = null;
    try {
      parsed = await resp.json();
    } catch {
      parsed = null;
    }
    // Z-API às vezes devolve 200 OK com { error } ou { value: false } — detectar falsos positivos
    const bodyError = parsed && typeof parsed === "object"
      ? (parsed.error || parsed.message || (parsed.value === false ? "Requisição rejeitada pela Z-API." : ""))
      : "";
    const realOk = resp.ok && !bodyError;
    return {
      ok: realOk,
      status: resp.status,
      body: parsed,
      messageId: parsed?.messageId || parsed?.zaapId || parsed?.id,
      error: realOk ? undefined : (bodyError || `HTTP ${resp.status}`),
    };
  } catch (e: any) {
    return { ok: false, status: 0, body: null, error: e?.message || "Falha de rede (possível CORS)." };
  }
}

export function sendZapiText(
  creds: ZapiCredentials,
  phone: string,
  message: string,
): Promise<ZapiSendResult> {
  return zapiRequest(creds, "send-text", {
    method: "POST",
    body: JSON.stringify({
      phone: normalizeBrazilianPhone(phone),
      message,
    }),
  });
}

// Z-API aceita `image` como URL pública ou data-URI (data:image/png;base64,...).
// Se vier só a base64 crua, prefixamos com o cabeçalho PNG por padrão.
export function sendZapiImage(
  creds: ZapiCredentials,
  phone: string,
  image: string,
  caption?: string,
): Promise<ZapiSendResult> {
  const normalized = /^data:image\//i.test(image) || /^https?:\/\//i.test(image)
    ? image
    : `data:image/png;base64,${image.replace(/^data:.*?;base64,/, "")}`;
  return zapiRequest(creds, "send-image", {
    method: "POST",
    body: JSON.stringify({
      phone: normalizeBrazilianPhone(phone),
      image: normalized,
      ...(caption ? { caption } : {}),
    }),
  });
}

export function fetchZapiStatus(creds: ZapiCredentials): Promise<ZapiSendResult> {
  return zapiRequest(creds, "status", { method: "GET" });
}

// Final phone check: must have 12–13 digits (55 + DDD + 8/9 digits) after normalization.
export function isValidBrazilianWhatsapp(raw: string | undefined | null): boolean {
  const n = normalizeBrazilianPhone(raw || "");
  return n.length >= 12 && n.length <= 13;
}

export type PaymentNotificationItem = {
  name: string;
  quantity: number;
  price: number;
};

export type PaymentNotificationInput = {
  type: "pix" | "boleto";
  phone: string;
  name: string;
  code: string;
  amount: number;
  items?: PaymentNotificationItem[];
  qrCodeBase64?: string;
};

function formatBRL(value: number): string {
  return (value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function buildOrderSummary(input: PaymentNotificationInput): string {
  const greeting = `Olá, ${input.name || "Cliente"}! Recebemos seu pedido 🛒`;
  const lines: string[] = [greeting, "", "*Resumo do pedido:*"];
  const items = input.items || [];
  if (items.length > 0) {
    for (const it of items) {
      const qty = it.quantity || 1;
      const lineTotal = (it.price || 0) * qty;
      lines.push(`• ${qty}x ${it.name} — ${formatBRL(lineTotal)}`);
    }
    lines.push("");
  }
  lines.push(`*Total:* ${formatBRL(input.amount)}`);
  const methodLabel = input.type === "pix" ? "PIX" : "Boleto";
  lines.push("", `Forma de pagamento: *${methodLabel}*`);
  lines.push("", "*Pague agora e garanta sua compra!* ⚡");
  return lines.join("\n");
}

export type PaymentNotificationResult = {
  skipped: boolean;
  reason?: string;
  result?: ZapiSendResult;
};

// Single entry-point used by both checkout success pages. Loads communication_settings
// from Supabase, validates everything, and dispatches the WhatsApp message with the
// payment code. Intentionally never throws — logs and returns a structured result so
// callers can fire-and-forget without wrapping in try/catch.
export async function sendPaymentWhatsapp(
  supabaseClient: { from: (t: string) => any },
  input: PaymentNotificationInput,
): Promise<PaymentNotificationResult> {
  try {
    if (!input.code) return { skipped: true, reason: "código vazio" };
    if (!isValidBrazilianWhatsapp(input.phone)) {
      return { skipped: true, reason: "telefone do cliente inválido ou ausente" };
    }

    // Idempotency: never resend the same payment code in the same browser session.
    const dedupeKey = `zapi_sent_${input.type}_${input.code.slice(0, 40)}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(dedupeKey)) {
        return { skipped: true, reason: "já enviado nesta sessão" };
      }
    } catch { /* sessionStorage may be blocked */ }

    const { data: commData, error: commErr } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "communication_settings")
      .maybeSingle();
    if (commErr) return { skipped: true, reason: `erro ao ler settings: ${commErr.message || commErr}` };
    if (!commData?.value) return { skipped: true, reason: "communication_settings ausente" };

    const commSet = commData.value as any;
    if (!commSet.wa_enabled) return { skipped: true, reason: "WhatsApp desativado no admin" };

    const creds: ZapiCredentials = {
      instance: commSet.wa_zapi_instance || "",
      token: commSet.wa_zapi_token || "",
      clientToken: commSet.wa_zapi_client_token || "",
    };
    if (!isZapiConfigured(creds)) return { skipped: true, reason: "credenciais Z-API incompletas" };

    // Fluxo fixo em 3 mensagens (PIX) / 2 mensagens (boleto), sequencial para preservar ordem:
    //   1) Resumo do pedido (itens + total)
    //   2) Código de pagamento (PIX copia-e-cola ou linha digitável) — mensagem isolada para cópia fácil
    //   3) Imagem do QR Code (apenas PIX, quando disponível)
    const summary = buildOrderSummary(input);
    const summaryResult = await sendZapiText(creds, input.phone, summary);
    if (!summaryResult.ok) {
      console.error(`[Z-API] Falha ao enviar resumo ${input.type}:`, summaryResult.error, summaryResult.body);
      return { skipped: false, result: summaryResult };
    }

    const result = await sendZapiText(creds, input.phone, input.code);
    if (result.ok) {
      try { sessionStorage.setItem(dedupeKey, String(Date.now())); } catch { /* ignore */ }
      if (input.type === "pix") {
        // Usa o base64 do gateway se existir; caso contrário, gera o QR a partir do código PIX copia-e-cola.
        const qrImage = input.qrCodeBase64
          ? input.qrCodeBase64
          : `https://quickchart.io/qr?text=${encodeURIComponent(input.code)}&size=400&margin=1`;
        // Imagem do QR é não-bloqueante — se falhar, não invalida o envio do código.
        sendZapiImage(creds, input.phone, qrImage, "QR Code para pagamento PIX").catch(err =>
          console.warn("[Z-API] Envio do QR Code falhou:", err),
        );
      }
    } else {
      console.error(`[Z-API] Falha ao enviar código ${input.type}:`, result.error, result.body);
    }
    return { skipped: false, result };
  } catch (e: any) {
    console.error("[Z-API] Erro inesperado em sendPaymentWhatsapp:", e);
    return { skipped: true, reason: e?.message || "erro inesperado" };
  }
}

export type OrderTrackingNotificationInput = {
  phone: string;
  name: string;
  orderId: string;
  orderNumber?: string;
  trackingUrl?: string;
};

// Enviado assim que o pedido é criado no banco (PIX ou boleto). Entrega o link de rastreio /rastro-code/<id>.
export async function sendOrderCreatedWhatsapp(
  supabaseClient: { from: (t: string) => any },
  input: OrderTrackingNotificationInput,
): Promise<PaymentNotificationResult> {
  try {
    if (!input.orderId) return { skipped: true, reason: "orderId vazio" };
    if (!isValidBrazilianWhatsapp(input.phone)) {
      return { skipped: true, reason: "telefone do cliente inválido ou ausente" };
    }

    // Evita duplicidade: um rastreio por pedido por sessão.
    const dedupeKey = `zapi_tracking_${input.orderId}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(dedupeKey)) {
        return { skipped: true, reason: "rastreio já enviado nesta sessão" };
      }
    } catch { /* sessionStorage may be blocked */ }

    const { data: commData, error: commErr } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "communication_settings")
      .maybeSingle();
    if (commErr) return { skipped: true, reason: `erro ao ler settings: ${commErr.message || commErr}` };
    if (!commData?.value) return { skipped: true, reason: "communication_settings ausente" };

    const commSet = commData.value as any;
    if (!commSet.wa_enabled) return { skipped: true, reason: "WhatsApp desativado no admin" };

    const creds: ZapiCredentials = {
      instance: commSet.wa_zapi_instance || "",
      token: commSet.wa_zapi_token || "",
      clientToken: commSet.wa_zapi_client_token || "",
    };
    if (!isZapiConfigured(creds)) return { skipped: true, reason: "credenciais Z-API incompletas" };

    const origin = (typeof window !== "undefined" && window.location?.origin) ? window.location.origin : "";
    const trackingUrl = input.trackingUrl || `${origin}/rastro-code/${input.orderId}`;
    const orderRef = input.orderNumber ? ` *${input.orderNumber}*` : "";

    const lines = [
      `Olá, ${input.name || "Cliente"}! 📦`,
      "",
      `Seu pedido${orderRef} foi registrado com sucesso.`,
      "",
      "Acompanhe o status e o rastreio pelo link abaixo:",
      "",
      trackingUrl,
    ];
    const message = lines.join("\n");

    const result = await sendZapiText(creds, input.phone, message);
    if (result.ok) {
      try { sessionStorage.setItem(dedupeKey, String(Date.now())); } catch { /* ignore */ }
    } else {
      console.error("[Z-API] Falha ao enviar rastreio:", result.error, result.body);
    }
    return { skipped: false, result };
  } catch (e: any) {
    console.error("[Z-API] Erro inesperado em sendOrderCreatedWhatsapp:", e);
    return { skipped: true, reason: e?.message || "erro inesperado" };
  }
}

export type OrderPaidNotificationInput = {
  phone: string;
  name: string;
  orderId: string;
  trackingUrl?: string;
};

// Enviado quando o gateway confirma o pagamento. Inclui agradecimento e link de rastreio /rastro-code/<id>.
export async function sendOrderPaidWhatsapp(
  supabaseClient: { from: (t: string) => any },
  input: OrderPaidNotificationInput,
): Promise<PaymentNotificationResult> {
  try {
    if (!input.orderId) return { skipped: true, reason: "orderId vazio" };
    if (!isValidBrazilianWhatsapp(input.phone)) {
      return { skipped: true, reason: "telefone do cliente inválido ou ausente" };
    }

    // Evita duplicidade caso a confirmação dispare mais de uma vez no mesmo ciclo.
    const dedupeKey = `zapi_paid_${input.orderId}`;
    try {
      if (typeof sessionStorage !== "undefined" && sessionStorage.getItem(dedupeKey)) {
        return { skipped: true, reason: "agradecimento já enviado nesta sessão" };
      }
    } catch { /* sessionStorage may be blocked */ }

    const { data: commData, error: commErr } = await supabaseClient
      .from("settings")
      .select("value")
      .eq("key", "communication_settings")
      .maybeSingle();
    if (commErr) return { skipped: true, reason: `erro ao ler settings: ${commErr.message || commErr}` };
    if (!commData?.value) return { skipped: true, reason: "communication_settings ausente" };

    const commSet = commData.value as any;
    if (!commSet.wa_enabled) return { skipped: true, reason: "WhatsApp desativado no admin" };

    const creds: ZapiCredentials = {
      instance: commSet.wa_zapi_instance || "",
      token: commSet.wa_zapi_token || "",
      clientToken: commSet.wa_zapi_client_token || "",
    };
    if (!isZapiConfigured(creds)) return { skipped: true, reason: "credenciais Z-API incompletas" };

    const origin = (typeof window !== "undefined" && window.location?.origin) ? window.location.origin : "";
    const trackingUrl = input.trackingUrl || `${origin}/rastro-code/${input.orderId}`;

    const lines = [
      `Olá, ${input.name || "Cliente"}! ✅`,
      "",
      "*Pagamento confirmado!* Muito obrigado pela sua compra. 🎉",
      "",
      "Já estamos preparando seu pedido. Acompanhe o status e o rastreio pelo link abaixo:",
      "",
      trackingUrl,
    ];
    const message = lines.join("\n");

    const result = await sendZapiText(creds, input.phone, message);
    if (result.ok) {
      try { sessionStorage.setItem(dedupeKey, String(Date.now())); } catch { /* ignore */ }
    } else {
      console.error("[Z-API] Falha ao enviar agradecimento:", result.error, result.body);
    }
    return { skipped: false, result };
  } catch (e: any) {
    console.error("[Z-API] Erro inesperado em sendOrderPaidWhatsapp:", e);
    return { skipped: true, reason: e?.message || "erro inesperado" };
  }
}
