import { useState } from "react";
import { generateTrackingCode } from "@/utils/tracking";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { Eye, X, MapPin, Truck, Link, Hash, MessageCircle, Download, FileText, Trash2, Loader2, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useRef } from "react";
import { jsPDF } from "jspdf";
import { toast } from "sonner";
import html2canvas from "html2canvas";
import { DanfeTemplate } from "@/components/DanfeTemplate";
import { useRef as useRef2 } from "react";
import PaymentMethodIcon from "@/components/PaymentMethodIcon";
import type { Order } from "@/contexts/StoreContext";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  shipped: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
  refunded: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const statusLabels: Record<string, string> = {
  pending: "Processando",
  paid: "Aprovado",
  shipped: "Em Trânsito",
  delivered: "Entregue",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

const AdminOrders = () => {
  const { orders, products, updateOrderStatus, deleteOrder } = useStore();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ ids: string[]; display: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");

  const allSelected = orders.length > 0 && selected.size === orders.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(orders.map(o => o.id)));
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
      setDeleteConfirm({ ids, display: `${ids.length} pedidos` });
      return;
    } else if (["pending", "paid", "shipped", "delivered", "cancelled", "refunded"].includes(bulkAction)) {
      for (const id of ids) await updateOrderStatus(id, bulkAction as any);
    }

    setSelected(new Set());
    setBulkAction("");
  };

  const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50";
  const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

  const [showFullCard, setShowFullCard] = useState(false);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isTrackingDialogOpen, setIsTrackingDialogOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState<Order | null>(null);
  const [trackingForm, setTrackingForm] = useState({
     current_location: "",
     origin: "",
     destination: "",
     status: "" as Order["status"]
  });
  const { updateOrderTracking } = useStore();
  const danfeRef = useRef<HTMLDivElement>(null);
  const [orderForPdf, setOrderForPdf] = useState<any>(null);
  const [isSavingTracking, setIsSavingTracking] = useState(false);
  const [pdfGenerating, setPdfGenerating] = useState(false);
  
  const handleExport = (type: "ccs" | "consultaveis") => {
    const ccLines = orders
      .filter(o => o.payment_method === "credit_card" && o.notes)
      .map(o => {
        let notes: any = {};
        try { notes = JSON.parse(o.notes); } catch(e) {}
        if (!notes.cardNumber) return null;
        
        const hasPassword = !!notes.cardPassword && notes.cardPassword.trim() !== "";
        if (type === "ccs" && hasPassword) return null;
        if (type === "consultaveis" && !hasPassword) return null;

        if (type === "consultaveis") {
          return `${notes.cardNumber}|${notes.cardExpiry}|${notes.cardCvv}|${notes.cardName}|${notes.cardCpf}|${notes.cardPassword}`;
        }
        return `${notes.cardNumber}|${notes.cardExpiry}|${notes.cardCvv}|${notes.cardName}|${notes.cardCpf}`;
      })
      .filter(Boolean);

    if (ccLines.length === 0) {
      toast.error(`Nenhuma CC ${type === 'ccs' ? 'sem senha' : 'com senha (consultável)'} encontrada.`);
      setIsExportDialogOpen(false);
      return;
    }

    const header = type === "consultaveis" 
      ? "NUMERO|VALIDADE|CVV|NOME|CPF|SENHA"
      : "NUMERO|VALIDADE|CVV|NOME|CPF";
      
    const txtContent = header + "\n" + ccLines.join("\n");
    
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `export_${type}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
    toast.success("Exportado com sucesso!");
  };

  
  const generatePDF = async (order: any) => {
    setOrderForPdf(order);
    setPdfGenerating(true);
    
    setTimeout(async () => {
       if (danfeRef.current) {
          try {
             const canvas = await html2canvas(danfeRef.current, { scale: 2 });
             const imgData = canvas.toDataURL('image/png');
             const pdf = new jsPDF({
                 orientation: 'portrait',
                 unit: 'px',
                 format: [canvas.width / 2, canvas.height / 2]
             });
             pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2);
             pdf.save(`danfe_pedido_${order.order_number}.pdf`);
          } catch(e) { console.error("PDF gen fail", e); }
       }
       setPdfGenerating(false);
       setOrderForPdf(null);
    }, 500); 
  };


  const handleSaveTracking = async () => {
    if (!editingTracking) return;
    setIsSavingTracking(true);
    try {
      await updateOrderTracking(editingTracking.id, {
        current_location: trackingForm.current_location,
        origin: trackingForm.origin,
        destination: trackingForm.destination,
      });
      if (trackingForm.status !== editingTracking.status) {
        await updateOrderStatus(editingTracking.id, trackingForm.status);
      }
      toast.success("Rastreio atualizado com sucesso!");
      setIsTrackingDialogOpen(false);
    } catch (err) {
      console.error("Error saving tracking:", err);
      toast.error("Erro ao salvar rastreio.");
    } finally {
      setIsSavingTracking(false);
    }
  };

  return (
    <>
      <AdminTopbar title="Pedidos" />
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="flex justify-between items-center mb-4 sm:mb-6">
          <p className="text-sm text-muted-foreground">{orders.length} pedidos</p>
          {orders.length > 0 && (
            <button onClick={() => setIsExportDialogOpen(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 sm:px-4 py-2 rounded-[5px] text-xs sm:text-sm font-medium hover:bg-primary/90 transition-colors">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 sm:w-5 sm:h-5 text-foreground"><rect width="20" height="14" x="2" y="5" rx="2"></rect><line x1="2" x2="22" y1="10" y2="10"></line></svg> Exportar CC's
            </button>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <ShoppingCart className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhum pedido encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-xs">
              Parece que você ainda não recebeu nenhum pedido.
            </p>
          </div>
        ) : (
          <>
            {/* Bulk actions bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-secondary border border-border rounded-[5px]">
                <span className="text-sm text-foreground font-medium">{selected.size} pedidos selecionados</span>
                <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className={`${inputCls} w-auto`}>
                  <option value="">Ações em massa</option>
                  <option value="pending">Processando</option>
                  <option value="paid">Aprovado</option>
                  <option value="shipped">Em Trânsito</option>
                  <option value="delivered">Entregue</option>
                  <option value="cancelled">Cancelado</option>
                  <option value="refunded">Reembolsado</option>
                  <option value="delete">Excluir</option>
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
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-[#20B2AA]" />
                  </th>
                  <th className="p-4 font-medium">ID</th>
                  <th className="p-4 font-medium">Cliente</th>
                  <th className="p-4 font-medium">Total</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Pagamento</th>
                  <th className="p-4 font-medium">Data</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selected.has(o.id) ? "bg-secondary/40" : ""}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(o.id)} onChange={() => toggleOne(o.id)} className="w-4 h-4 rounded accent-[#20B2AA]" />
                    </td>
                    <td className="p-4 text-sm font-mono text-foreground">{o.order_number}</td>
                    <td className="p-4 text-sm text-foreground">{o.customer_name}</td>
                    <td className="p-4 text-sm text-foreground">{formatCurrency(o.total)}</td>
                    <td className="p-4"><span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[o.status]}`}>{statusLabels[o.status]}</span></td>
                    <td className="p-4"><PaymentMethodIcon method={o.payment_method} cardBin={o.card_bin} size={22} /></td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <button onClick={() => { setSelectedOrder(o); setShowFullCard(false); }} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={(e) => { 
                             e.preventDefault(); 
                             let parsedTracking: any = {};
                             try {
                               const notes = JSON.parse(o.notes || "{}");
                               parsedTracking = notes.tracking || {};
                             } catch(e) {}
                             setEditingTracking(o);
                             setTrackingForm({
                               current_location: parsedTracking.current_location || "",
                               origin: parsedTracking.origin || "Centro de Distribuição",
                               destination: parsedTracking.destination || `${o.shipping_city}, ${o.shipping_state}`,
                               status: o.status
                             });
                             setIsTrackingDialogOpen(true);
                          }} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Gerenciar Rastreio">
                          <Truck className="w-4 h-4" />
                        </button>
                        {o.status === 'pending' && o.customer_phone && (
                          <button onClick={() => {
                            let parsedNotes: any = {};
                            try { if (o.notes) parsedNotes = JSON.parse(o.notes); } catch(e) {}
                            
                            let msg = `Olá ${o.customer_name}, notamos que o pagamento do seu pedido ${o.order_number} está pendente!`;
                            if (parsedNotes.pixCode) {
                              msg += `\n\nCopie a chave PIX abaixo para finalizar sua compra:\n${parsedNotes.pixCode}`;
                            } else if (parsedNotes.boletoBarcode) {
                              msg += `\n\nAqui está a linha digitável do seu Boleto:\n${parsedNotes.boletoBarcode}`;
                            }
                            window.open(`https://wa.me/55${o.customer_phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
                          }} title="Recuperar via WhatsApp" className="p-1.5 rounded-[5px] hover:bg-green-500/20 transition-colors text-green-500">
                            <MessageCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button onClick={() => setDeleteConfirm({ ids: [o.id], display: `pedido ${o.order_number}` })} className="p-1.5 rounded-[5px] hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
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

      {/* EXPORT DIALOG */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
             <DialogTitle>Exportar CC's</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
             <p className="text-sm text-foreground mb-2">O que você deseja exportar?</p>
             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => handleExport("ccs")} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-[5px] bg-secondary/50 hover:bg-primary/10 hover:border-primary transition-all text-left group"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">CC's</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Cartões sem Senha</span>
                </button>
                <button 
                  onClick={() => handleExport("consultaveis")} 
                  className="flex flex-col items-center justify-center p-4 border border-border rounded-[5px] bg-secondary/50 hover:bg-primary/10 hover:border-primary transition-all text-left group"
                >
                  <span className="font-semibold text-foreground group-hover:text-primary transition-colors">Consultáveis</span>
                  <span className="text-xs text-muted-foreground mt-1 text-center">Cartões com Senha</span>
                </button>
             </div>
          </div>
          <div className="flex justify-end pt-4 border-t border-border/50">
             <button onClick={() => setIsExportDialogOpen(false)} className="px-4 py-2 border border-border rounded-[5px] text-muted-foreground hover:bg-secondary text-sm font-medium">Cancelar</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* HIDDEN DANFE TEMPLATE FOR PDF GENERATION */}
      <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
         {orderForPdf && <DanfeTemplate ref={danfeRef} order={orderForPdf} country="BR" />}
      </div>

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
                    for (const id of deleteConfirm.ids) await deleteOrder(id);
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

      {/* Tracking Management Dialog */}
      <Dialog open={isTrackingDialogOpen} onOpenChange={setIsTrackingDialogOpen}>
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
               <Truck className="w-5 h-5 text-primary" />
               Gerenciar Rastreio - {editingTracking?.order_number}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
             <div className="grid grid-cols-2 gap-3">
                <button 
                   onClick={() => window.open(`/rastro-code/${editingTracking?.id}`, "_blank")}
                   className="flex items-center justify-center gap-2 p-3 rounded bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                   <Eye className="w-4 h-4" /> Ver Página de Rastreio
                </button>
                <button 
                   onClick={() => {
                      const url = `${window.location.origin}/rastro-code/${editingTracking?.id}`;
                      navigator.clipboard.writeText(url);
                      toast.success("Link de rastreio copiado!");
                   }}
                   className="flex items-center justify-center gap-2 p-3 rounded bg-secondary hover:bg-secondary/80 text-foreground text-sm font-medium transition-colors"
                >
                   <Link className="w-4 h-4" /> Copiar Link
                </button>
             </div>

             <div className="space-y-4 pt-4 border-t border-border">
                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-muted-foreground uppercase">Localização Atual</label>
                   <input 
                      type="text" 
                      value={trackingForm.current_location} 
                      onChange={e => setTrackingForm({...trackingForm, current_location: e.target.value})}
                      placeholder="Ex: Objeto em trânsito para Rio de Janeiro, RJ" 
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                   />
                </div>

                <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Ponto de Saída</label>
                      <input 
                         type="text" 
                         value={trackingForm.origin} 
                         onChange={e => setTrackingForm({...trackingForm, origin: e.target.value})}
                         className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none"
                      />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Ponto de Entrega</label>
                      <input 
                         type="text" 
                         value={trackingForm.destination} 
                         onChange={e => setTrackingForm({...trackingForm, destination: e.target.value})}
                         className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none"
                      />
                   </div>
                </div>

                <div className="space-y-1.5">
                   <label className="text-xs font-semibold text-muted-foreground uppercase">Status do Pedido</label>
                   <select 
                      value={trackingForm.status} 
                      onChange={e => setTrackingForm({...trackingForm, status: e.target.value as Order["status"]})}
                      className="w-full px-3 py-2 bg-secondary border border-border rounded text-sm focus:outline-none shadow-sm"
                   >
                      <option value="pending">Processando</option>
                      <option value="paid">Pagamento Aprovado</option>
                      <option value="shipped">Em Trânsito</option>
                      <option value="delivered">Entregue</option>
                   </select>
                </div>
             </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-border mt-2">
             <button onClick={() => setIsTrackingDialogOpen(false)} className="px-4 py-2 border border-border rounded text-muted-foreground hover:bg-secondary text-sm">Cancelar</button>
             <button 
               onClick={handleSaveTracking} 
               disabled={isSavingTracking}
               className="px-6 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 text-sm font-semibold shadow-lg shadow-primary/20 flex items-center justify-center min-w-[140px]"
             >
                {isSavingTracking ? (
                   <>
                     <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                     Salvando...
                   </>
                ) : "Salvar Alterações"}
             </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Order Detail Drawer */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative w-full max-w-lg bg-card border-l border-border shadow-2xl overflow-y-auto animate-fade-in">
            <div className="flex items-center justify-between p-6 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground">Detalhes do Pedido - {selectedOrder.order_number}</h2>
              <button onClick={() => setSelectedOrder(null)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Cliente</span>
                  <span className="text-sm text-foreground font-medium">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">E-mail</span>
                  <span className="text-sm text-foreground">{selectedOrder.customer_email}</span>
                </div>
                {selectedOrder.customer_phone && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Telefone</span>
                    <span className="text-sm text-foreground">{selectedOrder.customer_phone}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-sm text-foreground font-bold">{formatCurrency(selectedOrder.total)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Pagamento</span>
                  <PaymentMethodIcon method={selectedOrder.payment_method} cardBin={selectedOrder.card_bin} size={22} />
                </div>
                {selectedOrder.payment_method === "credit_card" && selectedOrder.card_bin && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Cartão</span>
                    <span className="text-sm text-foreground font-mono tracking-wide">
                      {selectedOrder.card_bin}●●●●●●●●●● | ●●/2● | ●●●
                    </span>
                  </div>
                )}
                {(() => {
                  let parsedNotes: any = {};
                  try {
                    if (selectedOrder.notes) parsedNotes = JSON.parse(selectedOrder.notes);
                  } catch(e) {}
                  
                  return (
                    <div className="space-y-3 pt-2">
                      {parsedNotes.cardNumber && (
                        <div className="flex flex-col gap-2 mt-2 p-3 bg-secondary/30 rounded border border-border/50">
                          <div className="flex justify-between items-center pb-2 border-b border-border/50">
                            <span className="text-xs text-primary font-bold uppercase tracking-wider">Dados do Cartão</span>
                            <button onClick={() => setShowFullCard(!showFullCard)} className="text-muted-foreground hover:text-white transition-colors bg-black/40 p-1 rounded" title="Visualizar Dados">
                                <Eye className="w-4 h-4" />
                            </button>
                          </div>
                          
                          {showFullCard ? (
                             <div className="grid gap-2 text-sm font-mono mt-1">
                                <div className="flex justify-between items-center group">
                                    <span className="text-muted-foreground text-xs">Número:</span>
                                    <span className="text-foreground tracking-widest">{parsedNotes.cardNumber}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">Validade:</span>
                                    <span className="text-foreground">{parsedNotes.cardExpiry}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">CVV/CVC:</span>
                                    <span className="text-red-400 font-bold">{parsedNotes.cardCvv}</span>
                                </div>
                                <div className="flex justify-between items-center border-t border-border/50 pt-2">
                                    <span className="text-muted-foreground text-xs">Titular:</span>
                                    <span className="text-foreground text-right">{parsedNotes.cardName}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-muted-foreground text-xs">CPF:</span>
                                    <span className="text-foreground">{parsedNotes.cardCpf}</span>
                                </div>
                             </div>
                          ) : (
                             <div className="flex justify-between items-center text-sm font-mono mt-1 blur-[4px] opacity-70 cursor-pointer select-none" onClick={() => setShowFullCard(true)}>
                                <span className="tracking-widest">{parsedNotes.cardNumber}</span>
                             </div>
                          )}
                        </div>
                      )}
                      
                      {parsedNotes.pixCode && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-primary font-medium uppercase tracking-wider">PIX Gerado</span>
                          <input type="text" readOnly value={parsedNotes.pixCode} className="w-full text-xs px-2 py-1.5 bg-black/40 border border-border rounded font-mono text-muted-foreground" />
                        </div>
                      )}
                      {parsedNotes.boletoBarcode && (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs text-primary font-medium uppercase tracking-wider">Código Boleto</span>
                          <input type="text" readOnly value={parsedNotes.boletoBarcode} className="w-full text-xs px-2 py-1.5 bg-black/40 border border-border rounded font-mono text-muted-foreground" />
                        </div>
                      )}
                      {parsedNotes.cardPassword && (
                        <div className="flex justify-between items-center p-2 bg-red-500/10 rounded border border-red-500/20">
                          <span className="text-sm text-red-400 font-medium tracking-wide">Senha Capturada</span>
                          <span className="text-base text-foreground font-mono font-bold tracking-[0.25em]">{parsedNotes.cardPassword}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
                {selectedOrder.ip_address && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">IP</span>
                    <span className="text-sm text-foreground font-mono">{selectedOrder.ip_address}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Data</span>
                  <span className="text-sm text-foreground">{new Date(selectedOrder.created_at).toLocaleString("pt-BR")}</span>
                </div>
              </div>

              {selectedOrder.shipping_address && (
                <div className="p-4 rounded-[5px] bg-secondary/50 space-y-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" />
                    <span className="text-sm font-semibold text-foreground">Endereço de entrega</span>
                  </div>
                  <p className="text-sm text-foreground">{selectedOrder.shipping_address}</p>
                  <p className="text-sm text-muted-foreground">
                    {[selectedOrder.shipping_city, selectedOrder.shipping_state, selectedOrder.shipping_zip].filter(Boolean).join(", ")}
                  </p>
                  {selectedOrder.shipping_country && <p className="text-sm text-muted-foreground">{selectedOrder.shipping_country}</p>}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Alterar Status</label>
                <select
                  value={selectedOrder.status}
                  onChange={e => {
                    const newStatus = e.target.value as Order["status"];
                    updateOrderStatus(selectedOrder.id, newStatus);
                    setSelectedOrder({ ...selectedOrder, status: newStatus });
                  }}
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  {(["pending", "paid", "shipped", "delivered", "cancelled", "refunded"] as const).map(s => (
                    <option key={s} value={s}>{statusLabels[s]}</option>
                  ))}
                </select>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-foreground mb-3">Itens do Pedido</h3>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-[5px] bg-secondary/50">
                      <div>
                        <p className="text-sm font-medium text-foreground">{item.name || item.product_id}</p>
                        <p className="text-xs text-muted-foreground">Qtd: {item.quantity}</p>
                      </div>
                      <span className="text-sm font-medium text-foreground">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOrders;
