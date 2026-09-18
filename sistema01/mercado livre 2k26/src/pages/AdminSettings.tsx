import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { formatCurrency } from "@/utils/formatters";
import { countries, type Country } from "@/contexts/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { CreditCard, Globe, Wallet, Building, CreditCard as CardIcon, Truck, Tag, User, Plus, Trash2, X, Percent, DollarSign, Package, Settings2, BarChart3, Palette, Mail, MessageSquare, Monitor, Lock, Smartphone, Plug, QrCode, Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";
import { sendZapiText, normalizeBrazilianPhone, type ZapiCredentials } from "@/utils/zapi";
import GatewaysManager from "@/components/admin/GatewaysManager";
import StaticPixManager from "@/components/admin/StaticPixManager";

const inputClass = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50";
const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";
const sectionCard = "p-4 rounded-[5px] bg-secondary/50 border border-border";

type PixMode = "api" | "account" | "none";
type TabId = "language" | "gateways" | "pix-keys" | "payment" | "shipping" | "coupons" | "tracking" | "mascara" | "communications" | "spa";

interface ShippingMethod {
  id?: string;
  name: string;
  description: string;
  price: number;
  delivery_days_min: number;
  delivery_days_max: number;
  free_shipping_min: number | null;
  status: string;
  is_free_shipping: boolean;
  current_city?: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
  delivery_days_min: number;
  delivery_days_max: number;
}

