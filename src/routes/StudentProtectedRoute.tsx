import React from "react";
import { Navigate, useLocation } from "react-router-dom";

const StudentProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  // Check for student login (adjust key as per your login logic)
  const isLoggedIn = !!localStorage.getItem("studentId");
  const location = useLocation();

  if (!isLoggedIn) {
    // Redirect to login, preserve intended path
    return <Navigate to="/students/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default StudentProtectedRoute;