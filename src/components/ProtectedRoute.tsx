import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

// const roleToRoute = {
//   admin: "/admin",
//   donor: "/donor",
//   campus: "/campus",
//   fullDashboardAccess: "/dashboard",
// };

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  // const location = useLocation();
  // const [roleLoading, setRoleLoading] = useState(true);
  // const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }
    // if (!loading && user) {
    //   const email = user.email || "";
    //   if (!email.endsWith("@navgurukul.com")) {
    //     navigate("/auth");
    //     return;
    //   }
    //   // Fetch user role from API
    //   setRoleLoading(true);
    //   fetch("https://dev-join.navgurukul.org/api/rolebaseaccess/email")
    //     .then((res) => res.json())
    //     .then((data) => {
    //       const found = data.find((u) => u.email === email);
    //       if (!found || !found.userrole || found.userrole.length === 0) {
    //         setUserRole(null);
    //         setRoleLoading(false);
    //         navigate("/auth");
    //         return;
    //       }
    //       const roleObj = found.userrole.find((ur) => ur.role && ur.role.length > 0);
    //       const role = roleObj && roleObj.role[0]?.roles;
    //       setUserRole(role);
    //       setRoleLoading(false);
    //       const expectedRoute = roleToRoute[role] || "/auth";
    //       if (location.pathname !== expectedRoute) {
    //         navigate(expectedRoute, { replace: true });
    //       }
    //     });
    // }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // // Only render children if user is on the correct route for their role
  // const expectedRoute = userRole ? roleToRoute[userRole] : "/auth";
  // if (location.pathname !== expectedRoute) {
  //   return null;
  // }

  return <>{children}</>;
}