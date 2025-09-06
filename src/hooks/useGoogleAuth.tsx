
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';
import { loginWithGoogle, User, Role, GoogleAuthPayload, SUPER_ADMIN_EMAILS } from '@/utils/api';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: 'google';
  role_id?: number;
  role?: Role;
}

interface GoogleAuthState {
  user: GoogleUser | null;
  loading: boolean;
  isAuthenticated: boolean;
}

// Google OAuth Configuration
const GOOGLE_CLIENT_ID = '654022633429-fv4rgcs654a0f9r0464tl6o8jvjk3dco.apps.googleusercontent.com';
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
      // Check if script is already loaded
      if (document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
        if (window.google) {
          initializeGoogleOAuth();
        }
        return;
      }

      // Load Google OAuth script
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

          // Check if user is already signed in
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

  // Check for existing session (Updated for Railway API)
  const checkExistingSession = () => {
    const storedUser = localStorage.getItem('user'); // Changed from 'googleUser' to 'user'
    const authToken = localStorage.getItem('authToken');
    const userRole = localStorage.getItem('userRole');
    
    if (storedUser && authToken) {
      try {
        const user = JSON.parse(storedUser);
        const role = userRole ? JSON.parse(userRole) : null;
        
        // Create GoogleUser format for backward compatibility
        const googleUser: GoogleUser = {
          id: user.id?.toString() || user.sub,
          email: user.email,
          name: user.name,
          avatar: user.picture || '', // Handle if avatar not present in Railway user
          provider: 'google',
          role_id: user.role_id,
          role: role,
        };

        setAuthState({
          user: googleUser,
          loading: false,
          isAuthenticated: true,
        });
      } catch (error) {
        console.error('Error parsing stored user:', error);
        // Clear corrupted data
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

  // Handle Google Sign In (Updated for Railway API)
  const handleGoogleSignIn = async (response: any) => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));

      // Decode the JWT token from Google
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      console.log('Google JWT payload:', payload);

      // Prepare payload for API
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

      console.log('this is checking payload:=>',googleAuthPayload)
      // Call Railway login API
      const loginResponse = await loginWithGoogle(googleAuthPayload);
      console.log('Railway login response:', loginResponse);

      if (loginResponse.success && loginResponse.data) {
        const { user: railwayUser, token } = loginResponse.data;

        // Store Railway data in localStorage
        localStorage.setItem('authToken', token); // Railway JWT token
        localStorage.setItem('user', JSON.stringify(railwayUser)); 
        
        // Store role information if available
        if (railwayUser.role) {
          localStorage.setItem('userRole', JSON.stringify(railwayUser.role));
        }

        // Create GoogleUser format for component compatibility
        const googleUser: GoogleUser = {
          id: railwayUser.id.toString(),
          email: railwayUser.email,
          name: railwayUser.name,
          avatar: payload.picture || '', 
          provider: 'google',
          role_id: railwayUser.role_id,
          role: railwayUser.role,
        };

        setAuthState({
          user: googleUser,
          loading: false,
          isAuthenticated: true,
        });

        // Clean up old NavGurukul data if exists
        localStorage.removeItem('googleUser');
        localStorage.removeItem('roleAccess');
        localStorage.removeItem('privileges');

        toast({
          title: "Welcome!",
          description: `Successfully signed in as ${railwayUser.name}`,
        });

      } else {
        throw new Error(loginResponse.message || 'Login failed');
      }

    } catch (error) {
      console.error('Login error:', error);
      
      // Clear any stored data on error
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('userRole');
      
      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      // Show different error messages based on error type
      let errorMessage = "Failed to sign in. Please try again.";
      
      if (error instanceof Error) {
        if (error.message.includes('unauthorized') || error.message.includes('not found')) {
          // Check if user is super admin
          const payload = JSON.parse(atob(response.credential.split('.')[1]));
          if (SUPER_ADMIN_EMAILS.includes(payload.email)) {
            errorMessage = "Super admin detected but user not found in system. Please contact system administrator.";
          } else {
            errorMessage = "You are not authorized to access this system. Please contact administrator.";
          }
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: "Sign In Failed",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  // Sign Out (Updated)
  const signOut = () => {
    if (window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error('Error disabling Google auto select:', error);
      }
    }
    
    // Clear all stored data
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('userRole');
    
    // Clean up old NavGurukul data if exists
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

  // Render Google Sign In Button (Unchanged)
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

  // Helper functions for role checking
  const isSuperAdmin = () => {
    return authState.user ? SUPER_ADMIN_EMAILS.includes(authState.user.email) : false;
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
    isSuperAdmin,
    getUserRole,
    hasRole,
  };
};

// TypeScript declarations (Unchanged)
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