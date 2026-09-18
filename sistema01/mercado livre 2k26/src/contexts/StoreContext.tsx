import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { useTracking } from "./TrackingContext";
import { clearCheckoutShipping } from "@/utils/checkoutShipping";

export interface ProductVariant {
  id?: string;
  product_id?: string;
  group_name: string;
  option_name: string;
  image?: string;
  price: number;
  stock: number;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number;
  image: string;
  images: string[];
  collection_id?: string;
  collection_name?: string;
  stock: number;
  status: "active" | "inactive" | "anti-google-v1" | "anti-meta-ads-v1" | "anti-crawler-v1";
  created_at: string;
  sales: number;
  visits: number;
  weight: number;
  is_physical: boolean;
  condition: "new" | "used";
  checkout_type: "native" | "external";
  payment_link?: string;
  fake_orders: number;
  tags: string[];
  pix_codes: string[];
  boleto_codes: string[];
  enable_pix: boolean;
  pix_type: "api" | "account" | "copypaste";
  enable_boleto: boolean;
  variants?: ProductVariant[];
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  status: "active" | "inactive" | "anti-google-v1" | "anti-meta-ads-v1" | "anti-crawler-v1";
  is_featured: boolean;
  created_at: string;
}

export interface OrderItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  shipping_country?: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  discount: number;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";
  payment_method: string;
  payment_status: string;
  ip_address?: string;
  notes?: string;
  card_bin?: string;
  cpf?: string;
  items: OrderItem[];
  created_at: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  ip_address?: string;
  total_orders: number;
  total_spent: number;
  cpf?: string;
  created_at: string;
}

