import { useParams, Link } from "react-router-dom";
import { formatCurrency } from "@/utils/formatters";
import { Package, Truck, CheckCircle2, MapPin, MessageCircle, Loader2, ShieldCheck, HelpCircle, ChevronRight, Search, History } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const TrackOrder = () => {
  const { id } = useParams<{ id: string }>();
  const language = 'pt';
  const [order, setOrder] = useState<any>(null);
  const [shippingSettings, setShippingSettings] = useState<any>(null);
  const [perOrderTracking, setPerOrderTracking] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const searchParams = new URLSearchParams(window.location.search);
      const targetId = id || searchParams.get('id') || searchParams.get('order') || sessionStorage.getItem('last_created_order_id') || localStorage.getItem('last_created_order_id');

      if (!targetId) {
        setIsLoading(false);
        setError(true);
        return;
      }
      
      setIsLoading(true);
      setError(false);
      try {
        // Fetch Order
        let { data: orderData } = await supabase
          .from('orders')
          .select('*')
          .eq('id', targetId)
          .maybeSingle();

        if (!orderData) {
          const { data: dataByNum } = await supabase
            .from('orders')
            .select('*')
            .eq('order_number', targetId)
            .maybeSingle();
          orderData = dataByNum;
        }

        // Fetch Shipping Settings
        const { data: settingsData } = await supabase
          .from('settings')
          .select('value')
          .eq('key', 'delivery_settings')
          .maybeSingle();

        if (orderData) {
          // Parse Items
          if (typeof orderData.items === 'string') {
            try { orderData.items = JSON.parse(orderData.items); } catch (e) { orderData.items = []; }
          }
          // Parse Notes for Tracking
          if (orderData.notes) {
             try { 
               const notes = JSON.parse(orderData.notes);
               if (notes.tracking) setPerOrderTracking(notes.tracking);
             } catch(e) {}
          }
          setOrder(orderData);
        } else {
          setError(true);
        }

        if (settingsData?.value) {
          setShippingSettings(settingsData.value);
        }
      } catch (err) {
        console.error("Critical error fetching tracking data:", err);
        setError(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 6000);
    return () => clearInterval(interval);
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <Loader2 className="w-10 h-10 text-[#3483fa] animate-spin mb-4" />
        <p className="text-[#666] font-medium">Buscando detalhes do pedido...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-full max-w-md bg-white p-12 rounded-lg shadow-sm">
           <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-8 h-8 text-red-500" />
           </div>
           <h1 className="text-xl font-bold text-[#333] mb-2">Pedido não encontrado</h1>
           <p className="text-sm text-[#666] mb-8">Não conseguimos localizar um pedido com os dados informados. Verifique o número e tente novamente.</p>
           <Link to="/store" className="text-sm text-[#3483fa] font-bold hover:underline">Voltar para o início</Link>
        </div>
      </div>
    );
  }

  const statusMap = {
    pending: { label: "Aguardando Pagamento", color: 'text-orange-500', bg: 'bg-orange-500', step: 0 },
    paid: { label: "Pagamento Confirmado", color: 'text-[#00a650]', bg: 'bg-[#00a650]', step: 1 },
    shipped: { label: "Em Trânsito", color: 'text-[#3483fa]', bg: 'bg-[#3483fa]', step: 2 },
    delivered: { label: "Entregue", color: 'text-[#00a650]', bg: 'bg-[#00a650]', step: 3 },
  };

  const currentStatus = statusMap[order.status as keyof typeof statusMap] || statusMap.pending;
  const createdAt = order.created_at ? new Date(order.created_at) : new Date();
  
  // Dynamic Estimate
  const deliveryDays = shippingSettings?.delivery_days_max || 5;
  const deliveryEstimate = new Date(createdAt.getTime() + 1000 * 60 * 60 * 24 * deliveryDays).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'es-MX', { day: 'numeric', month: 'long' });

  // Location Data (Per-order or Global)
  const currentLocation = perOrderTracking?.current_location || shippingSettings?.current_city || (language === 'pt' ? "Centro de Distribuição" : "Centro de Distribución");
  const originPoint = perOrderTracking?.origin || (language === 'pt' ? "Centro de Distribuição" : "Centro de Distribución");
  const destinationPoint = perOrderTracking?.destination || `${order.shipping_city}, ${order.shipping_state}`;

  // History with per-order injections
  const history = [
    { title: "Entregue", status: "delivered", desc: "O pacote foi entregue ao destinatário" },
    { title: "Saiu para entrega", status: "delivered", desc: `O motorista está a caminho de ${destinationPoint}` },
    { title: currentLocation.includes('trânsito') || currentLocation.includes('tránsito') ? currentLocation : `Em trânsito para ${currentLocation}`, status: "shipped", desc: `O pacote está sendo transportado para ${currentLocation}` },
    { title: "Postado", status: "shipped", desc: `O pacote foi postado no centro de distribuição em ${originPoint}` },
    { title: "Preparando envio", status: "paid", desc: "O vendedor está preparando o seu pacote" },
    { title: "Pedido solicitado", status: "pending", desc: "O pedido foi registrado em nosso sistema" }
  ];

  const visibleHistory = history.filter(h => {
     if (order.status === 'delivered') return true;
     if (order.status === 'shipped') return !["Entregue", "Saiu para entrega"].includes(h.title.split(' - ')[0]);
     if (order.status === 'paid') return ["Preparando envio", "Pedido solicitado"].includes(h.title);
     return h.title === "Pedido solicitado";
  });

  return (
    <div className="bg-[#ebebeb] min-h-screen py-8">
      <main className="max-w-[1200px] mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
        
        {/* Coluna Principal: Status do Envio */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card de Status de Entrega */}
          <div className="bg-white rounded-lg shadow-sm border border-[#ddd] overflow-hidden">
             <div className="p-8 pb-4 flex items-start gap-6">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${currentStatus.bg} bg-opacity-10 ${currentStatus.color} border border-current border-opacity-20`}>
                   {order.status === 'delivered' ? <CheckCircle2 className="w-8 h-8" /> : <Truck className="w-8 h-8" />}
                </div>
                <div className="flex-1">
                   <h2 className={`text-2xl md:text-3xl font-bold tracking-tight ${currentStatus.color}`}>
                      {order.status === 'delivered' ? "Chegou!" : `Chega dia ${deliveryEstimate}`}
                   </h2>
                   <p className="text-[#333] font-semibold mt-1">Status: {currentStatus.label}</p>
                   {order.status === 'shipped' && (
                     <p className="text-sm text-[#3483fa] font-bold mt-1 flex items-center gap-1">
                       <MapPin className="w-3.5 h-3.5" />
                       Última atualização: {currentLocation}
                     </p>
                   )}
                   <p className="text-sm text-[#666] mt-4 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-[#00a650]" />
                      Compra Garantida
                   </p>
                </div>
             </div>
             
             {/* Info points (Mobile style) */}
             <div className="px-8 flex flex-col md:flex-row gap-4 md:gap-8 pb-4">
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-orange-400" />
                   <span className="text-[11px] font-bold text-[#999] uppercase tracking-tighter">Origem: {originPoint}</span>
                </div>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 rounded-full bg-green-400" />
                   <span className="text-[11px] font-bold text-[#999] uppercase tracking-tighter">Destino: {destinationPoint}</span>
                </div>
             </div>

             {/* Progress Bar */}
             <div className="px-8 pb-12 pt-6">
                <div className="relative h-2 bg-[#f5f5f5] rounded-full overflow-hidden mb-8">
                   <div className={`absolute left-0 top-0 h-full ${currentStatus.bg} transition-all duration-1000 ease-out`} style={{ width: `${(currentStatus.step + 1) * 25}%` }} />
                </div>
                <div className="flex justify-between text-[11px] md:text-xs text-[#666] font-bold uppercase tracking-wider">
                   <span className={currentStatus.step >= 0 ? 'text-[#333]' : 'opacity-40'}>Pedido Realizado</span>
                   <span className={currentStatus.step >= 1 ? 'text-[#333]' : 'opacity-40'}>Pagamento</span>
                   <span className={currentStatus.step >= 2 ? 'text-[#333]' : 'opacity-40'}>Enviado</span>
                   <span className={currentStatus.step >= 3 ? 'text-[#333]' : 'opacity-40'}>Entregue</span>
                </div>
             </div>
          </div>

          {/* Timeline Detalhada */}
          <div className="bg-white rounded-lg shadow-sm border border-[#ddd] p-8">
             <h3 className="text-xl font-bold text-[#333] mb-10 flex items-center gap-3">
                <History className="w-5 h-5 text-[#3483fa]" />
                Histórico de Movimentação
             </h3>
             <div className="space-y-0 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-[2px] before:bg-[#f5f5f5]">
                {visibleHistory.map((h, i) => (
                  <div key={i} className="relative pl-12 pb-12 last:pb-0 group">
                    <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white z-10 transition-transform group-hover:scale-110 shadow-sm ${
                       i === 0 ? (order.status === 'delivered' ? 'bg-[#00a650]' : 'bg-[#3483fa]') : 'bg-[#ddd]'
                    }`} />
                    <div className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
                       <p className={`text-lg font-bold transition-colors ${i === 0 ? 'text-[#333]' : 'text-[#999]'}`}>
                          {h.title}
                       </p>
                       <p className="text-sm text-[#666] mt-1 pr-4">{h.desc}</p>
                       <div className="flex items-center gap-4 mt-3">
                          <p className="text-[11px] text-[#999] font-bold uppercase tracking-wider bg-[#f9f9f9] px-2 py-1 rounded">
                             {new Date(createdAt.getTime() + (visibleHistory.length - i - 1) * 1000 * 60 * 60 * 12).toLocaleDateString(language === 'pt' ? 'pt-BR' : 'es-MX')}
                          </p>
                       </div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        </div>

        {/* Coluna Lateral */}
        <div className="space-y-6">
           {/* Card do Produto */}
           <div className="bg-white rounded-lg shadow-sm border border-[#ddd] p-6">
              <h3 className="text-base font-bold text-[#333] mb-6 flex justify-between">
                <span>Produtos</span>
              </h3>
              <div className="space-y-6">
                 {Array.isArray(order.items) && order.items.map((item: any, i: number) => (
                   <div key={i} className="flex gap-4 group cursor-pointer">
                      <div className="w-14 h-14 bg-[#f5f5f5] rounded-lg border border-[#eee] flex items-center justify-center shrink-0">
                         <Package className="w-7 h-7 text-[#bbb]" />
                      </div>
                      <div className="flex-1 min-w-0">
                         <p className="text-sm font-semibold text-[#333] leading-tight truncate overflow-hidden whitespace-nowrap">{item.name || item.product_id}</p>
                         <p className="text-xs text-[#666] mt-1">{item.quantity} un. • {formatCurrency(item.price)}</p>
                      </div>
                   </div>
                 ))}
              </div>
              <div className="mt-6 pt-6 border-t border-[#eee] flex justify-between items-center text-[#333]">
                 <span className="text-sm font-bold uppercase opacity-60">Total</span>
                 <span className="text-2xl font-bold tracking-tighter tabular-nums">{formatCurrency(order.total)}</span>
              </div>
           </div>

           {/* Detalhes da Entrega */}
           <div className="bg-white rounded-lg shadow-sm border border-[#ddd] p-8">
              <h3 className="text-base font-bold text-[#333] mb-6">Informaçoes de entrega</h3>
              <div className="flex gap-4 mb-6">
                 <div className="w-10 h-10 rounded-full bg-[#f9f9f9] border border-[#eee] flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-[#333]" />
                 </div>
                 <div className="text-sm text-[#666]">
                    <p className="font-bold text-[#333] mb-1">{order.customer_name}</p>
                    <p className="opacity-80">{order.shipping_address || "Endereço não informado"}</p>
                    <p className="opacity-80">{order.shipping_city}, {order.shipping_state}</p>
                    <p className="opacity-80">{order.shipping_zip}</p>
                 </div>
              </div>
           </div>
        </div>

      </main>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(15px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}} />
    </div>
  );
};

export default TrackOrder;
