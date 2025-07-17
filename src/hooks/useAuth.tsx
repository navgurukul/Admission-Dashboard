import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

interface AdminUser {
  id: number;
  email: string;
  password: string;
}

interface AuthContextType {
  user: AdminUser | null;
  signIn: (email: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const email = localStorage.getItem("currentUserEmail");
    const adminUsers: AdminUser[] = JSON.parse(localStorage.getItem("adminUser") || "[]");
    const foundUser = adminUsers.find(
      (u) => u.email.toLowerCase() === (email || "").toLowerCase()
    );
    setUser(foundUser || null);
  }, []);

  const signIn = (email: string) => {
    localStorage.setItem("currentUserEmail", email);
    const adminUsers: AdminUser[] = JSON.parse(localStorage.getItem("adminUser") || "[]");
    const foundUser = adminUsers.find(
      (u) => u.email.toLowerCase() === (email || "").toLowerCase()
    );
    setUser(foundUser || null);
  };

  const signOut = () => {
    localStorage.removeItem("currentUserEmail");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}