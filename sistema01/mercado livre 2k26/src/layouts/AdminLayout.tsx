import { useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "@/components/AdminSidebar";
import { SalesNotificationToast } from "@/components/admin/SalesNotificationToast";
import { useSalesNotifier } from "@/hooks/useSalesNotifier";
import { AdminProvider } from "@/contexts/AdminContext";

const AdminLayoutContent = () => {
  const navigate = useNavigate();
  const { currentNotification, closeNotification } = useSalesNotifier();

  useEffect(() => {
    document.body.classList.add('admin-theme');
    return () => {
      document.body.classList.remove('admin-theme');
    };
  }, []);

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      <AdminSidebar />
      <div className="flex-1 flex flex-col h-screen min-w-0 overflow-hidden">
        <Outlet />
      </div>

      {/* Real-time Sales Toast */}
      <SalesNotificationToast
        notification={currentNotification}
        onClose={closeNotification}
        onClick={() => {
          closeNotification();
          navigate("/admin/orders-pix");
        }}
      />
    </div>
  );
};

const AdminLayout = () => {
  return (
    <AdminProvider>
      <AdminLayoutContent />
    </AdminProvider>
  );
};

export default AdminLayout;
