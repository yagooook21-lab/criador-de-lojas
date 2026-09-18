import { useState, useEffect, useMemo } from "react";
import AdminTopbar from "@/components/AdminTopbar";
import { 
  ShoppingBag, Search, CheckCircle2, Clock, AlertCircle, 
  RefreshCw, Copy, Check, DollarSign, Download, Eye, FileText,
  MapPin, User, Tag, QrCode, Trash2
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { copyToClipboard } from "@/utils/clipboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PixOrder {
  id: string;
  order_number: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_state?: string;
  shipping_zip?: string;
  total: number;
  subtotal?: number;
  shipping_cost?: number;
  status: string;
  payment_status: string;
  payment_method: string;
  notes: any;
  items?: any[];
  created_at: string;
  cpf?: string;
}

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

export default function AdminOrdersPix() {
  const { refreshData } = useStore();
  const [orders, setOrders] = useState<PixOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isConsulting, setIsConsulting] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PixOrder | null>(null);

  const fetchPixOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .in('payment_method', ['pix', 'PIX', 'Pix'])
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar pedidos Pix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPixOrders();
    const interval = setInterval(fetchPixOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      toast.success('Copiado com sucesso!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Não foi possível copiar.');
    }
  };

  const handleConfirmPayment = async (orderId: string) => {
    try {
      const res = await fetch('/api/pix-pool/confirm-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId })
      });
      if (!res.ok) throw new Error('Falha ao confirmar pagamento');
      toast.success('Pagamento confirmado com sucesso!');
      fetchPixOrders();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleConsultGateway = async () => {
    setIsConsulting(true);
    toast.info('Consultando status dos pagamentos Pix no Gateway...');
    try {
      const syncRes = await fetch('/api/gateway/sync-pending', { method: 'POST' });
      const syncData = await syncRes.json().catch(() => ({}));
      await fetchPixOrders();
      if (syncData?.updated > 0) {
        toast.success(`${syncData.updated} pagamento(s) confirmado(s) pelo Gateway!`);
      } else {
        toast.success('Status sincronizado com o Gateway!');
      }
    } catch (e) {
      toast.error('Erro ao consultar Gateway');
    } finally {
      setIsConsulting(false);
    }
  };

  const handleClearAllPixOrders = async () => {
    if (!window.confirm("Atenção: Deseja realmente excluir todos os pedidos Pix? Esta ação limpará a lista de pedidos, zerará o contador lateral e o total faturado.")) {
      return;
    }

    try {
      setClearing(true);
      const res = await fetch('/api/orders/clear-pix', { method: 'POST' });
      if (!res.ok) {
        await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      }
      setOrders([]);
      localStorage.removeItem("metarat_known_paid_orders");
      await refreshData?.();
      toast.success("Todos os pedidos Pix foram excluídos e o contador foi zerado!");
    } catch (err: any) {
      toast.error(`Erro ao limpar pedidos: ${err.message}`);
    } finally {
      setClearing(false);
    }
  };

  const getModality = (order: PixOrder) => {
    let note: any = {};
    try {
      note = typeof order.notes === 'string' ? JSON.parse(order.notes) : (order.notes || {});
    } catch (e) {}

    if (note.gateway) return note.gateway;
    if (note.pixCode) return "Pool Copia e Cola";
    return "Pix Padrão";
  };

  const stats = useMemo(() => {
    const total = orders.length;
    const paid = orders.filter(o => o.status === 'paid' || o.payment_status === 'paid');
    const pending = orders.filter(o => (o.status === 'pending' || o.status === 'processing') && o.payment_status !== 'paid');
    const paidTotal = paid.reduce((acc, o) => acc + (Number(o.total) || 0), 0);

    return { total, paidCount: paid.length, pendingCount: pending.length, paidTotal };
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      const isPaid = order.status === 'paid' || order.payment_status === 'paid';
      const isPending = !isPaid && order.status !== 'cancelled';

      if (statusFilter === 'paid' && !isPaid) return false;
      if (statusFilter === 'pending' && !isPending) return false;
      if (statusFilter === 'cancelled' && order.status !== 'cancelled') return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesNum = (order.order_number || '').toLowerCase().includes(s);
        const matchesName = (order.customer_name || '').toLowerCase().includes(s);
        const matchesEmail = (order.customer_email || '').toLowerCase().includes(s);
        const matchesPhone = (order.customer_phone || '').toLowerCase().includes(s);
        return matchesNum || matchesName || matchesEmail || matchesPhone;
      }
      return true;
    });
  }, [orders, statusFilter, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <AdminTopbar title="Pedidos Pix" />

      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#F59E0B]" />
              Todos os Pedidos Pix
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoramento centralizado de todas as modalidades de Pix (Pool Copia e Cola, Gateways e Chaves).
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={handleClearAllPixOrders}
              disabled={clearing || orders.length === 0}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-medium rounded-[5px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
              title="Apagar todos os pedidos Pix e zerar contadores"
            >
              <Trash2 className={`w-3.5 h-3.5 ${clearing ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{clearing ? "Limpando..." : "Limpar Pedidos Pix"}</span>
              <span className="sm:hidden">{clearing ? "..." : "Limpar"}</span>
            </button>
            <button
              onClick={handleConsultGateway}
              disabled={isConsulting}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-medium rounded-[5px] ${gradientBtn} text-white shadow-md shadow-[#D97706]/20 transition disabled:opacity-50`}
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isConsulting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Consultar no Gateway</span>
              <span className="sm:hidden">Gateway</span>
            </button>
            <button
              onClick={fetchPixOrders}
              className="flex items-center gap-1.5 px-2.5 sm:px-3.5 py-2 text-xs font-medium rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total de Pedidos Pix</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">Todas as modalidades</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-green-400">Total Faturado</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">
              {formatCurrency(stats.paidTotal)}
            </div>
            <span className="text-[10px] sm:text-[11px] text-green-400/80">{stats.paidCount} pedidos aprovados</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-400">Aguardando</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">{stats.pendingCount}</div>
            <span className="text-[10px] sm:text-[11px] text-amber-400/80">Pendentes no Pix</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-purple-400">Conversão Pix</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400">
              {stats.total > 0 ? Math.round((stats.paidCount / stats.total) * 100) : 0}%
            </div>
            <span className="text-[10px] sm:text-[11px] text-purple-400/80">Taxa de sucesso</span>
          </div>
        </div>

        {/* Orders Table Container */}
        <div className="bg-card border border-border rounded-[5px] p-3 sm:p-5 shadow-lg">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por cliente, pedido, e-mail..."
                className="w-full pl-9 pr-3 py-1.5 bg-secondary border border-border rounded-[5px] text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>

            <div className="flex items-center gap-1 bg-secondary p-1 rounded-[5px] border border-border text-xs overflow-x-auto max-w-full">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${statusFilter === 'all' ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Todos ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('paid')}
                className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${statusFilter === 'paid' ? 'bg-green-500/20 text-green-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Pagos ({stats.paidCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${statusFilter === 'pending' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
              >
                Pendentes ({stats.pendingCount})
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4 -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[640px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="pb-3 pl-2">Pedido</th>
                  <th className="pb-3">Data / Hora</th>
                  <th className="pb-3">Cliente</th>
                  <th className="pb-3">Modalidade</th>
                  <th className="pb-3">Valor</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right pr-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground">
                      Nenhum pedido Pix encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredOrders.map((order) => {
                    const isPaid = order.status === 'paid' || order.payment_status === 'paid';
                    const isPending = !isPaid && order.status !== 'cancelled';
                    const modality = getModality(order);

                    return (
                      <tr key={order.id} className="hover:bg-secondary/40 transition">
                        <td className="py-3 pl-2">
                          <div className="font-semibold text-foreground flex items-center gap-1.5">
                            <span>#{order.order_number || order.id.slice(0, 8)}</span>
                            <button
                              onClick={() => handleCopy(order.order_number || order.id, order.id)}
                              className="p-1 rounded-[5px] hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                            >
                              {copiedId === order.id ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground text-[11px]">
                          {new Date(order.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{order.customer_name || 'Cliente'}</span>
                            <span className="text-[11px] text-muted-foreground">{order.customer_phone || order.customer_email || '-'}</span>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-[5px] bg-secondary text-foreground text-[10px] font-medium border border-border">
                            {modality}
                          </span>
                        </td>
                        <td className="py-3 font-semibold text-foreground">
                          {formatCurrency(Number(order.total || 0))}
                        </td>
                        <td className="py-3">
                          {isPaid && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-green-400" />
                              Aprovado
                            </span>
                          )}
                          {isPending && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                              <Clock className="w-3 h-3 text-amber-400" />
                              Aguardando Pix
                            </span>
                          )}
                          {order.status === 'cancelled' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-medium">
                              <AlertCircle className="w-3 h-3 text-red-400" />
                              Cancelado
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedOrder(order)}
                              className="p-1.5 rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
                              title="Ver Detalhes do Pedido"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            {isPending && (
                              <button
                                onClick={() => handleConfirmPayment(order.id)}
                                className="px-2.5 py-1 rounded-[5px] bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 text-[11px] font-medium transition"
                              >
                                Aprovar
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <ShoppingBag className="w-5 h-5 text-[#F59E0B]" />
              Pedido #{selectedOrder?.order_number || selectedOrder?.id.slice(0, 8)}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-[5px] bg-secondary/80 border border-border space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">Valor Total</span>
                  <span className="font-bold text-sm text-foreground">{formatCurrency(Number(selectedOrder.total || 0))}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">Cliente</span>
                  <span className="font-semibold text-foreground">{selectedOrder.customer_name}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-muted-foreground">E-mail / Telefone</span>
                  <span className="text-foreground">{selectedOrder.customer_phone || selectedOrder.customer_email || '—'}</span>
                </div>
                {selectedOrder.cpf && (
                  <div className="flex justify-between items-center pb-2 border-b border-border/60">
                    <span className="text-muted-foreground">CPF</span>
                    <span className="font-mono text-foreground">{selectedOrder.cpf}</span>
                  </div>
                )}
                {selectedOrder.shipping_address && (
                  <div className="pb-2 border-b border-border/60">
                    <span className="text-muted-foreground block">Endereço de Entrega</span>
                    <span className="text-foreground">{selectedOrder.shipping_address}, {selectedOrder.shipping_city} - {selectedOrder.shipping_state} ({selectedOrder.shipping_zip})</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Status do Pedido</span>
                  <span className="font-semibold capitalize text-foreground">{selectedOrder.status}</span>
                </div>
              </div>

              {selectedOrder.notes && (
                <div className="p-3 rounded-[5px] bg-secondary border border-border text-[11px] font-mono text-muted-foreground break-all max-h-32 overflow-y-auto">
                  <p className="font-sans font-semibold text-foreground mb-1">Notas / Payload:</p>
                  {typeof selectedOrder.notes === 'string' ? selectedOrder.notes : JSON.stringify(selectedOrder.notes, null, 2)}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
