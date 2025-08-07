import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user: googleUser, isAuthenticated, loading: googleLoading } = useGoogleAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Allowed admin emails
  const ALLOWED_EMAILS = ["nasir@navgurukul.org", "urmilaparte23@navgurukul.org", "saksham.c@navgurukul.org", "mukul@navgurukul.org"];

  // Helper to get current user's email
  const getCurrentUserEmail = () => {
    if (googleUser) {
      return googleUser.email;
    }
    return null;
  };

  useEffect(() => {
    if (!googleLoading) {
      // Check if user is authenticated via Google
      if (!googleUser || !isAuthenticated) {
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
  }, [googleUser, isAuthenticated, googleLoading, navigate]);

  // Show loading while checking authentication
  if (googleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated via Google
  if (!googleUser || !isAuthenticated) {
    return null; // Will redirect to auth page
  }

  // Email check (for SSR safety) - only for authenticated users
  const email = getCurrentUserEmail();
  if (email && !ALLOWED_EMAILS.includes(email)) {
    return null; // Will redirect to /students
  }

  return <>{children}</>;
}