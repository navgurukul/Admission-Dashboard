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

  useEffect(() => {
    if (!loading && !googleLoading) {
      // Check if user is authenticated via either method
      const isUserAuthenticated = user || (googleUser && isAuthenticated);
      
      if (!isUserAuthenticated) {
        navigate("/auth");
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

  return <>{children}</>;
}