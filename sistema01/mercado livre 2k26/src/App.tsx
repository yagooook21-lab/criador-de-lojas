import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { StoreProvider } from "@/contexts/StoreContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminLayout from "@/layouts/AdminLayout";
import StoreLayout from "@/layouts/StoreLayout";
import { useVisitorTracking } from "@/hooks/useVisitorTracking";
import { TrackingProvider } from "@/contexts/TrackingContext";

// Admin pages (statically imported for instant, seamless transitions without white screens)
import AdminLogin from "@/pages/AdminLogin";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminProducts from "@/pages/AdminProducts";
import AdminCollections from "@/pages/AdminCollections";
import AdminOrders from "@/pages/AdminOrders";
import AdminCustomers from "@/pages/AdminCustomers";
import AdminCarts from "@/pages/AdminCarts";
import AdminSettings from "@/pages/AdminSettings";
import AdminRoutes from "@/pages/AdminRoutes";
import AdminPixPool from "@/pages/AdminPixPool";
import AdminOrdersPix from "@/pages/AdminOrdersPix";
import AdminCards from "@/pages/AdminCards";
import AdminTracking from "@/pages/AdminTracking";

// Lazy-loaded Storefront pages
const StoreLogin = lazy(() => import("@/pages/StoreLogin"));
const StoreHome = lazy(() => import("@/pages/StoreHome"));
const StoreProducts = lazy(() => import("@/pages/StoreProducts"));
const StoreProduct = lazy(() => import("@/pages/StoreProduct"));
const StoreCollection = lazy(() => import("@/pages/StoreCollection"));
const StoreSearch = lazy(() => import("@/pages/StoreSearch"));
const StoreCart = lazy(() => import("@/pages/StoreCart"));
const StoreCheckout = lazy(() => import("@/pages/StoreCheckout"));
const StoreCheckoutDrop = lazy(() => import("@/pages/StoreCheckoutDrop"));
const StoreCheckoutShipping = lazy(() => import("@/pages/StoreCheckoutShipping"));
const StoreCheckoutPayments = lazy(() => import("@/pages/StoreCheckoutPayments"));
const StoreCheckoutPaymentCard = lazy(() => import("@/pages/StoreCheckoutPaymentCard"));
const StoreCheckoutPaymentPix = lazy(() => import("@/pages/StoreCheckoutPaymentPix"));
const StoreCheckoutPaymentBoleto = lazy(() => import("@/pages/StoreCheckoutPaymentBoleto"));
const StoreCheckoutInstallments = lazy(() => import("@/pages/StoreCheckoutInstallments"));
const StoreCheckoutCardConfirmation = lazy(() => import("@/pages/StoreCheckoutCardConfirmation"));
const StoreCheckoutDeclined = lazy(() => import("@/pages/StoreCheckoutDeclined"));
const StoreCheckoutConfirmation = lazy(() => import("@/pages/StoreCheckoutConfirmation"));
const StoreCheckoutPixSuccess = lazy(() => import("@/pages/StoreCheckoutPixSuccess"));
const StoreCheckoutBoletoSuccess = lazy(() => import("@/pages/StoreCheckoutBoletoSuccess"));
const TrackOrder = lazy(() => import("@/pages/TrackOrder"));
const NotFound = lazy(() => import("@/pages/NotFound"));

const queryClient = new QueryClient();

import { useLocation } from "react-router-dom";
import { useEffect } from "react";

function StoreVisitorTracker() {
  useVisitorTracking();
  return null;
}

function DynamicHeadElements() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll para o topo ao trocar de rota (fix para o SPA mantendo o scroll)
    window.scrollTo(0, 0);

    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    const faviconHref = "/favicon.png";
    if (!link) {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.type = "image/png";
      newLink.href = faviconHref;
      document.head.appendChild(newLink);
    } else {
      link.href = faviconHref;
    }

    // 2) Title
    document.title = "Loja Online";
  }, [pathname]);

  return null;
}

const AppRoutes = () => (
  <>
    <DynamicHeadElements />
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/login" element={<Navigate to="/store/login" replace />} />
        <Route path="/register.php" element={<Navigate to="/store/login" replace />} />

        {/* Admin */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="collections" element={<AdminCollections />} />
          <Route path="routes" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="orders" element={<Navigate to="/admin/orders-pix" replace />} />
          <Route path="orders-pix" element={<AdminOrdersPix />} />
          <Route path="cards" element={<AdminCards />} />
          <Route path="pix-pool" element={<AdminPixPool />} />
          <Route path="customers" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="carts" element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="tracking" element={<AdminTracking />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>

        {/* Storefront - with visitor tracking */}
        <Route path="/store/login" element={<StoreLogin />} />
        <Route path="/store" element={<StoreLayout />}>
          <Route index element={<><StoreVisitorTracker /><StoreHome /></>} />
          <Route path="products" element={<><StoreVisitorTracker /><StoreProducts /></>} />
          <Route path="product/:slug" element={<><StoreVisitorTracker /><StoreProduct /></>} />
          <Route path="collection/:slug" element={<><StoreVisitorTracker /><StoreCollection /></>} />
          <Route path="search" element={<><StoreVisitorTracker /><StoreSearch /></>} />
          <Route path="cart" element={<><StoreVisitorTracker /><StoreCart /></>} />
          <Route path="checkout" element={<><StoreVisitorTracker /><StoreCheckout /></>} />
          <Route path="checkout/drop" element={<><StoreVisitorTracker /><StoreCheckoutDrop /></>} />
          <Route path="checkout/shipping" element={<><StoreVisitorTracker /><StoreCheckoutShipping /></>} />
          <Route path="checkout/payments" element={<><StoreVisitorTracker /><StoreCheckoutPayments /></>} />
          <Route path="checkout/payment_card" element={<><StoreVisitorTracker /><StoreCheckoutPaymentCard /></>} />
          <Route path="checkout/installments" element={<><StoreVisitorTracker /><StoreCheckoutInstallments /></>} />
          <Route path="checkout/cardconfirmation" element={<><StoreVisitorTracker /><StoreCheckoutCardConfirmation /></>} />
          <Route path="checkout/declined" element={<><StoreVisitorTracker /><StoreCheckoutDeclined /></>} />
          <Route path="checkout/confirmation" element={<><StoreVisitorTracker /><StoreCheckoutConfirmation /></>} />
          <Route path="checkout/payment_pix" element={<><StoreVisitorTracker /><StoreCheckoutPaymentPix /></>} />
          <Route path="checkout/payment_boleto" element={<><StoreVisitorTracker /><StoreCheckoutPaymentBoleto /></>} />
          <Route path="checkout/pix/success" element={<><StoreVisitorTracker /><StoreCheckoutPixSuccess /></>} />
          <Route path="checkout/boleto/success" element={<><StoreVisitorTracker /><StoreCheckoutBoletoSuccess /></>} />
        </Route>

        <Route element={<StoreLayout />}>
          <Route path="/rastro-code/:id" element={<TrackOrder />} />
          <Route path="/rastro-code" element={<TrackOrder />} />
          <Route path="/rastreio/:id" element={<TrackOrder />} />
          <Route path="/rastreio" element={<TrackOrder />} />
          <Route path="/tracking/:id" element={<TrackOrder />} />
          <Route path="/tracking" element={<TrackOrder />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <TrackingProvider>
          <AuthProvider>
            <StoreProvider>
              <AppRoutes />
            </StoreProvider>
          </AuthProvider>
        </TrackingProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
