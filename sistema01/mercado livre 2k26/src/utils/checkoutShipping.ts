const STORAGE_KEY = "checkout_shipping";

export type CheckoutShipping = {
  id: string;
  name: string;
  price: number;
  isFree: boolean;
  min: number;
  max: number;
};

export function getCheckoutShipping(): CheckoutShipping | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const v = JSON.parse(raw);
    if (!v || typeof v !== "object") return null;
    return {
      id: String(v.id ?? ""),
      name: String(v.name ?? ""),
      price: Number(v.price) || 0,
      isFree: Boolean(v.isFree),
      min: Number(v.min) || 0,
      max: Number(v.max) || 0,
    };
  } catch {
    return null;
  }
}

export function saveCheckoutShipping(value: CheckoutShipping): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function clearCheckoutShipping(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
