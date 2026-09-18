import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore, type Collection } from "@/contexts/StoreContext";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Link2, ExternalLink, X, Search, Tag, ImageIcon, Lock, LockOpen, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";
const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50";
const labelCls = "text-sm font-medium text-foreground";

const statusColors: Record<string, string> = {
  active: "bg-green-500/10 text-green-400 border-green-500/20",
  inactive: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  "anti-google-v1": "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "anti-meta-ads-v1": "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "anti-crawler-v1": "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

const statusLabels: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  "anti-google-v1": "Anti-Google v1",
  "anti-meta-ads-v1": "Anti-Meta v1",
  "anti-crawler-v1": "Anti-Crawler v1",
};

const allStatuses = ["active", "inactive", "anti-google-v1", "anti-meta-ads-v1", "anti-crawler-v1"];

const emptyCollection: { name: string; slug: string; description: string; image: string; status: "active" | "inactive" | "anti-google-v1" | "anti-meta-ads-v1" | "anti-crawler-v1"; is_featured: boolean } = { name: "", slug: "", description: "", image: "", status: "active", is_featured: false };

const AdminCollections = () => {
  const { collections, products, addCollection, updateCollection, deleteCollection, updateProduct } = useStore();
  const [saving, setSaving] = useState(false);
  const [collectionProductCounts, setCollectionProductCounts] = useState<Record<string, number>>({});
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0 });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Collection | null>(null);
  const [form, setForm] = useState(emptyCollection);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    const loadCounts = async () => {
      const { data } = await supabase.from('product_collections').select('collection_id');
      if (data) {
        const counts: Record<string, number> = {};
        data.forEach((r: any) => { counts[r.collection_id] = (counts[r.collection_id] || 0) + 1; });
        setCollectionProductCounts(counts);
      }
    };
    loadCounts();
  }, [collections, modal]);

  const openStatusDropdown = (id: string, trigger: HTMLButtonElement) => {
    const rect = trigger.getBoundingClientRect();
    const menuWidth = 176;
    const menuHeight = allStatuses.length * 34 + 16;

    const left = Math.min(Math.max(8, rect.left), window.innerWidth - menuWidth - 8);
    const preferredTop = rect.bottom + 6;
    const fitsBelow = preferredTop + menuHeight <= window.innerHeight - 8;
    const top = fitsBelow ? preferredTop : Math.max(8, rect.top - menuHeight - 6);

    setStatusDropdownPos({ top, left });
    setStatusDropdownOpen(id);
  };

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const allSelected = collections.length > 0 && selected.size === collections.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(collections.map(c => c.id)));
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
      for (const id of ids) await deleteCollection(id);
    } else if (["active", "inactive", "anti-google-v1", "anti-meta-ads-v1", "anti-crawler-v1"].includes(bulkAction)) {
      for (const id of ids) await updateCollection(id, { status: bulkAction as any });
    }
    setSelected(new Set());
    setBulkAction("");
  };

  // Product association state
  const [linkedProductIds, setLinkedProductIds] = useState<Set<string>>(new Set());
  const [tagFilter, setTagFilter] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    products.forEach(p => p.tags?.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase())) return false;
      return true;
    });
  }, [products, productSearch]);

  const productsByTag = (tag: string) => products.filter(p => p.tags?.includes(tag));

  const openNew = () => {
    setEditing(null);
    setForm(emptyCollection);
    setLinkedProductIds(new Set());
    setTagFilter("");
    setProductSearch("");
    setModal(true);
  };

  const openEdit = async (c: Collection) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug, description: c.description, image: c.image, status: c.status, is_featured: c.is_featured });
    // Load linked products from junction table
    const { data: links } = await supabase.from('product_collections').select('product_id').eq('collection_id', c.id);
    const linked = new Set((links || []).map((l: any) => l.product_id as string));
    setLinkedProductIds(linked);
    setTagFilter("");
    setProductSearch("");
    setModal(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let collectionId: string;

      if (editing) {
        await updateCollection(editing.id, form);
        collectionId = editing.id;
      } else {
        const newCol = await addCollection(form);
        collectionId = (newCol as any)?.id || '';
        if (!collectionId) {
          // Fallback: find by slug
          const { data } = await supabase.from('collections').select('id').eq('slug', form.slug).single();
          collectionId = data?.id || '';
        }
      }

      if (collectionId) {
        // Remove all existing links for this collection
        await supabase.from('product_collections').delete().eq('collection_id', collectionId);
        // Insert new links
        if (linkedProductIds.size > 0) {
          const inserts = Array.from(linkedProductIds).map(pid => ({
            product_id: pid,
            collection_id: collectionId,
          }));
          await supabase.from('product_collections').insert(inserts);
        }
      }

      setModal(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleProduct = (id: string) => {
    setLinkedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setLinkedProductIds(new Set(filteredProducts.map(p => p.id)));
  const deselectAll = () => setLinkedProductIds(new Set());

  const addByTag = (tag: string) => {
    const tagged = productsByTag(tag);
    setLinkedProductIds(prev => {
      const next = new Set(prev);
      tagged.forEach(p => next.add(p.id));
      return next;
    });
  };

  const removeByTag = (tag: string) => {
    const tagged = productsByTag(tag);
    setLinkedProductIds(prev => {
      const next = new Set(prev);
      tagged.forEach(p => next.delete(p.id));
      return next;
    });
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/store/collection/${slug}?bypass`;
    const success = await copyToClipboard(url);
    if (success) {
      toast.success("Link copiado com sucesso!");
    } else {
      toast.error("Não foi possível copiar o link.");
    }
  };

  return (
    <>
      <AdminTopbar title="Coleções" />
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <p className="text-sm text-muted-foreground">{collections.length} coleções</p>
          {collections.length > 0 && (
            <button onClick={openNew} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>
              <Plus className="w-4 h-4" /> Nova coleção
            </button>
          )}
        </div>

        {collections.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Tag className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhuma coleção cadastrada</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Crie coleções para organizar e agrupar seus produtos.
            </p>
            <button 
              onClick={openNew} 
              className={`flex items-center gap-2 px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}
            >
              <Plus className="w-4 h-4" /> Nova coleção
            </button>
          </div>
        ) : (
          <>
            {/* Bulk actions bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-secondary border border-border rounded-[5px]">
                <span className="text-sm text-foreground font-medium">{selected.size} selecionado(s)</span>
                <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className={`${inputCls} w-auto`}>
                  <option value="">Ação em massa</option>
                  <option value="active">Marcar como Ativo</option>
                  <option value="inactive">Marcar como Inativo</option>
                  <option value="anti-google-v1">Marcar como Anti-Google v1</option>
                  <option value="anti-meta-ads-v1">Marcar como Anti-Meta v1</option>
                  <option value="anti-crawler-v1">Marcar como Anti-Crawler v1</option>
                  <option value="delete">Apagar selecionados</option>
                </select>
                <button onClick={handleBulkAction} disabled={!bulkAction} className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${bulkAction ? `${gradientBtn} text-foreground hover:opacity-90` : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                  Aplicar
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Limpar seleção</button>
              </div>
            )}

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[580px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-[#20B2AA]" />
                  </th>
                  <th className="p-4 font-medium">Imagem</th>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Produtos</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {collections.map(c => (
                  <tr key={c.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selected.has(c.id) ? "bg-secondary/40" : ""}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(c.id)} onChange={() => toggleOne(c.id)} className="w-4 h-4 rounded accent-[#20B2AA]" />
                    </td>
                    <td className="p-4"><img src={c.image || "/placeholder.svg"} alt={c.name} className="w-12 h-12 rounded-[5px] object-cover" /></td>
                    <td className="p-4 text-sm font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => openEdit(c)}>{c.name}</td>
                    <td className="p-4 text-sm text-muted-foreground">{collectionProductCounts[c.id] ?? 0}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[c.status] || statusColors.inactive}`}>
                        {statusLabels[c.status] || c.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (statusDropdownOpen === c.id) {
                                setStatusDropdownOpen(null);
                                return;
                              }
                              openStatusDropdown(c.id, e.currentTarget);
                            }}
                            className={`p-1.5 rounded-[5px] hover:bg-secondary transition-colors ${c.status === "active" ? "text-green-400" : c.status === "anti-google-v1" ? "text-blue-400" : c.status === "anti-meta-ads-v1" ? "text-purple-400" : c.status === "anti-crawler-v1" ? "text-orange-400" : "text-yellow-400"}`}
                            title="Alterar status"
                          >
                            {c.status === "active" ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          {statusDropdownOpen === c.id && createPortal(
                            <>
                              <div className="fixed inset-0 z-[99998]" onClick={() => setStatusDropdownOpen(null)} />
                              <div
                                className="fixed z-[99999] w-44 bg-popover border border-border rounded-[5px] shadow-lg py-1"
                                style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}
                              >
                                {allStatuses.map(s => (
                                  <button key={s} onClick={() => { updateCollection(c.id, { status: s as any }); setStatusDropdownOpen(null); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 ${c.status === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    <span className={`w-2 h-2 rounded-full ${statusColors[s].split(" ")[0].replace("/10", "")}`} />
                                    {statusLabels[s]}
                                  </button>
                                ))}
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                        <button
                          onClick={() => {
                            const featuredCount = collections.filter(col => col.is_featured && col.id !== c.id).length;
                            if (!c.is_featured && featuredCount >= 3) {
                              toast.error("Máximo de 3 coleções favoritas atingido!");
                              return;
                            }
                            updateCollection(c.id, { is_featured: !c.is_featured } as any);
                          }}
                          className={`p-1.5 rounded-[5px] hover:bg-secondary transition-colors ${c.is_featured ? "text-yellow-400" : "text-muted-foreground hover:text-yellow-400"}`}
                          title={c.is_featured ? "Remover dos favoritos" : "Favoritar coleção"}
                        >
                          <Star className={`w-4 h-4 ${c.is_featured ? "fill-yellow-400" : ""}`} />
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: c.id, name: c.name })} className="p-1.5 rounded-[5px] hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        <button onClick={() => copyLink(c.slug)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><Link2 className="w-4 h-4" /></button>
                        <a href={`/store/collection/${c.slug}?bypass`} target="_blank" rel="noreferrer" className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><ExternalLink className="w-4 h-4" /></a>
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

        {/* Full-page Modal */}
        {modal && (
          <div className="fixed inset-0 z-[100] bg-background flex flex-col">
            <div className="flex-1 flex flex-col h-full bg-background animate-in fade-in duration-200">
              <div className="flex-1 overflow-y-auto bg-secondary/10">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 md:p-8">
                  {/* Header aligned with content */}
                  <header className="flex items-center justify-between mb-6 sm:mb-8">
                    <h2 className="text-xl sm:text-2xl font-bold text-foreground">{editing ? "Editar coleção" : "Nova coleção"}</h2>
                    <button onClick={() => setModal(false)} className="p-2 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground">
                      <X className="w-5 h-5 sm:w-6 sm:h-6" />
                    </button>
                  </header>
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-8 items-start">
                    
                    {/* LEFT COLUMN: BASIC INFO */}
                    <div className="lg:col-span-5 space-y-6">
                      <div className="glass-card p-6 space-y-6 border border-border shadow-xl shadow-black/5 bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Informações Básicas</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className={labelCls}>Nome da Coleção</label>
                            <input 
                              type="text" 
                              placeholder="Ex: Ofertas de Verão" 
                              value={form.name} 
                              onChange={e => setForm({ 
                                ...form, 
                                name: e.target.value, 
                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") 
                              })} 
                              className={inputCls} 
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Slug</label>
                            <input type="text" value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={inputCls} />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Descrição</label>
                            <textarea 
                              value={form.description} 
                              onChange={e => setForm({ ...form, description: e.target.value })} 
                              className={`${inputCls} min-h-[100px] resize-none`} 
                              placeholder="Descreva brevemente esta coleção..."
                            />
                          </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                          <div className="flex items-center justify-between gap-4 mb-4">
                            <label className={labelCls}>Status</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className={`${inputCls} !w-[220px]`}>
                              <option value="active">Ativo</option>
                              <option value="inactive">Inativo</option>
                              <option value="anti-google-v1">Anti-Google v1</option>
                              <option value="anti-meta-ads-v1">Anti-Meta v1</option>
                              <option value="anti-crawler-v1">Anti-Crawler v1</option>
                            </select>
                          </div>
                          <label className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/10 rounded-[5px] cursor-pointer hover:bg-primary/10 transition-all group">
                            <input 
                              type="checkbox" 
                              checked={form.is_featured} 
                              onChange={e => setForm({ ...form, is_featured: e.target.checked })} 
                              className="w-4 h-4 rounded accent-primary" 
                            />
                            <div className="flex-1 text-sm font-medium text-foreground group-hover:text-primary transition-colors">Destacar Coleção</div>
                            <Star className={`w-4 h-4 ${form.is_featured ? "fill-primary text-primary" : "text-muted-foreground"}`} />
                          </label>
                        </div>
                      </div>

                      <div className="glass-card p-6 space-y-6 border border-border shadow-xl shadow-black/5 bg-background">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Imagem de Capa</h3>
                        </div>
                        
                        <div className="space-y-4 text-center">
                          <div className="relative group mx-auto w-full aspect-video bg-secondary/20 rounded-xl border-2 border-dashed border-border hover:border-primary/40 transition-all overflow-hidden flex items-center justify-center">
                            {form.image ? (
                              <>
                                <img src={form.image} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={e => e.currentTarget.style.display = 'none'} />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center">
                                  <button onClick={() => setForm({...form, image: ""})} className="p-2 bg-destructive text-destructive-foreground rounded-[5px] hover:scale-110 transition-transform">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                  <span className="text-white text-xs mt-2 font-medium">Remover Imagem</span>
                                </div>
                              </>
                            ) : (
                              <div className="flex flex-col items-center p-6">
                                <ImageIcon className="w-10 h-10 text-muted-foreground/30 mb-2" />
                                <p className="text-sm text-foreground font-medium">Nenhuma imagem</p>
                                <p className="text-xs text-muted-foreground mt-1">Insira uma URL abaixo</p>
                              </div>
                            )}
                          </div>
                          <div className="space-y-1.5 text-left">
                            <label className={labelCls}>URL da Imagem</label>
                            <div className="flex gap-2">
                              <input 
                                type="text" 
                                value={form.image} 
                                onChange={e => setForm({ ...form, image: e.target.value })} 
                                className={inputCls} 
                                placeholder="https://exemplo.com/imagem.jpg" 
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: PRODUCT SELECTION */}
                    <div className="lg:col-span-7 space-y-6">
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5 flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Produtos da Coleção</h3>
                          </div>
                          <span className="px-3 py-1 bg-primary/10 text-primary text-xs font-bold rounded-full border border-primary/10">
                             {linkedProductIds.size} selecionado(s)
                          </span>
                        </div>

                        {/* Search & Bulk Selection Buttons */}
                        <div className="space-y-4">
                           <div className="relative">
                             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                             <input 
                               value={productSearch} 
                               onChange={e => setProductSearch(e.target.value)} 
                               placeholder="Procurar produtos..." 
                               className={`${inputCls} pl-10 h-11 border-border/50 bg-secondary/20`}
                             />
                           </div>
                           <div className="flex flex-wrap gap-2">
                             <button onClick={selectAll} className="px-4 py-2 bg-secondary border border-border rounded-[5px] text-xs font-bold text-foreground hover:bg-accent transition-all">Selecionar Todos</button>
                             <button onClick={deselectAll} className="px-4 py-2 bg-secondary border border-border rounded-[5px] text-xs font-bold text-foreground hover:bg-accent transition-all">Limpar Seleção</button>
                           </div>
                        </div>

                        {/* Tag Filters */}
                        <div className="space-y-2">
                           <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Tag className="w-3 h-3" /> Filtrar por etiquetas
                           </p>
                           <div className="flex flex-wrap gap-1.5 p-1">
                             {allTags.length === 0 ? (
                               <p className="text-xs text-muted-foreground italic">Nenhuma etiqueta cadastrada</p>
                             ) : (
                               allTags.map(tag => {
                                 const tagProducts = productsByTag(tag);
                                 const allLinked = tagProducts.every(p => linkedProductIds.has(p.id)) && tagProducts.length > 0;
                                 return (
                                   <button
                                     key={tag}
                                     onClick={() => allLinked ? removeByTag(tag) : addByTag(tag)}
                                     className={`flex items-center gap-2 px-3 py-1.5 rounded-[5px] text-[11px] font-semibold border transition-all ${
                                       allLinked
                                         ? "bg-primary text-white border-primary shadow-lg shadow-primary/20"
                                         : "bg-secondary/40 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                                     }`}
                                   >
                                     {tag}
                                     <span className={`px-1 rounded ${allLinked ? 'bg-white/20' : 'bg-muted'} text-[9px] underline decoration-transparent`}>
                                       {tagProducts.length}
                                     </span>
                                   </button>
                                 );
                               })
                             )}
                           </div>
                        </div>

                        {/* Scrollable Product list */}
                        <div className="flex-1 overflow-y-auto min-h-0 pr-1 space-y-2 pb-4 scrollbar-thin scrollbar-thumb-primary/20">
                           {filteredProducts.length === 0 ? (
                             <div className="flex flex-col items-center justify-center py-20 text-center">
                               <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mb-4 text-muted-foreground/30">
                                  <Search className="w-8 h-8" />
                               </div>
                               <p className="text-sm text-foreground font-medium">Nenhum produto encontrado</p>
                               <p className="text-xs text-muted-foreground max-w-[200px] mt-1">Tente ajustar sua busca ou filtros</p>
                             </div>
                           ) : (
                             filteredProducts.map(p => (
                               <label key={p.id} className={`flex items-center gap-4 p-3 rounded-[5px] cursor-pointer border transition-all hover:shadow-md ${linkedProductIds.has(p.id) ? "bg-primary/[0.03] border-primary/30" : "bg-background border-border hover:border-primary/20"}`}>
                                 <div className="relative">
                                    <input 
                                      type="checkbox" 
                                      checked={linkedProductIds.has(p.id)} 
                                      onChange={() => toggleProduct(p.id)} 
                                      className="w-5 h-5 rounded-md accent-primary" 
                                    />
                                 </div>
                                 <img src={p.image || "/placeholder.svg"} alt={p.name} className="w-14 h-14 rounded-lg object-cover border border-border/50 shadow-sm" />
                                 <div className="flex-1 min-w-0">
                                   <p className={`text-sm font-bold truncate ${linkedProductIds.has(p.id) ? "text-foreground" : "text-foreground/80"}`}>{p.name}</p>
                                   <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[11px] font-black text-primary">R$ {p.price.toFixed(2).replace(".", ",")}</span>
                                      <span className="text-[10px] text-muted-foreground">· Estoque: {p.stock}</span>
                                   </div>
                                 </div>
                                 {p.tags && p.tags.length > 0 && (
                                   <div className="hidden sm:flex gap-1">
                                     {p.tags.slice(0, 1).map(t => (
                                       <span key={t} className="px-2 py-0.5 bg-secondary text-[9px] font-bold text-muted-foreground border border-border rounded-[5px]">{t}</span>
                                     ))}
                                     {p.tags.length > 1 && <span className="text-[10px] text-muted-foreground font-bold">+{p.tags.length - 1}</span>}
                                   </div>
                                 )}
                               </label>
                             ))
                           )}
                        </div>
                      </div>

                    </div>
                  </div>

                  {/* Footer (Not Sticky) */}
                  <div className="mt-8 pt-6 border-t border-border flex justify-end gap-3">
                    <button onClick={() => setModal(false)} className="px-6 py-2.5 rounded-[5px] border border-border text-foreground text-sm font-bold hover:bg-secondary transition-all">
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={saving} 
                      className={`px-10 py-2.5 rounded-[5px] ${gradientBtn} text-white text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2`}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="animate-spin h-4 w-4" />
                          Salvando...
                        </>
                      ) : "Salvar Coleção"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      {deleteConfirm && createPortal(
        <>
          <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setDeleteConfirm(null)} />
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl p-6 w-full max-w-sm shadow-2xl">
              <h3 className="text-lg font-semibold text-foreground mb-2">Confirmar exclusão</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Tem certeza que deseja excluir <strong className="text-foreground">{deleteConfirm.name}</strong>? Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 justify-end">
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-[5px] border border-border text-foreground hover:bg-secondary transition-colors">Cancelar</button>
                <button onClick={async () => { await deleteCollection(deleteConfirm.id); setDeleteConfirm(null); }} className="px-4 py-2 text-sm rounded-[5px] bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors">Excluir</button>
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
};

export default AdminCollections;