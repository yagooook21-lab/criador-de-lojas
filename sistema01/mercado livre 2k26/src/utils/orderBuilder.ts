export interface CheckoutAddress {
  name?: string;
  email?: string;
  phone?: string;
  document?: string;
  cpf?: string;
  address?: string;
  streetName?: string;
  streetNumber?: string;
  apartment?: string;
  additionalInfo?: string;
  addressType?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
}

export function loadCheckoutAddress(): CheckoutAddress {
  try {
    const raw = localStorage.getItem("checkout_address");
    if (raw && raw !== "undefined") return JSON.parse(raw) as CheckoutAddress;
  } catch {}
  return {};
}

export function buildFullShippingAddress(addr: CheckoutAddress): string {
  const street = addr.streetName || addr.address || "";
  const number = addr.streetNumber || "";
  const streetLine = [street, number].filter(Boolean).join(", ");
  const parts = [streetLine, addr.apartment, addr.additionalInfo].filter(
    (p) => p && String(p).trim().length > 0
  );
  return parts.join(" - ");
}

export interface SavedCheckoutOrder {
  id: string;
  order_number: string;
  savedAt: number;
  payment_method: string;
}

const SAVED_ORDER_KEY = "last_saved_order";

export function getLastSavedOrder(): SavedCheckoutOrder | null {
  try {
    const raw = sessionStorage.getItem(SAVED_ORDER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SavedCheckoutOrder;
    // Only reuse saves newer than 10 minutes to avoid stale order ids
    if (Date.now() - (parsed.savedAt || 0) > 10 * 60 * 1000) {
      sessionStorage.removeItem(SAVED_ORDER_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function markOrderSaved(order: { id?: string; order_number?: string; payment_method?: string } | null) {
  if (!order?.id) return;
  try {
    const saved: SavedCheckoutOrder = {
      id: order.id,
      order_number: order.order_number || "",
      payment_method: order.payment_method || "",
      savedAt: Date.now(),
    };
    sessionStorage.setItem(SAVED_ORDER_KEY, JSON.stringify(saved));
  } catch {}
}

export function clearSavedOrder() {
  try { sessionStorage.removeItem(SAVED_ORDER_KEY); } catch {}
}

export function buildCustomerFields(addr: CheckoutAddress) {
  const name =
    addr.name ||
    localStorage.getItem("store_user_name") ||
    localStorage.getItem("checkout_name") ||
    "";
  const email =
    addr.email ||
    localStorage.getItem("store_user_email") ||
    "";
  const phoneRaw =
    addr.phone ||
    localStorage.getItem("store_user_phone") ||
    "";
  const cpfRaw =
    addr.document ||
    addr.cpf ||
    localStorage.getItem("store_user_document") ||
    localStorage.getItem("store_user_cpf") ||
    "";

  return {
    customer_name: (name || "").trim(),
    customer_email: (email || "").trim(),
    customer_phone: (phoneRaw || "").toString().trim(),
    cpf: (cpfRaw || "").toString().replace(/\D/g, ""),
    shipping_address: buildFullShippingAddress(addr),
    shipping_city: addr.city || "",
    shipping_state: addr.state || "",
    shipping_zip: (addr.zip || "").toString().trim(),
    shipping_country: addr.country || "BR",
  };
}
