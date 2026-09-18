import { useState, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import AdminTopbar from "@/components/AdminTopbar";
import { useStore, type Product, type ProductVariant } from "@/contexts/StoreContext";
import { formatCurrency } from "@/utils/formatters";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Link2, ExternalLink, X, ChevronDown, ChevronUp, Download, CheckSquare, Upload, GripVertical, ArrowUp, ArrowDown, ImageIcon, Lock, LockOpen, Copy, Loader2, Package, Star, Search } from "lucide-react";
import { toast } from "sonner";
import { copyToClipboard } from "@/utils/clipboard";

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

const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

interface VariantOption {
  option_name: string;
  image: string;
  price: number;
  stock: number;
  payment_link: string;
}

interface VariantGroup {
  group_name: string;
  options: VariantOption[];
}

interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_price: number;
  image: string;
  images: string[];
  collection_name: string;
  stock: number;
  status: "active" | "inactive" | "anti-google-v1" | "anti-meta-ads-v1" | "anti-crawler-v1";
  weight: number;
  is_physical: boolean;
  condition: "new" | "used";
  checkout_type: "native" | "external";
  payment_link: string;
  fake_orders: number;
  tags: string[];
  enable_pix: boolean;
  pix_type: "api" | "account" | "copypaste";
  pix_codes: string[];
  enable_boleto: boolean;
  boleto_codes: string[];
  variant_groups: VariantGroup[];
}

const emptyForm: ProductForm = {
  name: "", slug: "", description: "", price: 0, compare_price: 0, image: "", images: [], collection_name: "",
  stock: 0, status: "active", weight: 0, is_physical: true, condition: "new",
  checkout_type: "native", payment_link: "", fake_orders: 0, tags: [],
  enable_pix: false, pix_type: "copypaste", pix_codes: [], enable_boleto: false, boleto_codes: [],
  variant_groups: [],
};

function cleanHtmlDescription(raw: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(raw, "text/html");
  doc.querySelectorAll("script, style").forEach(el => el.remove());
  return doc.body.innerHTML.trim();
}

function variantsToGroups(variants: ProductVariant[]): VariantGroup[] {
  const map: Record<string, VariantGroup> = {};
  for (const v of variants) {
    if (!map[v.group_name]) map[v.group_name] = { group_name: v.group_name, options: [] };
    map[v.group_name].options.push({ option_name: v.option_name, image: v.image || "", price: v.price, stock: v.stock, payment_link: (v as any).payment_link || "" });
  }
  return Object.values(map);
}

function groupsToVariants(groups: VariantGroup[]): ProductVariant[] {
  const result: ProductVariant[] = [];
  for (const g of groups) {
    for (const o of g.options) {
      result.push({ group_name: g.group_name, option_name: o.option_name, image: o.image || undefined, price: o.price, stock: o.stock, payment_link: o.payment_link || undefined } as any);
    }
  }
  return result;
}

const inputCls = "w-full px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-[#F59E0B]/50";
const labelCls = "text-sm font-medium text-foreground";
const sectionCls = "border border-border rounded-[5px] p-4 space-y-3";

