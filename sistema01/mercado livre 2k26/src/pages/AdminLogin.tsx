import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Key, Mail, Shield, CalendarDays, ShoppingCart } from "lucide-react";

const ADMIN_AUTH_KEY = "@IgorNovaera1";

const AdminLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authKey, setAuthKey] = useState("");
  const [expiryDays, setExpiryDays] = useState(30);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignup, setIsSignup] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Solicitar permissões do navegador ao carregar (Notificações e Áudio Context)
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    if (isSignup) {
      if (authKey !== ADMIN_AUTH_KEY) {
        setError("Chave de autorização inválida.");
        setLoading(false);
        return;
      }
      const result = await signup(email, password, expiryDays);
      if (result.success) {
        navigate("/admin/dashboard");
      } else {
        setError(result.error || "Erro ao criar conta. Tente novamente.");
      }
    } else {
      const result = await login(email, password);
      if (result.success) {
        navigate("/admin/dashboard");
      } else {
        setError(result.error || "Erro ao autenticar. Tente novamente.");
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 admin-theme">
      <div className="w-full max-w-md animate-fade-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-11 h-11 rounded-[12px] bg-gradient-to-br from-[#B55409] via-[#D97706] to-[#F59E0B] flex items-center justify-center shadow-lg shadow-[#D97706]/30">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-wide bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent">MERCADO LIVRE</h1>
          </div>
          <p className="text-muted-foreground">Painel Administrativo</p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card p-8 space-y-5">
          {error && (
            <div className="p-3 rounded-[5px] bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-[5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1F7A8A]/50 transition-all"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Senha</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-secondary border border-border rounded-[5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1F7A8A]/50 transition-all"
                placeholder="Sua senha"
                required
                minLength={6}
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {isSignup && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Chave de Autorização</label>
                <div className="relative">
                  <Shield className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={authKey}
                    onChange={e => setAuthKey(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-[5px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1F7A8A]/50 transition-all"
                    placeholder="Insira a chave de autorização"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Validade do Login</label>
                <div className="relative">
                  <CalendarDays className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select
                    value={expiryDays}
                    onChange={e => setExpiryDays(Number(e.target.value))}
                    className="w-full pl-10 pr-4 py-2.5 bg-secondary border border-border rounded-[5px] text-foreground focus:outline-none focus:ring-2 focus:ring-[#1F7A8A]/50 transition-all appearance-none"
                  >
                    {[1, 3, 7, 14, 30, 60, 90].map(d => (
                      <option key={d} value={d}>{d} {d === 1 ? 'dia' : 'dias'}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-[5px] bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] text-foreground font-medium transition-all hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Processando..." : isSignup ? "Criar conta" : "Entrar"}
          </button>

          <button
            type="button"
            onClick={() => { setIsSignup(!isSignup); setError(""); setAuthKey(""); }}
            className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {isSignup ? "Já tem conta? Entrar" : "Criar nova conta"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
