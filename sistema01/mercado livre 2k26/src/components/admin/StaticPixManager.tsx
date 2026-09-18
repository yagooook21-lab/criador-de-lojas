import React, { useState, useEffect } from "react";
import { 
  QrCode, Plus, Check, Trash2, Edit3, Loader2, Building, 
  User, MapPin, Hash, Sparkles 
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SavedStaticPixKey {
  id: string;
  provider_id: string; // "static_pix"
  provider_name: string;
  active: boolean;
  credentials: {
    pix_key_type: "cpf" | "cnpj" | "email" | "phone" | "random" | string;
    pix_key: string;
    merchant_name: string;
    merchant_city: string;
  };
  created_at?: string;
  updated_at?: string;
}

export const StaticPixManager: React.FC = () => {
  const [keys, setKeys] = useState<SavedStaticPixKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState<SavedStaticPixKey | null>(null);
  const [providerName, setProviderName] = useState<string>("");
  const [keyType, setKeyType] = useState<string>("cpf");
  const [pixKey, setPixKey] = useState<string>("");
  const [merchantName, setMerchantName] = useState<string>("");
  const [merchantCity, setMerchantCity] = useState<string>("SAO PAULO");

  // Sync active static key into pix_settings
  const syncToPixSettings = async (activeKey: SavedStaticPixKey | null) => {
    try {
      const { data: currentPix } = await supabase.from("settings").select("*").eq("key", "pix_settings").maybeSingle();
      const currentVal = (currentPix?.value as any) || {};

      if (!activeKey) {
        // If static pix is deactivated, remove account key info
        const updatedVal = {
          ...currentVal,
          account_key: "",
          account_name: "",
          account_city: ""
        };
        await supabase.from("settings").update({ value: updatedVal as any }).eq("key", "pix_settings");
        return;
      }

      const updatedVal = {
        ...currentVal,
        account_key: activeKey.credentials.pix_key,
        account_key_type: activeKey.credentials.pix_key_type,
        account_name: activeKey.credentials.merchant_name,
        account_city: activeKey.credentials.merchant_city
      };

      const { data: existing } = await supabase.from("settings").select("id").eq("key", "pix_settings").maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value: updatedVal as any }).eq("key", "pix_settings");
      } else {
        await supabase.from("settings").insert({ key: "pix_settings", value: updatedVal as any });
      }
    } catch (e) {
      console.warn("Error syncing static pix key to pix_settings:", e);
    }
  };

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const { data } = await supabase.from("settings").select("*").eq("key", "static_pix_keys").maybeSingle();
      let list: SavedStaticPixKey[] = [];
      if (data?.value && Array.isArray(data.value)) {
        list = data.value;
      } else if (data?.value && typeof data.value === "object") {
        list = Object.values(data.value);
      } else {
        // Migration: check if pix_settings already has account_key
        const { data: pixSet } = await supabase.from("settings").select("*").eq("key", "pix_settings").maybeSingle();
        if (pixSet?.value && (pixSet.value as any).account_key) {
          const pVal = pixSet.value as any;
          const initialKey: SavedStaticPixKey = {
            id: `key_${Date.now()}`,
            provider_id: "static_pix",
            provider_name: "Chave Pix Principal",
            active: pVal.mode === "account" || true,
            credentials: {
              pix_key_type: pVal.account_key_type || "cpf",
              pix_key: pVal.account_key || "",
              merchant_name: pVal.account_name || "LOJA",
              merchant_city: pVal.account_city || "SAO PAULO"
            },
            created_at: new Date().toISOString()
          };
          list = [initialKey];
          await supabase.from("settings").upsert({ key: "static_pix_keys", value: list as any }, { onConflict: "key" });
        }
      }
      setKeys(list);
    } catch (err) {
      console.error("Failed to load static pix keys:", err);
      toast.error("Erro ao carregar chaves Pix.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKeys();
  }, []);

  const saveKeysList = async (newList: SavedStaticPixKey[]) => {
    setSaving(true);
    try {
      const { data: existing } = await supabase.from("settings").select("id").eq("key", "static_pix_keys").maybeSingle();
      if (existing) {
        await supabase.from("settings").update({ value: newList as any }).eq("key", "static_pix_keys");
      } else {
        await supabase.from("settings").insert({ key: "static_pix_keys", value: newList as any });
      }

      setKeys(newList);

      const activeKey = newList.find(k => k.active) || null;
      await syncToPixSettings(activeKey);

      return true;
    } catch (err: any) {
      console.error("Erro ao salvar chave Pix estática:", err);
      toast.error("Falha ao salvar chave Pix.");
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingKey(null);
    setProviderName("Chave Pix Principal");
    setKeyType("cpf");
    setPixKey("");
    setMerchantName("");
    setMerchantCity("SAO PAULO");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item: SavedStaticPixKey) => {
    setEditingKey(item);
    setProviderName(item.provider_name);
    setKeyType(item.credentials.pix_key_type || "cpf");
    setPixKey(item.credentials.pix_key || "");
    setMerchantName(item.credentials.merchant_name || "");
    setMerchantCity(item.credentials.merchant_city || "SAO PAULO");
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    const nameTrimmed = providerName.trim() || "Chave Pix";
    const keyTrimmed = pixKey.trim();
    const merchantTrimmed = merchantName.trim();
    const cityTrimmed = merchantCity.trim() || "SAO PAULO";

    if (!keyTrimmed) {
      toast.error("Informe a chave Pix.");
      return;
    }
    if (!merchantTrimmed) {
      toast.error("Informe o nome do recebedor.");
      return;
    }

    let updatedList: SavedStaticPixKey[];
    if (editingKey) {
      updatedList = keys.map(k => {
        if (k.id === editingKey.id) {
          return {
            ...k,
            provider_name: nameTrimmed,
            credentials: {
              pix_key_type: keyType,
              pix_key: keyTrimmed,
              merchant_name: merchantTrimmed.substring(0, 25),
              merchant_city: cityTrimmed.substring(0, 15)
            },
            updated_at: new Date().toISOString()
          };
        }
        return k;
      });
      toast.success("Chave Pix atualizada com sucesso!");
    } else {
      const newKey: SavedStaticPixKey = {
        id: `key_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        provider_id: "static_pix",
        provider_name: nameTrimmed,
        active: keys.length === 0, // Auto-activate if first
        credentials: {
          pix_key_type: keyType,
          pix_key: keyTrimmed,
          merchant_name: merchantTrimmed.substring(0, 25),
          merchant_city: cityTrimmed.substring(0, 15)
        },
        created_at: new Date().toISOString()
      };
      updatedList = [...keys, newKey];
      toast.success("Chave Pix cadastrada e salva!");
    }

    const ok = await saveKeysList(updatedList);
    if (ok) {
      setIsModalOpen(false);
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    const updatedList = keys.map(k => {
      if (k.id === id) {
        return { ...k, active: !currentActive };
      }
      if (!currentActive) {
        return { ...k, active: false };
      }
      return k;
    });

    const activeItem = updatedList.find(k => k.id === id);
    if (activeItem?.active) {
      toast.success(`Chave Pix "${activeItem.provider_name}" ativada.`);
    } else {
      toast.info(`Chave Pix desativada.`);
    }

    await saveKeysList(updatedList);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Tem certeza que deseja remover a chave "${name}"?`)) return;
    const updatedList = keys.filter(k => k.id !== id);
    toast.success(`Chave ${name} removida.`);
    await saveKeysList(updatedList);
  };

  const formatKeyTypeLabel = (type: string) => {
    switch (type) {
      case "cpf": return "CPF";
      case "cnpj": return "CNPJ";
      case "email": return "E-mail";
      case "phone": return "Telefone";
      case "random": return "Aleatória";
      default: return type.toUpperCase();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header matching Kronos Technology */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
        <div>
          <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
            <QrCode className="h-5 w-5 text-primary" />
            Chaves Pix cadastradas
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            A chave ativa é usada para gerar o Pix Copia e Cola + QR Code localmente. Confirmação é manual.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white text-sm font-semibold hover:opacity-90 transition-all shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Adicionar chave Pix
        </button>
      </div>

      {/* List of registered static keys ONLY */}
      {loading ? (
        <div className="py-12 flex items-center justify-center gap-3 text-muted-foreground text-sm">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          Carregando chaves Pix cadastradas...
        </div>
      ) : keys.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-secondary/20 p-8 text-center">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <QrCode className="w-6 h-6" />
          </div>
          <h4 className="text-base font-semibold text-foreground">Nenhuma chave Pix cadastrada</h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-4">
            Clique em "Adicionar chave Pix" para cadastrar sua chave Pix estática (CPF, CNPJ, E-mail, Telefone ou Chave Aleatória).
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:opacity-90"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar primeira chave Pix
          </button>
        </div>
      ) : (
        <div className="grid gap-3.5">
          {keys.map(k => {
            const isKeyActive = k.active;

            return (
              <div 
                key={k.id}
                className={`relative rounded-xl border p-4 sm:p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isKeyActive 
                    ? "border-emerald-500/40 bg-emerald-500/[0.03] shadow-[0_0_15px_rgba(16,185,129,0.08)]" 
                    : "border-border bg-card hover:border-muted-foreground/30"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3.5">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border font-bold text-sm ${
                    isKeyActive 
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                      : "bg-secondary text-muted-foreground border-border"
                  }`}>
                    <QrCode className="w-5 h-5" />
                  </div>

                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h4 className="font-semibold text-foreground text-base leading-tight">
                        {k.provider_name}
                      </h4>
                      {isKeyActive ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                          <Check className="w-3 h-3" />
                          Ativa
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-muted text-muted-foreground">
                          Inativa
                        </span>
                      )}
                    </div>

                    <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-mono">
                      <span className="bg-secondary px-2 py-0.5 rounded border border-border text-foreground font-semibold text-[11px]">
                        {formatKeyTypeLabel(k.credentials.pix_key_type)}
                      </span>
                      <span className="text-foreground">{k.credentials.pix_key}</span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>Beneficiário: <strong className="text-foreground">{k.credentials.merchant_name}</strong></span>
                      <span className="text-muted-foreground/60">•</span>
                      <span>{k.credentials.merchant_city}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  {/* Active Toggle Switch */}
                  <div className="flex items-center gap-2 pr-2 border-r border-border">
                    <span className="text-xs text-muted-foreground font-medium hidden xs:inline">
                      {isKeyActive ? "Ativada" : "Desativada"}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleActive(k.id, isKeyActive)}
                      disabled={saving}
                      title={isKeyActive ? "Desativar chave" : "Ativar chave"}
                      className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
                        isKeyActive ? "bg-emerald-500" : "bg-muted-foreground/30"
                      }`}
                    >
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                        isKeyActive ? "translate-x-5" : "translate-x-0"
                      }`} />
                    </button>
                  </div>

                  {/* Edit */}
                  <button
                    onClick={() => handleOpenEdit(k)}
                    className="p-2 rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-colors border border-border"
                    title="Editar chave"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(k.id, k.provider_name)}
                    className="p-2 rounded-lg bg-destructive/10 hover:bg-destructive/20 text-destructive transition-colors border border-destructive/20"
                    title="Excluir chave"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal / Dialog for Static Pix Key */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {editingKey ? "Editar Chave Pix Estática" : "Cadastrar Chave Pix Estática"}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Gere Pix Copia e Cola + QR Code localmente, sem gateway.
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
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Identificação da Chave</label>
                <input
                  type="text"
                  value={providerName}
                  onChange={e => setProviderName(e.target.value)}
                  placeholder="Ex: Minha Chave Nubank, Chave Principal"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Tipo da chave</label>
                <select
                  value={keyType}
                  onChange={e => setKeyType(e.target.value)}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                >
                  <option value="cpf">CPF</option>
                  <option value="cnpj">CNPJ</option>
                  <option value="email">E-mail</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Aleatória</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Chave Pix <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  value={pixKey}
                  onChange={e => setPixKey(e.target.value)}
                  placeholder="Ex.: 12345678900, seu@email.com, +5511999998888…"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary font-mono text-xs"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Nome do recebedor (máx. 25 caracteres) <span className="text-primary">*</span>
                </label>
                <input
                  type="text"
                  maxLength={25}
                  value={merchantName}
                  onChange={e => setMerchantName(e.target.value)}
                  placeholder="Nome que aparece no app do pagador"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary"
                  required
                />
                <span className="text-[10px] text-muted-foreground">{merchantName.length}/25 caracteres</span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">
                  Cidade (máx. 15 caracteres)
                </label>
                <input
                  type="text"
                  maxLength={15}
                  value={merchantCity}
                  onChange={e => setMerchantCity(e.target.value)}
                  placeholder="SAO PAULO"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground focus:outline-none focus:border-primary uppercase"
                />
                <span className="text-[10px] text-muted-foreground">{merchantCity.length}/15 caracteres</span>
              </div>

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
                  {editingKey ? "Salvar alterações" : "Cadastrar chave Pix"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StaticPixManager;
