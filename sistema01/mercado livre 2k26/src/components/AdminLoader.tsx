import React from "react";

const AdminLoader: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/40 backdrop-blur-md">
      <div className="relative w-20 h-20">
        {/* Animated Gradient Ring */}
        <div className="absolute inset-0 rounded-full border-4 border-muted/20" />
        <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin" 
             style={{ 
               borderTopColor: "transparent",
               backgroundImage: "linear-gradient(135deg, #1B3C53 0%, #1F7A8A 50%, #20B2AA 100%)",
               WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
               WebkitMaskComposite: "xor",
               maskComposite: "exclude",
               padding: "4px"
             }} 
        />
        
        {/* Inner Glow */}
        <div className="absolute inset-0 rounded-full bg-primary/10 blur-xl animate-pulse" />
      </div>
      
      <div className="mt-6 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold bg-gradient-to-r from-[#B55409] via-[#D97706] to-[#F59E0B] bg-clip-text text-transparent animate-pulse">
          Carregando informações
        </h3>
        <p className="text-xs text-muted-foreground uppercase tracking-[0.2em] font-medium">
          Aguarde um momento
        </p>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default AdminLoader;