const makeShippingOptionId = () =>
  (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function")
    ? crypto.randomUUID()
    : `sm_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

interface Coupon {
  id?: string;
  code: string;
  type: "percentage" | "fixed" | "free_shipping";
  value: number;
  min_purchase: number;
  max_uses: number | null;
  used_count: number;
  free_shipping: boolean;
  expires_at: string | null;
  status: string;
}

const emptyShipping: ShippingMethod = { name: "", description: "", price: 0, delivery_days_min: 1, delivery_days_max: 5, free_shipping_min: null, status: "active", is_free_shipping: true, current_city: "" };
const emptyCoupon: Coupon = { code: "", type: "percentage", value: 0, min_purchase: 0, max_uses: null, used_count: 0, free_shipping: false, expires_at: null, status: "active" };

const AdminSettings = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const validTabs: TabId[] = ["language", "gateways", "pix-keys", "payment", "shipping", "coupons", "tracking", "mascara", "communications", "spa"];
  const [tab, setTab] = useState<TabId>(() => {
    const tabParam = new URLSearchParams(window.location.search).get("tab") as TabId;
    return (tabParam && validTabs.includes(tabParam)) ? tabParam : "language";
  });

  useEffect(() => {
    const tabParam = searchParams.get("tab") as TabId;
    if (tabParam && validTabs.includes(tabParam)) {
      setTab(tabParam);
    }
  }, [searchParams]);
  const [country, setCountry] = useState<Country>("BR");
  const [currency, setCurrency] = useState("BRL");
  const [pixMode, setPixMode] = useState<PixMode>("none");
  const [pixApiKey, setPixApiKey] = useState("");
  const [pixApiSecret, setPixApiSecret] = useState("");
  const [pixPublicKey, setPixPublicKey] = useState("");
  const [pixIronProductHash, setPixIronProductHash] = useState("");
  const [pixIronOfferHash, setPixIronOfferHash] = useState("");

  const [pixAccountKey, setPixAccountKey] = useState("");
  const [pixAccountKeyType, setPixAccountKeyType] = useState("cpf");
  const [pixAccountName, setPixAccountName] = useState("");
  const [pixAccountCity, setPixAccountCity] = useState("");
  const [pixGateway, setPixGateway] = useState("BLACK CAT");
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardRequestKey, setCardRequestKey] = useState(false);

  // Store checkout options
  const [requestLogin, setRequestLogin] = useState(false);
  const [enableAddToCart, setEnableAddToCart] = useState(true);

  // Card interest rates
  const [cardMaxInstallments, setCardMaxInstallments] = useState(12);
  const [cardMonthlyRate, setCardMonthlyRate] = useState(1.99);
  const [cardFreeInstallments, setCardFreeInstallments] = useState(3);

  // Shipping
  const [shippingForm, setShippingForm] = useState<ShippingMethod>(emptyShipping);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);

  // Coupons
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [couponModal, setCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [couponForm, setCouponForm] = useState<Coupon>(emptyCoupon);

  // Tracking
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaPixelIds, setMetaPixelIds] = useState<string[]>([""]);
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleAnalyticsIds, setGoogleAnalyticsIds] = useState<string[]>([""]);
  const [utmfyEnabled, setUtmfyEnabled] = useState(false);
  const [utmfyIds, setUtmfyIds] = useState<string[]>([""]);
  const [salesNotifEnabled, setSalesNotifEnabled] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("metarat_sales_notif_enabled") !== "false" : true;
  });
  const [salesSoundEnabled, setSalesSoundEnabled] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("metarat_sales_sound_enabled") !== "false" : true;
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
  });

  // Mascara
  const [mascaraActive, setMascaraActive] = useState(false);
  const [mascaraLogo, setMascaraLogo] = useState("");
  const [mascaraName, setMascaraName] = useState("");
  const [mascaraCnpj, setMascaraCnpj] = useState("");
  const [mascaraAddress, setMascaraAddress] = useState("");
  const [mascaraPrimaryColor, setMascaraPrimaryColor] = useState("#ffe600");
  const [mascaraSecondaryColor, setMascaraSecondaryColor] = useState("#3483fa");
  const [mascaraTextColor, setMascaraTextColor] = useState("#333333");

  // Communication (SMTP & WhatsApp)
  const [smtpHost, setSmtpHost] = useState("");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPass, setSmtpPass] = useState("");
  const [smtpFromEmail, setSmtpFromEmail] = useState("");
  const [smtpFromName, setSmtpFromName] = useState("");

  const [waEnabled, setWaEnabled] = useState(false);
  const [waZapiInstance, setWaZapiInstance] = useState("");
  const [waZapiToken, setWaZapiToken] = useState("");
  const [waZapiClientToken, setWaZapiClientToken] = useState("");
  const [waTemplatePix, setWaTemplatePix] = useState("Olá {name}, aqui está seu código PIX para pagamento: {code}");
  const [waTemplateBoleto, setWaTemplateBoleto] = useState("Olá {name}, aqui está a linha digitável do seu boleto: {code}");
  const [waTestPhone, setWaTestPhone] = useState("");
  const [testingWa, setTestingWa] = useState(false);
  
  // SPA Settings
  const [spaEnabled, setSpaEnabled] = useState(false);
  const [spaDeviceType, setSpaDeviceType] = useState<"mobile" | "desktop" | "all">("mobile");


  // Load data
  const fetchShipping = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "delivery_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setShippingForm(prev => ({
        ...prev,
        delivery_days_min: v.delivery_days_min ?? 1,
        delivery_days_max: v.delivery_days_max ?? 5,
        is_free_shipping: v.is_free_shipping ?? true,
        current_city: v.current_city ?? "",
        name: v.name ?? "",
        price: Number(v.price ?? 0),
      }));

      // Prefer methods[] array; migrate legacy single name/price if present and methods[] is empty
      const raw: any[] = Array.isArray(v.methods) ? v.methods : [];
      if (raw.length > 0) {
        setShippingOptions(raw.map((m) => ({
          id: String(m.id ?? makeShippingOptionId()),
          name: String(m.name ?? ""),
          price: Number(m.price) || 0,
          delivery_days_min: Number(m.delivery_days_min) || 1,
          delivery_days_max: Number(m.delivery_days_max) || 5,
        })));
      } else if (v.name && Number(v.price) > 0) {
        setShippingOptions([{
          id: makeShippingOptionId(),
          name: String(v.name),
          price: Number(v.price) || 0,
          delivery_days_min: Number(v.delivery_days_min) || 1,
          delivery_days_max: Number(v.delivery_days_max) || 5,
        }]);
      } else {
        setShippingOptions([]);
      }
    }
  }, []);

  const fetchCoupons = useCallback(async () => {
    const { data } = await supabase.from("coupons").select("*").order("created_at");
    if (data) setCoupons(data as any);
  }, []);

  // Load PIX settings from DB
  const fetchPixSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "pix_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setPixMode(v.mode ?? "none");
      setPixApiKey(v.api_key ?? "");
      setPixApiSecret(v.api_secret ?? "");
      setPixPublicKey(v.public_key ?? "");
      setPixIronProductHash(v.iron_product_hash ?? "");
      setPixIronOfferHash(v.iron_offer_hash ?? "");

      setPixAccountKey(v.account_key ?? "");
      setPixAccountKeyType(v.account_key_type ?? "cpf");
      setPixAccountName(v.account_name ?? "");
      setPixAccountCity(v.account_city ?? "");
      setPixGateway(v.gateway ?? "BLACK CAT");
    }
  }, []);

  // Load card settings from DB
  const fetchCardSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "card_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setCardEnabled(v.enabled ?? false);
      setCardRequestKey(v.request_key ?? false);
      setCardMaxInstallments(v.max_installments ?? 12);
      setCardMonthlyRate(v.monthly_rate ?? 1.99);
      setCardFreeInstallments(v.free_installments ?? 3);
    }
  }, []);

  const fetchStoreOptions = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "store_options").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setRequestLogin(v.request_login ?? false);
      setEnableAddToCart(v.enable_add_to_cart ?? true);
    }
  }, []);

  const fetchTrackingSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "tracking_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      const toArr = (raw: any, legacy: any): string[] => {
        const arr = Array.isArray(raw) ? raw.filter((s: any) => typeof s === "string") : (typeof raw === "string" && raw ? [raw] : []);
        if (arr.length === 0 && typeof legacy === "string" && legacy) arr.push(legacy);
        return arr.length > 0 ? arr : [""];
      };
      setMetaEnabled(v.meta_enabled ?? false);
      setMetaPixelIds(toArr(v.meta_pixel_ids, v.meta_pixel_id));
      setGoogleEnabled(v.google_enabled ?? false);
      setGoogleAnalyticsIds(toArr(v.google_analytics_ids, v.google_analytics_id));
      setUtmfyEnabled(v.utmfy_enabled ?? false);
      setUtmfyIds(toArr(v.utmfy_ids, v.utmfy_id));
      if (v.sales_notification_enabled !== undefined) {
        setSalesNotifEnabled(v.sales_notification_enabled);
        localStorage.setItem("metarat_sales_notif_enabled", String(v.sales_notification_enabled));
      }
      if (v.sales_sound_enabled !== undefined) {
        setSalesSoundEnabled(v.sales_sound_enabled);
        localStorage.setItem("metarat_sales_sound_enabled", String(v.sales_sound_enabled));
      }
    }
  }, []);

  const fetchMascaraSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "mascara_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setMascaraActive(v.active ?? false);
      setMascaraLogo(v.logo_url ?? "");
      setMascaraName(v.name ?? "");
      setMascaraCnpj(v.cnpj ?? "");
      setMascaraAddress(v.address ?? "");
      setMascaraPrimaryColor(v.primary_color ?? "#ffe600");
      setMascaraSecondaryColor(v.secondary_color ?? "#3483fa");
      setMascaraTextColor(v.text_color ?? "#333333");
    }
  }, []);

  const fetchCommunicationSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "communication_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setSmtpHost(v.smtp_host ?? "");
      setSmtpPort(v.smtp_port ?? "587");
      setSmtpUser(v.smtp_user ?? "");
      setSmtpPass(v.smtp_pass ?? "");
      setSmtpFromEmail(v.smtp_from_email ?? "");
      setSmtpFromName(v.smtp_from_name ?? "");

      setWaEnabled(v.wa_enabled ?? false);
      setWaZapiInstance(v.wa_zapi_instance ?? "");
      setWaZapiToken(v.wa_zapi_token ?? "");
      setWaZapiClientToken(v.wa_zapi_client_token ?? "");
      if (typeof v.wa_template_pix === "string" && v.wa_template_pix) setWaTemplatePix(v.wa_template_pix);
      if (typeof v.wa_template_boleto === "string" && v.wa_template_boleto) setWaTemplateBoleto(v.wa_template_boleto);
    }
  }, []);

  const fetchSpaSettings = useCallback(async () => {
    const { data } = await supabase.from("settings").select("*").eq("key", "spa_settings").maybeSingle();
    if (data?.value) {
      const v = data.value as any;
      setSpaEnabled(v.enabled ?? false);
      setSpaDeviceType("mobile"); // Force mobile only as requested
    }
  }, []);

  useEffect(() => {
    const loadI18nSettings = async () => {
      const { data } = await supabase.from("settings").select("*");
      if (data) {
        const c = data.find(s => s.key === "country")?.value as Country;
        const cr = data.find(s => s.key === "currency")?.value;
        if (c) setCountry(c);
        if (cr) setCurrency(cr);
      }
    };
    loadI18nSettings();
    fetchShipping();
    fetchCoupons();
    fetchPixSettings();
    fetchCardSettings();
    fetchStoreOptions();
    fetchTrackingSettings();
    fetchMascaraSettings();
    fetchCommunicationSettings();
    fetchSpaSettings();
  }, [fetchShipping, fetchCoupons, fetchPixSettings, fetchCardSettings, fetchStoreOptions, fetchTrackingSettings, fetchMascaraSettings, fetchCommunicationSettings, fetchSpaSettings]);

  // Save PIX settings
  const savePixSettings = async () => {
    const value: any = { mode: pixMode };
    if (pixMode === "api") {
      value.api_key = pixApiKey;
      value.api_secret = pixApiSecret;
      value.public_key = pixPublicKey;
      value.iron_product_hash = pixIronProductHash;
      value.iron_offer_hash = pixIronOfferHash;
      value.gateway = pixGateway;
    } else if (pixMode === "account") {
      value.account_key = pixAccountKey;
      value.account_key_type = pixAccountKeyType;
      value.account_name = pixAccountName;
      value.account_city = pixAccountCity;
      value.gateway = pixGateway;
    }

    const { data: existing } = await supabase.from("settings").select("id").eq("key", "pix_settings").maybeSingle();
    let errorObj = null;
    if (existing) {
      const { error } = await supabase.from("settings").update({ value: value as any }).eq("key", "pix_settings");
      errorObj = error;
    } else {
      const { error } = await supabase.from("settings").insert({ key: "pix_settings", value: value as any });
      errorObj = error;
    }

    if (errorObj) {
      console.error("Erro ao salvar PIX:", errorObj);
      throw errorObj;
    }
  };

  // Save card settings
  const saveCardSettings = async () => {
    const value = {
      enabled: cardEnabled,
      request_key: cardRequestKey,
      max_installments: cardMaxInstallments,
      monthly_rate: cardMonthlyRate,
      free_installments: cardFreeInstallments,
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "card_settings").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "card_settings");
    } else {
      await supabase.from("settings").insert({ key: "card_settings", value: value as any });
    }
  };

  // Save store options
  const saveStoreOptions = async () => {
    const value = {
      request_login: requestLogin,
      enable_add_to_cart: enableAddToCart,
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "store_options").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "store_options");
    } else {
      await supabase.from("settings").insert({ key: "store_options", value: value as any });
    }
  };

  // Generic Save Everything on Payment Tab
  const saveAllPaymentSettings = async () => {
    try {
      await savePixSettings();
      await saveCardSettings();
      await saveStoreOptions();
      toast.success("Todas as configurações da aba foram salvas!");
    } catch (err) {
      toast.error("Erro ao salvar as configurações");
    }
  };

  // Save tracking settings
  const saveTrackingSettings = async () => {
    const clean = (arr: string[]) => arr.map(s => (s || "").trim()).filter(Boolean);
    const metaIds = clean(metaPixelIds);
    const gaIds = clean(googleAnalyticsIds);
    const utmIds = clean(utmfyIds);
    const value = {
      meta_enabled: metaEnabled,
      meta_pixel_ids: metaIds,
      meta_pixel_id: metaIds[0] || "",
      google_enabled: googleEnabled,
      google_analytics_ids: gaIds,
      google_analytics_id: gaIds[0] || "",
      utmfy_enabled: utmfyEnabled,
      utmfy_ids: utmIds,
      utmfy_id: utmIds[0] || "",
      sales_notification_enabled: salesNotifEnabled,
      sales_sound_enabled: salesSoundEnabled,
    };
    localStorage.setItem("metarat_sales_notif_enabled", String(salesNotifEnabled));
    localStorage.setItem("metarat_sales_sound_enabled", String(salesSoundEnabled));
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "tracking_settings").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "tracking_settings");
    } else {
      await supabase.from("settings").insert({ key: "tracking_settings", value: value as any });
    }
    toast.success("Configurações de rastreamento salvas!");
  };

  // Save mascara settings
  const saveMascaraSettings = async () => {
    const value = {
      active: mascaraActive,
      logo_url: mascaraLogo,
      name: mascaraName,
      cnpj: mascaraCnpj,
      address: mascaraAddress,
      primary_color: mascaraPrimaryColor,
      secondary_color: mascaraSecondaryColor,
      text_color: mascaraTextColor,
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "mascara_settings").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "mascara_settings");
    } else {
      await supabase.from("settings").insert({ key: "mascara_settings", value: value as any });
    }
    toast.success("Configurações de máscara salvas!");
  };

  // Save communication settings
  const saveCommunicationSettings = async () => {
    const value = {
      smtp_host: smtpHost,
      smtp_port: smtpPort,
      smtp_user: smtpUser,
      smtp_pass: smtpPass,
      smtp_from_email: smtpFromEmail,
      smtp_from_name: smtpFromName,
      wa_enabled: waEnabled,
      wa_provider: "zapi",
      wa_zapi_instance: waZapiInstance,
      wa_zapi_token: waZapiToken,
      wa_zapi_client_token: waZapiClientToken,
      wa_template_pix: waTemplatePix,
      wa_template_boleto: waTemplateBoleto,
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "communication_settings").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "communication_settings");
    } else {
      await supabase.from("settings").insert({ key: "communication_settings", value: value as any });
    }
    toast.success("Configurações de comunicação salvas!");
  };

  const handleTestWhatsApp = async () => {
    const instance = waZapiInstance.trim();
    const token = waZapiToken.trim();
    const clientToken = waZapiClientToken.trim();
    if (!instance || !token || !clientToken) {
      toast.error("Preencha Instance ID, Instance Token e Client-Token da Z-API.");
      return;
    }
    const phone = normalizeBrazilianPhone(waTestPhone);
    if (!phone || phone.length < 12) {
      toast.error("Informe um número de teste válido (DDD + número). Ex: 11999999999");
      return;
    }
    setTestingWa(true);
    const creds: ZapiCredentials = { instance, token, clientToken };
    try {
      const result = await sendZapiText(creds, phone, "Teste de conexão via Z-API ✔");
      if (result.ok) {
        const suffix = result.messageId ? ` (id ${String(result.messageId).slice(0, 10)}…)` : "";
        toast.success(`Mensagem enviada via Z-API${suffix}. Confira no WhatsApp do número de teste.`);
      } else {
        const msg = String(result.error || "").toLowerCase();
        if (msg.includes("client-token") || msg.includes("client token")) {
          toast.error("Z-API rejeitou o Client-Token. Verifique se copiou o valor da seção Conta > Segurança no painel Z-API.");
        } else if (msg.includes("not connected") || msg.includes("disconnected")) {
          toast.error("Instância Z-API não conectada — escaneie o QR Code no painel.");
        } else {
          toast.error(`Erro Z-API: ${result.error || result.status}`);
        }
      }
    } catch (e: any) {
      toast.error(`Falha: ${e.message}`);
    } finally {
      setTestingWa(false);
    }
  };

  const saveSpaSettings = async () => {
    const value = {
      enabled: spaEnabled,
      device_type: spaDeviceType,
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "spa_settings").maybeSingle();
    if (existing) {
      await supabase.from("settings").update({ value: value as any }).eq("key", "spa_settings");
    } else {
      await supabase.from("settings").insert({ key: "spa_settings", value: value as any });
    }
    toast.success("Configurações SPA salvas!");
  };


  const getInstallmentPreview = (total: number = 100) => {
    const previews = [];
    for (let i = 1; i <= cardMaxInstallments; i++) {
      if (i <= cardFreeInstallments) {
        previews.push({ n: i, value: total / i, total, hasInterest: false });
      } else {
        const rate = cardMonthlyRate / 100;
        const totalWithInterest = total * Math.pow(1 + rate, i);
        previews.push({ n: i, value: totalWithInterest / i, total: totalWithInterest, hasInterest: true });
      }
    }
    return previews;
  };

  // Save delivery settings
  const saveShipping = async () => {
    for (let i = 0; i < shippingOptions.length; i++) {
      const m = shippingOptions[i];
      if (!(m.price > 0)) {
        toast.error(`Informe um preço maior que zero no Método ${i + 1}`);
        return;
      }
      if (m.delivery_days_min < 1 || m.delivery_days_max < m.delivery_days_min) {
        toast.error(`Prazo inválido no Método ${i + 1}`);
        return;
      }
    }
    const value = {
      delivery_days_min: shippingForm.delivery_days_min,
      delivery_days_max: shippingForm.delivery_days_max,
      is_free_shipping: shippingForm.is_free_shipping,
      current_city: shippingForm.current_city,
      methods: shippingOptions.map(m => ({
        id: m.id,
        name: m.name.trim(),
        price: Number(m.price) || 0,
        delivery_days_min: Number(m.delivery_days_min) || 1,
        delivery_days_max: Number(m.delivery_days_max) || 5,
      })),
    };
    const { data: existing } = await supabase.from("settings").select("id").eq("key", "delivery_settings").maybeSingle();
    let error;
    if (existing) {
      ({ error } = await supabase.from("settings").update({ value: value as any }).eq("key", "delivery_settings"));
    } else {
      ({ error } = await supabase.from("settings").insert({ key: "delivery_settings", value: value as any }));
    }
    if (error) {
      console.error("Error saving delivery settings:", error);
      toast.error("Erro ao salvar prazo de entrega");
      return;
    }
    toast.success("Prazo de entrega salvo!");
  };

  // Coupon CRUD
  const openNewCoupon = () => { setEditingCoupon(null); setCouponForm(emptyCoupon); setCouponModal(true); };
  const openEditCoupon = (c: Coupon) => { setEditingCoupon(c); setCouponForm({ ...c }); setCouponModal(true); };
  const saveCoupon = async () => {
    if (!couponForm.code.trim()) { toast.error("Código é obrigatório"); return; }
    if (editingCoupon?.id) {
      const { id, used_count, ...rest } = couponForm;
      await supabase.from("coupons").update(rest as any).eq("id", editingCoupon.id);
    } else {
      const { id, used_count, ...rest } = couponForm;
      await supabase.from("coupons").insert(rest as any);
    }
    setCouponModal(false);
    fetchCoupons();
    toast.success("Cupom salvo!");
  };
  const deleteCoupon = async (id: string) => {
    await supabase.from("coupons").delete().eq("id", id);
    fetchCoupons();
    toast.success("Cupom removido!");
  };


  const tabs: { id: TabId; label: string; icon: any; isSoon?: boolean }[] = [
    { id: "language", label: "Idioma e Moeda", icon: Globe },
    { id: "gateways", label: "Gateways", icon: Plug },
    { id: "pix-keys", label: "Chave Pix Estática", icon: QrCode },
    { id: "payment", label: "Cartão e Loja", icon: CreditCard },
    { id: "shipping", label: "Envio", icon: Truck },
    { id: "coupons", label: "Cupons", icon: Tag },
    { id: "mascara", label: "Máscara (White Label)", icon: Palette },
    { id: "communications", label: "Api WA", icon: MessageSquare },
    { id: "spa", label: "SPA", icon: Monitor },
  ];


  const pixOptions: { value: PixMode; label: string; description: string; icon: typeof Wallet }[] = [
    { value: "none", label: "PIX via Produto (Códigos Manuais)", description: "Usa os códigos 'Copia e Cola' configurados individualmente em cada produto.", icon: Wallet },
    { value: "api", label: "PIX via API (Gateway)", description: "Gera cobranças automaticamente via Black Cat, StreetPay ou FreePay.", icon: Wallet },
    { value: "account", label: "PIX via Conta (Dinâmico)", description: "Gera códigos dinâmicos usando sua chave PIX, nome e cidade configurados abaixo.", icon: Building },
  ];

  const tabTitles: Record<TabId, string> = {
    language: "Idioma e Moeda",
    gateways: "Gateways de Pagamento",
    "pix-keys": "Chave Pix Estática",
    payment: "Pagamento e Checkout",
    shipping: "Envio e Frete",
    coupons: "Cupons de Desconto",
    tracking: "Rastreamento e Pixels",
    mascara: "Máscara (White Label)",
    communications: "Api WhatsApp",
    spa: "Configurações SPA"
  };

  return (
    <>
      <AdminTopbar title={tabTitles[tab] || "Configurações"} />
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="glass-card p-3.5 sm:p-6">
          {/* ========== Language & Currency ========== */}
          {tab === "language" && (
            <div className="space-y-8 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                    Configurações Regionais
                  </h3>
                  <p className="text-sm text-muted-foreground">Idioma, moeda e localidade da loja.</p>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary animate-pulse">
                  <Lock className="w-3.5 h-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">Em breve</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-80 pointer-events-none select-none relative">
                {/* País da Loja */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-foreground">País da Loja</label>
                  </div>
                  <div className="relative group">
                    <div 
                      className="grid grid-cols-1 gap-2 max-h-[350px] overflow-y-auto pr-1"
                      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
                      <div className="no-scrollbar space-y-2">
                        {countries.map(c => (
                          <div key={c.code}
                            className={`flex items-center justify-between px-4 py-3 rounded-[5px] text-sm font-medium border text-left ${country === c.code ? `${gradientBtn} text-foreground border-transparent shadow-lg` : "bg-secondary/50 text-muted-foreground border-border"}`}>
                            <div className="flex items-center gap-2">
                              <span>{c.name}</span>
                            </div>
                            <span className="text-[10px] opacity-70 font-mono tracking-tighter bg-black/20 px-1.5 py-0.5 rounded cursor-default uppercase">{c.currency}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-card/40 via-transparent to-transparent pointer-events-none" />
                  </div>
                </div>

                {/* Moeda de Exibição */}
                <div className="space-y-4">
                  <label className="text-sm font-semibold text-foreground">Moeda de Exibição</label>
                  {country && (() => {
                    const selectedCountry = countries.find(c => c.code === country);
                    if (!selectedCountry) return null;
                    const localCurrency = selectedCountry.currency;
                    const localName = selectedCountry.currencyName;
                    
                    return (
                      <div className="space-y-3">
                        <div className={`flex items-center justify-between px-4 py-3 rounded-[5px] text-sm font-medium border text-left ${currency === localCurrency ? `${gradientBtn} text-foreground border-transparent shadow-lg` : "bg-secondary/50 text-muted-foreground border-border"}`}>
                          <div className="flex flex-col">
                            <span>{localName}</span>
                            <span className="text-[10px] opacity-60">Moeda Local</span>
                          </div>
                          {currency === localCurrency && <div className="w-2 h-2 rounded-full bg-foreground shadow-glow" />}
                        </div>
                        
                        <div className={`flex items-center justify-between px-4 py-3 rounded-[5px] text-sm font-medium border text-left ${currency === "USD" ? `${gradientBtn} text-foreground border-transparent shadow-lg` : "bg-secondary/50 text-muted-foreground border-border"}`}>
                          <div className="flex flex-col">
                            <span>Dólar Americano (USD)</span>
                            <span className="text-[10px] opacity-60">Moeda Global</span>
                          </div>
                          {currency === "USD" && <div className="w-2 h-2 rounded-full bg-foreground shadow-glow" />}
                        </div>

                        <div className="mt-6 p-4 rounded-[5px] bg-secondary/30 border border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
                          <Lock className="w-6 h-6 text-muted-foreground/40" />
                          <p className="text-[11px] text-muted-foreground max-w-[180px]">As alterações automáticas de idioma e moeda estão temporariamente bloqueadas.</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* ========== Gateways ========== */}
          {tab === "gateways" && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <GatewaysManager />
            </div>
          )}

          {/* ========== Static Pix Keys ========== */}
          {tab === "pix-keys" && (
            <div className="max-w-4xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              <StaticPixManager />
            </div>
          )}

          {/* ========== Payment ========== */}
          {tab === "payment" && (
            <div className="space-y-6 max-w-2xl animate-in fade-in slide-in-from-bottom-2 duration-300">
              {/* Quick links to Kronos-style managers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <button
                  type="button"
                  onClick={() => setTab("gateways")}
                  className="p-4 rounded-xl border border-sky-500/20 bg-card hover:bg-secondary/40 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <Plug className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">Gateways de Pagamento</h4>
                      <p className="text-xs text-muted-foreground">Configurar Duttyfy, Blackcat, StreetPay...</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium">Abrir →</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTab("pix-keys")}
                  className="p-4 rounded-xl border border-sky-500/20 bg-card hover:bg-secondary/40 transition-all text-left flex items-center justify-between group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:scale-105 transition-transform">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm">Chave Pix Estática</h4>
                      <p className="text-xs text-muted-foreground">Configurar Pix via Conta Dinâmico</p>
                    </div>
                  </div>
                  <span className="text-xs text-primary font-medium">Abrir →</span>
                </button>
              </div>

              {/* Card Payment */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <CardIcon className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Pagamento via Cartão</h3>
                      <p className="text-xs text-muted-foreground">Habilite o checkout com cartão de crédito (captura de dados)</p>
                    </div>
                  </div>
                  <button onClick={() => setCardEnabled(!cardEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${cardEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${cardEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {cardEnabled && (
                  <div className="space-y-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-medium text-foreground">Solicitar Chave</h4>
                        <p className="text-xs text-muted-foreground">Solicitar chave de integração do cartão</p>
                      </div>
                      <button type="button" onClick={() => setCardRequestKey(!cardRequestKey)}
                        className={`w-10 h-5 rounded-full transition-colors ${cardRequestKey ? "bg-primary" : "bg-secondary"} border border-border`}>
                        <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${cardRequestKey ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>


                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-4">Taxas de Parcelamento</h4>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Parcelas sem Juros</label>
                        <input type="number" min={1} max={12} value={cardFreeInstallments} onChange={e => setCardFreeInstallments(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Taxa Mensal (%)</label>
                        <input type="number" step={0.01} min={0} value={cardMonthlyRate} onChange={e => setCardMonthlyRate(Number(e.target.value))} className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Máximo de Parcelas</label>
                        <input type="number" min={1} max={24} value={cardMaxInstallments} onChange={e => setCardMaxInstallments(Number(e.target.value))} className={inputClass} />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-3">
                      <p className="text-xs text-muted-foreground mb-2">Simulação para {formatCurrency(100)}</p>
                      <div className="grid grid-cols-2 gap-1 text-xs max-h-40 overflow-y-auto">
                        {getInstallmentPreview(100).map(p => (
                          <div key={p.n} className={`flex justify-between px-2 py-1 rounded ${p.hasInterest ? "text-yellow-400" : "text-green-400"}`}>
                            <span>{p.n}x de {formatCurrency(p.value)}</span>
                            {p.hasInterest && <span className="text-muted-foreground">({formatCurrency(p.total)})</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Store Checkout Options */}
              <div className={sectionCard}>
                <div className="flex items-center gap-2 mb-4">
                  <Settings2 className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Opções da Loja</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Solicitar Login no Checkout</h4>
                      <p className="text-xs text-muted-foreground">Exige que o cliente faça login/cadastro para finalizar a compra.</p>
                    </div>
                    <button type="button" onClick={() => setRequestLogin(!requestLogin)}
                      className={`w-10 h-5 rounded-full transition-colors ${requestLogin ? "bg-primary" : "bg-secondary"} border border-border`}>
                      <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${requestLogin ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>


                  <div className="flex items-center justify-between p-3 rounded-[5px] bg-primary/5 border border-primary/20">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">Habilitar Carrinho</h4>
                      <p className="text-xs text-muted-foreground">Permite adicionar vários produtos ao carrinho antes do checkout.</p>
                    </div>
                    <button type="button" onClick={() => setEnableAddToCart(!enableAddToCart)}
                      className={`w-10 h-5 rounded-full transition-colors ${enableAddToCart ? "bg-primary" : "bg-secondary"} border border-border`}>
                      <div className={`w-4 h-4 rounded-full bg-foreground transition-transform ${enableAddToCart ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>

                  
                </div>
              </div>

              <div className="flex justify-start">
                <button onClick={saveAllPaymentSettings} className={`px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>Salvar todas as configurações</button>
              </div>
            </div>
          )}

          {/* ========== Shipping ========== */}
          {tab === "shipping" && (
            <div className="space-y-6 max-w-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Frete Grátis Global</h3>
                    <p className="text-xs text-muted-foreground">Quando ativo, todos os produtos da loja terão frete grátis por padrão.</p>
                  </div>
                  <button type="button" onClick={() => setShippingForm({ ...shippingForm, is_free_shipping: !shippingForm.is_free_shipping })}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${shippingForm.is_free_shipping ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${shippingForm.is_free_shipping ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
              </div>

              {shippingForm.is_free_shipping && (
                <div className="space-y-4 pt-4 border-t border-border">
                  <h3 className="text-sm font-semibold text-foreground">Prazo do Frete Grátis</h3>
                  <p className="text-xs text-muted-foreground">Intervalo de dias exibido na opção de envio grátis no checkout.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Mínimo de dias</label>
                      <input type="number" min={1} value={shippingForm.delivery_days_min} onChange={e => setShippingForm({ ...shippingForm, delivery_days_min: Number(e.target.value) })} className={inputClass} />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Máximo de dias</label>
                      <input type="number" min={1} value={shippingForm.delivery_days_max} onChange={e => setShippingForm({ ...shippingForm, delivery_days_max: Number(e.target.value) })} className={inputClass} />
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-foreground">Métodos de Envio Pago</h3>
                    <p className="text-xs text-muted-foreground">Crie uma ou mais opções de envio pago. O cliente escolhe no checkout de envio.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShippingOptions([...shippingOptions, { id: makeShippingOptionId(), name: "", price: 0, delivery_days_min: 1, delivery_days_max: 5 }])}
                    className={`flex items-center gap-2 px-3 py-2 rounded-[5px] ${gradientBtn} text-foreground text-xs font-medium hover:opacity-90 transition-all shrink-0`}
                  >
                    <Plus className="w-4 h-4" /> Adicionar
                  </button>
                </div>

                {shippingOptions.length === 0 ? (
                  <div className="text-center py-8 text-xs text-muted-foreground bg-secondary/40 rounded-[5px] border border-dashed border-border">
                    Nenhum método de envio pago cadastrado.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shippingOptions.map((m, idx) => (
                      <div key={m.id} className={`${sectionCard} space-y-3`}>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-muted-foreground">Método {idx + 1}</span>
                          <button
                            type="button"
                            onClick={() => setShippingOptions(shippingOptions.filter(x => x.id !== m.id))}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                            aria-label="Remover método"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Prazo mínimo (dias)</label>
                            <input
                              type="number" min={1}
                              value={m.delivery_days_min}
                              onChange={e => setShippingOptions(shippingOptions.map(x => x.id === m.id ? { ...x, delivery_days_min: Number(e.target.value) } : x))}
                              className={inputClass}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-xs text-muted-foreground">Prazo máximo (dias)</label>
                            <input
                              type="number" min={1}
                              value={m.delivery_days_max}
                              onChange={e => setShippingOptions(shippingOptions.map(x => x.id === m.id ? { ...x, delivery_days_max: Number(e.target.value) } : x))}
                              className={inputClass}
                            />
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs text-muted-foreground">Preço ({currency})</label>
                          <input
                            type="number" min={0} step="0.01"
                            value={m.price}
                            onChange={e => setShippingOptions(shippingOptions.map(x => x.id === m.id ? { ...x, price: Number(e.target.value) } : x))}
                            placeholder="0.00"
                            className={inputClass}
                          />
                          {m.price > 0 && (
                            <p className="text-xs text-muted-foreground">Pré-visualização: {formatCurrency(m.price)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div className="space-y-4 pt-4 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground">Localização da Loja</h3>
                <p className="text-xs text-muted-foreground">Exibido no rastreamento como ponto de origem e atual.</p>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted-foreground">Cidade de Origem</label>
                  <input type="text" value={shippingForm.current_city} onChange={e => setShippingForm({ ...shippingForm, current_city: e.target.value })} placeholder="Ex: Curitiba, PR" className={inputClass} />
                </div>
              </div>

              <button onClick={saveShipping} className={`px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>Salvar</button>
            </div>
          )}

          {/* ========== Coupons ========== */}
          {tab === "coupons" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Cupons de Desconto</h3>
                <button onClick={openNewCoupon} className={`flex items-center gap-2 px-4 py-2 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>
                  <Plus className="w-4 h-4" /> Novo cupom
                </button>
              </div>

              {coupons.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Tag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                  <p className="text-sm">Nenhum cupom cadastrado</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-muted-foreground border-b border-border">
                        <th className="p-3 font-medium">Código</th>
                        <th className="p-3 font-medium">Tipo</th>
                        <th className="p-3 font-medium">Valor</th>
                        <th className="p-3 font-medium">Uso</th>
                        <th className="p-3 font-medium">Validade</th>
                        <th className="p-3 font-medium">Status</th>
                        <th className="p-3 font-medium">Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coupons.map(c => (
                        <tr key={c.id} className="border-b border-border/50 hover:bg-secondary/30">
                          <td className="p-3 text-sm font-mono font-medium text-foreground">{c.code}</td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {c.type === "percentage" ? "Porcentagem" : c.type === "fixed" ? "Valor fixo" : "Frete grátis"}
                          </td>
                          <td className="p-3 text-sm text-foreground">
                            {c.type === "percentage" ? `${c.value}%` : c.type === "fixed" ? formatCurrency(c.value) : "—"}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {c.used_count}{c.max_uses ? `/${c.max_uses}` : ""}
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {c.expires_at ? new Date(c.expires_at).toLocaleDateString("pt-BR") : "Sem validade"}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${c.status === "active" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"}`}>
                              {c.status === "active" ? "Ativo" : "Inativo"}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <button onClick={() => openEditCoupon(c)} className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-secondary">Editar</button>
                              <button onClick={() => deleteCoupon(c.id!)} className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Coupon Modal - rendered via portal so it overlays the full page */}
              {couponModal && createPortal(
                <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <div className="glass-card w-full max-w-lg mx-4 overflow-hidden">
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-[5px] bg-primary/10 flex items-center justify-center">
                          <Tag className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-foreground">{editingCoupon?.id ? "Editar Cupom" : "Novo Cupom"}</h3>
                          <p className="text-xs text-muted-foreground">Preencha os campos abaixo</p>
                        </div>
                      </div>
                      <button onClick={() => setCouponModal(false)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-[5px] hover:bg-secondary">
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">
                      {/* Code */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Código do cupom *</label>
                        <input
                          value={couponForm.code}
                          onChange={e => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          placeholder="Ex: DESCONTO10"
                          className={`${inputClass} font-mono font-semibold tracking-widest uppercase`}
                        />
                      </div>

                      {/* Type */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Tipo de desconto</label>
                        <div className="grid grid-cols-3 gap-2">
                          {([
                            { value: "percentage", label: "Porcentagem", icon: Percent },
                            { value: "fixed", label: "Valor fixo", icon: DollarSign },
                            { value: "free_shipping", label: "Frete grátis", icon: Truck },
                          ] as const).map(opt => (
                            <button
                              key={opt.value}
                              onClick={() => setCouponForm({ ...couponForm, type: opt.value, free_shipping: opt.value === "free_shipping" })}
                              className={`flex items-center gap-1.5 justify-center px-3 py-2 rounded-[5px] text-xs font-medium border transition-all ${
                                couponForm.type === opt.value
                                  ? "border-primary bg-primary/10 text-foreground"
                                  : "border-border bg-secondary text-muted-foreground hover:border-primary/50 hover:text-foreground"
                              }`}
                            >
                              <opt.icon className="w-3 h-3" /> {opt.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Value */}
                      {couponForm.type !== "free_shipping" && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                            {couponForm.type === "percentage" ? "Porcentagem (%)" : "Valor do desconto"}
                          </label>
                          <input
                            type="number"
                            step={couponForm.type === "percentage" ? 1 : 0.01}
                            min={0}
                            max={couponForm.type === "percentage" ? 100 : undefined}
                            value={couponForm.value}
                            onChange={e => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                            className={inputClass}
                          />
                        </div>
                      )}

                      {/* Min purchase + Max uses */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Compra mínima</label>
                          <input
                            type="number" step={0.01} min={0}
                            value={couponForm.min_purchase}
                            onChange={e => setCouponForm({ ...couponForm, min_purchase: Number(e.target.value) })}
                            className={inputClass}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Limite de usos</label>
                          <input
                            type="number" min={0}
                            value={couponForm.max_uses ?? ""}
                            onChange={e => setCouponForm({ ...couponForm, max_uses: e.target.value ? Number(e.target.value) : null })}
                            placeholder="Ilimitado"
                            className={inputClass}
                          />
                        </div>
                      </div>

                      {/* Expiry */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Data de expiração</label>
                        <input
                          type="date"
                          value={couponForm.expires_at ? couponForm.expires_at.split("T")[0] : ""}
                          onChange={e => setCouponForm({ ...couponForm, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null })}
                          className={inputClass}
                        />
                      </div>

                      {/* Free shipping toggle */}
                      {couponForm.type !== "free_shipping" && (
                        <div className="flex items-center justify-between p-3 rounded-[5px] bg-secondary border border-border">
                          <div>
                            <p className="text-sm font-medium text-foreground">Incluir frete grátis</p>
                            <p className="text-xs text-muted-foreground">Aplicar frete grátis junto com o desconto</p>
                          </div>
                          <button
                            onClick={() => setCouponForm({ ...couponForm, free_shipping: !couponForm.free_shipping })}
                            className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${couponForm.free_shipping ? "bg-primary" : "bg-muted-foreground/30"}`}
                          >
                            <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow-sm ${couponForm.free_shipping ? "translate-x-4" : "translate-x-0"}`} />
                          </button>
                        </div>
                      )}

                      {/* Status */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Status</label>
                        <select
                          value={couponForm.status}
                          onChange={e => setCouponForm({ ...couponForm, status: e.target.value })}
                          className={inputClass}
                        >
                          <option value="active">Ativo</option>
                          <option value="inactive">Inativo</option>
                        </select>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="flex gap-3 px-5 py-4 border-t border-border">
                      <button
                        onClick={() => setCouponModal(false)}
                        className="flex-1 px-4 py-2 rounded-[5px] border border-border bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors"
                      >Cancelar</button>
                      <button
                        onClick={saveCoupon}
                        className={`flex-1 px-4 py-2 rounded-[5px] ${gradientBtn} text-white text-sm font-medium hover:opacity-90 transition-opacity`}
                      >Salvar cupom</button>
                    </div>
                  </div>
                </div>,
                document.body
              )}
            </div>
          )}

          {/* ========== Tracking ========== */}
          {tab === "tracking" && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-sm font-semibold text-foreground">Rastreamento e Pixels</h3>
              <p className="text-xs text-muted-foreground">Configure os pixels de rastreamento para acompanhar eventos na loja (visualização, carrinho, checkout, compra).</p>

              {/* Meta Pixel */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Pixel Meta (Facebook)</h3>
                      <p className="text-xs text-muted-foreground">Rastreie eventos no Facebook/Instagram Ads</p>
                    </div>
                  </div>
                  <button onClick={() => setMetaEnabled(!metaEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${metaEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${metaEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {metaEnabled && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">Pixel IDs (adicione quantos quiser)</label>
                      {metaPixelIds.map((id, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={id}
                            onChange={e => setMetaPixelIds(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                            placeholder="Ex: 123456789012345"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => setMetaPixelIds(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""])}
                            className="px-3 rounded-[5px] border border-border bg-secondary/50 hover:bg-destructive/20 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-all"
                            aria-label="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setMetaPixelIds(prev => [...prev, ""])}
                        className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar outro Pixel
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Eventos rastreados: PageView, ViewContent, AddToCart, InitiateCheckout, Purchase</p>
                  </div>
                )}
              </div>

              {/* Google Analytics */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Google Analytics</h3>
                      <p className="text-xs text-muted-foreground">Rastreie eventos com Google Analytics 4</p>
                    </div>
                  </div>
                  <button onClick={() => setGoogleEnabled(!googleEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${googleEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${googleEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {googleEnabled && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">IDs de Medição (GA4)</label>
                      {googleAnalyticsIds.map((id, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={id}
                            onChange={e => setGoogleAnalyticsIds(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                            placeholder="Ex: G-XXXXXXXXXX"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => setGoogleAnalyticsIds(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""])}
                            className="px-3 rounded-[5px] border border-border bg-secondary/50 hover:bg-destructive/20 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-all"
                            aria-label="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setGoogleAnalyticsIds(prev => [...prev, ""])}
                        className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar outro ID
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Eventos rastreados: page_view, view_item, add_to_cart, begin_checkout, purchase</p>
                  </div>
                )}
              </div>

              {/* UTMfy */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">UTMfy</h3>
                      <p className="text-xs text-muted-foreground">Rastreamento de UTM e conversões</p>
                    </div>
                  </div>
                  <button onClick={() => setUtmfyEnabled(!utmfyEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${utmfyEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${utmfyEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>
                {utmfyEnabled && (
                  <div className="space-y-3 pt-3 border-t border-border">
                    <div className="space-y-2">
                      <label className="text-xs text-muted-foreground">UTMfy IDs (adicione quantos quiser)</label>
                      {utmfyIds.map((id, idx) => (
                        <div key={idx} className="flex gap-2">
                          <input
                            type="text"
                            value={id}
                            onChange={e => setUtmfyIds(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                            placeholder="Ex: utm_abc123"
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() => setUtmfyIds(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [""])}
                            className="px-3 rounded-[5px] border border-border bg-secondary/50 hover:bg-destructive/20 hover:border-destructive/40 text-muted-foreground hover:text-destructive transition-all"
                            aria-label="Remover"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setUtmfyIds(prev => [...prev, ""])}
                        className="flex items-center gap-1.5 text-xs text-primary hover:opacity-80"
                      >
                        <Plus className="w-3.5 h-3.5" /> Adicionar outro ID
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Notificações de Venda em Tempo Real (Desktop & Som) */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Bell className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Notificações de Vendas (Desktop & Som)</h3>
                      <p className="text-xs text-muted-foreground">Alertas na tela do computador e som de confirmação quando um pedido for pago</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const next = !salesNotifEnabled;
                      setSalesNotifEnabled(next);
                      localStorage.setItem("metarat_sales_notif_enabled", String(next));
                      if (next && typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                        const perm = await Notification.requestPermission();
                        setNotifPermission(perm);
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${salesNotifEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${salesNotifEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {salesNotifEnabled && (
                  <div className="space-y-4 pt-3 border-t border-border">
                    {/* Som toggle */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {salesSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                        <div>
                          <p className="text-xs font-medium text-foreground">Som da Caixa Registradora (Ka-ching)</p>
                          <p className="text-[11px] text-muted-foreground">Toca efeito sonoro de dinheiro ao confirmar pagamento</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const next = !salesSoundEnabled;
                          setSalesSoundEnabled(next);
                          localStorage.setItem("metarat_sales_sound_enabled", String(next));
                        }}
                        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${salesSoundEnabled ? "bg-emerald-500" : "bg-muted-foreground/30"}`}
                      >
                        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-foreground transition-transform ${salesSoundEnabled ? "translate-x-4" : "translate-x-0"}`} />
                      </button>
                    </div>

                    {/* Status de Permissão Desktop */}
                    <div className="flex items-center justify-between p-2.5 rounded-[5px] bg-secondary/40 border border-border">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Status no Windows: </span>
                        <span className={`font-semibold ${notifPermission === "granted" ? "text-emerald-400" : notifPermission === "denied" ? "text-destructive" : "text-amber-400"}`}>
                          {notifPermission === "granted" ? "Autorizado para notificações" : notifPermission === "denied" ? "Bloqueado pelo navegador" : "Pendente de autorização"}
                        </span>
                      </div>
                      {notifPermission !== "granted" && (
                        <button
                          type="button"
                          onClick={async () => {
                            if (typeof window !== "undefined" && "Notification" in window) {
                              const p = await Notification.requestPermission();
                              setNotifPermission(p);
                              if (p === "granted") toast.success("Notificações do navegador autorizadas!");
                              else toast.error("Permissão negada no navegador.");
                            }
                          }}
                          className="px-2.5 py-1 text-xs font-medium rounded bg-primary/20 text-primary hover:bg-primary/30 transition-colors"
                        >
                          Autorizar no Windows
                        </button>
                      )}
                    </div>

                    {/* Botão de Teste */}
                    <div className="pt-1">
                      <button
                        type="button"
                        onClick={async () => {
                          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
                            const p = await Notification.requestPermission();
                            setNotifPermission(p);
                          }

                          const testId = "ORD-" + Date.now().toString().slice(-12) + "-" + Math.random().toString(36).substring(2, 6).toUpperCase();
                          const now = new Date();
                          const timeStr = now.toLocaleDateString("pt-BR") + ", " + now.toLocaleTimeString("pt-BR");

                          // Dispatch global event for in-app floating banner
                          if (typeof window !== "undefined") {
                            window.dispatchEvent(new CustomEvent("metarat:sale_notification", {
                              detail: {
                                id: testId,
                                order_number: testId,
                                total: 197.00,
                                customer_name: "Cliente Teste",
                                created_at: now.toISOString(),
                                isTest: true,
                              }
                            }));
                          }

                          if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
                            try {
                              new Notification("Venda realizada", {
                                body: `Pedido ${testId} pago com sucesso\n${timeStr}`,
                                icon: "/favicon.png",
                              });
                            } catch {}
                          }
                        }}
                        id="btn-test-sales-notification"
                        className="w-full py-2 px-3 rounded-[5px] border border-border bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-all"
                      >
                        <Volume2 className="w-3.5 h-3.5 text-primary" />
                        Testar Notificação e Som Agora
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={saveTrackingSettings} className={`px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>Salvar Rastreamento</button>
            </div>
          )}

          {/* ========== Mascara ========== */}
          {tab === "mascara" && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-sm font-semibold text-foreground">Máscara (White Label)</h3>
              <p className="text-xs text-muted-foreground">Configure uma identidade visual personalizada. Quando ativa, os dados abaixo substituirão a logo, nome, CNPJ e endereço no site.</p>

              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Palette className="w-4 h-4 text-primary" />
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Ativar Máscara</h3>
                      <p className="text-xs text-muted-foreground">Quando ativa, os dados da máscara serão exibidos no site</p>
                    </div>
                  </div>
                  <button onClick={() => setMascaraActive(!mascaraActive)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${mascaraActive ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${mascaraActive ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                <div className="space-y-4 pt-3 border-t border-border">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">URL da Logo Personalizada</label>
                    <input type="text" value={mascaraLogo} onChange={e => setMascaraLogo(e.target.value)} placeholder="https://exemplo.com/logo.png" className={inputClass} />
                    {mascaraLogo && (
                      <div className="mt-2 p-3 bg-secondary rounded-[5px] flex items-center justify-center">
                        <img src={mascaraLogo} alt="Preview logo" className="max-h-16 object-contain" />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Nome da Loja</label>
                    <input type="text" value={mascaraName} onChange={e => setMascaraName(e.target.value)} placeholder="Nome fantasia da empresa" className={inputClass} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">CNPJ</label>
                    <input type="text" value={mascaraCnpj} onChange={e => setMascaraCnpj(e.target.value)} placeholder="00.000.000/0001-00" className={inputClass} />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Endereço da Loja</label>
                    <input type="text" value={mascaraAddress} onChange={e => setMascaraAddress(e.target.value)} placeholder="Rua, número, bairro, cidade/UF - CEP" className={inputClass} />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Cor Primária</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={mascaraPrimaryColor} onChange={e => setMascaraPrimaryColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                        <input type="text" value={mascaraPrimaryColor} onChange={e => setMascaraPrimaryColor(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Cor Secundária</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={mascaraSecondaryColor} onChange={e => setMascaraSecondaryColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                        <input type="text" value={mascaraSecondaryColor} onChange={e => setMascaraSecondaryColor(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Cor do Texto</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={mascaraTextColor} onChange={e => setMascaraTextColor(e.target.value)} className="w-10 h-10 rounded border border-border cursor-pointer" />
                        <input type="text" value={mascaraTextColor} onChange={e => setMascaraTextColor(e.target.value)} className={inputClass} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <button onClick={saveMascaraSettings} className={`px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>Salvar Máscara</button>
            </div>
          )}

          {/* ========== Communications ========== */}
          {tab === "communications" && (
            <div className="space-y-6 max-w-lg">
              <h3 className="text-sm font-semibold text-foreground">Api WA</h3>
              <p className="text-xs text-muted-foreground">Integração com o WhatsApp via <b>Z-API</b> para envio de PIX e boleto automaticamente ao cliente.</p>

              {/* Z-API Configuration */}
              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    <h3 className="text-sm font-semibold text-foreground">Z-API (WhatsApp Business)</h3>
                    {waEnabled && (
                      <div className="flex items-center gap-1.5 ml-2">
                        <div className={`w-2 h-2 rounded-full ${waZapiInstance && waZapiToken && waZapiClientToken ? "bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-yellow-500"}`} />
                        <span className={`text-[10px] uppercase font-bold ${waZapiInstance && waZapiToken && waZapiClientToken ? "text-green-500" : "text-yellow-500"}`}>
                          {waZapiInstance && waZapiToken && waZapiClientToken ? "Configurado" : "Aguardando Dados"}
                        </span>
                      </div>
                    )}
                  </div>
                  <button onClick={() => setWaEnabled(!waEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${waEnabled ? "bg-primary" : "bg-muted-foreground/30"}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform ${waEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {waEnabled && (
                  <div className="space-y-4 pt-3 border-t border-border">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Instance ID</label>
                        <input type="text" value={waZapiInstance} onChange={e => setWaZapiInstance(e.target.value.trim())} placeholder="Ex: 3D4A7B..." className={inputClass} />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-muted-foreground">Instance Token</label>
                        <input type="password" value={waZapiToken} onChange={e => setWaZapiToken(e.target.value.trim())} placeholder="Token da instância..." className={inputClass} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Client-Token <span className="text-[10px] text-muted-foreground/70">(Token de Conta — diferente do Instance Token)</span></label>
                      <input type="password" value={waZapiClientToken} onChange={e => setWaZapiClientToken(e.target.value)} placeholder="Cole o Client-Token da conta Z-API..." className={inputClass} />
                      <p className="text-[10px] text-muted-foreground">Enviado no header <code>Client-Token</code> em cada requisição. Encontre em <b className="text-foreground">Conta &gt; Segurança &gt; Token de Segurança da Conta</b> no painel Z-API (NÃO é o token da instância).</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Mensagem PIX</label>
                      <textarea
                        rows={3}
                        value={waTemplatePix}
                        onChange={e => setWaTemplatePix(e.target.value)}
                        placeholder="Use {name} e {code} como variáveis"
                        className={`${inputClass} resize-none`}
                      />
                      <p className="text-[10px] text-muted-foreground">Variáveis: <code>{"{name}"}</code> nome do cliente, <code>{"{code}"}</code> copia-e-cola do PIX, <code>{"{amount}"}</code> valor.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Mensagem Boleto</label>
                      <textarea
                        rows={3}
                        value={waTemplateBoleto}
                        onChange={e => setWaTemplateBoleto(e.target.value)}
                        placeholder="Use {name} e {code} como variáveis"
                        className={`${inputClass} resize-none`}
                      />
                      <p className="text-[10px] text-muted-foreground">Variáveis: <code>{"{name}"}</code>, <code>{"{code}"}</code> linha digitável, <code>{"{amount}"}</code>.</p>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs text-muted-foreground">Telefone para teste</label>
                      <input
                        type="tel"
                        value={waTestPhone}
                        onChange={e => setWaTestPhone(e.target.value)}
                        placeholder="Ex: 11999999999"
                        className={inputClass}
                      />
                      <p className="text-[10px] text-muted-foreground">Usado apenas pelo botão "Testar Conexão". DDD + número (com ou sem o 55 na frente).</p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleTestWhatsApp}
                        disabled={testingWa || !waZapiInstance || !waZapiToken || !waZapiClientToken}
                        className="flex-1 px-4 py-2 rounded-[5px] bg-secondary border border-border text-xs font-medium hover:bg-secondary/80 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                      >
                        {testingWa ? "Enviando..." : (
                          <>
                            <Monitor className="w-3.5 h-3.5" />
                            Testar Conexão (Z-API)
                          </>
                        )}
                      </button>
                      <button
                        onClick={saveCommunicationSettings}
                        className={`flex-1 px-4 py-2 rounded-[5px] ${gradientBtn} text-xs font-bold transition-all shadow-lg shadow-primary/10`}
                      >
                        Salvar Integração
                      </button>
                    </div>

                    <div className="p-3 rounded-[5px] bg-blue-500/5 border border-blue-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-blue-400">
                        <Settings2 className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Como configurar</span>
                      </div>
                      <ul className="space-y-1.5 list-disc list-inside text-[11px] text-muted-foreground leading-relaxed">
                        <li>Crie sua conta em <b className="text-foreground">app.z-api.io</b> e gere uma <b className="text-foreground">instância</b>.</li>
                        <li>Conecte o WhatsApp escaneando o QR Code dentro do painel da instância.</li>
                        <li>Copie o <b className="text-foreground">Instance ID</b> e o <b className="text-foreground">Instance Token</b> da instância.</li>
                        <li>Em <b className="text-foreground">Conta &gt; Segurança</b>, copie o <b className="text-foreground">Client-Token</b> da conta.</li>
                        <li>Cole os três valores acima, ative o toggle e salve.</li>
                      </ul>
                    </div>

                    <div className="p-3 rounded-[5px] bg-purple-500/5 border border-purple-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-purple-400">
                        <Lock className="w-3.5 h-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Endpoint utilizado</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-mono break-all">
                        POST https://api.z-api.io/instances/&#123;instance&#125;/token/&#123;token&#125;/send-text<br />
                        Header: Client-Token: &#123;client_token&#125;
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <button onClick={saveCommunicationSettings} className={`px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>
                Salvar Api WA
              </button>
            </div>
          )}

          {/* ========== SPA ========== */}
          {tab === "spa" && (
            <div className="space-y-6 max-w-lg animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-1">Single Page Application (SPA)</h3>
                <p className="text-sm text-muted-foreground">Converta sua loja em uma experiência de aplicativo fluido com carregamento instantâneo e modo tela cheia.</p>
              </div>

              <div className={sectionCard}>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-[5px] bg-primary/10 text-primary">
                      <Monitor className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Ativar Experiência SPA</h4>
                      <p className="text-xs text-muted-foreground">Exibe o convite para "Continuar via Aplicativo" ao carregar a loja.</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSpaEnabled(!spaEnabled)}
                    className={`relative w-11 h-6 rounded-full transition-all duration-200 shrink-0 ${spaEnabled ? "bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]" : "bg-muted-foreground/30"}`}
                  >
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-foreground transition-transform duration-200 ${spaEnabled ? "translate-x-5" : "translate-x-0"}`} />
                  </button>
                </div>

                {spaEnabled && (
                  <div className="space-y-6 pt-6 border-t border-border/50 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="space-y-3">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Disponibilidade</label>
                      <div className="p-3 rounded-[5px] border border-primary bg-primary/5 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Smartphone className="w-4 h-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">Apenas Mobile</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground mt-1">A experiência SPA é otimizada e exclusiva para dispositivos móveis para simular um aplicativo real.</p>
                      </div>
                    </div>

                    <div className="p-4 rounded-[5px] bg-primary/5 border border-primary/10 border-dashed">
                      <h5 className="text-xs font-bold text-primary uppercase mb-2">Resumo da Experiência</h5>
                      <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc list-inside">
                        <li>Solicita "Continuar pelo aplicativo" via popup flutuante</li>
                        <li>Ativa Modo Tela Cheia (100% do dispositivo)</li>
                        <li>Branding instantâneo com cores configuradas (#ffe600)</li>
                        <li>Simulação de carregamento de app nativo</li>
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-start pt-2">
                <button 
                  onClick={saveSpaSettings} 
                  className={`px-8 py-3 rounded-[5px] ${gradientBtn} text-foreground text-sm font-bold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg`}
                >
                  Salvar Configurações SPA
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
};

export default AdminSettings;
