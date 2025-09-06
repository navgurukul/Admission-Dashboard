

import { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { useGoogleAuth } from './useGoogleAuth';
import { getCurrentUser, getCurrentUserRole, isSuperAdmin } from '@/utils/api';

interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
  phone?: string;
  avatar?: string;
  role_id?: number;
  role_name?: string;
}

interface AuthContextType {
  user: User | null;
  session: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUserInfo: () => User | null;
  isAuthenticated: boolean;
  userRole: string | null;
  hasRole: (role: string) => boolean;
  // isSuperAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Use Railway-integrated GoogleAuth hook
  const { 
    user: googleUser, 
    isAuthenticated: googleAuthenticated, 
    loading: googleLoading,
    getUserRole,
    hasRole: googleHasRole,
    logout: googleLogout 
  } = useGoogleAuth();

  useEffect(() => {
    // Sync with Railway Google Auth state
    const syncAuthState = () => {
      if (googleUser && googleAuthenticated) {
        // Convert Railway user to local user format
        const localUser: User = {
          id: googleUser.id,
          email: googleUser.email,
          name: googleUser.name,
          avatar: googleUser.avatar,
          role: getUserRole(), // Get role from Railway
          role_id: googleUser.role_id,
          role_name: googleUser.role_name
        };

        setUser(localUser);
        setSession({ 
          provider: 'google',
          railway_token: localStorage.getItem('authToken'),
          user_role: getUserRole()
        });

        // console.log('Auth synced with Railway:', {
        //   user: localUser.email,
        //   role: getUserRole(),
        //   isSuper: googleUser ? googleUser.email in ['nasir@navgurukul.org', 'urmilaparte23@navgurukul.org', 'saksham.c@navgurukul.org', 'mukul@navgurukul.org'] : false
        // });
      } else {
        setUser(null);
        setSession(null);
      }
      setLoading(false);
    };

    // if (!googleLoading) {
    //   syncAuthState();
    // }
  }, [googleUser, googleAuthenticated, googleLoading, getUserRole]);

  const signOut = async () => {
    try {
      // Use Railway logout function
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

  const getUserInfo = (): User | null => {
    return user;
  };

  const userRole = getUserRole();
  const isAuthenticated = googleAuthenticated;
  const hasRole = (role: string): boolean => {
    return googleHasRole(role);
  };

  // Check if current user is super admin using your API utils
  // const isSuperAdmin = googleUser ? [
  //   "nasir@navgurukul.org", 
  //   "urmilaparte23@navgurukul.org", 
  //   "saksham.c@navgurukul.org", 
  //   "mukul@navgurukul.org"
  // ].includes(googleUser.email) : false;

  const contextValue: AuthContextType = {
    user,
    session,
    loading: loading || googleLoading,
    signOut,
    getUserInfo,
    isAuthenticated,
    userRole,
    hasRole,
    // isSuperAdmin
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
export type { User, AuthContextType };