const AdminProducts = () => {
  const { products, collections, addProduct, updateProduct, deleteProduct } = useStore();
  const [statusDropdownOpen, setStatusDropdownOpen] = useState<string | null>(null);
  const [statusDropdownPos, setStatusDropdownPos] = useState({ top: 0, left: 0 });
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [priceStr, setPriceStr] = useState<string>("");
  const [comparePriceStr, setComparePriceStr] = useState<string>("");
  const [variantPriceStr, setVariantPriceStr] = useState<Record<string, string>>({});
  const [tagInput, setTagInput] = useState("");
  const [pixInput, setPixInput] = useState("");
  const [boletoInput, setBoletoInput] = useState("");
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({ basic: true });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importFileRef = useRef<HTMLInputElement>(null);

  // New Export/Import state
  const [importModal, setImportModal] = useState(false);
  const [importData, setImportData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const urlToBase64 = async (url: string): Promise<string> => {
    if (!url || url.startsWith("data:")) return url;
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } catch (e) {
      console.error("Base64 conversion failed", e);
      return url;
    }
  };

  const handleImportFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (Array.isArray(data)) {
          setImportData(data);
          setImportModal(true);
        } else {
          toast.error("Formato de arquivo inválido. Deve ser um array de produtos.");
        }
      } catch (err) {
        toast.error("Erro ao ler o arquivo.");
      }
    };
    reader.readAsText(file);
    if (importFileRef.current) importFileRef.current.value = "";
  };

  const handleImportConfirm = async () => {
    if (importData.length === 0) return;
    setIsImporting(true);
    let importedCount = 0;
    try {
      for (const p of importData) {
        const { id, created_at, updated_at, sales, visits, variants, slug, ...rest } = p;
        // Generate new slug to avoid conflicts
        const newSlug = `${slug}-imported-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await addProduct({ 
          ...rest, 
          slug: newSlug,
          variants: variants || [] 
        });
        importedCount++;
      }
      toast.success(`${importedCount} produtos importados com sucesso!`);
      setImportModal(false);
      setImportData([]);
    } catch (err) {
      console.error("Import error:", err);
      toast.error("Ocorreu um erro durante a importação.");
    } finally {
      setIsImporting(false);
    }
  };

  const handleExportDetailed = async (ids: string[]) => {
    const selectedProducts = products.filter(p => ids.includes(p.id));
    toast.info("Convertendo imagens para o backup portátil. Aguarde...");
    
    try {
      const exportData = await Promise.all(selectedProducts.map(async p => {
        const mainImage = await urlToBase64(p.image);
        const galleryImages = await Promise.all((p.images || []).map(url => urlToBase64(url)));
        const variantsWithImages = await Promise.all((p.variants || []).map(async v => ({
          ...v,
          image: v.image ? await urlToBase64(v.image) : ""
        })));

        return {
          ...p,
          image: mainImage,
          images: galleryImages,
          variants: variantsWithImages
        };
      }));

      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `produtos_backup_${Date.now()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exportação concluída com sucesso!");
    } catch (err) {
      console.error("Export error:", err);
      toast.error("Falha ao exportar produtos.");
    }
  };

  // Image helpers
  const addImageUrl = () => {
    if (imageUrlInput.trim()) {
      const imgs = [...form.images, imageUrlInput.trim()];
      setForm({ ...form, images: imgs, image: imgs[0] });
      setImageUrlInput("");
    }
  };
  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newImages = [...form.images];
    for (const file of Array.from(files)) {
      const ext = file.name.split(".").pop();
      const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(path);
        newImages.push(urlData.publicUrl);
      }
    }
    setForm({ ...form, images: newImages, image: newImages[0] || "" });
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };
  const removeImage = (index: number) => {
    const imgs = form.images.filter((_, i) => i !== index);
    setForm({ ...form, images: imgs, image: imgs[0] || "" });
  };
  const moveImage = (index: number, direction: "up" | "down") => {
    const imgs = [...form.images];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= imgs.length) return;
    [imgs[index], imgs[target]] = [imgs[target], imgs[index]];
    setForm({ ...form, images: imgs, image: imgs[0] || "" });
  };

  // Bulk selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState("");
  const [duplicateModal, setDuplicateModal] = useState(false);
  const [duplicateCount, setDuplicateCount] = useState(1);
  const [duplicating, setDuplicating] = useState(false);

  const allSelected = products.length > 0 && selected.size === products.length;
  const toggleAll = () => {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(products.map(p => p.id)));
  };
  const toggleOne = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleDuplicate = async () => {
    if (selected.size === 0 || duplicateCount < 1) return;
    setDuplicating(true);
    const ids = Array.from(selected);
    let totalCreated = 0;

    try {
      for (const id of ids) {
        // Fetch full product data
        const { data: productData } = await supabase
          .from('products')
          .select('*')
          .eq('id', id)
          .single();

        if (!productData) continue;

        // Fetch variants for this product
        const { data: variantsData } = await supabase
          .from('product_variants')
          .select('*')
          .eq('product_id', id);

        for (let i = 0; i < duplicateCount; i++) {
          const suffix = `-copia-${Date.now()}-${i + 1}`;
          const newSlug = productData.slug + suffix;

          // Remove id, created_at, updated_at and set new slug
          const { id: _id, created_at: _ca, updated_at: _ua, slug: _slug, ...rest } = productData;

          const { data: newProduct, error } = await supabase
            .from('products')
            .insert({ ...rest, slug: newSlug })
            .select()
            .single();

          if (error || !newProduct) {
            console.error('Error duplicating product:', error);
            continue;
          }

          // Duplicate variants
          if (variantsData && variantsData.length > 0) {
            const newVariants = variantsData.map(v => {
              const { id: _vid, created_at: _vca, product_id: _pid, ...vRest } = v;
              return { ...vRest, product_id: newProduct.id };
            });

            await supabase.from('product_variants').insert(newVariants);
          }

          totalCreated++;
        }
      }

      toast.success(`${totalCreated} produto(s) duplicado(s) com sucesso!`);
      // Refresh products
      window.location.reload();
    } catch (err) {
      console.error('Duplicate error:', err);
      toast.error('Erro ao duplicar produtos');
    } finally {
      setDuplicating(false);
      setDuplicateModal(false);
      setDuplicateCount(1);
      setSelected(new Set());
      setBulkAction("");
    }
  };

  const handleBulkAction = async () => {
    if (selected.size === 0 || !bulkAction) return;
    const ids = Array.from(selected);

    if (bulkAction === "duplicate") {
      setDuplicateModal(true);
      return;
    }

    if (bulkAction === "delete") {
      for (const id of ids) await deleteProduct(id);
    } else if (["active", "inactive", "anti-google-v1", "anti-meta-ads-v1", "anti-crawler-v1"].includes(bulkAction)) {
      for (const id of ids) await updateProduct(id, { status: bulkAction as any });
    } else if (bulkAction === "export") {
      await handleExportDetailed(ids);
    }
    setSelected(new Set());
    setBulkAction("");
  };

  const toggleSection = (s: string) => setExpandedSections(prev => ({ ...prev, [s]: !prev[s] }));

  const openNew = () => { setEditing(null); setForm(emptyForm); setPriceStr(""); setComparePriceStr(""); setVariantPriceStr({}); setExpandedSections({ basic: true }); setModal(true); };
  const openEdit = (p: Product) => {
    setEditing(p);
    setPriceStr(String(p.price));
    setComparePriceStr(String(p.compare_price));
    setVariantPriceStr({});
    setForm({
      name: p.name, slug: p.slug, description: p.description, price: p.price,
      compare_price: p.compare_price, image: p.image, images: [...(p.images || [])], collection_name: p.collection_name || "",
      stock: p.stock, status: p.status, weight: p.weight, is_physical: p.is_physical,
      condition: p.condition, checkout_type: p.checkout_type, payment_link: p.payment_link || "",
      fake_orders: p.fake_orders, tags: [...p.tags], enable_pix: p.enable_pix, pix_type: p.pix_type,
      pix_codes: [...p.pix_codes], enable_boleto: p.enable_boleto, boleto_codes: [...p.boleto_codes],
      variant_groups: variantsToGroups(p.variants || []),
    });
    setExpandedSections({ basic: true });
    setModal(true);
  };

  const [formErrors, setFormErrors] = useState<string[]>([]);

  const validateForm = (): string[] => {
    const errors: string[] = [];
    if (!form.name.trim()) errors.push("Título é obrigatório");
    if (!form.slug.trim()) errors.push("Slug é obrigatório");
    if (!form.description.trim()) errors.push("Descrição é obrigatória");
    if (form.price <= 0) errors.push("Preço deve ser maior que zero");
    if (form.stock < 0) errors.push("Estoque não pode ser negativo");
    if (form.images.length === 0 && !form.image.trim()) errors.push("Pelo menos uma imagem é obrigatória");
    
    if (form.is_physical && form.weight <= 0) errors.push("Peso é obrigatório para produtos físicos");
    if (form.checkout_type === "external" && !form.payment_link.trim()) errors.push("Link de pagamento é obrigatório para checkout externo");
    if (form.enable_pix && form.pix_codes.length === 0) errors.push("Adicione pelo menos um código PIX");
    if (form.enable_boleto && form.boleto_codes.length === 0) errors.push("Adicione pelo menos um código de boleto");
    for (const g of form.variant_groups) {
      if (!g.group_name.trim()) errors.push("Nome do grupo de variantes é obrigatório");
      for (const o of g.options) {
        const groupLabel = g.group_name.trim() || "sem nome";
        const optLabel = o.option_name.trim() || "sem nome";
        if (!o.option_name.trim()) errors.push(`Opção sem nome no grupo "${groupLabel}"`);
        if (!(o.price > 0)) errors.push(`Preço é obrigatório na variante "${optLabel}" do grupo "${groupLabel}"`);
        if (!(o.stock > 0)) errors.push(`Estoque é obrigatório na variante "${optLabel}" do grupo "${groupLabel}"`);
      }
    }
    return errors;
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors([]);
    setSaving(true);
    try {
      const cleanedDesc = cleanHtmlDescription(form.description);
      const data: any = { ...form, description: cleanedDesc, variants: groupsToVariants(form.variant_groups) };
      delete data.variant_groups;
      if (editing) await updateProduct(editing.id, data);
      else await addProduct(data);
      setModal(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao salvar produto");
    } finally {
      setSaving(false);
    }
  };

  const copyLink = async (slug: string) => {
    const url = `${window.location.origin}/store/product/${slug}?bypass`;
    const success = await copyToClipboard(url);
    if (success) {
      toast.success("Link do produto copiado com sucesso!");
    } else {
      toast.error("Não foi possível copiar o link.");
    }
  };

  const addTag = () => { if (tagInput.trim() && !form.tags.includes(tagInput.trim())) { setForm({ ...form, tags: [...form.tags, tagInput.trim()] }); setTagInput(""); } };
  const removeTag = (t: string) => setForm({ ...form, tags: form.tags.filter(x => x !== t) });
  const addPixCode = () => { if (pixInput.trim()) { setForm({ ...form, pix_codes: [...form.pix_codes, pixInput.trim()] }); setPixInput(""); } };
  const removePixCode = (i: number) => setForm({ ...form, pix_codes: form.pix_codes.filter((_, idx) => idx !== i) });
  const addBoletoCode = () => { if (boletoInput.trim()) { setForm({ ...form, boleto_codes: [...form.boleto_codes, boletoInput.trim()] }); setBoletoInput(""); } };
  const removeBoletoCode = (i: number) => setForm({ ...form, boleto_codes: form.boleto_codes.filter((_, idx) => idx !== i) });

  const addVariantGroup = () => setForm({ ...form, variant_groups: [...form.variant_groups, { group_name: "", options: [{ option_name: "", image: "", price: 0, stock: 0, payment_link: "" }] }] });
  const removeVariantGroup = (i: number) => { setForm({ ...form, variant_groups: form.variant_groups.filter((_, idx) => idx !== i) }); setVariantPriceStr({}); };
  const updateGroupName = (i: number, name: string) => {
    const groups = [...form.variant_groups]; groups[i] = { ...groups[i], group_name: name }; setForm({ ...form, variant_groups: groups });
  };
  const addVariantOption = (gi: number) => {
    const groups = [...form.variant_groups]; groups[gi] = { ...groups[gi], options: [...groups[gi].options, { option_name: "", image: "", price: 0, stock: 0, payment_link: "" }] }; setForm({ ...form, variant_groups: groups });
  };
  const removeVariantOption = (gi: number, oi: number) => {
    const groups = [...form.variant_groups]; groups[gi] = { ...groups[gi], options: groups[gi].options.filter((_, idx) => idx !== oi) }; setForm({ ...form, variant_groups: groups });
    setVariantPriceStr(prev => {
      const next: Record<string, string> = {};
      for (const [k, val] of Object.entries(prev)) {
        const [kgi, koi] = k.split(":").map(Number);
        if (kgi !== gi) { next[k] = val; continue; }
        if (koi === oi) continue;
        const newOi = koi > oi ? koi - 1 : koi;
        next[`${kgi}:${newOi}`] = val;
      }
      return next;
    });
  };
  const updateVariantOption = (gi: number, oi: number, field: string, value: any) => {
    const groups = [...form.variant_groups]; const opts = [...groups[gi].options]; opts[oi] = { ...opts[oi], [field]: value }; groups[gi] = { ...groups[gi], options: opts }; setForm({ ...form, variant_groups: groups });
  };

  const SectionHeader = ({ id, title }: { id: string; title: string }) => (
    <button type="button" onClick={() => toggleSection(id)} className="flex items-center justify-between w-full text-sm font-semibold text-foreground">
      {title}
      {expandedSections[id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
    </button>
  );

  return (
    <>
      <AdminTopbar title="Produtos" />
      <main className="flex-1 p-3 sm:p-6 overflow-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
          <p className="text-sm text-muted-foreground">{products.length} produtos</p>
          {products.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                ref={importFileRef}
                onChange={handleImportFileSelect}
                accept=".json"
                className="hidden"
              />
              <button 
                onClick={() => importFileRef.current?.click()} 
                className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[5px] bg-secondary border border-border text-foreground text-sm font-medium hover:bg-accent transition-all"
              >
                <Upload className="w-4 h-4" /> Importar
              </button>
              <button onClick={openNew} className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}>
                <Plus className="w-4 h-4" /> Novo produto
              </button>
            </div>
          )}
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-secondary/20 border border-dashed border-border rounded-xl">
            <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mb-4">
              <Package className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-lg font-semibold text-foreground">Nenhum produto encontrado</h3>
            <p className="text-sm text-muted-foreground mt-1 mb-6">Parece que você ainda não tem produtos cadastrados.</p>
            <div className="flex gap-3">
              <button 
                onClick={openNew} 
                className={`flex items-center gap-2 px-6 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all`}
              >
                <Plus className="w-4 h-4" /> Novo produto
              </button>
              <button 
                onClick={() => importFileRef.current?.click()} 
                className="flex items-center gap-2 px-6 py-2.5 rounded-[5px] bg-secondary border border-border text-foreground text-sm font-medium hover:bg-accent transition-all"
              >
                <Upload className="w-4 h-4" /> Importar produtos
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Bulk actions bar */}
            {selected.size > 0 && (
              <div className="flex items-center gap-3 mb-4 p-3 bg-secondary border border-border rounded-[5px]">
                <span className="text-sm text-foreground font-medium">{selected.size} selecionado(s)</span>
                <select value={bulkAction} onChange={e => setBulkAction(e.target.value)} className={`${inputCls} w-auto`}>
                  <option value="">Ações em massa</option>
                  <option value="active">Marcar como Ativo</option>
                  <option value="inactive">Marcar como Inativo</option>
                  <option value="anti-google-v1">Marcar como Anti-Google v1</option>
                  <option value="anti-meta-ads-v1">Marcar como Anti-Meta v1</option>
                  <option value="anti-crawler-v1">Marcar como Anti-Crawler v1</option>
                  <option value="duplicate">Duplicar selecionados</option>
                  <option value="delete">Excluir selecionados</option>
                  <option value="export">Exportar selecionados</option>
                </select>
                <button onClick={handleBulkAction} disabled={!bulkAction} className={`px-4 py-2 rounded-[5px] text-sm font-medium transition-all ${bulkAction ? `${gradientBtn} text-foreground hover:opacity-90` : "bg-muted text-muted-foreground cursor-not-allowed"}`}>
                  Aplicar
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-muted-foreground hover:text-foreground ml-auto">Limpar seleção</button>
              </div>
            )}

        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto -mx-1 sm:mx-0">
            <table className="w-full min-w-[620px]">
              <thead>
                <tr className="text-left text-xs text-muted-foreground border-b border-border">
                  <th className="p-4 font-medium w-10">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} className="w-4 h-4 rounded accent-[#20B2AA]" />
                  </th>
                  <th className="p-4 font-medium">Imagem</th>
                  <th className="p-4 font-medium">Nome</th>
                  <th className="p-4 font-medium">Preço</th>
                  <th className="p-4 font-medium">Status</th>
                  <th className="p-4 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} className={`border-b border-border/50 hover:bg-secondary/30 transition-colors ${selected.has(p.id) ? "bg-secondary/40" : ""}`}>
                    <td className="p-4">
                      <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleOne(p.id)} className="w-4 h-4 rounded accent-[#20B2AA]" />
                    </td>
                    <td className="p-4"><img src={p.image || "/placeholder.svg"} alt={p.name} className="w-12 h-12 rounded-[5px] object-cover" /></td>
                    <td className="p-4 text-sm font-medium text-foreground cursor-pointer hover:text-primary hover:underline" onClick={() => openEdit(p)}>{p.name.split(' ').slice(0, 5).join(' ')}{p.name.split(' ').length > 5 ? '...' : ''}</td>
                    <td className="p-4 text-sm text-foreground">{formatCurrency(p.price)}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColors[p.status] || statusColors.inactive}`}>{statusLabels[p.status] || p.status}</span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <div className="relative">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (statusDropdownOpen === p.id) {
                                setStatusDropdownOpen(null);
                                return;
                              }
                              openStatusDropdown(p.id, e.currentTarget);
                            }}
                            className={`p-1.5 rounded-[5px] hover:bg-secondary transition-colors ${p.status === "active" ? "text-green-400" : p.status === "anti-google-v1" ? "text-blue-400" : p.status === "anti-meta-ads-v1" ? "text-purple-400" : p.status === "anti-crawler-v1" ? "text-orange-400" : "text-yellow-400"}`}
                            title="Alterar status"
                          >
                            {p.status === "active" ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          {statusDropdownOpen === p.id && createPortal(
                            <>
                              <div className="fixed inset-0 z-[99998]" onClick={() => setStatusDropdownOpen(null)} />
                              <div
                                className="fixed z-[99999] w-44 bg-popover border border-border rounded-[5px] shadow-lg py-1"
                                style={{ top: statusDropdownPos.top, left: statusDropdownPos.left }}
                              >
                                {allStatuses.map(s => (
                                  <button key={s} onClick={() => { updateProduct(p.id, { status: s as any }); setStatusDropdownOpen(null); }} className={`w-full text-left px-3 py-2 text-xs hover:bg-secondary transition-colors flex items-center gap-2 ${p.status === s ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                                    <span className={`w-2 h-2 rounded-full ${statusColors[s].split(" ")[0].replace("/10", "")}`} />
                                    {statusLabels[s]}
                                  </button>
                                ))}
                              </div>
                            </>,
                            document.body
                          )}
                        </div>
                        <button onClick={() => setDeleteConfirm({ id: p.id, name: p.name })} className="p-1.5 rounded-[5px] hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                        <button type="button" onClick={() => copyLink(p.slug)} className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Copiar link do produto"><Link2 className="w-4 h-4" /></button>
                        <a href={`/store/product/${p.slug}?bypass`} target="_blank" rel="noreferrer" className="p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"><ExternalLink className="w-4 h-4" /></a>
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
                <div className="max-w-7xl mx-auto p-6 md:p-8">
                  {/* Header aligned with content */}
                  <header className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-foreground">{editing ? "Editar produto" : "Novo produto"}</h2>
                    <button onClick={() => { setModal(false); setFormErrors([]); }} className="p-2 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground">
                      <X className="w-6 h-6" />
                    </button>
                  </header>

                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: MAIN INFO (8 cols) */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* BASIC INFORMATION */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Informações Básicas</h3>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-1.5">
                            <label className={labelCls}>Nome do Produto</label>
                            <input 
                              value={form.name} 
                              onChange={e => setForm({ 
                                ...form, 
                                name: e.target.value, 
                                slug: e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") 
                              })} 
                              className={inputCls} 
                              placeholder="Fritadeira Elétrica Air Fryer 4L..."
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Slug (URL do produto)</label>
                            <div className="flex gap-2">
                              <input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} className={`${inputCls} flex-1`} />
                              {form.slug && (
                                <button
                                  type="button"
                                  onClick={() => copyLink(form.slug)}
                                  className="px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-xs font-medium hover:bg-accent transition-all flex items-center gap-1.5 flex-shrink-0"
                                  title="Copiar link do produto"
                                >
                                  <Link2 className="w-3.5 h-3.5" /> Copiar link
                                </button>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1.5">
                            <label className={labelCls}>Descrição HTML</label>
                            <textarea 
                              value={form.description} 
                              onChange={e => setForm({ ...form, description: e.target.value })} 
                              className={`${inputCls} min-h-[160px] resize-none font-mono text-xs`} 
                              placeholder="Cole o código HTML aqui..."
                            />
                            <p className="text-[10px] text-muted-foreground flex items-center gap-1.5 mt-1">
                               <Package className="w-3 h-3" /> Apenas elementos HTML seguros serão mantidos.
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* MULTI-IMAGE MANAGER */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Galeria de Imagens</h3>
                        </div>

                        <div className="space-y-6">
                          {/* Upload Actions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                              onClick={() => fileInputRef.current?.click()}
                              className="group cursor-pointer border-2 border-dashed border-border hover:border-primary/40 rounded-xl p-6 flex flex-col items-center justify-center transition-all bg-secondary/20 hover:bg-primary/[0.02]"
                            >
                              <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload className="w-5 h-5 text-primary" />
                              </div>
                              <p className="text-xs font-bold text-foreground">Upload de Arquivos</p>
                              <p className="text-[10px] text-muted-foreground mt-1 text-center">Arraste ou clique para selecionar</p>
                              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={e => handleFileUpload(e.target.files)} className="hidden" />
                            </div>

                            <div className="flex flex-col justify-center gap-3">
                               <label className={labelCls}>URL da Imagem</label>
                               <div className="flex gap-2">
                                  <input
                                    value={imageUrlInput}
                                    onChange={e => setImageUrlInput(e.target.value)}
                                    onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                                    placeholder="https://exemplo.com/imagem.png"
                                    className={`${inputCls} flex-1`}
                                  />
                                  <button type="button" onClick={addImageUrl} className="px-4 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm font-bold hover:bg-accent transition-all">
                                    +
                                  </button>
                               </div>
                            </div>
                          </div>

                          {/* Image Grid */}
                          {form.images.length > 0 ? (
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                               {form.images.map((img, i) => (
                                 <div key={i} className={`relative group border rounded-xl overflow-hidden aspect-square bg-secondary/30 transition-all ${i === 0 ? "border-primary ring-2 ring-primary/20 shadow-lg" : "border-border/50"}`}>
                                    <img src={img} alt={`Img ${i + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    
                                    {/* Order badge */}
                                    <span className={`absolute top-2 left-2 w-5 h-5 flex items-center justify-center rounded-md text-[10px] font-black border ${i === 0 ? "bg-primary text-white border-primary" : "bg-black/60 text-white border-white/20"}`}>
                                      {i + 1}
                                    </span>

                                    {/* Controls overlay */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                      <div className="flex gap-1.5">
                                        <button onClick={() => moveImage(i, "up")} disabled={i === 0} className="p-1.5 rounded-[5px] bg-white/20 text-white hover:bg-white/40 disabled:opacity-20 transition-all">
                                          <ArrowUp className="w-4 h-4 -rotate-90" />
                                        </button>
                                        <button onClick={() => moveImage(i, "down")} disabled={i === form.images.length - 1} className="p-1.5 rounded-[5px] bg-white/20 text-white hover:bg-white/40 disabled:opacity-20 transition-all">
                                          <ArrowDown className="w-4 h-4 -rotate-90" />
                                        </button>
                                      </div>
                                      <button onClick={() => removeImage(i)} className="p-1.5 rounded-[5px] bg-destructive text-white hover:scale-110 transition-transform">
                                        <Trash2 className="w-4 h-4" />
                                      </button>
                                    </div>

                                    {i === 0 && (
                                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-primary text-[9px] font-black text-white text-center rounded uppercase tracking-widest">Capa</div>
                                    )}
                                 </div>
                               ))}
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-20 bg-secondary/10 border border-dashed border-border/60 rounded-xl text-muted-foreground/40">
                               <ImageIcon className="w-12 h-12 mb-3" />
                               <p className="text-sm font-medium">Nenhuma imagem adicionada</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* PRICING & STOCK */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Preços e Estoque</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                           <div className="space-y-4">
                              <div className="space-y-1.5">
                                <label className={labelCls}>Preço de Venda</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                                  <input 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={form.price === 0 && !priceStr ? '' : priceStr ?? String(form.price)} 
                                    onChange={e => { const v = e.target.value.replace(',', '.'); if (/^\d*\.?\d*$/.test(v)) { setPriceStr(v); setForm({ ...form, price: parseFloat(v) || 0 }); } }} 
                                    className={`${inputCls} pl-10`} 
                                    placeholder="0,00" 
                                  />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className={labelCls}>Preço Original (Comparativo)</label>
                                <div className="relative">
                                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-bold">R$</span>
                                  <input 
                                    type="text" 
                                    inputMode="decimal" 
                                    value={form.compare_price === 0 && !comparePriceStr ? '' : comparePriceStr ?? String(form.compare_price)} 
                                    onChange={e => { const v = e.target.value.replace(',', '.'); if (/^\d*\.?\d*$/.test(v)) { setComparePriceStr(v); setForm({ ...form, compare_price: parseFloat(v) || 0 }); } }} 
                                    className={`${inputCls} pl-10 opacity-70`} 
                                    placeholder="0,00" 
                                  />
                                </div>
                              </div>
                           </div>

                           <div className="space-y-4">
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                  <label className={labelCls}>Estoque Inicial</label>
                                  <input type="number" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className={inputCls} />
                                </div>
                                <div className="space-y-1.5">
                                  <label className={labelCls}>Peso (gramas)</label>
                                  <input type="number" value={form.weight} onChange={e => setForm({ ...form, weight: Number(e.target.value) })} className={inputCls} />
                                </div>
                              </div>
                              <div className="space-y-1.5">
                                <label className={labelCls}>Pedidos Mock/Fake</label>
                                <input type="number" value={form.fake_orders} onChange={e => setForm({ ...form, fake_orders: Number(e.target.value) })} className={inputCls} placeholder="Ex: 50" />
                                <p className="text-[10px] text-muted-foreground">Número fictício mostrado na página do produto</p>
                              </div>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT COLUMN: SETTINGS (4 cols) */}
                    <div className="lg:col-span-4 space-y-6">
                      
                      {/* STATUS & VISIBILITY */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Status e Visibilidade</h3>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className={labelCls}>Status Atual</label>
                              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })} className={`${inputCls} !w-full`}>
                                <option value="active">Ativo (Visível)</option>
                                <option value="inactive">Inativo (Oculto)</option>
                                <option value="anti-google-v1">Anti-Google v1</option>
                                <option value="anti-meta-ads-v1">Anti-Meta v1</option>
                                <option value="anti-crawler-v1">Anti-Crawler v1</option>
                              </select>
                           </div>

                           <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1.5">
                                <label className={labelCls}>Condição</label>
                                <select value={form.condition} onChange={e => setForm({ ...form, condition: e.target.value as any })} className={inputCls}>
                                  <option value="new">Produto Novo</option>
                                  <option value="used">Usado / Recondicionado</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className={labelCls}>Categorização Interna</label>
                                <select value={form.is_physical ? "physical" : "digital"} onChange={e => setForm({ ...form, is_physical: e.target.value === "physical" })} className={inputCls}>
                                  <option value="physical">Produto Físico</option>
                                  <option value="digital">Produto Digital / Link</option>
                                </select>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* ETIQUETAS / TAGS */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Etiquetas</h3>
                        </div>

                        <div className="space-y-4">
                           <div className="flex gap-2">
                             <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => e.key === "Enter" && (e.preventDefault(), addTag())} placeholder="Ex: Premium, Oferta" className={`${inputCls} flex-1`} />
                             <button type="button" onClick={addTag} className="px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm font-bold hover:bg-accent transition-all">
                               Adicionar
                             </button>
                           </div>
                           
                           {form.tags.length > 0 ? (
                             <div className="flex flex-wrap gap-2">
                               {form.tags.map(t => (
                                 <span key={t} className="flex items-center gap-2 px-3 py-1.5 bg-primary/5 hover:bg-primary/10 text-primary text-xs font-bold border border-primary/10 rounded-full transition-colors group">
                                   {t}
                                   <button onClick={() => removeTag(t)} className="opacity-40 group-hover:opacity-100 hover:text-destructive">
                                     <X className="w-3.5 h-3.5" />
                                   </button>
                                 </span>
                               ))}
                             </div>
                           ) : (
                             <p className="text-[10px] text-muted-foreground italic">Nenhuma etiqueta adicionada ainda.</p>
                           )}
                        </div>
                      </div>

                      {/* CHECKOUT CONFIG */}
                      <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-1.5 h-6 bg-primary rounded-full" />
                          <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Config. de Pagamento</h3>
                        </div>

                        <div className="space-y-4">
                           <div className="space-y-1.5">
                              <label className={labelCls}>Tipo de Checkout</label>
                              <select value={form.checkout_type} onChange={e => setForm({ ...form, checkout_type: e.target.value as any })} className={inputCls}>
                                <option value="native">Checkout Nativo (Mercado Livre)</option>
                                <option value="external">Checkout Externo (Link)</option>
                              </select>
                           </div>

                           {form.checkout_type === "external" && (
                             <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                               <label className={labelCls}>Link de Checkout</label>
                               <input value={form.payment_link} onChange={e => setForm({ ...form, payment_link: e.target.value })} placeholder="https://checkout.exemplo.com/..." className={inputCls} />
                             </div>
                           )}

                           {form.checkout_type === "native" && (
                             <div className="space-y-3 pt-2">
                               {/* PIX TOGGLE */}
                               <div className="space-y-4">
                                 <div className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-md ${form.enable_pix ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                         <Link2 className="w-4 h-4" />
                                      </div>
                                      <span className="text-sm font-bold">PIX Ativo</span>
                                    </div>
                                    <button type="button" onClick={() => setForm({ ...form, enable_pix: !form.enable_pix })} className={`w-10 h-5 rounded-full relative transition-colors ${form.enable_pix ? "bg-primary" : "bg-muted"}`}>
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.enable_pix ? "left-[22px]" : "left-0.5"}`} />
                                    </button>
                                 </div>

                                 {form.enable_pix && (
                                   <div className="space-y-3 p-3 bg-secondary/20 border border-border rounded-lg animate-in fade-in transition-all">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Códigos PIX Copia e Cola</label>
                                        <div className="flex gap-2">
                                          <input value={pixInput} onChange={e => setPixInput(e.target.value)} placeholder="Cole o código PIX aqui..." className={`${inputCls} flex-1 font-mono text-xs`} />
                                          <button type="button" onClick={addPixCode} className="px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm font-bold hover:bg-accent transition-all">+</button>
                                        </div>
                                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                          {form.pix_codes.map((code, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-[5px] p-2 group">
                                              <span className="flex-1 text-[10px] font-mono text-muted-foreground truncate">{code}</span>
                                              <button onClick={() => removePixCode(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                   </div>
                                 )}
                               </div>

                               {/* BOLETO TOGGLE */}
                               <div className="space-y-4">
                                 <div className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-lg">
                                    <div className="flex items-center gap-3">
                                      <div className={`p-1.5 rounded-md ${form.enable_boleto ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                         <Search className="w-4 h-4" />
                                      </div>
                                      <span className="text-sm font-bold">Boleto Ativo</span>
                                    </div>
                                    <button type="button" onClick={() => setForm({ ...form, enable_boleto: !form.enable_boleto })} className={`w-10 h-5 rounded-full relative transition-colors ${form.enable_boleto ? "bg-primary" : "bg-muted"}`}>
                                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${form.enable_boleto ? "left-[22px]" : "left-0.5"}`} />
                                    </button>
                                 </div>

                                 {form.enable_boleto && (
                                   <div className="space-y-3 p-3 bg-secondary/20 border border-border rounded-lg animate-in fade-in transition-all">
                                      <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-muted-foreground uppercase">Códigos de Boleto (Barra)</label>
                                        <div className="flex gap-2">
                                          <input value={boletoInput} onChange={e => setBoletoInput(e.target.value)} placeholder="Cole o código do boleto aqui..." className={`${inputCls} flex-1 font-mono text-xs`} />
                                          <button type="button" onClick={addBoletoCode} className="px-3 py-2 bg-secondary border border-border rounded-[5px] text-foreground text-sm font-bold hover:bg-accent transition-all">+</button>
                                        </div>
                                        <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                                          {form.boleto_codes.map((code, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-background border border-border rounded-[5px] p-2 group">
                                              <span className="flex-1 text-[10px] font-mono text-muted-foreground truncate">{code}</span>
                                              <button onClick={() => removeBoletoCode(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                                                <X className="w-3 h-3" />
                                              </button>
                                            </div>
                                          ))}
                                        </div>
                                      </div>
                                   </div>
                                 )}
                               </div>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>

                    {/* VARIANTS (LG:COL-SPAN-12) */}
                    <div className="lg:col-span-12">
                       <div className="glass-card p-6 space-y-6 border border-border bg-background shadow-xl shadow-black/5">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 bg-primary rounded-full" />
                            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground">Variantes e Opções</h3>
                          </div>
                          <button onClick={addVariantGroup} className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary border border-primary/20 rounded-[5px] text-xs font-bold hover:bg-primary/20 transition-all">
                            <Plus className="w-3.5 h-3.5" /> Adicionar Grupo
                          </button>
                        </div>

                        {form.variant_groups.length > 0 ? (
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {form.variant_groups.map((group, gi) => (
                                <div key={gi} className="group/var border border-border bg-secondary/10 rounded-xl overflow-hidden animate-in zoom-in-95 duration-200">
                                   <div className="p-4 border-b border-border bg-background/50 flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                                         <GripVertical className="w-4 h-4 text-muted-foreground" />
                                      </div>
                                      <input value={group.group_name} onChange={e => updateGroupName(gi, e.target.value)} placeholder="Ex: Cores, Tamanhos..." className={`${inputCls} !bg-transparent !border-none !ring-0 text-base font-bold flex-1`} />
                                      <button onClick={() => removeVariantGroup(gi)} className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all">
                                         <Trash2 className="w-4 h-4" />
                                      </button>
                                   </div>

                                   <div className="p-4 space-y-3">
                                      {group.options.map((opt, oi) => (
                                        <div key={oi} className="grid grid-cols-[1fr_2fr_120px_100px_40px] gap-3 items-center p-3 bg-background border border-border/50 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                           <div className="space-y-1">
                                             <label className="text-[10px] font-bold text-muted-foreground uppercase">Opção</label>
                                             <input value={opt.option_name} onChange={e => updateVariantOption(gi, oi, "option_name", e.target.value)} className={`${inputCls} h-9 px-2`} placeholder="Ex: Azul" />
                                           </div>
                                           <div className="space-y-1">
                                             <label className="text-[10px] font-bold text-muted-foreground uppercase">Imagem (URL)</label>
                                             <input value={opt.image} onChange={e => updateVariantOption(gi, oi, "image", e.target.value)} className={`${inputCls} h-9 px-2`} placeholder="https://..." />
                                           </div>
                                           <div className="space-y-1">
                                             <label className="text-[10px] font-bold text-muted-foreground uppercase">Preço (R$)</label>
                                             <input
                                               type="text"
                                               inputMode="decimal"
                                               placeholder="0,00"
                                               value={(() => {
                                                 const shadow = variantPriceStr[`${gi}:${oi}`];
                                                 if (shadow !== undefined) return shadow;
                                                 return opt.price === 0 ? "" : String(opt.price);
                                               })()}
                                               onChange={e => {
                                                 const v = e.target.value.replace(',', '.');
                                                 if (!/^\d*\.?\d*$/.test(v)) return;
                                                 setVariantPriceStr(prev => ({ ...prev, [`${gi}:${oi}`]: v }));
                                                 updateVariantOption(gi, oi, "price", v === '' || v === '.' ? 0 : parseFloat(v) || 0);
                                               }}
                                               className={`${inputCls} h-9 px-2`}
                                             />
                                           </div>
                                           <div className="space-y-1">
                                             <label className="text-[10px] font-bold text-muted-foreground uppercase">Estoque</label>
                                             <input type="number" value={opt.stock} onChange={e => updateVariantOption(gi, oi, "stock", Number(e.target.value))} className={`${inputCls} h-9 px-2`} />
                                           </div>
                                           <button onClick={() => removeVariantOption(gi, oi)} className="p-2 text-muted-foreground hover:text-destructive self-end mb-1">
                                              <X className="w-3.5 h-3.5" />
                                           </button>
                                        </div>
                                      ))}
                                      
                                      <button onClick={() => addVariantOption(gi)} className="w-full py-3 border-2 border-dashed border-border/60 hover:border-primary/40 rounded-xl text-xs font-bold text-muted-foreground hover:text-primary hover:bg-primary/[0.02] transition-all flex items-center justify-center gap-2 mt-2">
                                         <Plus className="w-3 h-3" /> Adicionar Opção
                                      </button>
                                   </div>
                                </div>
                              ))}
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-xl bg-secondary/10">
                              <CheckSquare className="w-8 h-8 text-muted-foreground/30 mb-2" />
                              <p className="text-xs text-muted-foreground font-medium">Nenhuma variante cadastrada</p>
                              <p className="text-[10px] text-muted-foreground">Útil para tamanhos, cores ou modelos diferentes</p>
                           </div>
                        )}
                       </div>
                    </div>
                  </div>

                  {/* FORM ERRORS */}
                  {formErrors.length > 0 && (
                    <div className="mt-8 p-4 bg-destructive/5 border border-destructive/20 rounded-xl animate-in slide-in-from-bottom-2 duration-300">
                      <div className="flex items-center gap-2 text-destructive mb-3">
                        <Star className="w-4 h-4 fill-destructive" />
                        <h4 className="text-sm font-black uppercase tracking-wider">Erros de Validação</h4>
                      </div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {formErrors.map((err, i) => (
                          <li key={i} className="text-xs text-foreground/80 flex items-center gap-2">
                             <div className="w-1 h-1 bg-destructive rounded-full" /> {err}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* FOOTER (NOT STICKY) */}
                  <div className="mt-12 mb-20 pt-8 border-t border-border flex justify-end gap-3">
                    <button onClick={() => { setModal(false); setFormErrors([]); }} className="px-8 py-3 rounded-[5px] border border-border text-foreground text-sm font-black hover:bg-secondary transition-all">
                      Cancelar
                    </button>
                    <button 
                      onClick={handleSave} 
                      disabled={saving}
                      className={`px-12 py-3 rounded-[5px] ${gradientBtn} text-white text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-2 min-w-[180px] justify-center disabled:opacity-70`}
                    >
                      {saving ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Salvando...
                        </>
                      ) : editing ? "Salvar Alterações" : "Criar Produto"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Duplicate Modal */}
        {duplicateModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60">
            <div className="bg-background border border-border rounded-[10px] p-6 w-full max-w-md shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  Duplicar produtos
                </h3>
                <button onClick={() => { setDuplicateModal(false); setBulkAction(""); }} className="p-1 rounded hover:bg-secondary transition-colors text-muted-foreground">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {selected.size} produto(s) selecionado(s). Cada produto será duplicado com todos os dados, incluindo variantes. Apenas o slug será diferente.
              </p>
              <div className="space-y-2 mb-6">
                <label className="text-sm font-medium text-foreground">Quantidade de cópias por produto</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={duplicateCount}
                  onChange={e => setDuplicateCount(Math.max(1, Math.min(50, Number(e.target.value))))}
                  className={inputCls}
                />
                <p className="text-xs text-muted-foreground">
                  Total: {selected.size * duplicateCount} novo(s) produto(s) será(ão) criado(s)
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => { setDuplicateModal(false); setBulkAction(""); }}
                  className="flex-1 py-2.5 rounded-[5px] bg-secondary text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDuplicate}
                  disabled={duplicating}
                  className={`flex-1 py-2.5 rounded-[5px] ${gradientBtn} text-foreground text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50`}
                >
                  {duplicating ? "Duplicando..." : "Duplicar"}
                </button>
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
                <button onClick={() => setDeleteConfirm(null)} className="px-4 py-2 text-sm rounded-lg border border-border text-foreground hover:bg-secondary transition-colors">Cancelar</button>
                <button 
                  disabled={isDeleting}
                  onClick={async () => { 
                    setIsDeleting(true);
                    await deleteProduct(deleteConfirm.id); 
                    setIsDeleting(false);
                    setDeleteConfirm(null); 
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

      {/* Import Preview Modal */}
      {importModal && createPortal(
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-card border border-border rounded-[5px] w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-foreground">Importar Produtos</h3>
                <p className="text-sm text-muted-foreground mt-1">Verifique os dados abaixo antes de confirmar a importação.</p>
              </div>
              <button 
                onClick={() => setImportModal(false)}
                className="p-2 rounded-[5px] hover:bg-secondary text-muted-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
               {importData.map((p, i) => (
                 <div key={i} className="flex items-center gap-4 p-3 bg-secondary/30 border border-border/50 rounded-[5px] hover:bg-secondary/50 transition-colors">
                   <div className="w-16 h-16 rounded-[5px] bg-secondary border border-border overflow-hidden flex-shrink-0">
                      <img src={p.image || "/placeholder.svg"} alt={p.name} className="w-full h-full object-cover" />
                   </div>
                   <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-bold text-foreground truncate">{p.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{p.description?.replace(/<[^>]*>/g, '')}</p>
                      <div className="flex items-center gap-3 mt-2">
                         <span className="text-xs font-bold text-primary">{formatCurrency(p.price)}</span>
                         <span className="text-[10px] px-2 py-0.5 bg-secondary border border-border rounded-[5px] text-muted-foreground uppercase">{p.variants?.length || 0} variantes</span>
                      </div>
                   </div>
                 </div>
               ))}
            </div>

            <div className="p-6 border-t border-border bg-secondary/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-sm font-medium text-foreground">
                Total de <span className="text-primary font-bold">{importData.length}</span> itens identificados
              </p>
              <div className="flex gap-3 w-full sm:w-auto">
                <button 
                  onClick={() => setImportModal(false)}
                  className="flex-1 sm:flex-none px-6 py-2.5 rounded-[5px] border border-border text-foreground text-sm font-bold hover:bg-secondary transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleImportConfirm}
                  disabled={isImporting}
                  className={`flex-1 sm:flex-none px-8 py-2.5 rounded-[5px] ${gradientBtn} text-white text-sm font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 min-w-[160px] disabled:opacity-70`}
                >
                  {isImporting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Importando...
                    </>
                  ) : "Confirmar Importação"}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default AdminProducts;
