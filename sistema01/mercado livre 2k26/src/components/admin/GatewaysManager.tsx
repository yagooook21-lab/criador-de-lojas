import React, { useState, useEffect } from "react";
import { 
  Plug, Plus, Check, Trash2, Edit3, AlertCircle, 
  Key, ShieldCheck, ExternalLink, Power, Eye, EyeOff, Loader2 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface GatewayField {
  key: string;
  label: string;
  placeholder?: string;
  type: "text" | "password" | "select";
  optional?: boolean;
  hidden?: boolean;
  options?: { value: string; label: string }[];
}

export interface GatewayProvider {
  id: string;
  name: string;
  description: string;
  logoText?: string;
  fields: GatewayField[];
}

export const KRONOS_GATEWAY_PROVIDERS: GatewayProvider[] = [
  {
    id: "duttyfy",
    name: "Duttyfy",
    description: "Receba via Pix com a Duttyfy usando a URL criptografada do painel.",
    fields: [
      { key: "url_encrypted", label: "URL criptografada", placeholder: "https://www.pagamentos-seguros.app/api-pix/...", type: "password" }
    ]
  },
  {
    id: "blackcat",
    name: "Blackcat",
    description: "Receba pagamentos via Pix com a API da Blackcat.",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "API Key do painel Blackcat", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.blackcatoficial.com/api)", placeholder: "https://api.blackcatoficial.com/api", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header x-webhook-secret)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "streetpays",
    name: "StreetPay",
    description: "Receba pagamentos via Pix com a API da StreetPay (Bearer token).",
    fields: [
      { key: "api_key", label: "Chave de API", placeholder: "Cole aqui a chave da StreetPay", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.streetpays.com.br/v1)", placeholder: "https://api.streetpays.com.br/v1", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header X-Signature)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "freepay",
    name: "FreePay Brasil",
    description: "Receba pagamentos via Pix com a API da FreePay Brasil.",
    fields: [
      { key: "public_key", label: "Public Key", placeholder: "public key da página Credenciais API", type: "password" },
      { key: "secret_key", label: "Secret Key", placeholder: "secret key da página Credenciais API", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.freepaybrasil.com)", placeholder: "https://api.freepaybrasil.com", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header x-webhook-secret)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "otimize",
    name: "Otimize Pagamentos",
    description: "Receba pagamentos via Pix com a API da Otimize. A chave secreta fica no painel da Otimize em Configurações → Credenciais de API.",
    fields: [
      { key: "api_token", label: "Chave secreta da API", placeholder: "Configurações → Credenciais de API (painel Otimize)", type: "password" }
    ]
  },
  {
    id: "payevo",
    name: "PayEvo",
    description: "Receba pagamentos via Pix com a API da PayEvo.",
    fields: [
      { key: "api_key", label: "Secret Key", placeholder: "sk_live_...", type: "password" }
    ]
  },
  {
    id: "ironpay",
    name: "IronPay",
    description: "Receba pagamentos via Pix com a API da IronPay.",
    fields: [
      { key: "api_key", label: "API Token", placeholder: "ZqbA26...", type: "password" }
    ]
  },
  {
    id: "primecash",
    name: "PrimeCash",
    description: "Receba pagamentos exclusivamente via Pix com a API PrimeCash v2.2.3 (Basic Auth com Public Key e Secret Key).",
    fields: [
      { key: "public_key", label: "Public Key", placeholder: "pk_live_...", type: "password" },
      { key: "secret_key", label: "Secret Key", placeholder: "sk_live_...", type: "password" }
    ]
  },
  {
    id: "centurionpay",
    name: "Centurion Pay",
    description: "Receba pagamentos via Pix com a API da Centurion Pay (x-api-key).",
    fields: [
      { key: "api_token", label: "API Token", placeholder: "Cole aqui o API Token da Centurion Pay", type: "password" },
      { key: "environment", label: "Ambiente (production ou sandbox)", placeholder: "production", type: "text", optional: true },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api-gateway.centurionpaybr.com)", placeholder: "https://api-gateway.centurionpaybr.com", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header x-webhook-secret)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "axxonpay",
    name: "AxxonPay",
    description: "Receba pagamentos via Pix com a API da AxxonPay (Public Key + Secret Key).",
    fields: [
      { key: "public_key", label: "Public Key", placeholder: "chave pública da AxxonPay", type: "password" },
      { key: "secret_key", label: "Secret Key", placeholder: "chave secreta da AxxonPay", type: "password" }
    ]
  },
  {
    id: "medusa",
    name: "Medusa Payments",
    description: "Receba pagamentos via Pix com a API da Medusa Payments (Bearer mk_live_).",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "mk_live_...", type: "password" },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header X-Medusa-Signature)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "medusapay",
    name: "Medusa Pay",
    description: "Receba pagamentos via Pix com a API da Medusa Pay (Bearer mk_live_).",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "mk_live_...", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.medusapayoficial.pro/api/v1/api)", placeholder: "https://api.medusapayoficial.pro/api/v1/api", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header X-Medusa-Signature)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "pinpay",
    name: "PinPay",
    description: "Receba pagamentos via Pix com a API da PinPay (Bearer sk_).",
    fields: [
      { key: "api_key", label: "Chave secreta (sk_)", placeholder: "sk_...", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.usepinpay.com/functions/v1/api-v1)", placeholder: "https://api.usepinpay.com/functions/v1/api-v1", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header X-Webhook-Signature)", placeholder: "whsec_...", type: "password", optional: true }
    ]
  },
  {
    id: "wappi",
    name: "Wappi Brasil",
    description: "Receba pagamentos via Pix com a API da Wappi Brasil.",
    fields: [
      { key: "api_key", label: "Chave de API (live_)", placeholder: "live_...", type: "password" },
      { key: "public_key", label: "Public Key", placeholder: "public key da sua conta", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.wappibrasil.com.br)", placeholder: "https://api.wappibrasil.com.br", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header x-webhook-signature)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  },
  {
    id: "eaglepay",
    name: "EaglePay",
    description: "Receba pagamentos via Pix com a API da EaglePay.",
    fields: [
      { key: "client_id", label: "Client ID", placeholder: "X-Client-Id (Painel → Integrações → API e Webhooks)", type: "password" },
      { key: "public_key", label: "Public Key", placeholder: "X-Public-Key (Painel → Integrações → API e Webhooks)", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.eaglepagamentos.com.br)", placeholder: "https://api.eaglepagamentos.com.br", type: "text", optional: true }
    ]
  },
  {
    id: "quantumpay",
    name: "Quantum Pay",
    description: "Receba pagamentos via Pix com a API da Quantum Pay.",
    fields: [
      { key: "api_key", label: "API Key", placeholder: "API Key do dashboard Quantum Pay", type: "password" },
      { key: "api_secret", label: "API Secret", placeholder: "API Secret do dashboard Quantum Pay", type: "password" },
      { key: "base_url", label: "Base URL (opcional — padrão: https://api.quantumpay.com.br)", placeholder: "https://api.quantumpay.com.br", type: "text", optional: true },
      { key: "webhook_secret", label: "Webhook Secret (opcional — valida o header X-Signature)", placeholder: "deixe em branco se não usar", type: "password", optional: true }
    ]
  }
];

export interface SavedGateway {
  id: string;
  provider_id: string;
  provider_name: string;
  active: boolean;
  credentials: Record<string, string>;
  created_at?: string;
  updated_at?: string;
}

export const GatewaysManager: React.FC = () => {
  const [gateways, setGateways] = useState<SavedGateway[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGateway, setEditingGateway] = useState<SavedGateway | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<string>("duttyfy");
  const [providerName, setProviderName] = useState<string>("");
  const [credentials, setCredentials] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

  // Sync active gateway into pix_settings for immediate compatibility
  const syncToPixSettings = async (activeGw: SavedGateway | null) => {
    try {
      if (!activeGw) {
        await supabase.from("settings").update({
          value: { mode: "none", gateway: "" } as any
        }).eq("key", "pix_settings");
        return;
      }

      const prov = activeGw.provider_id.toUpperCase();
      const creds = activeGw.credentials || {};

      let normalizedGatewayName = prov;
      if (prov === "DUTTYFY") normalizedGatewayName = "DUTTYFY";
      else if (prov === "BLACKCAT") normalizedGatewayName = "BLACK CAT";
      else if (prov === "STREETPAYS") normalizedGatewayName = "STREETPAY";
      else if (prov === "FREEPAY") normalizedGatewayName = "FREEPAY";
      else if (prov === "PAYEVO") normalizedGatewayName = "PAYEVO";
      else if (prov === "IRONPAY") normalizedGatewayName = "IRONPAY";
      else if (prov === "OTIMIZE") normalizedGatewayName = "OTIMIZE";

      const payload = {
        mode: "api",
        gateway: normalizedGatewayName,
        api_key: creds.api_key || creds.api_token || creds.url_encrypted || creds.secret_key || "",
        api_secret: creds.api_secret || creds.secret_key || "",
        public_key: creds.public_key || creds.client_id || "",
        url_encrypted: creds.url_encrypted || "",
        credentials: creds,
        provider_id: activeGw.provider_id
      };

      const { data: existing } = await supabase.from("settings").select("id").eq("key", "pix_settings").maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value: payload as any }).eq("key", "pix_settings");
      } else {
        await supabase.from("settings").insert({ key: "pix_settings", value: payload as any });
      }
    } catch (e) {
      console.warn("Error syncing active gateway to pix_settings:", e);
    }
  };

  // Load gateways from settings
  const fetchGateways = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("settings").select("*").eq("key", "payment_gateways").maybeSingle();
      let list: SavedGateway[] = [];
      if (data?.value && Array.isArray(data.value)) {
        list = data.value;
      } else if (data?.value && typeof data.value === "object") {
        list = Object.values(data.value);
      } else {
        // Migration: check if pix_settings already has an active gateway saved
        const { data: pixSet } = await supabase.from("settings").select("*").eq("key", "pix_settings").maybeSingle();
        if (pixSet?.value && (pixSet.value as any).mode === "api" && (pixSet.value as any).gateway) {
          const gwVal = pixSet.value as any;
          const matchedProv = KRONOS_GATEWAY_PROVIDERS.find(p => 
            p.name.toLowerCase() === gwVal.gateway?.toLowerCase() ||
            p.id.toLowerCase() === gwVal.gateway?.toLowerCase().replace(/\s+/g, "")
          ) || KRONOS_GATEWAY_PROVIDERS[0];

          const initialGw: SavedGateway = {
            id: `gw_${Date.now()}`,
            provider_id: matchedProv.id,
            provider_name: gwVal.gateway || matchedProv.name,
            active: true,
            credentials: {
              api_key: gwVal.api_key || "",
              api_secret: gwVal.api_secret || "",
              public_key: gwVal.public_key || "",
              url_encrypted: gwVal.api_key || ""
            },
            created_at: new Date().toISOString()
          };
          list = [initialGw];
          await supabase.from("settings").upsert({ key: "payment_gateways", value: list as any }, { onConflict: "key" });
        }
      }
      setGateways(list);
    } catch (err: any) {
      console.error("Failed to load payment gateways:", err);
      toast.error("Erro ao carregar gateways.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGateways();
  }, []);

  const saveGatewaysList = async (newList: SavedGateway[]) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("settings").select("id").eq("key", "payment_gateways").maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value: newList as any }).eq("key", "payment_gateways");
      } else {
        await supabase.from("settings").insert({ key: "payment_gateways", value: newList as any });
      }

      setGateways(newList);

      // Sync active gateway with pix_settings
      const activeOne = newList.find(g => g.active) || null;
      await syncToPixSettings(activeOne);

      return true;
    } catch (err: any) {
      console.error("Erro ao salvar lista de gateways:", err);
      toast.error("Falha ao salvar gateway.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingGateway(null);
    setSelectedProviderId("duttyfy");
    setProviderName("Duttyfy");
    const prov = KRONOS_GATEWAY_PROVIDERS.find(p => p.id === "duttyfy");
    const initCreds: Record<string, string> = {};
    prov?.fields.forEach(f => { initCreds[f.key] = ""; });
    setCredentials(initCreds);
    setShowPasswords({});
    setIsModalOpen(true);
  };

  const handleOpenEdit = (gw: SavedGateway) => {
    setEditingGateway(gw);
    setSelectedProviderId(gw.provider_id);
    setProviderName(gw.provider_name);
    setCredentials({ ...(gw.credentials || {}) });
    setShowPasswords({});
    setIsModalOpen(true);
  };

  const handleProviderChange = (newProviderId: string) => {
    setSelectedProviderId(newProviderId);
    const prov = KRONOS_GATEWAY_PROVIDERS.find(p => p.id === newProviderId);
    if (prov) {
      if (!editingGateway || providerName === editingGateway.provider_name) {
        setProviderName(prov.name);
      }
      const newCreds: Record<string, string> = {};
      prov.fields.forEach(f => {
        newCreds[f.key] = credentials[f.key] || "";
      });
      setCredentials(newCreds);
    }
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = providerName.trim();
    if (!nameTrimmed) {
      toast.error("Dê um nome de identificação para o gateway.");
      return;
    }

    const currentProvider = KRONOS_GATEWAY_PROVIDERS.find(p => p.id === selectedProviderId);
    if (currentProvider) {
      for (const field of currentProvider.fields) {
        if (!field.optional && !credentials[field.key]?.trim()) {
          toast.error(`Preencha o campo: ${field.label}`);
          return;
        }
      }
    }

    let updatedList: SavedGateway[];
    if (editingGateway) {
      updatedList = gateways.map(g => {
        if (g.id === editingGateway.id) {
          return {
            ...g,
            provider_id: selectedProviderId,
            provider_name: nameTrimmed,
            credentials: { ...credentials },
            updated_at: new Date().toISOString()
          };
        }
        return g;
      });
      toast.success(`${nameTrimmed} atualizado com sucesso!`);
    } else {
      const newGw: SavedGateway = {
        id: `gw_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        provider_id: selectedProviderId,
        provider_name: nameTrimmed,
        active: gateways.length === 0, // Auto-activate if it's the first gateway
        credentials: { ...credentials },
        created_at: new Date().toISOString()
      };
      updatedList = [...gateways, newGw];
      toast.success(`${nameTrimmed} cadastrado e salvo!`);
    }

    const ok = await saveGatewaysList(updatedList);
    if (ok) {
      setIsModalOpen(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const updatedList = gateways.map(g => {
      if (g.id === id) {
        return { ...g, active: !currentActive };
      }
      // If we are activating this gateway, deactivate the others so only one is active at a time
      if (!currentActive) {
        return { ...g, active: false };
      }
      return g;
    });

    const activeItem = updatedList.find(g => g.id === id);
    if (activeItem?.active) {
      toast.success(`Gateway ${activeItem.provider_name} ativado.`);
    } else {
      toast.info(`Gateway desativado.`);
    }

    await saveGatewaysList(updatedList);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover o gateway "${name}"?`)) return;
    const updatedList = gateways.filter(g => g.id !== id);
    toast.success(`Gateway ${name} removido.`);
    await saveGatewaysList(updatedList);
  };

  const currentProviderDef = KRONOS_GATEWAY_PROVIDERS.find(p => p.id === selectedProviderId) || KRONOS_GATEWAY_PROVIDERS[0];

  return (
    <div className="space-y-6">
      {/* Header section matching Kronos Technology */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <Plug className="h-5 w-5 text-primary" />
            Gateways cadastrados
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            O gateway ativo é quem recebe e sincroniza os pagamentos via Pix no momento.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar gateway
        </button>
      </div>

      {/* List of registered gateways ONLY */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Carregando gateways cadastrados...
        </div>
      ) : gateways.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Plug className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Nenhum gateway cadastrado ainda</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Clique em "Adicionar gateway" para cadastrar seu gateway de pagamento (Duttyfy, Blackcat, StreetPay, FreePay, etc.).
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar primeiro gateway
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {gateways.map(gw => {
            const provDef = KRONOS_GATEWAY_PROVIDERS.find(p => p.id === gw.provider_id);
            const isGatewayActive = gw.active;

            return (
              <div 
                key={gw.id}
                className={`relative rounded-xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isGatewayActive 
                    ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_0_15px_rgba(16,185,129,0.08)]" 
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border font-bold text-sm ${
                    isGatewayActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-secondary text-muted-foreground border-border"
                  }`}>
                    {provDef?.name.substring(0, 2).toUpperCase() || "GW"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-semibold text-foreground text-base leading-tight">
                        {gw.provider_name}
                      </h4>
                      {isGatewayActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          Ativo
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                          Inativo
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5">
                      <span>Provedor:</span>
                      <strong className="text-foreground font-medium">{provDef?.name || gw.provider_id}</strong>
                      {provDef?.description && (
                        <span className="hidden md:inline text-muted-foreground/70">• {provDef.description}</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Active Toggle Switch */}
                  <div className="flex items-center gap-2 pr-2 border-r border-border">
                    <span className="text-xs text-muted-foreground font-medium hidden xs:inline">
                      {isGatewayActive ? "Ativado" : "Desativado"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(gw.id, isGatewayActive)}
                      disabled={saving}
                      title={isGatewayActive ? "Desativar gateway" : "Ativar gateway"}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        isGatewayActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        isGatewayActive ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(gw)}
                    className="p-2 rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
                    title="Editar credenciais"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(gw.id, gw.provider_name)}
                    className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                    title="Excluir gateway"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog matching Kronos configuration */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Plug className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {editingGateway ? "Editar Gateway" : "Adicionar Gateway"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Configure os dados e credenciais para processamento de Pix.
                  </p>
                </div>
              </div>

              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground text-sm p-1.5 rounded-lg hover:bg-secondary"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="p-5 space-y-4 overflow-y-auto flex-1">
              {/* Provider Selection (only when adding or switchable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Provedor de Pagamento</label>
                <select
                  value={selectedProviderId}
                  onChange={e => handleProviderChange(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  {KRONOS_GATEWAY_PROVIDERS.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {currentProviderDef && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    {currentProviderDef.description}
                  </p>
                )}
              </div>

              {/* Custom Identifier Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nome de Identificação <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={providerName}
                  onChange={e => setProviderName(e.target.value)}
                  placeholder="Ex: Duttyfy Principal, Blackcat Loja 1"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              {/* Dynamic Fields for Chosen Provider */}
              <div className="space-y-3 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
                  <Key className="w-3.5 h-3.5 text-primary" />
                  Credenciais da API
                </div>

                {currentProviderDef.fields.map(field => {
                  const isPassword = field.type === "password";
                  const isVisible = showPasswords[field.key] || false;

                  return (
                    <div key={field.key} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-muted-foreground font-medium">
                          {field.label} {field.optional && <span className="text-[10px] text-muted-foreground/60">(opcional)</span>}
                        </label>
                        {isPassword && (
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, [field.key]: !prev[field.key] }))}
                            className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1"
                          >
                            {isVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            {isVisible ? "Ocultar" : "Mostrar"}
                          </button>
                        )}
                      </div>

                      <div className="relative">
                        <input
                          type={isPassword ? (isVisible ? "text" : "password") : "text"}
                          value={credentials[field.key] || ""}
                          onChange={e => setCredentials({ ...credentials, [field.key]: e.target.value })}
                          placeholder={field.placeholder}
                          className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary font-mono text-xs"
                          required={!field.optional}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Footer buttons */}
              <div className="pt-4 border-t border-border flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-lg bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white text-sm font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingGateway ? "Salvar alterações" : "Cadastrar gateway"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default GatewaysManager;
