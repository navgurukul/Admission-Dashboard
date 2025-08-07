import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const { user: googleUser, isAuthenticated, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Allowed admin emails
  const ALLOWED_EMAILS = ["nasir@navgurukul.org", "urmilaparte23@navgurukul.org", "saksham.c@navgurukul.org", "mukul@navgurukul.org","santosh@navgurukul.org"];

  // Helper to get current user's email
  const getCurrentUserEmail = () => {
    if (user) {
      return user.email;
    } else if (googleUser) {
      return googleUser.email;
    }
    return null;
  };

  useEffect(() => {
    if (!loading && !googleLoading) {
      // Check if user is authenticated via either method
      const isUserAuthenticated = user || (googleUser && isAuthenticated);
      
      if (!isUserAuthenticated) {
        // Redirect to auth page if not authenticated
        navigate("/auth", { replace: true });
        return;
      }

      // Email check - only for authenticated users
      const email = getCurrentUserEmail();
      if (email && !ALLOWED_EMAILS.includes(email)) {
        // Redirect to students page if email not in allowed list
        navigate("/students", { replace: true });
        return;
      }
    }
  }, [user, loading, googleUser, isAuthenticated, googleLoading, navigate]);

  // Show loading while checking authentication
  if (loading || googleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated via either method
  const isUserAuthenticated = user || (googleUser && isAuthenticated);
  if (!isUserAuthenticated) {
    return null; // Will redirect to auth page
  }

  // Email check (for SSR safety) - only for authenticated users
  const email = getCurrentUserEmail();
  if (email && !ALLOWED_EMAILS.includes(email)) {
    return null; // Will redirect to /students
  }

  return <>{children}</>;
}