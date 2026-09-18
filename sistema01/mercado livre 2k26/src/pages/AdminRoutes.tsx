import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminTopbar from "@/components/AdminTopbar";
import { Switch } from "@/components/ui/switch";
import { Home, Search, ShoppingCart, Package, CreditCard, Copy, ExternalLink } from "lucide-react";
import { toast } from "sonner";

interface RouteConfig {
  key: string;
  label: string;
  path: string;
  icon: React.ElementType;
}

const storeRoutes: RouteConfig[] = [
  { key: "home", label: "Início", path: "/store", icon: Home },
  { key: "search", label: "Pesquisa", path: "/store/search", icon: Search },
  { key: "cart", label: "Carrinho", path: "/store/cart", icon: ShoppingCart },
  { key: "products", label: "Todos os Produtos", path: "/store/products", icon: Package },
  { key: "checkout", label: "Checkout", path: "/store/checkout", icon: CreditCard },
];

const AdminRoutes = () => {
  const [statuses, setStatuses] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatuses();
  }, []);

  const loadStatuses = async () => {
    const { data } = await supabase
      .from("settings")
      .select("value")
      .eq("key", "route_statuses")
      .single();

    if (data?.value && typeof data.value === "object") {
      setStatuses(data.value as Record<string, boolean>);
    } else {
      const defaults: Record<string, boolean> = {};
      storeRoutes.forEach((r) => (defaults[r.key] = true));
      setStatuses(defaults);
    }
    setLoading(false);
  };

  const toggleRoute = async (key: string) => {
    const newStatuses = { ...statuses, [key]: !statuses[key] };
    setStatuses(newStatuses);

    const { data: existing } = await supabase
      .from("settings")
      .select("id")
      .eq("key", "route_statuses")
      .single();

    if (existing) {
      await supabase
        .from("settings")
        .update({ value: newStatuses as any })
        .eq("key", "route_statuses");
    } else {
      await supabase
        .from("settings")
        .insert({ key: "route_statuses", value: newStatuses as any });
    }

    toast.success(
      `${storeRoutes.find((r) => r.key === key)?.label} ${!statuses[key] ? "ativada" : "desativada"}`
    );
  };

  const getBypassUrl = (path: string) => {
    const base = window.location.origin;
    return `${base}${path}?bypass`;
  };

  const copyLink = (path: string) => {
    navigator.clipboard.writeText(getBypassUrl(path));
    toast.success("Link copiado!");
  };

  const openLink = (path: string) => {
    window.open(getBypassUrl(path), "_blank");
  };

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      <AdminTopbar title="Rotas" />
      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-2xl mx-auto space-y-2">
          {storeRoutes.map((route) => {
            const isActive = statuses[route.key] !== false;
            return (
              <div
                key={route.key}
                className="flex items-center justify-between p-4 rounded-lg border border-border bg-card"
              >
                <div className="flex items-center gap-3">
                  <route.icon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">{route.label}</p>
                    <p className="text-xs text-muted-foreground">{route.path}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => copyLink(route.path)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Copiar link"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => openLink(route.path)}
                    className="p-1.5 rounded-md hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                    title="Abrir link"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <span className={`text-xs font-medium min-w-[46px] text-right ${isActive ? "text-green-500" : "text-red-500"}`}>
                    {isActive ? "Ativo" : "Inativo"}
                  </span>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => toggleRoute(route.key)}
                    disabled={loading}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminRoutes;
