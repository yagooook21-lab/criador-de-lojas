import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore } from "@/contexts/StoreContext";
import { Eye, X, Phone, Mail, MapPin, CheckCircle2, ShieldQuestion, Fingerprint, Lock, User, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/utils/formatters";
import type { Customer } from "@/contexts/StoreContext";

const statusLabels: Record<string, string> = {
  paid: "Pago",
  pending: "Pendente",
  cancelled: "Cancelado",
  shipped: "Enviado",
  delivered: "Entregue"
};

const AdminCustomers = () => {
  const { customers, orders, deleteCustomer } = useStore();
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loginCredentials, setLoginCredentials] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; display: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  const allSelected = customers.length > 0 && selected.size === customers.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(customers.map(c => c.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleBulkAction = async () => {
    if (selected.size === 0 || !bulkAction) return;
    const ids = Array.from(selected);

    if (bulkAction === "delete") {
      setDeleteConfirm({ ids, display: `${ids.length} clientes` });
      return;
    }

    setSelected(new Set());
    setBulkAction("");
  };

  const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50";
  const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";
  
  useEffect(() => {
    supabase.from('store_credentials').select('*').then(({ data }) => {
       if (data) setLoginCredentials(data);
    });
  }, []);

  const getCustomerOrders = (email: string) => orders.filter(o => o.customer_email === email);
  
  const getLoginData = (email: string) => {
    return loginCredentials.find(lc => lc.email?.toLowerCase() === email?.toLowerCase());
  };

  return (
    <>
      <AdminTopbar title="Clientes" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <p className="text-sm text-muted-foreground">{customers.length} clientes</p>
        </div>

        {customers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <User className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">nada encontrado por aqui</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
              Os dados dos seus clientes serão listados aqui assim que eles se cadastrarem ou realizarem compras.
            </p>
          </div>
        ) : (
          <>
            {/* Bulk actions bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-secondary border border-border rounded-[5px]">
                <span className="text-sm text-foreground font-medium">{selected.size} selecionado(s)</span>
                <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className={`${inputCls} w-auto`}>
                  <option value="">Ação em massa</option>
                  <option value="delete">Apagar selecionados</option>
                </select>
                <button
                  onClick={handleBulkAction}
                  disabled={!bulkAction}
                  className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${bulkAction ? `${gradientBtn} text-foreground hover:opacity-90` : "bg-muted text-muted-foreground cursor-not-allowed"}`}
                >
                  Aplicar
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Limpar seleção</button>
              </div>
            )}

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-[#20B2AA]" />
                  </th>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">E-mail</th>
                  <th className="p-4 font-medium">Gasto Total</th>
                  <th className="p-4 font-medium">Conta</th>
                  <th className="p-4 font-medium text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {customers.map(c => {
                  const loginData = getLoginData(c.email);
                  return (
                    <tr key={c.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selected.has(c.id) ? "bg-secondary/40" : ""}`}>
                      <td className="p-4">
                        <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} className="w-4 h-4 rounded accent-[#20B2AA]" />
                      </td>
                      <td className="p-4 text-sm font-medium text-foreground">{c.name}</td>
                      <td className="p-4 text-sm text-muted-foreground">{c.email}</td>
                      <td className="p-4 text-sm font-semibold text-primary">{formatCurrency(c.total_spent)}</td>
                      <td className="p-4">
                        {loginData ? (
                           <div className="flex items-center gap-1.5 px-2.5 py-1 w-max rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Tem Conta</span>
                           </div>
                        ) : (
                           <div className="flex items-center gap-1.5 px-2.5 py-1 w-max rounded-full bg-secondary text-muted-foreground border border-border/50">
                              <ShieldQuestion className="w-3.5 h-3.5" />
                              <span className="text-[11px] font-bold uppercase tracking-wider">Visitante</span>
                           </div>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => setSelectedCustomer(c)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteConfirm({ ids: [c.id], display: `cliente ${c.name}` })} className="p-1.5 rounded-[5px] hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Customer Detail Drawer */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto animate-fade-in flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-border bg-card sticky top-0 z-10">
              <h2 className="text-lg font-semibold text-foreground">Detalhes do Cliente</h2>
              <button onClick={() => setSelectedCustomer(null)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-8 flex-1">
              {/* Top Profile Header */}
              <div className="flex items-center gap-5 p-4 rounded-xl bg-secondary/20 border border-border/40">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/40 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-primary/20">
                  {selectedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground leading-tight">{selectedCustomer.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                    <Fingerprint className="w-3 h-3" /> UID: {selectedCustomer.id.substring(0,8)}
                  </p>
                </div>
              </div>

              {/* Data Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-orange-500/5 border border-orange-500/10 text-center">
                  <p className="text-2xl font-black text-orange-500">{selectedCustomer.total_orders}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-orange-500/60 mt-1">Pedidos Feitos</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-center">
                  <p className="text-2xl font-black text-emerald-500">{formatCurrency(selectedCustomer.total_spent)}</p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-500/60 mt-1">Total Consumido</p>
                </div>
              </div>

              {/* General Contact Info */}
              <div className="space-y-4">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Dados de Contato (Pedidos)</h4>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-secondary/30 border border-border/50">
                    <Mail className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">E-mail Principal</p>
                      <p className="text-sm text-foreground font-medium">{selectedCustomer.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-secondary/30 border border-border/50">
                    <Phone className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Telefone Celular</p>
                      <p className="text-sm text-foreground font-medium">{selectedCustomer.phone || "Não informado"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3.5 rounded-lg bg-secondary/30 border border-border/50">
                    <Lock className="w-4 h-4 text-primary" />
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-semibold">Documento CPF</p>
                      <p className="text-sm text-foreground font-mono font-medium">
                        {(() => {
                           if (selectedCustomer.cpf) return selectedCustomer.cpf;
                           const custOrders = getCustomerOrders(selectedCustomer.email);
                           for (const o of custOrders) {
                             if (!o.notes) continue;
                             try {
                               const notes = typeof o.notes === 'string' ? JSON.parse(o.notes) : o.notes;
                               if (notes.cpf || notes.cardCpf) return notes.cpf || notes.cardCpf;
                             } catch(e) {}
                           }
                           return "Pendente de captura";
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* LOGIN / ACCOUNT DATA - THE CRITICAL PART */}
              <div className="space-y-4 pt-2">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-500 px-1">Credenciais de Conta (Login)</h4>
                
                {(() => {
                  const data = getLoginData(selectedCustomer.email);
                  if (!data) return (
                    <div className="p-6 rounded-xl border border-dashed border-border flex flex-col items-center justify-center text-center opacity-60">
                      <ShieldQuestion className="w-10 h-10 text-muted-foreground mb-3" />
                      <p className="text-sm font-medium text-foreground">Cliente Visitante</p>
                      <p className="text-xs text-muted-foreground px-4">Este usuário ainda não criou uma senha na página de login.</p>
                    </div>
                  );
                  
                  return (
                    <div className="rounded-xl overflow-hidden border border-emerald-500/30 bg-emerald-500/[0.02] animate-in fade-in slide-in-from-bottom-2 duration-500">
                      <div className="p-4 bg-emerald-500/10 border-b border-emerald-500/20 flex items-center justify-between">
                         <div className="flex items-center gap-2 text-emerald-500">
                            <CheckCircle2 className="w-4 h-4" />
                            <span className="text-xs font-bold uppercase tracking-wider">Conta Ativa</span>
                         </div>
                         <span className="text-[10px] font-medium text-emerald-600/60">Registrado em {data.created_at ? new Date(data.created_at).toLocaleDateString() : "---"}</span>
                      </div>
                      
                      <div className="p-5 space-y-5">
                        <div className="grid grid-cols-2 gap-5">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Nome no Cadastro</p>
                              <p className="text-sm text-foreground font-semibold flex items-center gap-1.5"><User className="w-3.5 h-3.5 opacity-50"/> {data.full_name || "---"}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">CPF Registrado</p>
                              <p className="text-sm text-foreground font-mono font-semibold">{data.cpf || "---"}</p>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-5">
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">E-mail de Login</p>
                              <p className="text-sm text-foreground font-medium underline decoration-emerald-500/30">{data.email}</p>
                           </div>
                           <div className="space-y-1">
                              <p className="text-[10px] font-bold text-muted-foreground uppercase">Telefone de Recuperação</p>
                              <p className="text-sm text-foreground font-medium">{data.phone || "---"}</p>
                           </div>
                        </div>

                        <div className="p-4 rounded-lg bg-black/40 border border-emerald-500/20 shadow-inner group relative overflow-hidden">
                           <div className="flex flex-col">
                              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Senha de Acesso</p>
                              <div className="flex items-center justify-between">
                                 <p className="text-lg font-mono font-black text-foreground tracking-[0.2em]">{data.password}</p>
                                 <Lock className="w-5 h-5 text-emerald-500/40 group-hover:text-emerald-500 transition-colors" />
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* Order history */}
              <div className="pb-8">
                <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 px-1">Histórico de Compras</h4>
                <div className="space-y-2">
                  {getCustomerOrders(selectedCustomer.email).map(o => (
                    <div key={o.id} className="flex items-center justify-between p-4 rounded-lg bg-secondary/20 border border-border/40 hover:border-primary/40 transition-colors group cursor-default">
                      <div className="flex items-center gap-3">
                         <div className="w-8 h-8 rounded-md bg-secondary flex items-center justify-center">
                            <Lock className="w-3 h-3 text-muted-foreground" />
                         </div>
                         <div>
                            <p className="text-xs font-bold text-foreground">Pedido #{o.order_number}</p>
                            <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</p>
                         </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-foreground">{formatCurrency(o.total)}</p>
                        <p className={`text-[9px] font-bold uppercase tracking-wider mt-0.5 ${o.status === 'paid' ? 'text-emerald-500' : 'text-orange-500'}`}>{statusLabels[o.status] || o.status}</p>
                      </div>
                    </div>
                  ))}
                  {getCustomerOrders(selectedCustomer.email).length === 0 && (
                    <div className="p-8 text-center bg-secondary/10 rounded-xl border border-dashed border-border">
                       <p className="text-xs text-muted-foreground italic">Nenhum pedido finalizado encontrado.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 z-[99998]" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar exclusão</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirm.display}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">Cancelar</button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => { 
                    setIsDeleting(true);
                    for (const id of deleteConfirm.ids) await deleteCustomer(id);
                    setIsDeleting(false);
                    setDeleteConfirm(null);
                    setSelected(new Set());
                    setBulkAction("");
                  }} 
                  className="px-4 py-2 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors flex items-center justify-center min-w-[80px]"
                >
                  {isDeleting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Excluir
                </button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default AdminCustomers;
