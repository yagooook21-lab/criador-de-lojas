import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Plus, Trash2, Save, Bell, Volume2, VolumeX } from "lucide-react";
import { toast } from "sonner";

const inputClass = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition";
const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

export default function AdminTracking() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Meta Pixel
  const [metaEnabled, setMetaEnabled] = useState(false);
  const [metaPixelIds, setMetaPixelIds] = useState<string[]>([""]);

  // Google Analytics
  const [googleEnabled, setGoogleEnabled] = useState(false);
  const [googleAnalyticsIds, setGoogleAnalyticsIds] = useState<string[]>([""]);

  // UTMfy
  const [utmfyEnabled, setUtmfyEnabled] = useState(false);
  const [utmfyIds, setUtmfyIds] = useState<string[]>([""]);

  // Sales Notifications
  const [salesNotifEnabled, setSalesNotifEnabled] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("metarat_sales_notif_enabled") !== "false" : true;
  });
  const [salesSoundEnabled, setSalesSoundEnabled] = useState(() => {
    return typeof window !== "undefined" ? localStorage.getItem("metarat_sales_sound_enabled") !== "false" : true;
  });
  const [notifPermission, setNotifPermission] = useState<string>(() => {
    return typeof window !== "undefined" && "Notification" in window ? Notification.permission : "default";
  });

  const activePixel = searchParams.get("pixel");

  // Fetch settings from Supabase
  const fetchTrackingSettings = useCallback(async () => {
    try {
      setLoading(true);
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
    } catch (e) {
      console.error("Erro ao carregar configurações de rastreamento:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTrackingSettings();
  }, [fetchTrackingSettings]);

  // Save tracking settings
  const saveTrackingSettings = async () => {
    try {
      setSaving(true);
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

      toast.success("Configurações salvas com sucesso!");
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar configurações");
    } finally {
      setSaving(false);
    }
  };

  const pageTitle = activePixel === "meta"
    ? "Pixel Meta (Facebook)"
    : activePixel === "google"
    ? "Google Analytics"
    : activePixel === "utmfy"
    ? "UTMfy"
    : "Rastreamento e Pixels";

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <AdminTopbar title={pageTitle} />

      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6 max-w-4xl">
        {/* Render 1. Meta Pixel Card */}
        {(!activePixel || activePixel === "meta") && (
          <div className="p-3.5 sm:p-5 rounded-[6px] bg-card border border-border transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Pixel Meta (Facebook)</h3>
                  <p className="text-xs text-muted-foreground">Rastreie eventos no Facebook/Instagram Ads</p>
                </div>
              </div>

              <button
                onClick={() => setMetaEnabled(!metaEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  metaEnabled ? "bg-[#F59E0B]" : "bg-muted-foreground/30"
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    metaEnabled ? "translate-x-6" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>

            {metaEnabled && (
              <div className="space-y-3 pt-4 mt-2 border-t border-border">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">IDs do Pixel (Meta / Facebook)</label>
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
                    className="flex items-center gap-1.5 text-xs text-[#F59E0B] hover:opacity-80 font-medium pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar outro Pixel Meta
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Eventos rastreados automaticamente: <strong>PageView</strong>, <strong>ViewContent</strong>, <strong>AddToCart</strong>, <strong>InitiateCheckout</strong>, <strong>Purchase</strong>
                </p>
              </div>
            )}
          </div>
        )}



        {/* Render 3. UTMfy Card */}
        {(!activePixel || activePixel === "utmfy") && (
          <div className="p-5 rounded-[6px] bg-card border border-border transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-sm">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">UTMfy</h3>
                  <p className="text-xs text-muted-foreground">Rastreamento de UTM e conversões</p>
                </div>
              </div>

              <button
                onClick={() => setUtmfyEnabled(!utmfyEnabled)}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  utmfyEnabled ? "bg-[#F59E0B]" : "bg-muted-foreground/30"
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    utmfyEnabled ? "translate-x-6" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>

            {utmfyEnabled && (
              <div className="space-y-3 pt-4 mt-2 border-t border-border">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">IDs / Scripts UTMfy</label>
                  {utmfyIds.map((id, idx) => (
                    <div key={idx} className="flex gap-2">
                      <input
                        type="text"
                        value={id}
                        onChange={e => setUtmfyIds(prev => prev.map((v, i) => i === idx ? e.target.value : v))}
                        placeholder="Ex: utm_script_id ou ID do Pixel"
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
                    className="flex items-center gap-1.5 text-xs text-[#F59E0B] hover:opacity-80 font-medium pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar outro ID UTMfy
                  </button>
                </div>
                <p className="text-[11px] text-muted-foreground pt-1">
                  Rastreamento e preservação de tags UTM em todas as etapas do funil de vendas.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Render 4. Sales Notification Card (Under UTMfy) */}
        {(!activePixel || activePixel === "utmfy") && (
          <div className="p-5 rounded-[6px] bg-card border border-border transition-all">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-[6px] bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white flex items-center justify-center shadow-sm">
                  <Bell className="w-4 h-4" />
                </div>
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
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ${
                  salesNotifEnabled ? "bg-[#F59E0B]" : "bg-muted-foreground/30"
                }`}
              >
                <span 
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform shadow-sm ${
                    salesNotifEnabled ? "translate-x-6" : "translate-x-0"
                  }`} 
                />
              </button>
            </div>

            {salesNotifEnabled && (
              <div className="space-y-4 pt-4 mt-2 border-t border-border">
                {/* Som toggle */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {salesSoundEnabled ? <Volume2 className="w-4 h-4 text-emerald-500" /> : <VolumeX className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <p className="text-xs font-medium text-foreground">Som da Caixa Registradora (Ka-ching)</p>
                      <p className="text-[11px] text-muted-foreground">Toca efeito sonoro de dinheiro ao aprovar venda (apenas 1 vez)</p>
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
                      className="px-2.5 py-1 text-xs font-medium rounded bg-[#F59E0B]/20 text-[#F59E0B] hover:bg-[#F59E0B]/30 transition-colors"
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

                      // Dispatch global event for in-app floating banner & single sound
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
                    id="btn-test-sales-notification-tracking"
                    className="w-full py-2.5 px-3 rounded-[5px] border border-border bg-secondary/60 hover:bg-secondary text-xs font-medium text-foreground flex items-center justify-center gap-2 transition-all shadow-sm"
                  >
                    <Volume2 className="w-4 h-4 text-[#F59E0B]" />
                    Testar Notificação e Som Agora
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <button
            onClick={saveTrackingSettings}
            disabled={saving || loading}
            className={`flex items-center gap-2 px-6 py-2.5 text-xs font-semibold rounded-[5px] ${gradientBtn} text-white shadow-md shadow-[#D97706]/20 transition disabled:opacity-50`}
          >
            <Save className="w-4 h-4" />
            {saving ? "Salvando..." : `Salvar ${pageTitle}`}
          </button>
        </div>
      </div>
    </div>
  );
}
