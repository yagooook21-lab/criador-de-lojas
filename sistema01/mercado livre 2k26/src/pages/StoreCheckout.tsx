import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useStore } from "@/contexts/StoreContext";

const StoreCheckout = () => {
  const navigate = useNavigate();
  const { cartItems } = useStore();
  const [checking, setChecking] = useState(true);

  // Filter out any corrupted items before calculations
  const validItems = cartItems.filter(i => i && i.product != null && typeof i.product.price === 'number');

  useEffect(() => {
    const originalBg = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#ffffff";

    if (validItems.length === 0) {
      navigate("/store/cart", { replace: true });
      return;
    }
    
    // Track initiate_checkout
    if ((window as any).__trackEvent) {
      (window as any).__trackEvent("initiate_checkout", {
        num_items: validItems.reduce((sum, i) => sum + i.quantity, 0),
        value: validItems.reduce((sum, i) => sum + i.product.price * i.quantity, 0),
        currency: "BRL",
      });
    }

    const check = async () => {
      try {
        const { data } = await supabase
          .from("settings")
          .select("value")
          .eq("key", "store_options")
          .maybeSingle();

        const opts = data?.value as any;
        const requireLogin = opts?.request_login === true;

        if (requireLogin) {
          const isLoggedIn = localStorage.getItem("store_logged_in") === "true";
          if (!isLoggedIn) {
            sessionStorage.setItem("store_redirect_after_login", "/store/checkout/drop");
            navigate("/store/login", { replace: true });
            return;
          }
        }
      } catch (err) {
        console.error("Error checking checkout conditions", err);
      }
      
      navigate("/store/checkout/drop", { replace: true });
    };

    const timer = setTimeout(() => {
      check().finally(() => setChecking(false));
    }, 1200);

    return () => {
      document.body.style.backgroundColor = originalBg;
      clearTimeout(timer);
    };
  }, [navigate, validItems]);

  if (!checking) return null;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", gap: "32px", background: "#ffffff", position: "fixed", top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999 }}>
      <div className="ml-loader" />
      <p style={{ color: "rgba(0, 0, 0, 0.9)", fontSize: "28px", fontWeight: 300, textAlign: "center", margin: 0, fontFamily: "Proxima Nova, -apple-system, sans-serif", lineHeight: 1.25 }}>
        Estamos preparando<br />tudo para sua compra
      </p>
      <style>{`
        .ml-loader {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: inline-block;
          border: 4px solid #eeeeee;
          border-top: 4px solid rgba(52, 131, 250, 1.000);
          box-sizing: border-box;
          animation: ml-rotation 1s linear infinite;
        }
        @keyframes ml-rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
};

export default StoreCheckout;
