import { useState, useEffect, useCallback, useMemo } from "react";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import {
  Activity, ShoppingBag, DollarSign, ShoppingCart,
  TrendingUp, Clock, MapPin,
  Home, Tag, CreditCard, CheckCircle2, AlertTriangle,
  RefreshCw, Trash2, Radio, Sparkles,
  Eye, Globe
} from "lucide-react";
import LiveViewMap from "@/components/LiveViewMap";
import { toast } from "sonner";

interface LiveVisitor {
  id: string;
  session_id: string;
  city: string | null;
  state: string | null;
  country: string | null;
  device: string | null;
  browser: string | null;
  ip_address: string | null;
  current_page: string | null;
  action: string | null;
  product_name: string | null;
  last_seen: string;
  created_at: string;
}

interface ActivityEvent {
  id: string;
  type: 'visit' | 'product' | 'cart' | 'address' | 'payment' | 'order';
  title: string;
  subtitle: string;
  time: string;
  icon: any;
  badgeColor: string;
}

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

export default function AdminDashboard() {
  const { products, orders, carts, refreshData } = useStore();
  const [liveVisitors, setLiveVisitors] = useState<LiveVisitor[]>([]);
  const [allVisits, setAllVisits] = useState<LiveVisitor[]>([]);
  const [dateRange, setDateRange] = useState<"today" | "yesterday" | "7days" | "30days">("today");
  const [loading, setLoading] = useState(false);
  const [showLiveMap, setShowLiveMap] = useState(false);

  // Fetch online active visitors (real-time last 35 seconds)
  const fetchLiveVisitors = useCallback(async () => {
    try {
      const activeThreshold = new Date(Date.now() - 35 * 1000).toISOString();
      const { data } = await supabase
        .from("live_visitors")
        .select("*")
        .gte("last_seen", activeThreshold)
        .order("last_seen", { ascending: false });

      if (data) setLiveVisitors(data as LiveVisitor[]);
    } catch (e) {
      console.error("Error fetching live visitors:", e);
    }
  }, []);

  // Fetch all visits based on date range
  const fetchAllVisits = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("live_visitors")
        .select("*")
        .order("last_seen", { ascending: false })
        .limit(300);

      if (data) setAllVisits(data as LiveVisitor[]);
    } catch (e) {
      console.error("Error fetching all visits:", e);
    }
  }, []);

  useEffect(() => {
    fetchLiveVisitors();
    fetchAllVisits();

    // Fast polling every 3 seconds for live visitors counters
    const liveInterval = setInterval(() => {
      fetchLiveVisitors();
    }, 3000);

    // Slower polling every 30 seconds for historical activity & store sync
    const dataInterval = setInterval(() => {
      fetchAllVisits();
      refreshData?.();
    }, 30000);

    return () => {
      clearInterval(liveInterval);
      clearInterval(dataInterval);
    };
  }, [fetchLiveVisitors, fetchAllVisits, refreshData]);

  // Filter all orders (Pix + Card) by date range
  const allFilteredOrders = useMemo(() => {
    const now = new Date();
    return orders.filter(o => {
      const d = new Date(o.created_at);
      if (dateRange === "today") {
        return now.getTime() - d.getTime() <= 24 * 60 * 60 * 1000;
      }
      if (dateRange === "yesterday") {
        const diff = now.getTime() - d.getTime();
        return diff > 24 * 60 * 60 * 1000 && diff <= 48 * 60 * 60 * 1000;
      }
      if (dateRange === "7days") {
        return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }
      return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    });
  }, [orders, dateRange]);

  // Filter Pix orders by date range for Pix KPI metrics
  const filteredPixOrders = useMemo(() => {
    return allFilteredOrders.filter(o => {
      const method = (o.payment_method || '').toLowerCase();
      return method.includes('pix');
    });
  }, [allFilteredOrders]);

  // Filter carts by date range
  const filteredCarts = useMemo(() => {
    const now = new Date();
    return carts.filter(c => {
      const d = new Date(c.created_at || c.last_activity);
      if (dateRange === "today") {
        return now.getTime() - d.getTime() <= 24 * 60 * 60 * 1000;
      }
      if (dateRange === "yesterday") {
        const diff = now.getTime() - d.getTime();
        return diff > 24 * 60 * 60 * 1000 && diff <= 48 * 60 * 60 * 1000;
      }
      if (dateRange === "7days") {
        return (now.getTime() - d.getTime()) <= 7 * 24 * 60 * 60 * 1000;
      }
      return (now.getTime() - d.getTime()) <= 30 * 24 * 60 * 60 * 1000;
    });
  }, [carts, dateRange]);

  // 1. Top Ribbon Metrics (Interactions count all Pix+Card; Pix cards count Pix)
  const interactionsCount = Math.max(allVisits.length, allFilteredOrders.length + filteredCarts.length);
  const totalOrdersCount = filteredPixOrders.length;
  const conversionRate = interactionsCount > 0 
    ? ((totalOrdersCount / interactionsCount) * 100).toFixed(1) 
    : "0.0";
  
  // Total Gerado (pagos e não pagos)
  const totalPixGeneratedRevenue = filteredPixOrders
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);

  // Total Pago (apenas pedidos pagos confirmados)
  const paidPixOrders = filteredPixOrders
    .filter(o => o.status === 'paid' || o.payment_status === 'paid');
  const paidPixRevenue = paidPixOrders
    .reduce((acc, o) => acc + (Number(o.total) || 0), 0);
  
  const averageTicket = totalOrdersCount > 0 
    ? totalPixGeneratedRevenue / totalOrdersCount 
    : 0;

  // 2. Real-Time Conversion Funnel Stages (Jornada do Pedido 100% em Tempo Real)
  const funnel = useMemo(() => {
    const stepCounts = {
      inicio: 0,
      produto: 0,
      carrinho: 0,
      endereco: 0,
      pagamento: 0,
      confirmado: 0
    };

    for (const v of liveVisitors) {
      const page = (v.current_page || '').toLowerCase();
      const act = (v.action || '').toLowerCase();

      // Step 6: Pedido Confirmado (tela de sucesso de Pix/Boleto ou status purchased)
      if (
        page.includes('sucesso') || page.includes('pix gerado') || 
        page.includes('boleto gerado') || page.includes('confirmado') || 
        page.includes('success') || act === 'purchased'
      ) {
        stepCounts.confirmado++;
      }
      // Step 5: Selecionando Pagamento
      else if (
        page.includes('pagamento') || page.includes('cartão') || 
        page.includes('pix') || page.includes('boleto') || 
        page.includes('parcelas') || page.includes('cardconfirmation') || 
        page.includes('declined')
      ) {
        stepCounts.pagamento++;
      }
      // Step 4: Preenchendo Endereço / Frete
      else if (
        page.includes('endereço') || page.includes('entrega') || 
        page.includes('shipping') || page.includes('drop')
      ) {
        stepCounts.endereco++;
      }
      // Step 3: Inicialização de Compra (No carrinho / checkout inicial)
      else if (
        page.includes('carrinho') || page.includes('cart') || 
        (page.includes('checkout') && !page.includes('success'))
      ) {
        stepCounts.carrinho++;
      }
      // Step 2: Página do Produto
      else if (
        page.includes('produto') || page.includes('product') || v.product_name
      ) {
        stepCounts.produto++;
      }
      // Step 1: Início / Navegando pela Loja
      else {
        stepCounts.inicio++;
      }
    }

    return [
      { id: 1, label: "Início", icon: Home, count: stepCounts.inicio },
      { id: 2, label: "Página do Produto", icon: Tag, count: stepCounts.produto },
      { id: 3, label: "Inicialização de Compra", icon: ShoppingCart, count: stepCounts.carrinho },
      { id: 4, label: "Endereço", icon: MapPin, count: stepCounts.endereco },
      { id: 5, label: "Selecionando Pagamento", icon: CreditCard, count: stepCounts.pagamento },
      { id: 6, label: "Pedido Confirmado", icon: CheckCircle2, count: stepCounts.confirmado }
    ];
  }, [liveVisitors]);

  // 3. High Abandonment Stages (Etapas com mais abandono)
  const abandonmentData = useMemo(() => {
    if (liveVisitors.length === 0) return [];
    const drops = [
      {
        stage: "Endereço → Pagamento",
        description: "Clientes ativos no frete e ainda não avançaram para pagamento",
        dropCount: funnel[3].count,
        rate: liveVisitors.length > 0 ? Math.round((funnel[3].count / liveVisitors.length) * 100) : 0
      },
      {
        stage: "Produto → Carrinho",
        description: "Visualizando detalhes do produto mas ainda não foram ao carrinho",
        dropCount: funnel[1].count,
        rate: liveVisitors.length > 0 ? Math.round((funnel[1].count / liveVisitors.length) * 100) : 0
      },
      {
        stage: "Pagamento → Conclusão",
        description: "Na etapa de pagamento mas ainda não concluíram o pedido",
        dropCount: funnel[4].count,
        rate: liveVisitors.length > 0 ? Math.round((funnel[4].count / liveVisitors.length) * 100) : 0
      }
    ].filter(d => d.dropCount > 0);

    return drops.sort((a, b) => b.rate - a.rate);
  }, [funnel, liveVisitors]);

  // 4. Hourly Access Line Chart Data (Acessos ao longo do dia)
  const hourlyData = useMemo(() => {
    const hours = ["00:00", "02:00", "04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "23:00"];
    const counts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const allEvents = [
      ...allVisits.map(v => v.last_seen || v.created_at),
      ...orders.map(o => o.created_at),
      ...carts.map(c => c.last_activity || c.created_at)
    ];

    for (const ts of allEvents) {
      if (!ts) continue;
      const d = new Date(ts);
      const h = d.getHours();
      if (!isNaN(h)) {
        const slotIndex = Math.min(11, Math.floor(h / 2));
        counts[slotIndex]++;
      }
    }

    const max = Math.max(...counts, 4);
    return { hours, counts, max };
  }, [allVisits, orders, carts]);

  // 5. Real-time Live Activity Feed (Includes both Pix and Card orders)
  const recentActivities = useMemo(() => {
    const list: ActivityEvent[] = [];

    // Orders (Pix + Card)
    for (const o of orders.slice(0, 6)) {
      const isPix = (o.payment_method || '').toLowerCase().includes('pix');
      list.push({
        id: `order_${o.id}`,
        type: 'order',
        title: isPix ? `Novo pedido Pix #${o.order_number || o.id.slice(0, 6)}` : `Novo pedido Cartão #${o.order_number || o.id.slice(0, 6)}`,
        subtitle: `${o.customer_name || 'Cliente'} realizou compra via ${isPix ? 'Pix' : 'Cartão'} de ${formatCurrency(Number(o.total || 0))}`,
        time: new Date(o.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        icon: isPix ? CheckCircle2 : CreditCard,
        badgeColor: isPix 
          ? 'bg-gradient-to-r from-[#006400] via-[#0D8B44] to-[#10B981] text-white shadow-sm shadow-emerald-950/40'
          : 'bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] text-white shadow-sm shadow-blue-950/40'
      });
    }

    // Carts
    for (const c of carts.slice(0, 4)) {
      list.push({
        id: `cart_${c.id}`,
        type: 'cart',
        title: `Carrinho em andamento #${c.cart_number || c.id.slice(0, 6)}`,
        subtitle: `${c.customer_name || 'Cliente'} - ${c.last_action || 'Itens selecionados'} (${formatCurrency(Number(c.total || 0))})`,
        time: new Date(c.last_activity || c.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        icon: ShoppingCart,
        badgeColor: 'bg-gradient-to-r from-[#B45309] via-[#D97706] to-[#F59E0B] text-white shadow-sm shadow-amber-950/40'
      });
    }

    // Live Visitors
    for (const v of allVisits.slice(0, 6)) {
      const loc = v.city && v.state ? `${v.city} - ${v.state}` : (v.country || 'Brasil');
      const page = v.current_page || 'Página Inicial';

      if (page.includes('Produto') || v.product_name) {
        list.push({
          id: `vis_${v.id}`,
          type: 'product',
          title: 'Visualização de Produto',
          subtitle: `Visitante de ${loc} visualizou ${v.product_name || page}`,
          time: new Date(v.last_seen || v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: Tag,
          badgeColor: 'bg-gradient-to-r from-[#1E40AF] via-[#2563EB] to-[#3B82F6] text-white shadow-sm shadow-blue-950/40'
        });
      } else if (page.includes('Endereço')) {
        list.push({
          id: `vis_${v.id}`,
          type: 'address',
          title: 'Preenchimento de Entrega',
          subtitle: `Visitante de ${loc} preencheu o endereço`,
          time: new Date(v.last_seen || v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: MapPin,
          badgeColor: 'bg-gradient-to-r from-[#581C87] via-[#7C3AED] to-[#8B5CF6] text-white shadow-sm shadow-purple-950/40'
        });
      } else {
        list.push({
          id: `vis_${v.id}`,
          type: 'visit',
          title: 'Acesso na Loja',
          subtitle: `Visitante de ${loc} acessou a loja (${v.device || 'Desktop'})`,
          time: new Date(v.last_seen || v.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
          icon: Home,
          badgeColor: 'bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-white shadow-sm shadow-[#D97706]/40'
        });
      }
    }

    return list.slice(0, 8);
  }, [orders, carts, allVisits]);

  // Clear Database Handlers
  const handleClearData = async () => {
    if (!confirm("Tem certeza que deseja limpar as visitas de hoje?")) return;
    try {
      await supabase.from("live_visitors").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      toast.success("Dados de monitoramento resetados com sucesso!");
      fetchLiveVisitors();
      fetchAllVisits();
      refreshData?.();
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Topbar */}
      <AdminTopbar title="Dashboard" />

      {/* Main Content Scrollable Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
              Acompanhar em Tempo Real
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Monitoramento ao vivo de acessos, funil de compras e atividades da loja.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            {/* Period Selector Pills */}
            <div className="flex items-center gap-1 bg-secondary border border-border p-1 rounded-[5px] text-xs overflow-x-auto max-w-full">
              <button
                onClick={() => setDateRange("today")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] transition font-medium whitespace-nowrap ${
                  dateRange === "today"
                    ? `${gradientBtn} text-white shadow-md shadow-[#D97706]/20`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Hoje
              </button>
              <button
                onClick={() => setDateRange("yesterday")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] transition font-medium whitespace-nowrap ${
                  dateRange === "yesterday"
                    ? `${gradientBtn} text-white shadow-md shadow-[#D97706]/20`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Ontem
              </button>
              <button
                onClick={() => setDateRange("7days")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] transition font-medium whitespace-nowrap ${
                  dateRange === "7days"
                    ? `${gradientBtn} text-white shadow-md shadow-[#D97706]/20`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                7 Dias
              </button>
              <button
                onClick={() => setDateRange("30days")}
                className={`px-2.5 sm:px-3 py-1.5 rounded-[5px] transition font-medium whitespace-nowrap ${
                  dateRange === "30days"
                    ? `${gradientBtn} text-white shadow-md shadow-[#D97706]/20`
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                30 Dias
              </button>
            </div>

            <button
              onClick={() => setShowLiveMap(true)}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 text-xs font-medium rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              <Globe className="w-4 h-4 text-[#F59E0B]" />
              <span className="hidden sm:inline">Mapa ao Vivo</span>
            </button>

            <button
              onClick={() => { fetchLiveVisitors(); fetchAllVisits(); refreshData?.(); }}
              title="Atualizar dados"
              className="p-2 rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <button
              onClick={handleClearData}
              title="Limpar visitas de hoje"
              className="p-2 rounded-[5px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 1. TOP 6 KPI CARDS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
          {/* Interações na Loja */}
          <div className="glass-card-hover p-3 sm:p-4 rounded-[5px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Interações na loja</span>
              <div className={`p-2 rounded-[5px] ${gradientBtn} text-white shadow-sm`}>
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{interactionsCount}</div>
              <span className="text-[11px] text-muted-foreground">Páginas e ações</span>
            </div>
          </div>

          {/* Pedidos Pix */}
          <div className="glass-card-hover p-4 rounded-[5px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Pedidos Pix</span>
              <div className={`p-2 rounded-[5px] ${gradientBtn} text-white shadow-sm`}>
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">{totalOrdersCount}</div>
              <span className="text-[11px] text-muted-foreground">Total Pix gerado</span>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="glass-card-hover p-4 rounded-[5px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Taxa de Conversão</span>
              <div className={`p-2 rounded-[5px] ${gradientBtn} text-white shadow-sm`}>
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-400">{conversionRate}%</div>
              <span className="text-[11px] text-green-400/80">Visitantes → Pix</span>
            </div>
          </div>

          {/* Receita Pix (Total Gerado: Pagos ou Não) */}
          <div className="glass-card-hover p-4 rounded-[5px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Receita Pix</span>
              <div className={`p-2 rounded-[5px] ${gradientBtn} text-white shadow-sm`}>
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(totalPixGeneratedRevenue)}
              </div>
              <span className="text-[11px] text-muted-foreground">Total gerado (pagos ou não)</span>
            </div>
          </div>

          {/* Pix Pagos (Valor Total dos Pedidos Pagos via Pix) */}
          <div className="glass-card-hover p-4 rounded-[5px] bg-card border border-emerald-500/30 bg-emerald-950/10 flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-400">Pix Pagos</span>
              <div className="p-2 rounded-[5px] bg-gradient-to-r from-[#006400] via-[#0D8B44] to-[#10B981] text-white shadow-sm shadow-emerald-950/40">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-emerald-400">
                {formatCurrency(paidPixRevenue)}
              </div>
              <span className="text-[11px] text-emerald-400/80 font-medium">
                {paidPixOrders.length} pedido{paidPixOrders.length === 1 ? '' : 's'} confirmado{paidPixOrders.length === 1 ? '' : 's'}
              </span>
            </div>
          </div>

          {/* Ticket Médio Pix */}
          <div className="glass-card-hover p-4 rounded-[5px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-[11px] font-medium uppercase tracking-wider">Ticket Médio Pix</span>
              <div className={`p-2 rounded-[5px] ${gradientBtn} text-white shadow-sm`}>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-foreground">
                {formatCurrency(averageTicket)}
              </div>
              <span className="text-[11px] text-muted-foreground">Média por pedido Pix</span>
            </div>
          </div>
        </div>

        {/* 2. JORNADA DO PEDIDO & ETAPAS COM MAIS ABANDONO */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Jornada do Pedido (Funnel) - 2 Cols */}
          <div className="lg:col-span-2 bg-card border border-border rounded-[5px] p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold text-foreground">Jornada do Pedido</h3>
                  <span className="text-xs text-muted-foreground">(Funil de Conversão)</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-[5px] bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold">
                  <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                  {liveVisitors.length} online
                </div>
              </div>

              {/* 6 Step Visual Funnel Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3 pt-6 pb-2">
                {funnel.map((step) => {
                  const IconComponent = step.icon;
                  const totalOnline = liveVisitors.length;
                  const progressPct = totalOnline > 0 
                    ? Math.round((step.count / totalOnline) * 100) 
                    : 0;

                  return (
                    <div 
                      key={step.id} 
                      className="flex flex-col items-center text-center p-3.5 rounded-[6px] bg-secondary/50 border border-border/80 hover:border-[#F59E0B]/60 hover:bg-secondary/80 hover:shadow-lg hover:shadow-[#D97706]/15 transition-all duration-200 group"
                    >
                      <div className="w-10 h-10 rounded-[6px] bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] flex items-center justify-center text-white shadow-md shadow-[#D97706]/30 mb-2 group-hover:scale-110 transition-transform duration-200">
                        <IconComponent className="w-5 h-5 text-white" />
                      </div>
                      <div className="text-xl font-bold text-foreground mt-1">{step.count}</div>
                      <span className="text-[11px] text-muted-foreground mt-1 font-medium line-clamp-2 min-h-[32px] flex items-center justify-center">
                        {step.label}
                      </span>
                      <div className="w-full bg-background h-1.5 rounded-full mt-3 overflow-hidden border border-border/40">
                        <div 
                          className="bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] h-full rounded-full shadow-[0_0_8px_rgba(245,158,11,0.5)] transition-all duration-500" 
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-muted-foreground font-semibold mt-1.5">{progressPct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-4 mt-2 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Passagem Início → Pagamento: <strong className="text-foreground">{liveVisitors.length > 0 ? Math.round(((funnel[4].count + funnel[5].count) / liveVisitors.length) * 100) : 0}%</strong></span>
              <span>Conversão Total: <strong className="text-green-400">{liveVisitors.length > 0 ? Math.round((funnel[5].count / liveVisitors.length) * 100) : 0}%</strong></span>
            </div>
          </div>

          {/* Etapas com Mais Abandono - 1 Col */}
          <div className="bg-card border border-border rounded-[5px] p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <h3 className="text-base font-semibold text-foreground">Etapas com mais abandono</h3>
              </div>

              <div className="space-y-3 pt-4">
                {abandonmentData.length === 0 ? (
                  <div className="text-center py-10">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground mb-2">
                      <CheckCircle2 className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-xs text-muted-foreground">Sem dados de abandono hoje.</p>
                  </div>
                ) : (
                  abandonmentData.map((item, i) => (
                    <div key={i} className="p-3 rounded-[5px] bg-secondary/80 border border-border">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-foreground">{item.stage}</span>
                        <span className="text-xs font-bold text-amber-400">-{item.rate}%</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">{item.description}</p>
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border text-[10px] text-muted-foreground">
                        <span>Perda estimada: {item.dropCount} usuários</span>
                        <span className="text-[#F59E0B] font-semibold">Gargalo</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-green-400 animate-pulse" />
              <span>Sincronizado em tempo real</span>
            </div>
          </div>
        </div>

        {/* 3. ACESSOS AO LONGO DO DIA (CHART) & ATIVIDADES RECENTES (FEED) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Acessos ao longo do dia (Chart) - 2 Cols */}
          <div className="lg:col-span-2 bg-card border border-border rounded-[5px] p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#F59E0B]" />
                  <h3 className="text-base font-semibold text-foreground">Acessos ao longo do dia</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <span className={`w-2.5 h-2.5 rounded-full ${gradientBtn}`}></span>
                  Acessos ({allVisits.length})
                </div>
              </div>

              {/* 24H Hourly Chart */}
              <div className="pt-6 pb-2">
                <div className="h-44 w-full flex items-end justify-between gap-1 sm:gap-2 px-2 border-b border-border relative">
                  {hourlyData.hours.map((hr, idx) => {
                    const val = hourlyData.counts[idx];
                    const heightPct = Math.max(8, Math.round((val / hourlyData.max) * 100));

                    return (
                      <div key={hr} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 bg-card border border-border px-2 py-0.5 rounded-[5px] text-[10px] text-foreground pointer-events-none whitespace-nowrap z-10 shadow-lg">
                          {hr}: {val} acessos
                        </div>

                        {/* Bar Pillar */}
                        <div 
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[28px] rounded-t-[3px] transition-all duration-300 ${
                            val > 0 
                              ? `${gradientBtn} shadow-md group-hover:brightness-125` 
                              : 'bg-secondary'
                          }`}
                        ></div>
                      </div>
                    );
                  })}
                </div>

                {/* X-Axis Labels */}
                <div className="flex justify-between px-2 pt-2 text-[10px] text-muted-foreground font-mono">
                  {hourlyData.hours.map(hr => (
                    <span key={hr} className="flex-1 text-center truncate">{hr}</span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span>Pico de Tráfego: <strong className="text-foreground">{Math.max(...hourlyData.counts)} visitas</strong></span>
              <span>Total no Período: <strong className="text-foreground">{allVisits.length} interações</strong></span>
            </div>
          </div>

          {/* Atividades Recentes (Feed) - 1 Col */}
          <div className="bg-card border border-border rounded-[5px] p-5 flex flex-col justify-between shadow-lg">
            <div>
              <div className="flex items-center gap-2 pb-4 border-b border-border">
                <Activity className="w-4 h-4 text-green-400" />
                <h3 className="text-base font-semibold text-foreground">Atividades recentes</h3>
              </div>

              <div className="space-y-3 pt-4 max-h-[320px] overflow-y-auto pr-1">
                {recentActivities.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto text-muted-foreground mb-2">
                      <Clock className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-xs text-muted-foreground">Nenhuma atividade registrada hoje.</p>
                  </div>
                ) : (
                  recentActivities.map((act) => {
                    const Icon = act.icon;
                    return (
                      <div key={act.id} className="flex items-start gap-3 p-2.5 rounded-[6px] bg-secondary/70 border border-border hover:border-border/80 transition">
                        <div className={`w-8 h-8 rounded-[6px] ${act.badgeColor} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <Icon className="w-4 h-4 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-semibold text-foreground truncate">{act.title}</p>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{act.time}</span>
                          </div>
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{act.subtitle}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Feed atualizado a cada 3s</span>
              <span className="text-green-400 font-medium">● Conectado</span>
            </div>
          </div>
        </div>

      </div>

      {/* Live View Map Modal */}
      {showLiveMap && (
        <LiveViewMap onClose={() => setShowLiveMap(false)} />
      )}
    </div>
  );
}
