import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

interface AdminContextType {
  mobileSidebarOpen: boolean;
  setMobileSidebarOpen: (open: boolean) => void;
  toggleMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Automatically close mobile sidebar whenever the route or search query changes
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname, location.search]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSidebarOpen(false);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Prevent background scrolling when mobile sidebar is open
  useEffect(() => {
    if (mobileSidebarOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileSidebarOpen]);

  const toggleMobileSidebar = () => setMobileSidebarOpen(prev => !prev);
  const closeMobileSidebar = () => setMobileSidebarOpen(false);

  return (
    <AdminContext.Provider
      value={{
        mobileSidebarOpen,
        setMobileSidebarOpen,
        toggleMobileSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (!context) {
    return {
      mobileSidebarOpen: false,
      setMobileSidebarOpen: () => {},
      toggleMobileSidebar: () => {},
      closeMobileSidebar: () => {},
    };
  }
  return context;
};