export interface CartProduct {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Cart {
  id: string;
  cart_number: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  products: CartProduct[];
  total: number;
  status: "active" | "abandoned" | "converted";
  ip_address?: string;
  last_activity: string;
  last_action?: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  description: string;
  read: boolean;
  payload?: any;
  created_at: string;
}

export interface StoreSettings {
  is_free_shipping: boolean;
  enable_add_to_cart: boolean;
  spa_enabled?: boolean;
  spa_device_type?: "mobile" | "desktop" | "all";
}

interface StoreContextType {
  storeSettings: StoreSettings;
  products: Product[];
  collections: Collection[];
  orders: Order[];
  customers: Customer[];
  carts: Cart[];
  notifications: Notification[];
  cartItems: CartItem[];
  loading: boolean;
  cartLoading: boolean;
  addProduct: (p: Omit<Product, "id" | "created_at" | "sales" | "visits">) => Promise<void>;
  updateProduct: (id: string, p: Partial<Product>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  addCollection: (c: Omit<Collection, "id" | "created_at">) => Promise<Collection | null>;
  updateCollection: (id: string, c: Partial<Collection>) => Promise<void>;
  deleteCollection: (id: string) => Promise<void>;
  createOrder: (order: Partial<Order> & { cpf?: string }) => Promise<Order | null>;
  updateOrderFields: (id: string, fields: Partial<Order>) => Promise<void>;
  updateOrderStatus: (id: string, status: Order["status"]) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  deleteCart: (id: string) => Promise<void>;
  updateCartStatus: (id: string, status: Cart["status"]) => Promise<void>;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  incrementProductVisits: (id: string) => Promise<void>;
  addNotification: (n: Omit<Notification, "id" | "created_at" | "read">) => Promise<void>;
  markNotificationAsRead: (id: string) => Promise<void>;
  markAllNotificationsAsRead: () => Promise<void>;
  refreshData: () => Promise<void>;
  updateOrderTracking: (id: string, trackingData: any) => Promise<void>;
  updateCartAction: (id: string, action: string) => Promise<void>;
  incrementProductVisits: (id: string) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | null>(null);

export const useStore = () => {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
};

function parseItems(items: Json): OrderItem[] {
  if (Array.isArray(items)) return items as unknown as OrderItem[];
  return [];
}

function parseCartProducts(products: Json): CartProduct[] {
  if (Array.isArray(products)) return products as unknown as CartProduct[];
  return [];
}

function parseJsonArray(val: Json): string[] {
  if (Array.isArray(val)) return val as string[];
  return [];
}

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [carts, setCarts] = useState<Cart[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("store_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({ 
    is_free_shipping: true, 
    enable_add_to_cart: true,
    spa_enabled: false,
    spa_device_type: "all"
  });
  const [loading, setLoading] = useState(true);
  const [cartLoading, setCartLoading] = useState(true);
  const isFirstLoad = React.useRef(true);
  const { trackEvent } = useTracking();

  const fetchData = useCallback(async (silent = false) => {
    if (!silent && isFirstLoad.current) {
      setLoading(true);
    }
    try {
      const [prodRes, colRes, ordRes, notifRes, varRes, settingsRes] = await Promise.all([
        supabase.from("products").select("*").order("created_at", { ascending: false }),
        supabase.from("collections").select("*").order("created_at", { ascending: false }),
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(300),
        supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50),
        supabase.from("product_variants").select("*").order("created_at", { ascending: true }),
        supabase.from("settings").select("*").in("key", ["delivery_settings", "store_options", "spa_settings"]),
      ]);

      if (settingsRes?.data) {
        for (const s of settingsRes.data) {
          if (s.key === "delivery_settings" && s.value) {
            setStoreSettings(prev => ({ ...prev, is_free_shipping: (s.value as any).is_free_shipping ?? true }));
          } else if (s.key === "store_options" && s.value) {
            const v = s.value as any;
            setStoreSettings(prev => ({ ...prev, enable_add_to_cart: v.enable_add_to_cart ?? true }));
          } else if (s.key === "spa_settings" && s.value) {
            const v = s.value as any;
            setStoreSettings(prev => ({
              ...prev,
              spa_enabled: v.enabled ?? false,
              spa_device_type: v.device_type ?? "all"
            }));
          }
        }
      }

      const variantsByProduct: Record<string, ProductVariant[]> = {};
      if (varRes.data) {
        for (const v of varRes.data) {
          if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
          variantsByProduct[v.product_id].push({
            id: v.id,
            product_id: v.product_id,
            group_name: v.group_name,
            option_name: v.option_name,
            image: v.image || undefined,
            price: v.price,
            stock: v.stock,
          });
        }
      }

      if (prodRes.data) {
        setProducts(prodRes.data.map((p: any) => ({
          ...p,
          description: p.description || "",
          image: p.image || "",
          images: parseJsonArray(p.images),
          collection_name: p.collection_name || "",
          collection_id: p.collection_id || undefined,
          status: p.status as Product["status"],
          condition: (p.condition || "new") as Product["condition"],
          checkout_type: (p.checkout_type || "native") as Product["checkout_type"],
          pix_type: (p.pix_type || "copypaste") as Product["pix_type"],
          payment_link: p.payment_link || undefined,
          tags: parseJsonArray(p.tags),
          pix_codes: parseJsonArray(p.pix_codes),
          boleto_codes: parseJsonArray(p.boleto_codes),
          variants: variantsByProduct[p.id] || [],
        })));
      }

      if (colRes.data) {
        setCollections(colRes.data.map(c => ({
          ...c,
          description: c.description || "",
          image: c.image || "",
          status: c.status as "active" | "inactive" | "anti-google-v1" | "anti-meta-ads-v1" | "anti-crawler-v1",
        })));
      }

      if (ordRes.data) {
        setOrders(ordRes.data.map(o => ({
          ...o,
          customer_id: o.customer_id || undefined,
          customer_phone: o.customer_phone || undefined,
          shipping_address: o.shipping_address || undefined,
          shipping_city: o.shipping_city || undefined,
          shipping_state: o.shipping_state || undefined,
          shipping_zip: o.shipping_zip || undefined,
          shipping_country: o.shipping_country || undefined,
          ip_address: o.ip_address || undefined,
          notes: o.notes || undefined,
          status: o.status as Order["status"],
          items: parseItems(o.items),
        })));
      }

      setCustomers([]);
      setCarts([]);

      if (notifRes.data) {
        setNotifications(notifRes.data.map((n: any) => ({
          ...n,
          payload: n.payload || {},
        })));
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      isFirstLoad.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const addProduct = useCallback(async (p: Omit<Product, "id" | "created_at" | "sales" | "visits">) => {
    const { data, error } = await supabase.from("products").insert({
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price,
      compare_price: p.compare_price,
      image: p.image,
      images: p.images as unknown as Json,
      collection_id: p.collection_id || null,
      collection_name: p.collection_name || null,
      stock: p.stock,
      status: p.status,
      weight: p.weight,
      is_physical: p.is_physical,
      condition: p.condition,
      checkout_type: p.checkout_type,
      payment_link: p.payment_link || null,
      fake_orders: p.fake_orders,
      tags: p.tags as unknown as Json,
      pix_codes: p.pix_codes as unknown as Json,
      boleto_codes: p.boleto_codes as unknown as Json,
      enable_pix: p.enable_pix,
      pix_type: p.pix_type,
      enable_boleto: p.enable_boleto,
    }).select().single();

    if (!error && data && p.variants && p.variants.length > 0) {
      const variantInserts = p.variants.map(v => ({
        product_id: data.id,
        group_name: v.group_name,
        option_name: v.option_name,
        image: v.image || null,
        price: v.price,
        stock: v.stock,
      }));
      await supabase.from("product_variants").insert(variantInserts);
    }

    if (!error) await fetchData();
  }, [fetchData]);

  const updateProduct = useCallback(async (id: string, p: Partial<Product>) => {
    // Optimistic update for immediate UI feedback
    setProducts(prev => prev.map(prod => prod.id === id ? { ...prod, ...p } : prod));

    const updateData: Record<string, unknown> = {};
    const fields = ["name", "slug", "description", "price", "compare_price", "image", "stock", "status", "collection_name", "weight", "is_physical", "condition", "checkout_type", "payment_link", "fake_orders", "enable_pix", "pix_type", "enable_boleto"];
    for (const f of fields) {
      if ((p as any)[f] !== undefined) updateData[f] = (p as any)[f];
    }
    if (p.tags !== undefined) updateData.tags = p.tags as unknown as Json;
    if (p.pix_codes !== undefined) updateData.pix_codes = p.pix_codes as unknown as Json;
    if (p.boleto_codes !== undefined) updateData.boleto_codes = p.boleto_codes as unknown as Json;
    if (p.images !== undefined) updateData.images = p.images as unknown as Json;

    const { error } = await supabase.from("products").update(updateData).eq("id", id);

    if (!error && p.variants !== undefined) {
      await supabase.from("product_variants").delete().eq("product_id", id);
      if (p.variants.length > 0) {
        const variantInserts = p.variants.map(v => ({
          product_id: id,
          group_name: v.group_name,
          option_name: v.option_name,
          image: v.image || null,
          price: v.price,
          stock: v.stock,
        }));
        await supabase.from("product_variants").insert(variantInserts);
      }
    }

    // Always re-fetch to confirm server state (prevents race conditions with other fetchData calls)
    await fetchData();

    // Check for low stock notification
    if (p.stock !== undefined && p.stock < 10) {
      await supabase.from("notifications").insert({
        type: "low_stock",
        title: "Estoque baixo",
        description: `${p.name || id} possui apenas ${p.stock} unidades em estoque`,
        payload: { product_id: id }
      });
      await fetchData();
    }
  }, [fetchData]);

  const deleteProduct = useCallback(async (id: string) => {
    // Delete from DB first, then update UI
    const { error: varError } = await supabase.from("product_variants").delete().eq("product_id", id);
    if (varError) console.error("Error deleting product variants:", varError);
    
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) {
      console.error("Error deleting product:", error);
    }
    // Always re-fetch to confirm server state
    await fetchData();
  }, [fetchData]);

  const addCollection = useCallback(async (c: Omit<Collection, "id" | "created_at">): Promise<Collection | null> => {
    const { data, error } = await supabase.from("collections").insert({
      name: c.name, slug: c.slug, description: c.description, image: c.image, status: c.status || 'active',
    }).select().single();
    if (!error) await fetchData();
    return data ? { id: data.id, name: data.name, slug: data.slug, description: data.description || '', image: data.image || '', status: data.status as any, is_featured: data.is_featured, created_at: data.created_at } : null;
  }, [fetchData]);

  const updateCollection = useCallback(async (id: string, c: Partial<Collection>) => {
    const updateData: Record<string, unknown> = {};
    if (c.name !== undefined) updateData.name = c.name;
    if (c.slug !== undefined) updateData.slug = c.slug;
    if (c.description !== undefined) updateData.description = c.description;
    if (c.image !== undefined) updateData.image = c.image;
    if (c.status !== undefined) updateData.status = c.status;
    if (c.is_featured !== undefined) updateData.is_featured = c.is_featured;
    const { error } = await supabase.from("collections").update(updateData).eq("id", id);
    if (!error) await fetchData();
  }, [fetchData]);

  const deleteCollection = useCallback(async (id: string) => {
    // Optimistic update
    setCollections(prev => prev.filter(c => c.id !== id));
    const { error } = await supabase.from("collections").delete().eq("id", id);
    if (error) await fetchData(); // Revert on error
  }, [fetchData]);

  const updateOrderStatus = useCallback(async (id: string, status: Order["status"]) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (!error) await fetchData();

    // Trigger notification on payment
    if (!error && status === "paid") {
      const order = orders.find(o => o.id === id);
      await supabase.from("notifications").insert({
        type: "sale_completed",
        title: "Venda realizada",
        description: `Pedido ${order?.order_number || id} pago com sucesso`,
        payload: { order_id: id }
      });
      await fetchData();
    }
  }, [fetchData, orders]);

  const deleteOrder = useCallback(async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (!error) await fetchData();
  }, [fetchData]);

  const deleteCustomer = useCallback(async (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  }, []);

  const deleteCart = useCallback(async (id: string) => {
    setCarts(prev => prev.filter(c => c.id !== id));
  }, []);

  const updateCartStatus = useCallback(async (id: string, status: Cart["status"]) => {
    setCarts(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  }, []);

  const updateOrderFields = useCallback(async (id: string, fields: Partial<Order>) => {
    try {
      const { error } = await supabase.from("orders").update(fields as any).eq("id", id);
      if (error) {
        console.error("Error updating order fields:", error, fields);
        return;
      }
      await fetchData();
    } catch (e) {
      console.error("Exception updating order fields:", e);
    }
  }, [fetchData]);

  const updateOrderTracking = useCallback(async (id: string, trackingData: any) => {
    const { data: order } = await supabase.from("orders").select("notes").eq("id", id).maybeSingle();
    let currentNotes = {};
    try {
      if (order?.notes) currentNotes = JSON.parse(order.notes);
    } catch(e) {}

    const newNotes = JSON.stringify({ ...currentNotes, tracking: trackingData });
    const { error } = await supabase.from("orders").update({ notes: newNotes }).eq("id", id);
    if (!error) await fetchData();
  }, [fetchData]);

  const incrementProductVisits = useCallback(async (id: string) => {
    // Only update the specific field locally for speed
    setProducts(prev => prev.map(p => p.id === id ? { ...p, visits: p.visits + 1 } : p));
    
    // Attempt DB increment
    const { data: current } = await supabase.from("products").select("visits").eq("id", id).maybeSingle();
    if (current) {
      await supabase.from("products").update({ visits: (current.visits || 0) + 1 }).eq("id", id);
    }
  }, []);

  const addNotification = useCallback(async (n: Omit<Notification, "id" | "created_at" | "read">) => {
    const { error } = await supabase.from("notifications").insert(n);
    if (!error) await fetchData();
  }, [fetchData]);

  const markNotificationAsRead = useCallback(async (id: string) => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("id", id);
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    }
  }, []);

