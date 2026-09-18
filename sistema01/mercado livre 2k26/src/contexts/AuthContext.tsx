import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  isExpired: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (email: string, password: string, expiryDays?: number) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

const checkExpiry = (user: User | null): boolean => {
  if (!user) return false;
  const expiresAt = user.user_metadata?.expires_at;
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsExpired(checkExpiry(session?.user ?? null));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsExpired(checkExpiry(session?.user ?? null));
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { success: false, error: error.message };
    
    // Check if session is expired
    if (data.user && checkExpiry(data.user)) {
      await supabase.auth.signOut();
      return { success: false, error: "Sua sessão expirou. Solicite uma nova conta ao administrador." };
    }
    
    return { success: true };
  }, []);

  const signup = useCallback(async (email: string, password: string, expiryDays: number = 30) => {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          expires_at: expiresAt.toISOString(),
          expiry_days: expiryDays,
        },
      },
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    sessionStorage.removeItem("metarat_piracy_alert_shown");
    await supabase.auth.signOut();
  }, []);

  const isAuthenticated = !!user && !isExpired;

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, isExpired, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
