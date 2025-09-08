
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from './use-toast';
import { loginWithGoogle, Role, GoogleAuthPayload } from '@/utils/api';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google';
  role_id?: number | null;
  role?: any | null;  
  profile_pic?: string | null;
  role_name?: string | null;
}
interface GoogleAuthState {
  user: GoogleUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '654022633429-fv4rgcs654a0f9r0464tl6o8jvjk3dco.apps.googleusercontent.com';

export const useGoogleAuth = () => {
  
  const [authState, setAuthState] = useState<GoogleAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const { toast } = useToast();

  // Initialize Google OAuth
  useEffect(() => {
     checkExistingSession();
    const initializeGoogleAuth = () => {
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        if (window.google) {
          initializeGoogleOAuth();
        }
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        initializeGoogleOAuth();
      };

      script.onerror = () => {
        console.error('Failed to load Google OAuth script');
        setAuthState({
          user: null,
          loading: false,
          isAuthenticated: false,
        });
      };
    };

    const initializeGoogleOAuth = () => {
      if (window.google) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleGoogleSignIn,
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          checkExistingSession();
        } catch (error) {
          console.error('Error initializing Google OAuth:', error);
          setAuthState({
            user: null,
            loading: false,
            isAuthenticated: false,
          });
        }
      }
    };

    initializeGoogleAuth();
  }, []);

  // Restore session from localStorage
const checkExistingSession = () => {
  const storedUser = localStorage.getItem('user');
  const authToken = localStorage.getItem('authToken');
  
  if (storedUser && authToken) {
    try {
      const apiUser = JSON.parse(storedUser);

      const googleUser: GoogleUser = {
        id: apiUser.id.toString(),
        email: apiUser.email,
        name: apiUser.name,
        avatar: apiUser.profile_pic || '', 
        provider: 'google',
        role_id:  apiUser.user_role_id,
        role: apiUser.role,
        role_name: apiUser.role_name,
        profile_pic: apiUser.profile_pic,
      };

      setAuthState({
        user: googleUser,
        loading: false,
        isAuthenticated: true,
      });
    } catch (error) {
      console.error('Error parsing stored user:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('userRole');
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

      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Google JWT payload:', payload);

      const googleAuthPayload: GoogleAuthPayload = {
        iss: payload.iss,
        aud: payload.aud,
        sub: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified || true,
        name: payload.name,
        iat: payload.iat,
        exp: payload.exp,
        picture: payload.picture,
      };

      const loginResponse = await loginWithGoogle(googleAuthPayload);
      console.log('NG login response:', loginResponse);

      if (loginResponse.success && loginResponse.data) {
        const { user: apiUser, token } = loginResponse.data;

        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(apiUser));

        if (apiUser.role_name) {
          localStorage.setItem('userRole', JSON.stringify(apiUser.role_name));
        }

        const googleUser: GoogleUser = {
          id: apiUser.id.toString(),
          email: apiUser.email,
          name: apiUser.name,
          avatar: apiUser.profile_pic || payload.picture || '',
          provider: 'google',
          role_id: apiUser.role_id || apiUser.role_id,
          // role: apiUser.role,
          role_name: apiUser.role_name,
          profile_pic: apiUser.profile_pic,
        };

        setAuthState({
          user: googleUser,
          loading: false,
          isAuthenticated: true,
        });


      
        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${apiUser.name}`,
        });

      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }

    } catch (error) {
      console.error('Login error:', error);

     
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      toast({
        title: "Sign In Failed",
        description: error instanceof Error ? error.message : "Failed to sign in. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Sign Out
  const signOut = () => {
    if (window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Error disabling Google auto select:', error);
      }
    }
    
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
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
      try {
        const element = document.getElementById(elementId);
        if (element) {
          window.google.accounts.id.renderButton(element, {
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: 250,
          });
        }
      } catch (error) {
        console.error('Error rendering Google button:', error);
      }
    }
  };

  const getUserRole = () => {
    return authState.user?.role?.name || null;
  };

  const hasRole = (roleName: string) => {
    const userRole = getUserRole();
    return userRole ? userRole.toLowerCase() === roleName.toLowerCase() : false;
  };

  return {
    ...authState,
    signOut,
    renderGoogleSignInButton,
    getUserRole,
    hasRole,
  };
};

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


