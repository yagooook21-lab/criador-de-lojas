import React from "react";
import { createPortal } from "react-dom";
import { DollarSign, X } from "lucide-react";

export interface SalesNotificationData {
  id: string;
  order_number: string;
  amount?: number;
  customer_name?: string;
  timestamp: string;
}

interface SalesNotificationToastProps {
  notification: SalesNotificationData | null;
  onClose: () => void;
  onClick?: () => void;
}

export const SalesNotificationToast: React.FC<SalesNotificationToastProps> = ({
  notification,
  onClose,
  onClick,
}) => {
  if (!notification || typeof document === "undefined") return null;

  return createPortal(
    <div
      onClick={onClick}
      role="alert"
      className="fixed bottom-6 right-6 z-[999999] max-w-sm w-[380px] bg-[#1e2227] text-white rounded-xl p-4 shadow-[0_20px_60px_rgba(0,0,0,0.85)] border border-[#3e4652] flex items-start gap-3.5 transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 cursor-pointer hover:border-[#4f5968]"
    >
      {/* Green Square Icon Badge */}
      <div className="w-11 h-11 rounded-lg bg-[#234433] border border-[#2d5f43] text-[#34d399] flex items-center justify-center shrink-0 shadow-inner">
        <DollarSign className="w-6 h-6 stroke-[2.5]" />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 pr-1">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white tracking-wide">
            Venda realizada
          </h4>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-[0_0_8px_#f59e0b]"
              title="Novo pagamento aprovado"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="text-gray-400 hover:text-white p-0.5 rounded transition-colors"
              aria-label="Fechar notificação"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-[#b0b8c4] mt-1.5 leading-snug break-words">
          Pedido <span className="font-semibold text-gray-200">{notification.order_number}</span> pago com sucesso
        </p>

        {notification.amount !== undefined && notification.amount > 0 && (
          <p className="text-xs font-semibold text-[#34d399] mt-0.5">
            R$ {Number(notification.amount).toFixed(2).replace(".", ",")}
          </p>
        )}

        <p className="text-[11px] text-[#6e7681] mt-2 font-mono">
          {notification.timestamp}
        </p>
      </div>
    </div>,
    document.body
  );
};

export default SalesNotificationToast;
