import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "./use-toast";
import { loginWithGoogle, GoogleAuthPayload } from "@/utils/api";
import { getFriendlyErrorMessage } from "@/utils/errorUtils";

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  provider: "google";
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
const GOOGLE_CLIENT_ID =
  "654022633429-fv4rgcs654a0f9r0464tl6o8jvjk3dco.apps.googleusercontent.com";

interface UseGoogleAuthOptions {
  skipAutoNavigation?: boolean;
}

export const useGoogleAuth = (options?: UseGoogleAuthOptions) => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<GoogleAuthState>({
    user: null,
    loading: true,
    isAuthenticated: false,
  });
  const { toast } = useToast();
  const skipAutoNavigation = options?.skipAutoNavigation || false;

  // Initialize Google OAuth
  useEffect(() => {
    const initializeGoogleAuth = () => {
      if (
        document.querySelector(
          'script[src="https://accounts.google.com/gsi/client"]',
        )
      ) {
        if (window.google) {
          initializeGoogleOAuth();
        }
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);

      script.onload = () => {
        initializeGoogleOAuth();
      };

      script.onerror = () => {
        console.error("Failed to load Google OAuth script");
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

          // Check for existing session after Google is initialized
          checkExistingSession();
        } catch (error) {
          console.error("Error initializing Google OAuth:", error);
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
    const storedUser = localStorage.getItem("user");
    const authToken = sessionStorage.getItem("authToken");

    if (storedUser && authToken) {
      try {
        const apiUser = JSON.parse(storedUser);

        const googleUser: GoogleUser = {
          id: apiUser.id.toString(),
          email: apiUser.email,
          name: apiUser.name,
          avatar: apiUser.profile_pic || "",
          provider: "google",
          role_id: apiUser.user_role_id,
          role: apiUser.role,
          role_name: apiUser.role_name,
          profile_pic: apiUser.profile_pic,
        };

        setAuthState({
          user: googleUser,
          isAuthenticated: true,
          loading: false,
        });
      } catch (error) {
        console.error("Error parsing stored user:", error);
        localStorage.removeItem("user");
        localStorage.removeItem("authToken");
        localStorage.removeItem("userRole");
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
      setAuthState((prev) => ({ ...prev, loading: true }));

      const payload = JSON.parse(atob(response.credential.split(".")[1]));
      // console.log('Google JWT payload:', payload);

      // Store Google's JWT credential for students (who don't get backend token)
      const googleJWT = response.credential;
      sessionStorage.setItem("google_credential", googleJWT);

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
      // console.log('NG login response:', loginResponse);

      if (loginResponse.success && loginResponse.data) {
        const { user: apiUser, token } = loginResponse.data;

        // console.log('Storing auth data:', {
        //   token: token ? 'exists' : 'missing',
        //   tokenValue: token,
        //   userId: apiUser?.id,
        //   userEmail: apiUser?.email,
        //   skipAutoNavigation
        // });

        // Store token only if it exists and is not undefined
        if (token && token !== "undefined") {
          sessionStorage.setItem("authToken", token);
          // console.log(' Backend token stored successfully');
        } else {
          // console.warn(' Backend did not provide token for user:', apiUser?.email);
          // Don't store undefined - let student login page handle it
        }

        localStorage.setItem("user", JSON.stringify(apiUser));

        if (apiUser.role_name) {
          localStorage.setItem("userRole", JSON.stringify(apiUser.role_name));
        }

        const googleUser: GoogleUser = {
          id: apiUser.id.toString(),
          email: apiUser.email,
          name: apiUser.name,
          avatar: apiUser.profile_pic || payload.picture || "",
          provider: "google",
          role_id: apiUser.user_role_id,
          // role: apiUser.role,
          role_name: apiUser.role_name,
          profile_pic: apiUser.profile_pic,
        };

        setAuthState({
          user: googleUser,
          loading: false,
          isAuthenticated: true,
        });

        // console.log("Logged in user:", apiUser);

        // Skip auto-navigation if requested (e.g., for student login page)
        if (!skipAutoNavigation) {
          if (apiUser.role_name === "ADMIN" || apiUser.role_name === "USER") {
            localStorage.setItem("userRole", JSON.stringify(apiUser.role_name));
            navigate("/");
            toast({
              title: "✅ Welcome!",
              description: `Successfully signed in as ${apiUser.name}`,
              variant: "default",
              className: "border-green-500 bg-green-50 text-green-900",
            });
          } else {
            localStorage.setItem("userRole", JSON.stringify("student"));
            navigate("/students");
            toast({
              title: "⚠️ No Role Assigned",
              description: `No role assigned. Please contact admin to assign a role.`,
              variant: "default",
              className: "border-orange-500 bg-orange-50 text-orange-900",
            });
          }
        }
      } else {
        throw new Error(loginResponse.message || "Login failed");
      }
    } catch (error) {
      console.error("Login error:", error);

      setAuthState({
        user: null,
        loading: false,
        isAuthenticated: false,
      });

      toast({
        title: "❌ Sign In Failed",
        description: getFriendlyErrorMessage(error),
        variant: "destructive",
        className: "border-red-500 bg-red-50 text-red-900",
      });
    }
  };

  // Sign Out
  const signOut = () => {
    if (window.google) {
      try {
        window.google.accounts.id.disableAutoSelect();
      } catch (error) {
        console.error("Error disabling Google auto select:", error);
      }
    }

    localStorage.removeItem("authToken");
    localStorage.removeItem("user");
    localStorage.removeItem("userRole");
    localStorage.removeItem("googleUser");
    localStorage.removeItem("roleAccess");

    setAuthState({
      user: null,
      loading: false,
      isAuthenticated: false,
    });

    toast({
      title: "✅ Signed Out",
      description: "You have been successfully signed out.",
      variant: "default",
      className: "border-green-500 bg-green-50 text-green-900",
    });
  };

  // Render Google Sign In Button
  const renderGoogleSignInButton = useCallback((elementId: string) => {
    if (window.google) {
      try {
        const element = document.getElementById(elementId);
        if (element) {
          window.google.accounts.id.renderButton(element, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "rectangular",
            width: 250,
          });
        }
      } catch (error) {
        console.error("Error rendering Google button:", error);
      }
    }
  }, []);

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
