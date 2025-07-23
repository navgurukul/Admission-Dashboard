import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { useToast } from './use-toast';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signOut: () => Promise<void>;
  getUserInfo: () => any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Handle OAuth callback
        if (event === 'SIGNED_IN' && session?.user) {
          const userData = session.user;
          
          // Extract user information from Google OAuth
          if (userData.app_metadata?.provider === 'google') {
            const userInfo = {
              id: userData.id,
              email: userData.email,
              name: userData.user_metadata?.full_name || userData.user_metadata?.name,
              avatar: userData.user_metadata?.avatar_url,
              provider: 'google'
            };

            console.log('Google user info:', userInfo);
            
            // Store user info in localStorage
            localStorage.setItem('userInfo', JSON.stringify(userInfo));

            // Fetch role-based access and privileges for Google users too
            try {
              const roleAccessResponse = await fetch(`https://dev-join.navgurukul.org/api/rolebaseaccess/mail/${userData.email}`);
              const roleAccessData = await roleAccessResponse.json();
              console.log('Role-based access data for Google user:', roleAccessData);

              const privilegesResponse = await fetch('https://dev-join.navgurukul.org/api/role/getPrivilege');
              const privilegesData = await privilegesResponse.json();
              console.log('Privileges data for Google user:', privilegesData);

              localStorage.setItem('roleAccess', JSON.stringify(roleAccessData));
              localStorage.setItem('privileges', JSON.stringify(privilegesData));

            } catch (apiError) {
              console.error('Error fetching role data for Google user:', apiError);
            }

            toast({
              title: "Welcome!",
              description: `Successfully signed in with Google as ${userInfo.name}`,
            });
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [toast]);

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('userInfo');
    localStorage.removeItem('roleAccess');
    localStorage.removeItem('privileges');
  };

  const getUserInfo = () => {
    const userInfo = localStorage.getItem('userInfo');
    return userInfo ? JSON.parse(userInfo) : null;
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