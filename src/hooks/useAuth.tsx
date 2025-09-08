

import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useGoogleAuth } from './useGoogleAuth';

 interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
  avatar?: string;
  role_id?: number;
  role_name?: string;
  profile_pic?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUserInfo: () => AuthUser | null;
  isAuthenticated: boolean;
  userRole: string | null;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser| null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  const { 
    user: googleUser, 
    isAuthenticated: googleAuthenticated, 
    loading: googleLoading,
    getUserRole,
    hasRole: googleHasRole,
    signOut: googleLogout 
  } = useGoogleAuth();

  useEffect(() => {
    
    const syncAuthState = () => {
      if (googleUser && googleAuthenticated) {
        const localUser: AuthUser = {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          role: getUserRole(), 
          role_id: googleUser.role_id,
          role_name: googleUser.role_name,
          
        };

   
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    };

    if (!googleLoading) {
      syncAuthState();
    }
  }, [googleUser, googleAuthenticated, googleLoading, getUserRole]);

  const signOut = async () => {
    try {
      // Use  logout function
      await googleLogout();
      
      // Clear local state
      setUser(null);
      setSession(null);
      
      toast({
        title: "Signed out successfully",
        description: "You have been logged out from all systems.",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Logout Error",
        description: "There was an issue signing you out. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getUserInfo = ():AuthUser | null => {
    return user;
  };

  const userRole = getUserRole();
  const isAuthenticated = googleAuthenticated;
  const hasRole = (role: string): boolean => {
    return googleHasRole(role);
  };

  

  const contextValue: AuthContextType = {
    user,
    session,
    loading: loading || googleLoading,
    signOut,
    getUserInfo,
    isAuthenticated,
    userRole,
    hasRole,
    
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

// Backward compatibility exports
export type { AuthUser, AuthContextType };