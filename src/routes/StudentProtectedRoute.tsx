import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const StudentProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // Read once – do NOT set defaults here
  const studentId = localStorage.getItem("studentId");
  const testStarted = localStorage.getItem("testStarted") === "true";
  const testCompleted = localStorage.getItem("testCompleted") === "true";
  const allowRetest = localStorage.getItem("allowRetest") === "true";
  const registrationDone = localStorage.getItem("registrationDone") === "true";

  // 1️⃣ Not logged in and not on registration flow → login
  const isRegistrationFlow =
    path.startsWith("/students/details/") ||
    path.startsWith("/students/language-selection");

  if (!studentId && !isRegistrationFlow) {
    return <Navigate to="/students" replace />;
  }

  // 2️⃣ Trying to access test without registration or start
  if (!registrationDone && path.startsWith("/students/test")) {
    return <Navigate to="/students/details/instructions" replace />;
  }

  // 3️⃣ Test completed, no retest allowed → lock to final-result
  if (testCompleted && !allowRetest) {
    const allowedTestPaths = [
      "/students/test/start",
      "/students/test/section",
      "/students/test/result",
    ];

    if (
      !allowedTestPaths.includes(path) &&
      !path.startsWith("/students/final-result")
    ) {
      return <Navigate to="/students/final-result" replace />;
    }
  }

  // 4️⃣ Retesting → cannot visit final-result
  if (allowRetest && path.startsWith("/students/final-result")) {
    return <Navigate to="/students/test/start" replace />;
  }

  // 5️⃣ Registration done → cannot go back to instructions
  if (registrationDone && path.startsWith("/students/details/instructions")) {
    return <Navigate to="/students/test/start" replace />;
  }

  return <>{children}</>;
};

export default StudentProtectedRoute;
