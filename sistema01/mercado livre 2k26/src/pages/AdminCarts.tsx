import { useState } from "react";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore } from "@/contexts/StoreContext";
import { Eye, X, ShoppingCart, CreditCard, Package, AlertTriangle, Trash2, CheckCircle, RotateCcw, Loader2 } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";
import type { Cart } from "@/contexts/StoreContext";

const WhatsAppIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="currentColor">
    <path d="M11.42 9.49c-.19-.09-1.1-.54-1.27-.61s-.29-.09-.42.1-.48.6-.59.73-.21.14-.4 0a5.13 5.13 0 0 1-1.49-.92 5.25 5.25 0 0 1-1-1.29c-.11-.18 0-.28.08-.38s.18-.21.28-.32a1.39 1.39 0 0 0 .18-.31.38.38 0 0 0 0-.33c0-.09-.42-1-.58-1.37s-.3-.32-.41-.32h-.4a.72.72 0 0 0-.5.23 2.1 2.1 0 0 0-.65 1.55A3.59 3.59 0 0 0 5 8.2 8.32 8.32 0 0 0 8.19 11c.44.19.78.3 1.05.39a2.53 2.53 0 0 0 1.17.07 1.93 1.93 0 0 0 1.26-.88 1.67 1.67 0 0 0 .11-.88c-.05-.07-.17-.12-.36-.21z"/>
    <path d="M13.29 2.68A7.36 7.36 0 0 0 8 .5a7.44 7.44 0 0 0-6.41 11.15l-1 3.85 3.94-1a7.4 7.4 0 0 0 3.55.9H8a7.44 7.44 0 0 0 5.29-12.72zM8 14.12a6.12 6.12 0 0 1-3.15-.87l-.22-.13-2.34.61.62-2.28-.14-.23a6.18 6.18 0 0 1 9.6-7.65 6.12 6.12 0 0 1 1.81 4.37A6.19 6.19 0 0 1 8 14.12z"/>
  </svg>
);

const cartStatusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  abandoned: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  converted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

const cartStatusLabels: Record<string, string> = {
  active: "Ativo",
  abandoned: "Abandonado",
  converted: "Convertido",
};

// Determine the abandoned stage based on cart data
function getAbandonedStage(cart: Cart): { stage: string; label: string; color: string; icon: React.ElementType; step: number } {
  // If cart has shipping/checkout info fields populated → was at checkout
  if (cart.customer_email && cart.customer_phone && cart.customer_name) {
    return { stage: "checkout", label: "Dados preenchidos — Finalizando compra", color: "text-orange-400", icon: CreditCard, step: 3 };
  }
  // If has customer name or email → started filling info
  if (cart.customer_name || cart.customer_email) {
    return { stage: "info", label: "Preenchendo informações", color: "text-yellow-400", icon: Package, step: 2 };
  }
  // Default: just had items in cart
  return { stage: "cart", label: "Adicionou ao carrinho", color: "text-blue-400", icon: ShoppingCart, step: 1 };
}

const stageSteps = [
  { step: 1, label: "Carrinho" },
  { step: 2, label: "Informações" },
  { step: 3, label: "Pagamento" },
  { step: 4, label: "Confirmação" },
];

