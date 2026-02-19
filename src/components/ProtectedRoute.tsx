import { useEffect, useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import { navigation } from "@/components/ui/navigation.tsx";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user: googleUser, isAuthenticated, loading } = useGoogleAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  // Get allowedRoles for current path from navigation
  const currentNavItem = navigation.find(
    (item) => item.href === location.pathname,
  );
  const allowedRoles = currentNavItem?.allowedRoles;

  useEffect(() => {
    if (!loading) {
      // Not authenticated → redirect to auth page
      if (!googleUser || !isAuthenticated) {
        setAllowed(false);
        return;
      }

      // Role not allowed → redirect to default page
      if (allowedRoles && !allowedRoles.includes(googleUser.role_id)) {
        setAllowed(false);
        return;
      }

      // User is allowed
      setAllowed(true);
    }
  }, [googleUser, isAuthenticated, loading, allowedRoles]);

  // Show loader while checking auth/role
  if (loading || allowed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!allowed) {
    // Redirect unauthorized users to login page
    return <Navigate to="/students" replace />;
  }

  return <>{children}</>;
}
