import React, { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

interface StudentProtectedRouteProps {
  children?: ReactNode;
}

const StudentProtectedRoute: React.FC<StudentProtectedRouteProps> = ({ children }) => {
  const location = useLocation();

  // 🔹 Read progress synchronously
  const isLoggedIn = !!localStorage.getItem("studentId");
  const registrationDone = localStorage.getItem("registrationDone") === "true";
  const instructionsDone = localStorage.getItem("instructionsDone") === "true";
  const testStarted = localStorage.getItem("testStarted") === "true";
  const testCompleted = localStorage.getItem("testCompleted") === "true";

  const currentPath = location.pathname;

  // 🔹 Determine where to redirect
  if (!isLoggedIn && currentPath !== "/students/login") {
    return <Navigate to="/students/login" replace />;
  }

  if (isLoggedIn && !registrationDone && currentPath !== "/students/details/registration") {
    return <Navigate to="/students/details/registration" replace />;
  }

  if (isLoggedIn && registrationDone && !instructionsDone && currentPath !== "/students/details/instructions") {
    return <Navigate to="/students/details/instructions" replace />;
  }

  if (isLoggedIn && instructionsDone && !testStarted && currentPath !== "/students/test/start") {
    return <Navigate to="/students/test/start" replace />;
  }

  if (isLoggedIn && testStarted && !testCompleted && currentPath !== "/students/test/section") {
    return <Navigate to="/students/test/section" replace />;
  }

  if (isLoggedIn && testCompleted && currentPath !== "/students/test/result") {
    return <Navigate to="/students/test/result" replace />;
  }

  // 🔹 Render children or nested routes
  return <>{children ?? <Outlet />}</>;
};

export default StudentProtectedRoute;