const AdminCarts = () => {
  const { carts, deleteCart, updateCartStatus } = useStore();
  const [selectedCart, setSelectedCart] = useState<Cart | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; display: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  const allSelected = carts.length > 0 && selected.size === carts.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(carts.map(c => c.id)));
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
      setDeleteConfirm({ ids, display: `${ids.length} carrinhos` });
      return;
    } else if (["active", "abandoned", "converted"].includes(bulkAction)) {
      for (const id of ids) await updateCartStatus(id, bulkAction as any);
    }

    setSelected(new Set());
    setBulkAction("");
  };

  const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50";
  const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

  const buildWhatsAppUrl = (cart: Cart) => {
    const phone = cart.customer_phone || "";
    const items = cart.products.map(p => `• ${p.name} (x${p.quantity}) - ${formatCurrency(p.price * p.quantity)}`).join("\n");
    const msg = encodeURIComponent(
      `Olá ${cart.customer_name || ""}! 👋\n\nNotamos que você deixou alguns itens no carrinho:\n\n${items}\n\nTotal: ${formatCurrency(cart.total)}\n\nGostaria de finalizar sua compra? Estamos aqui para ajudar! 😊`
    );
    return `https://wa.me/${phone}?text=${msg}`;
  };

  const abandonedStage = selectedCart?.status === "abandoned" ? getAbandonedStage(selectedCart) : null;

  return (
    <>
      <AdminTopbar title="Carrinhos" />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">{carts.length} carrinhos</p>
        </div>

        {carts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">nada encontrado por aqui</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
              Carrinhos ativos e abandonados pelos clientes serão exibidos aqui para monitoramento.
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
                  <option value="abandoned">Marcar como Abandonado</option>
                  <option value="converted">Marcar como Convertido</option>
                  <option value="active">Marcar como Ativo</option>
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
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Produtos</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Última Ação</th>
                  <th className="p-4 font-medium">Última Atividade</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {carts.map(c => (
                  <tr key={c.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selected.has(c.id) ? "bg-secondary/40" : ""}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} className="w-4 h-4 rounded accent-[#20B2AA]" />
                    </td>
                    <td className="p-4 text-sm font-mono text-foreground">{c.id}</td>
                    <td className="p-4 text-sm text-foreground">{c.customer_name || "-"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.products.length} item(ns)</td>
                    <td className="p-4 text-sm text-foreground">{formatCurrency(c.total)}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cartStatusColors[c.status]}`}>{cartStatusLabels[c.status] || c.status}</span></td>
                    <td className="p-4 text-sm text-muted-foreground italic">{c.last_action || "Carrinho"}</td>
                    <td className="p-4 text-sm text-muted-foreground">{c.last_activity}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setSelectedCart(c)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        {c.status === "abandoned" && (
                          <a
                            href={buildWhatsAppUrl(c)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-[5px] hover:bg-green-500/10 transition-colors text-green-400 hover:text-green-300"
                            title="Recuperar Carrinho"
                          >
                            <WhatsAppIcon size={16} />
                          </a>
                        )}
                        <button onClick={() => setDeleteConfirm({ ids: [c.id], display: `carrinho ${c.id}` })} className="p-1.5 rounded-[5px] hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </main>

      {/* Cart Detail Drawer */}
      {selectedCart && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedCart(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Detalhes do Carrinho - {selectedCart.cart_number}</h2>
              <button onClick={() => setSelectedCart(null)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <span className="text-sm text-foreground font-medium">{selectedCart.customer_name || "-"}</span>
                </div>
                {selectedCart.customer_email && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Email</span>
                    <span className="text-sm text-foreground">{selectedCart.customer_email}</span>
                  </div>
                )}
                {selectedCart.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm text-foreground">{selectedCart.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${cartStatusColors[selectedCart.status]}`}>{cartStatusLabels[selectedCart.status] || selectedCart.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm text-foreground font-bold">{formatCurrency(selectedCart.total)}</span>
                </div>
                {selectedCart.ip_address && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP</span>
                    <span className="text-sm text-foreground font-mono">{selectedCart.ip_address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Última Atividade</span>
                  <span className="text-sm text-foreground">{selectedCart.last_activity}</span>
                </div>
              </div>

              {/* Abandoned Cart Stage */}
              {abandonedStage && (
                <div className="p-4 rounded-[5px] bg-yellow-500/5 border border-yellow-500/20">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-yellow-400" />
                    <span className="text-sm font-semibold text-foreground">Etapa do Abandono</span>
                  </div>
                  {/* Progress Steps */}
                  <div className="flex items-center gap-1 mb-3">
                    {stageSteps.map((s, i) => (
                      <div key={s.step} className="flex items-center flex-1">
                        <div className={`flex items-center justify-center w-6 h-6 rounded-full text-[10px] font-bold shrink-0 ${
                          s.step < abandonedStage.step ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : s.step === abandonedStage.step ? "bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 ring-2 ring-yellow-500/20"
                          : "bg-secondary text-muted-foreground border border-border"
                        }`}>
                          {s.step}
                        </div>
                        {i < stageSteps.length - 1 && (
                          <div className={`flex-1 h-0.5 mx-1 rounded ${
                            s.step < abandonedStage.step ? "bg-green-500/40" : "bg-border"
                          }`} />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between">
                    {stageSteps.map(s => (
                      <span key={s.step} className={`text-[9px] flex-1 text-center ${s.step === abandonedStage.step ? "text-yellow-400 font-medium" : "text-muted-foreground/50"}`}>
                        {s.label}
                      </span>
                    ))}
                  </div>
                  <div className={`mt-3 flex items-center gap-2 ${abandonedStage.color}`}>
                    <abandonedStage.icon className="w-4 h-4" />
                    <span className="text-xs font-medium">{selectedCart.last_action || abandonedStage.label}</span>
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Itens no Carrinho</h3>
                <div className="space-y-2">
                  {selectedCart.products.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-[5px] bg-secondary/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {selectedCart.status === "abandoned" && (
                <a
                  href={buildWhatsAppUrl(selectedCart)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-[5px] bg-green-600 hover:bg-green-700 text-foreground font-medium transition-colors"
                >
                  <WhatsAppIcon size={20} />
                  Recuperar Carrinho
                </a>
              )}
            </div>
          </div>
        </div>,
        document.body
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
                    for (const id of deleteConfirm.ids) await deleteCart(id);
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

export default AdminCarts;
