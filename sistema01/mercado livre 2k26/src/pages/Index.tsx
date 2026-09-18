import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingCart } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redireciona para o admin dashboard por padrão após um breve delay para mostrar o logo
    const timer = setTimeout(() => {
      navigate("/admin/dashboard");
    }, 1500);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0a]">
      <div className="flex flex-col items-center justify-center gap-6 animate-in fade-in zoom-in duration-700">
        <div className="relative">
          <div className="absolute -inset-4 bg-[#F59E0B]/20 rounded-full blur-2xl animate-pulse" />
          <div className="w-20 h-20 rounded-[20px] bg-gradient-to-br from-[#B55409] via-[#D97706] to-[#F59E0B] flex items-center justify-center shadow-xl shadow-[#D97706]/40 relative">
            <ShoppingCart className="w-10 h-10 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-black tracking-widest uppercase bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent">MERCADO LIVRE</h1>
          <div className="flex items-center justify-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-bounce [animation-delay:-0.3s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-bounce [animation-delay:-0.15s]" />
            <div className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] animate-bounce" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
