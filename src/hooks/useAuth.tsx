import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useGoogleAuth } from './useGoogleAuth';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUserInfo: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user: googleUser, isAuthenticated, loading: googleLoading } = useGoogleAuth();

  useEffect(() => {
    // Check for existing Google authentication on app load
    const checkAuth = () => {
      if (googleUser && isAuthenticated) {
        setUser(googleUser);
        setSession({ provider: 'google' });
      }
      setLoading(false);
    };

    if (!googleLoading) {
      checkAuth();
    }
  }, [googleUser, isAuthenticated, googleLoading]);

  const signOut = async () => {
    // Clear all auth data
    localStorage.removeItem('googleUser');
    localStorage.removeItem('roleAccess');
    localStorage.removeItem('privileges');
    setUser(null);
    setSession(null);
    
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
  };

  const getUserInfo = () => {
    return user;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signOut, getUserInfo }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}