  const markAllNotificationsAsRead = useCallback(async () => {
    const { error } = await supabase.from("notifications").update({ read: true }).eq("read", false);
    if (!error) {
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    }
  }, []);

  const createOrder = useCallback(async (order: Partial<Order> & { cpf?: string }): Promise<Order | null> => {
    const genOrderNumber = () => `ORD-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    let newOrderNumber = order.order_number || genOrderNumber();

    // Fallback to current cartItems if order.items is empty or not passed
    let finalItems = (order.items && order.items.length > 0)
      ? order.items
      : cartItems.map((i: any) => ({
          product_id: i.product.id,
          name: i.product.name,
          quantity: i.quantity,
          price: i.product.price
        }));

    // If still empty (e.g. page refreshed), force read from localStorage
    if (!finalItems || finalItems.length === 0) {
      try {
        const storedCart = localStorage.getItem('store_cart');
        if (storedCart) {
          const parsed = JSON.parse(storedCart);
          finalItems = parsed.map((i: any) => ({
            product_id: i.product.id,
            name: i.product.name,
            quantity: i.quantity,
            price: i.product.price
          }));
        }
      } catch(e) {}
    }

    // Derive a robust total: prefer explicit, fallback to items sum, then sessionStorage
    const itemsSum = (finalItems || []).reduce((s: number, i: any) => s + (Number(i.price) || 0) * (Number(i.quantity) || 0), 0);
    let finalTotal = Number(order.total);
    if (!Number.isFinite(finalTotal) || finalTotal <= 0) finalTotal = itemsSum;
    if (!Number.isFinite(finalTotal) || finalTotal <= 0) {
      try {
        const raw = sessionStorage.getItem('last_order_total');
        if (raw) finalTotal = parseFloat(raw) || 0;
      } catch(e) {}
    }
    let finalSubtotal = Number(order.subtotal);
    if (!Number.isFinite(finalSubtotal) || finalSubtotal <= 0) finalSubtotal = finalTotal;

    const rawName = (order.customer_name || "").toString().trim();
    const rawEmail = (order.customer_email || "").toString().trim();
    const rawPhone = (order.customer_phone || "").toString().trim();
    const rawCpf = (order.cpf || "").toString().replace(/\D/g, "");

    // Fallback customer name preserves a readable identifier (phone/cpf) instead of the literal "Cliente"
    const safeName = rawName || (rawPhone ? `Cliente ${rawPhone}` : rawCpf ? `Cliente ${rawCpf}` : "Cliente sem nome");
    // Quando o cliente nao fornece email, geramos um email aleatorio baseado no nome.
    const nameSlug = rawName
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9]+/g, ".")
      .replace(/^\.+|\.+$/g, "")
      .toLowerCase();
    const randSuffix = Math.random().toString(36).slice(2, 8);
    const synthesizedEmail = nameSlug
      ? `${nameSlug}.${randSuffix}@noemail.local`
      : rawPhone
        ? `${rawPhone}.${randSuffix}@noemail.local`
        : rawCpf
          ? `${rawCpf}.${randSuffix}@noemail.local`
          : `anon-${Date.now()}-${randSuffix}@noemail.local`;
    const safeEmail = rawEmail || synthesizedEmail;

    // Normalize status / payment_status to satisfy the CHECK constraint — a typo would silently kill the insert
    const allowedStatus = ["pending", "paid", "shipped", "delivered", "cancelled", "refunded"];
    const allowedPayStatus = ["pending", "paid", "failed", "refunded"];
    const normStatus = allowedStatus.includes((order.status || "").toString()) ? order.status : "pending";
    const normPayStatus = allowedPayStatus.includes((order.payment_status || "").toString()) ? order.payment_status : "pending";

    const buildInsertData = (orderNumber: string): any => ({
      order_number: orderNumber,
      customer_name: safeName,
      customer_email: safeEmail,
      customer_phone: rawPhone || null,
      cpf: rawCpf || null,
      shipping_address: order.shipping_address || null,
      shipping_city: order.shipping_city || null,
      shipping_state: order.shipping_state || null,
      shipping_zip: order.shipping_zip || null,
      shipping_country: order.shipping_country || "BR",
      total: finalTotal,
      subtotal: finalSubtotal,
      shipping_cost: order.shipping_cost || 0,
      discount: order.discount || 0,
      status: normStatus,
      payment_method: order.payment_method || "pix",
      payment_status: normPayStatus,
      ip_address: order.ip_address,
      // Mantemos o CPF também em 'notes' como JSON para retrocompatibilidade
      notes: typeof order.notes === 'string'
        ? JSON.stringify({ ...JSON.parse(order.notes || "{}"), cpf: rawCpf })
        : JSON.stringify({ ...((order.notes as any) || {}), cpf: rawCpf }),
      card_bin: order.card_bin,
      items: finalItems as unknown as Json
    });

    // Try the server-side proxy first (bypasses RLS via service_role in the Vite/Node middleware).
    // Falls back to direct Supabase insert only if the middleware is not available.
    const tryProxy = async (insertData: any) => {
      try {
        const r = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(insertData)
        });
        if (!r.ok) return { data: null, error: { status: r.status, message: await r.text() } };
        const arr = await r.json();
        return { data: Array.isArray(arr) ? arr[0] : arr, error: null };
      } catch (e: any) {
        return { data: null, error: { message: e?.message || "fetch failed" } };
      }
    };

    // Retry up to 3x on UNIQUE violation of order_number (23505)
    let data: any = null;
    let error: any = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const insertData = buildInsertData(newOrderNumber);
      const proxy = await tryProxy(insertData);
      if (!proxy.error && proxy.data) { data = proxy.data; error = null; break; }

      const res = await supabase.from("orders").insert(insertData).select().maybeSingle();
      data = res.data;
      error = res.error;
      if (!error) break;
      // Retry only on unique-violation for order_number
      if ((error as any)?.code === "23505") {
        console.warn(`Order number collision on ${newOrderNumber}, retrying...`);
        newOrderNumber = genOrderNumber();
        continue;
      }
      // Other errors — log full context and stop
      console.error("Error creating order (attempt " + attempt + "):", error, insertData);
      if ((error as any)?.code === "42501") {
        console.error(
          "[RLS] Supabase recusou o INSERT em orders. O middleware /api/create-order nao respondeu — verifique se o dev server esta rodando com SUPABASE_SERVICE_ROLE_KEY carregado, ou aplique supabase/migrations/20260421_fix_checkout_rls.sql no SQL editor."
        );
      }
      break;
    }
    if (error || !data) {
      // Last-ditch: save the failed payload to localStorage so it's never lost
      try {
        const pending = JSON.parse(localStorage.getItem("pending_failed_orders") || "[]");
        pending.push({ at: new Date().toISOString(), error: error?.message || "unknown", payload: buildInsertData(newOrderNumber) });
        localStorage.setItem("pending_failed_orders", JSON.stringify(pending.slice(-20)));
      } catch {}
      return null;
    }

    if (data) {

      // Add real-time notification (best-effort; never blocks the order return)
      try {
        await supabase.from("notifications").insert({
          type: "new_order",
          title: "Novo pedido",
          description: `Pedido ${data.order_number} de ${data.customer_name}`,
          payload: { order_id: data.id }
        });
      } catch (e) {
        console.error("Error inserting new_order notification:", e);
      }
    }

    try { await fetchData(); } catch (e) { console.error("Error refetching after order create:", e); }
    return data as any;
  }, [fetchData, cartItems]);

  // Generate or retrieve a persistent cart number for this browser session
  const getCartNumber = useCallback(() => {
    let cartNumber = localStorage.getItem("store_cart_number");
    if (!cartNumber) {
      cartNumber = `CART-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem("store_cart_number", cartNumber);
    }
    return cartNumber;
  }, []);

