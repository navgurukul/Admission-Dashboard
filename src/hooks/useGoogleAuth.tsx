import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google';
}

interface GoogleAuthState {
  user: GoogleUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '654022633429-fv4rgcs654a0f9r0464tl6o8jvjk3dco.apps.googleusercontent.com'; // Provided by user
const GOOGLE_REDIRECT_URI = window.location.origin;

export const useGoogleAuth = () => {
  const [authState, setAuthState] = useState<GoogleAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const { toast } = useToast();

  // Initialize Google OAuth
  useEffect(() => {
    const initializeGoogleAuth = () => {
      // Load Google OAuth script
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        // Initialize Google OAuth
        if (window.google) {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          // Check if user is already signed in
          checkExistingSession();
        }
      };
    };

    initializeGoogleAuth();
  }, []);

  // Check for existing session
  const checkExistingSession = () => {
    const storedUser = localStorage.getItem('googleUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          loading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('googleUser');
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      }
    } else {
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async (response: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Decode the JWT token
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const user: GoogleUser = {
        id: payload.sub,
        email: payload.email,
        name: payload.name,
        avatar: payload.picture,
        provider: 'google',
      };

      // Store user info
      localStorage.setItem('googleUser', JSON.stringify(user));
      
      // Fetch role-based access and privileges
      try {
        const roleAccessResponse = await fetch(`https://dev-join.navgurukul.org/api/rolebaseaccess/mail/${user.email}`);
        const roleAccessData = await roleAccessResponse.json();
        console.log('Role-based access data:', roleAccessData);

        const privilegesResponse = await fetch('https://dev-join.navgurukul.org/api/role/getPrivilege');
        const privilegesData = await privilegesResponse.json();
        console.log('Privileges data:', privilegesData);

        localStorage.setItem('roleAccess', JSON.stringify(roleAccessData));
        localStorage.setItem('privileges', JSON.stringify(privilegesData));
      } catch (apiError) {
        console.error('Error fetching role data:', apiError);
      }

      setAuthState({
        user,
        loading: false,
        isAuthenticated: true,
      });

      toast({
        title: "Welcome!",
        description: `Successfully signed in with Google as ${user.name}`,
      });

    } catch (error) {
      console.error('Google sign-in error:', error);
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });
      
      toast({
        title: "Error",
        description: "Failed to sign in with Google. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sign Out
  const signOut = () => {
    if (window.google) {
      window.google.accounts.id.disableAutoSelect();
    }
    
    localStorage.removeItem('googleUser');
    localStorage.removeItem('roleAccess');
    localStorage.removeItem('privileges');
    
    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    toast({
      title: "Signed Out",
      description: "You have been successfully signed out.",
    });
  };

  // Render Google Sign In Button
  const renderGoogleSignInButton = (elementId: string) => {
    if (window.google) {
      window.google.accounts.id.renderButton(
        document.getElementById(elementId),
        {
          theme: 'outline',
          size: 'large',
          text: 'continue_with',
          shape: 'rectangular',
          width: '100%',
        }
      );
    }
  };

  return {
    ...authState,
    signOut,
    renderGoogleSignInButton,
  };
};

// TypeScript declarations
declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          renderButton: (element: HTMLElement | null, options: any) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
} 