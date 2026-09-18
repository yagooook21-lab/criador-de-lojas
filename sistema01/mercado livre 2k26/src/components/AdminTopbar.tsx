import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useStore } from "@/contexts/StoreContext";
import { useAdmin } from "@/contexts/AdminContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bell, LogOut, User,
  Package, ShoppingBag, ShoppingCart, Star, DollarSign, MapPin, X, KeyRound, Mail, ChevronDown, Menu
} from "lucide-react";

// Using Notification interface from StoreContext

const inputClass = "w-full px-3 py-2 bg-background border border-border rounded-[5px] text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all";
const gradientBtn = "bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B]";

const AdminTopbar = ({ title }: { title: string }) => {
  const { user, logout } = useAuth();
  const { products, orders, carts, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useStore();
  const { toggleMobileSidebar } = useAdmin();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [showAccountSection, setShowAccountSection] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "low_stock": return Package;
      case "new_order": return ShoppingBag;
      case "abandoned_cart": return ShoppingCart;
      case "sale_completed": return DollarSign;
      default: return Bell;
    }
  };

  const getNotificationColors = (type: string) => {
    switch (type) {
      case "low_stock": return { color: "text-yellow-400", bgColor: "bg-yellow-400/10" };
      case "new_order": return { color: "text-blue-400", bgColor: "bg-blue-400/10" };
      case "abandoned_cart": return { color: "text-orange-400", bgColor: "bg-orange-400/10" };
      case "sale_completed": return { color: "text-green-400", bgColor: "bg-green-400/10" };
      default: return { color: "text-primary", bgColor: "bg-primary/10" };
    }
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) { toast.error("Informe o novo email"); return; }
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) { toast.error(error.message); return; }
    toast.success("Email de confirmação enviado para o novo endereço!");
    setNewEmail("");
  };

  const handleChangePassword = async () => {
    if (!newPassword || !confirmPassword) { toast.error("Preencha todos os campos"); return; }
    if (newPassword !== confirmPassword) { toast.error("As senhas não coincidem"); return; }
    if (newPassword.length < 6) { toast.error("A senha deve ter pelo menos 6 caracteres"); return; }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) { toast.error(error.message); return; }
    toast.success("Senha alterada com sucesso!");
    setNewPassword("");
    setConfirmPassword("");
  };

  return (
    <header className="h-16 border-b border-border bg-card/50 backdrop-blur-xl flex items-center justify-between px-3 sm:px-6 relative z-30">
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={toggleMobileSidebar}
          className="lg:hidden p-2 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground -ml-1 flex-shrink-0"
          aria-label="Abrir Menu"
        >
          <Menu className="w-5 h-5 text-foreground" />
        </button>
        <h1 className="text-base sm:text-lg font-semibold text-foreground truncate">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="p-2 rounded-[5px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-gradient-to-br from-[hsl(var(--destructive))] to-[hsl(var(--primary))] ring-2 ring-card" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[380px] max-w-[380px] bg-card border border-border rounded-[5px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Arrow indicator */}
              <div className="absolute -top-[6px] right-3 w-3 h-3 bg-card border-l border-t border-border rotate-45" />
              
              <div className="relative flex items-center justify-between px-4 py-3 border-b border-border bg-secondary/30">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-primary" />
                  <h3 className="text-sm font-semibold text-foreground">Notificações</h3>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-[3px] bg-primary/20 text-primary">{unreadCount}</span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  {unreadCount > 0 && (
                    <button onClick={markAllNotificationsAsRead} className="text-[11px] text-primary hover:text-primary/80 transition-colors font-medium">
                      Marcar todas como lidas
                    </button>
                  )}
                  <button onClick={() => setShowNotifications(false)} className="p-1 rounded-[3px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              
              <div className="overflow-y-auto max-h-[420px] divide-y divide-border/40">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center">
                    <Bell className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">Nenhuma notificação por enquanto</p>
                  </div>
                ) : notifications.map(n => {
                  const Icon = getNotificationIcon(n.type);
                  const { color, bgColor } = getNotificationColors(n.type);
                  return (
                    <div
                      key={n.id}
                      onClick={() => !n.read && markNotificationAsRead(n.id)}
                      className={`flex items-start gap-3 px-4 py-3 hover:bg-secondary/40 transition-all cursor-default ${!n.read ? "bg-primary/[0.03] cursor-pointer" : ""}`}
                    >
                      <div className={`p-2 rounded-[5px] ${bgColor} flex-shrink-0 ${color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[13px] font-medium text-foreground leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.description}</p>
                        <p className="text-[9px] text-muted-foreground/50 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                      </div>
                      {!n.read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0 mt-2" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User avatar menu */}
        <div ref={userRef} className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowAccountSection(false); }}
            className="flex items-center gap-1.5 p-1 rounded-[5px] hover:bg-secondary/50 transition-colors"
          >
            <div className="w-8 h-8 rounded-[5px] bg-gradient-to-br from-[hsl(var(--gradient-from))] via-[hsl(var(--destructive))] to-[hsl(var(--primary))] flex items-center justify-center text-foreground text-sm font-semibold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-full mt-2 w-[calc(100vw-24px)] sm:w-[340px] max-w-[340px] bg-card border border-border rounded-[5px] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)] z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              {/* Arrow indicator */}
              <div className="absolute -top-[6px] right-3 w-3 h-3 bg-card border-l border-t border-border rotate-45" />

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-[4px] bg-secondary flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">{user?.email}</span>
                </div>
                <button onClick={() => setShowUserMenu(false)} className="p-1 rounded-[3px] hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* User section */}
              <div className="px-3 py-2 space-y-0.5">

                {/* Account credentials toggle */}
                <button
                  onClick={() => setShowAccountSection(!showAccountSection)}
                  className="flex items-center justify-between w-full px-2.5 py-2 rounded-[4px] text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-[4px] bg-secondary flex items-center justify-center">
                      <KeyRound className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-sm font-medium">Alterar Acesso</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showAccountSection ? "rotate-180" : ""}`} />
                </button>

                {showAccountSection && (
                  <div className="mx-2.5 mt-1 mb-2 p-3 rounded-[5px] bg-secondary/40 border border-border/50 space-y-3">
                    {/* Change email */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        <Mail className="w-3 h-3" /> Novo email
                      </label>
                      <input type="email" value={newEmail} onChange={e => setNewEmail(e.target.value)} placeholder="novo@email.com" className={inputClass} />
                      <button onClick={handleChangeEmail} className={`w-full px-3 py-1.5 rounded-[4px] ${gradientBtn} text-foreground text-xs font-medium hover:opacity-90 transition-all`}>
                        Atualizar Email
                      </button>
                    </div>
                    
                    <div className="border-t border-border/50" />
                    
                    {/* Change password */}
                    <div className="space-y-1.5">
                      <label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                        <KeyRound className="w-3 h-3" /> Nova senha
                      </label>
                      <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="••••••••" className={inputClass} />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Confirmar senha" className={inputClass} />
                      <button onClick={handleChangePassword} className={`w-full px-3 py-1.5 rounded-[4px] ${gradientBtn} text-foreground text-xs font-medium hover:opacity-90 transition-all`}>
                        Atualizar Senha
                      </button>
                    </div>
                  </div>
                )}

                <button
                  onClick={logout}
                  className="flex items-center gap-3 w-full px-2.5 py-2 rounded-[4px] text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
                >
                  <div className="w-7 h-7 rounded-[4px] bg-secondary flex items-center justify-center">
                    <LogOut className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-sm font-medium">Sair</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminTopbar;