  // Sync cart items locally (sem salvar no banco para economizar espaço)
  const syncCartToDb = useCallback(async (items: CartItem[]) => {
    try {
      localStorage.setItem("store_cart", JSON.stringify(items));
    } catch {}
  }, []);

  // Initialize cart loading state
  useEffect(() => {
    setCartLoading(false);
  }, []);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.product.id === product.id);
      const newItems = existing
        ? prev.map(i => i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i)
        : [...prev, { product, quantity }];
      syncCartToDb(newItems);
      return newItems;
    });
    // Fire tracking event
    trackEvent("add_to_cart", {
      currency: "BRL",
      value: product.price * quantity,
      items: [{
        item_id: product.id,
        item_name: product.name,
        price: product.price,
        quantity: quantity
      }]
    });
  }, [syncCartToDb]);

  const removeFromCart = useCallback((productId: string) => {
    setCartItems(prev => {
      const newItems = prev.filter(i => i.product.id !== productId);
      syncCartToDb(newItems);
      return newItems;
    });
  }, [syncCartToDb]);

  const updateCartQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(prev => {
        const newItems = prev.filter(i => i.product.id !== productId);
        syncCartToDb(newItems);
        return newItems;
      });
      return;
    }
    setCartItems(prev => {
      const newItems = prev.map(i => i.product.id === productId ? { ...i, quantity } : i);
      syncCartToDb(newItems);
      return newItems;
    });
  }, [syncCartToDb]);

  const updateCartAction = useCallback(async (id: string, action: string) => {
    setCarts(prev => prev.map(c => c.id === id ? { ...c, last_action: action } : c));
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    syncCartToDb([]);
    clearCheckoutShipping();
    window.dispatchEvent(new Event("checkout_shipping_changed"));
  }, [syncCartToDb]);

  const cartTotal = cartItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  // Dispatch cart count to headers (they use raw HTML, can't use context)
  useEffect(() => {
    const totalQty = cartItems.reduce((sum, i) => sum + i.quantity, 0);
    localStorage.setItem('store_cart_count', String(totalQty));
    window.dispatchEvent(new Event('store_cart_changed'));
  }, [cartItems]);

  return (
    <StoreContext.Provider value={{
      storeSettings,
      products, collections, orders, customers, carts, notifications, cartItems, loading, cartLoading,
      addProduct, updateProduct, deleteProduct,
      addCollection, updateCollection, deleteCollection,
      createOrder, updateOrderFields, updateOrderStatus, deleteOrder, deleteCustomer, deleteCart, updateCartStatus,
      addToCart, removeFromCart, updateCartQuantity, clearCart, cartTotal,
      updateOrderTracking,
      updateCartAction,
      incrementProductVisits,
      addNotification,
      markNotificationAsRead,
      markAllNotificationsAsRead,
      refreshData: fetchData,
    }}>
      {children}
    </StoreContext.Provider>
  );
};
