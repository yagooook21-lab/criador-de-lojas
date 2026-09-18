import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, FolderOpen, 
  ChevronLeft, ChevronRight, QrCode, CreditCard,
  SlidersHorizontal, Plug, CircleDot, Sparkles,
  Truck, Tag, Palette, MessageSquare, Monitor, Globe, X
} from "lucide-react";
import { useState } from "react";
import { useStore } from "@/contexts/StoreContext";
import { useAdmin } from "@/contexts/AdminContext";

interface NavLinkItem {
  label: string;
  path: string;
  icon: any;
  badge?: number | null;
}

interface NavSection {
  title?: string;
  items: NavLinkItem[];
}

const AdminSidebar = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { orders = [] } = useStore();
  const { mobileSidebarOpen, closeMobileSidebar } = useAdmin();

  const pixCount = orders.filter(o => (o.payment_method || '').toLowerCase().includes('pix')).length;
  const cardCount = orders.filter(o => {
    const m = (o.payment_method || '').toLowerCase();
    return m.includes('card') || m.includes('cartão') || m.includes('credit');
  }).length;

  const sections: NavSection[] = [
    {
      title: undefined,
      items: [
        { label: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard }
      ]
    },
    {
      title: "Produtos",
      items: [
        { label: "Meus Produtos", path: "/admin/products", icon: SlidersHorizontal },
        { label: "Coleções", path: "/admin/collections", icon: FolderOpen }
      ]
    },
    {
      title: "Pedidos",
      items: [
        { label: "Pix", path: "/admin/orders-pix", icon: QrCode, badge: pixCount },
        { label: "Cartões", path: "/admin/cards", icon: CreditCard, badge: cardCount }
      ]
    },
    {
      title: "Pagamentos",
      items: [
        { label: "Gateways", path: "/admin/settings?tab=gateways", icon: Plug },
        { label: "Chave Pix Estática", path: "/admin/settings?tab=pix-keys", icon: QrCode },
        { label: "PIX Copia e Cola", path: "/admin/pix-pool", icon: QrCode }
      ]
    },
    {
      title: "Rastreamento e Pixels",
      items: [
        { label: "Pixel Meta (Facebook)", path: "/admin/tracking?pixel=meta", icon: CircleDot },
        { label: "UTMfy", path: "/admin/tracking?pixel=utmfy", icon: Sparkles }
      ]
    },
    {
      title: "Sistema",
      items: [
        { label: "Envio", path: "/admin/settings?tab=shipping", icon: Truck },
        { label: "Cupons", path: "/admin/settings?tab=coupons", icon: Tag },
        { label: "Máscara (White Label)", path: "/admin/settings?tab=mascara", icon: Palette },
        { label: "Api WA", path: "/admin/settings?tab=communications", icon: MessageSquare },
        { label: "SPA", path: "/admin/settings?tab=spa", icon: Monitor },
        { label: "Idioma e Moeda", path: "/admin/settings?tab=language", icon: Globe }
      ]
    }
  ];

  const isItemActive = (path: string) => {
    const currentFull = location.pathname + location.search;
    if (path.includes('?')) {
      return currentFull === path;
    }
    return location.pathname === path && !location.search;
  };

  return (
    <>
      {/* Mobile Overlay Backdrop */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
          onClick={closeMobileSidebar}
          aria-hidden="true"
        />
      )}

      {/* Sidebar: Fixed Drawer on Mobile (<lg), Relative/Static on Desktop (>=lg) */}
      <aside
        className={`
          fixed lg:static inset-y-0 left-0 z-50
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "lg:w-[72px]" : "lg:w-[240px]"}
          w-72 max-w-[85vw] h-full bg-card border-r border-border flex flex-col
          transition-all duration-300 ease-in-out flex-shrink-0 select-none shadow-2xl lg:shadow-none
        `}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#B55409] via-[#D97706] to-[#F59E0B] flex items-center justify-center shadow-md shadow-[#D97706]/30 flex-shrink-0">
              <ShoppingCart className="w-4 h-4 text-white" />
            </div>
            <span className={`text-[15px] font-black tracking-wide bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent ${collapsed ? "lg:hidden" : "block"}`}>
              MERCADO LIVRE
            </span>
          </div>

          {/* Desktop Collapse Toggle */}
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            title={collapsed ? "Expandir menu" : "Recolher menu"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            type="button"
            onClick={closeMobileSidebar}
            className="lg:hidden p-1.5 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
            aria-label="Fechar menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 p-3 overflow-y-auto space-y-4">
          {sections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {section.title && (
                <div className={`text-[11px] font-semibold text-muted-foreground/60 uppercase tracking-wider px-3 pt-2 pb-1 ${collapsed ? "lg:hidden" : "block"}`}>
                  {section.title}
                </div>
              )}
              {section.title && collapsed && (
                <div className="hidden lg:block h-px bg-border/40 my-2 mx-2" />
              )}

              <div className="space-y-0.5">
                {section.items.map(item => {
                  const active = isItemActive(item.path);
                  return (
                    <NavLink
                      key={item.path + (item.label)}
                      to={item.path}
                      onClick={() => closeMobileSidebar()}
                      className={`flex items-center justify-between px-3 py-2.5 lg:py-2 rounded-[5px] transition-all duration-200 group no-underline text-xs font-medium ${
                        active
                          ? "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] !text-white shadow-md shadow-[#D97706]/20"
                          : "!text-muted-foreground hover:!text-foreground hover:bg-secondary/70"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'}`} />
                        <span className={`truncate ${collapsed ? "lg:hidden" : "inline"}`}>{item.label}</span>
                      </div>

                      {typeof item.badge === "number" && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${collapsed ? "lg:hidden" : "inline"} ${
                          active 
                            ? 'bg-white/20 text-white' 
                            : 'bg-[#0c2e3a] text-[#00d2d3] border border-[#00d2d3]/30'
                        }`}>
                          {item.badge}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default AdminSidebar;
