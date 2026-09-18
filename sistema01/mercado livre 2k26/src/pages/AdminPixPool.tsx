import { useState, useEffect, useMemo } from "react";
import AdminTopbar from "@/components/AdminTopbar";
import { 
  Plus, Trash2, Copy, Check, RefreshCw, AlertCircle, 
  Layers, Clock, CheckCircle2, Search, Sparkles, Unlock, QrCode
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";

interface PixCodeItem {
  id: string;
  amount: number;
  code: string;
  tag: string | null;
  status: 'available' | 'reserved' | 'paid' | 'expired';
  order_id: string | null;
  product_id: string | null;
  reserved_at: string | null;
  paid_at: string | null;
  created_at: string;
  order_number?: string;
  customer_name?: string;
  customer_email?: string;
}

interface PixCounts {
  total: number;
  available: number;
  reserved: number;
  paid: number;
}

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

export default function AdminPixPool() {
  const [codes, setCodes] = useState<PixCodeItem[]>([]);
  const [counts, setCounts] = useState<PixCounts>({ total: 0, available: 0, reserved: 0, paid: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'available' | 'reserved' | 'paid'>('all');
  const [search, setSearch] = useState('');

  // Bulk Insert Form State
  const [amountInput, setAmountInput] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [rawCodesText, setRawCodesText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCodes = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/pix-pool');
      if (!res.ok) throw new Error('Falha ao carregar pool de Pix');
      const data = await res.json();
      setCodes(data.codes || []);
      setCounts(data.counts || { total: 0, available: 0, reserved: 0, paid: 0 });
    } catch (err: any) {
      toast.error(err.message || 'Erro ao carregar códigos Pix');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCodes();
    const interval = setInterval(fetchCodes, 10000);
    return () => clearInterval(interval);
  }, []);

  const parsedLines = useMemo(() => {
    return rawCodesText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);
  }, [rawCodesText]);

  const handleBulkInsert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountInput || parsedLines.length === 0) {
      toast.error('Preencha o valor e insira ao menos 1 código Pix.');
      return;
    }

    const numAmount = parseFloat(amountInput.replace(',', '.'));
    if (isNaN(numAmount) || numAmount <= 0) {
      toast.error('Informe um valor numérico válido.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await fetch('/api/pix-pool/bulk-insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: numAmount,
          tag: tagInput.trim() || null,
          codes: parsedLines
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao adicionar códigos');

      toast.success(`${data.count} códigos Pix adicionados com sucesso!`);
      setRawCodesText('');
      setTagInput('');
      setAmountInput('');
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message || 'Erro na inserção');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Deseja excluir este código do estoque?')) return;
    try {
      const res = await fetch(`/api/pix-pool/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao excluir');
      toast.success('Código removido');
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleClear = async (status: 'all' | 'paid' | 'available') => {
    const label = status === 'all' ? 'TODOS os códigos' : status === 'paid' ? 'códigos PAGOS' : 'códigos DISPONÍVEIS';
    if (!confirm(`Tem certeza que deseja limpar ${label}?`)) return;
    try {
      const res = await fetch(`/api/pix-pool/clear/${status}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Falha ao limpar');
      toast.success('Estoque limpo com sucesso');
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleRelease = async (id: string) => {
    try {
      const res = await fetch('/api/pix-pool/release', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (!res.ok) throw new Error('Falha ao liberar');
      toast.success('Código liberado de volta para Disponível!');
      fetchCodes();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleCopy = async (code: string, id: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCopiedId(id);
      toast.success('Código Copia e Cola copiado!');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('Não foi possível copiar.');
    }
  };

  const filteredCodes = useMemo(() => {
    return codes.filter(item => {
      if (activeTab === 'available' && item.status !== 'available') return false;
      if (activeTab === 'reserved' && item.status !== 'reserved') return false;
      if (activeTab === 'paid' && item.status !== 'paid') return false;

      if (search.trim()) {
        const s = search.toLowerCase();
        const matchesCode = item.code.toLowerCase().includes(s);
        const matchesTag = item.tag ? item.tag.toLowerCase().includes(s) : false;
        const matchesOrder = item.order_number ? item.order_number.toLowerCase().includes(s) : false;
        const matchesAmount = item.amount.toString().includes(s);
        return matchesCode || matchesTag || matchesOrder || matchesAmount;
      }
      return true;
    });
  }, [codes, activeTab, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      {/* Topbar */}
      <AdminTopbar title="PIX Copia e Cola" />

      {/* Main Content Area */}
      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
        
        {/* Header Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <QrCode className="w-5 h-5 text-[#F59E0B]" />
              Pool Inteligente por Valor
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Auto-reserva no checkout e liberação automática de códigos não pagos após 5 minutos.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={fetchCodes}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
            <button
              onClick={() => handleClear('paid')}
              className="px-3 py-2 text-xs font-medium rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              Limpar pagos
            </button>
            <button
              onClick={() => handleClear('all')}
              className="px-3 py-2 text-xs font-medium rounded-[5px] bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition"
            >
              Limpar tudo
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div 
            onClick={() => setActiveTab('all')}
            className={`cursor-pointer p-3 sm:p-4 rounded-[6px] border transition-all ${
              activeTab === 'all' 
                ? 'bg-card border-[#F59E0B] shadow-lg shadow-[#D97706]/20 ring-1 ring-[#F59E0B]' 
                : 'bg-card border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <Layers className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{counts.total}</div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">Todos os estados</span>
          </div>

          <div 
            onClick={() => setActiveTab('available')}
            className={`cursor-pointer p-3 sm:p-4 rounded-[6px] border transition-all ${
              activeTab === 'available' 
                ? 'bg-card border-[#F59E0B] shadow-lg shadow-[#D97706]/20 ring-1 ring-[#F59E0B]' 
                : 'bg-card border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-green-400">Disponíveis</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <CheckCircle2 className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">{counts.available}</div>
            <span className="text-[10px] sm:text-[11px] text-green-400/80">Prontos</span>
          </div>

          <div 
            onClick={() => setActiveTab('reserved')}
            className={`cursor-pointer p-3 sm:p-4 rounded-[6px] border transition-all ${
              activeTab === 'reserved' 
                ? 'bg-card border-[#F59E0B] shadow-lg shadow-[#D97706]/20 ring-1 ring-[#F59E0B]' 
                : 'bg-card border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-400">Em Espera</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <Clock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">{counts.reserved}</div>
            <span className="text-[10px] sm:text-[11px] text-amber-400/80">Em 5 min</span>
          </div>

          <div 
            onClick={() => setActiveTab('paid')}
            className={`cursor-pointer p-3 sm:p-4 rounded-[6px] border transition-all ${
              activeTab === 'paid' 
                ? 'bg-card border-[#F59E0B] shadow-lg shadow-[#D97706]/20 ring-1 ring-[#F59E0B]' 
                : 'bg-card border-border hover:border-border/80'
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-purple-400">Pagos</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <Sparkles className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400">{counts.paid}</div>
            <span className="text-[10px] sm:text-[11px] text-purple-400/80">Confirmados</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bulk Insert Form Card */}
          <div className="lg:col-span-1 bg-card border border-border rounded-[5px] p-5 shadow-lg">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-4 h-4 text-[#F59E0B]" />
              <h3 className="text-base font-semibold text-foreground">Adicionar Códigos</h3>
            </div>

            <form onSubmit={handleBulkInsert} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Valor do Pix (R$) <span className="text-red-400">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amountInput}
                    onChange={(e) => setAmountInput(e.target.value)}
                    placeholder="Ex: 97.00"
                    className="w-full pl-9 pr-3 py-2 bg-secondary border border-border rounded-[5px] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Tag Identificadora (opcional)
                </label>
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Ex: Oferta VIP, Kit 3x"
                  className="w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Códigos Pix Copia e Cola <span className="text-red-400">*</span>
                  </label>
                  <span className="text-[11px] text-[#F59E0B] font-semibold">
                    {parsedLines.length} {parsedLines.length === 1 ? 'código' : 'códigos'}
                  </span>
                </div>
                <textarea
                  rows={5}
                  required
                  value={rawCodesText}
                  onChange={(e) => setRawCodesText(e.target.value)}
                  placeholder="Cole 1 código Pix por linha:&#10;00020126...&#10;00020126..."
                  className="w-full p-3 bg-secondary border border-border rounded-[5px] text-xs font-mono text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition"
                />
              </div>

              <div className="p-3 rounded-[5px] bg-secondary/80 border border-border text-[11px] text-muted-foreground flex items-start gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#F59E0B]" />
                <span>
                  <strong>Auto-Release:</strong> Códigos reservados que não forem pagos dentro de 5 minutos voltam automaticamente a ficar <strong>Disponíveis</strong>.
                </span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || parsedLines.length === 0}
                className={`w-full py-2.5 rounded-[5px] ${gradientBtn} text-white font-medium text-sm transition shadow-lg shadow-[#D97706]/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    Adicionar ao Estoque
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Codes Table Card */}
          <div className="lg:col-span-2 bg-card border border-border rounded-[5px] p-5 shadow-lg flex flex-col">
            {/* Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
              {/* Search */}
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar código, valor ou tag..."
                  className="w-full pl-9 pr-3 py-1.5 bg-secondary border border-border rounded-[5px] text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              {/* Tabs Filter */}
              <div className="flex items-center gap-1 bg-secondary p-1 rounded-[5px] border border-border text-xs overflow-x-auto max-w-full">
                <button
                  onClick={() => setActiveTab('all')}
                  className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${activeTab === 'all' ? 'bg-card text-foreground font-medium shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Todos ({counts.total})
                </button>
                <button
                  onClick={() => setActiveTab('available')}
                  className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${activeTab === 'available' ? 'bg-green-500/20 text-green-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Disponíveis ({counts.available})
                </button>
                <button
                  onClick={() => setActiveTab('reserved')}
                  className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${activeTab === 'reserved' ? 'bg-amber-500/20 text-amber-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Em Espera ({counts.reserved})
                </button>
                <button
                  onClick={() => setActiveTab('paid')}
                  className={`px-2.5 py-1 rounded-[5px] transition whitespace-nowrap ${activeTab === 'paid' ? 'bg-purple-500/20 text-purple-400 font-medium' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  Pagos ({counts.paid})
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="flex-1 overflow-x-auto mt-4 -mx-1 sm:mx-0">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-medium">
                    <th className="pb-3 pl-2">Valor</th>
                    <th className="pb-3">Código Pix</th>
                    <th className="pb-3">Tag</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Pedido Vinculado</th>
                    <th className="pb-3 text-right pr-2">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredCodes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12 text-muted-foreground">
                        Nenhum código Pix encontrado com os filtros atuais.
                      </td>
                    </tr>
                  ) : (
                    filteredCodes.map((item) => (
                      <tr key={item.id} className="hover:bg-secondary/40 transition group">
                        <td className="py-3 pl-2 font-semibold text-foreground">
                          R$ {item.amount.toFixed(2).replace('.', ',')}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-foreground max-w-[200px]">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate max-w-[140px] text-muted-foreground">{item.code}</span>
                            <button
                              onClick={() => handleCopy(item.code, item.id)}
                              title="Copiar código Pix"
                              className="p-1 rounded-[5px] hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                            >
                              {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3">
                          {item.tag ? (
                            <span className="px-2 py-0.5 rounded-[5px] bg-secondary text-foreground text-[10px] font-medium border border-border">
                              {item.tag}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="py-3">
                          {item.status === 'available' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-green-500/10 text-green-400 border border-green-500/20 text-[10px] font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                              Disponível
                            </span>
                          )}
                          {item.status === 'reserved' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-medium">
                              <Clock className="w-3 h-3 text-amber-400 animate-spin" />
                              Em espera (5m)
                            </span>
                          )}
                          {item.status === 'paid' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-purple-500/10 text-purple-400 border border-purple-500/20 text-[10px] font-medium">
                              <CheckCircle2 className="w-3 h-3 text-purple-400" />
                              Pago
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-foreground">
                          {item.order_id || item.order_number ? (
                            <div className="flex flex-col">
                              <span className="font-medium text-[#F59E0B] flex items-center gap-1">
                                #{item.order_number || item.order_id?.slice(0, 8)}
                              </span>
                              {item.customer_name && (
                                <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">
                                  {item.customer_name}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/60">-</span>
                          )}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1">
                            {item.status === 'reserved' && (
                              <button
                                onClick={() => handleRelease(item.id)}
                                title="Liberar imediatamente"
                                className="p-1.5 rounded-[5px] bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 transition"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(item.id)}
                              title="Excluir código"
                              className="p-1.5 rounded-[5px] bg-secondary hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
