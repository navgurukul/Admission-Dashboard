// import React from "react";
// import { Navigate, useLocation } from "react-router-dom";

// interface Props {
//   children: React.ReactNode;
// }

// const StudentProtectedRoute: React.FC<Props> = ({ children }) => {
//   const location = useLocation();
//   const path = location.pathname;

//   // Initialize localStorage defaults if missing
//   if (localStorage.getItem("testStarted") === null)
//     localStorage.setItem("testStarted", "false");
//   if (localStorage.getItem("testCompleted") === null)
//     localStorage.setItem("testCompleted", "false");
//   if (localStorage.getItem("allowRetest") === null)
//     localStorage.setItem("allowRetest", "false");
//   if (localStorage.getItem("registrationDone") === null)
//     localStorage.setItem("registrationDone", "false");

//   // Read values
//   const studentId = localStorage.getItem("studentId");
//   const testStarted = localStorage.getItem("testStarted") === "true";
//   const testCompleted = localStorage.getItem("testCompleted") === "true";
//   const allowRetest = localStorage.getItem("allowRetest") === "true";
//   const registrationDone = localStorage.getItem("registrationDone") === "true";

//   // Not logged in → back to landing/login
//   if (!studentId) {
//     return <Navigate to="/students" replace />;
//   }

//   // Test completed, not retesting
//   if (testCompleted && !allowRetest) {
//     if (path.startsWith("/students/test") || path.startsWith("/students/details")) {
//       return <Navigate to="/students/final-result" replace />;
//     }
//   }

//   //  Retesting but trying to access final-result
//   if (allowRetest && path.startsWith("/students/final-result")) {
//     return <Navigate to="/students/test/start" replace />;
//   }

//   // Registration completed but trying to access instructions again
//   if (registrationDone && path.startsWith("/students/details/instructions")) {
//     return <Navigate to="/students/test/start" replace />;
//   }

//   //  Trying to access test without starting or registration
//   if (!testStarted && !allowRetest && !registrationDone && path.startsWith("/students/test")) {
//     return <Navigate to="/students/details/instructions" replace />;
//   }

//   // ✅ Otherwise allow access
//   return <>{children}</>;
// };

// export default StudentProtectedRoute;



import React from "react";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
}

const StudentProtectedRoute: React.FC<Props> = ({ children }) => {
  const location = useLocation();
  const path = location.pathname;

  // ---------- Initialize localStorage defaults ----------
  if (localStorage.getItem("testStarted") === null)
    localStorage.setItem("testStarted", "false");
  if (localStorage.getItem("testCompleted") === null)
    localStorage.setItem("testCompleted", "false");
  if (localStorage.getItem("allowRetest") === null)
    localStorage.setItem("allowRetest", "false");
  if (localStorage.getItem("registrationDone") === null)
    localStorage.setItem("registrationDone", "false");

  // ---------- Read stored values ----------
  const studentId = localStorage.getItem("studentId");
  const testStarted = localStorage.getItem("testStarted") === "true";
  const testCompleted = localStorage.getItem("testCompleted") === "true";
  const allowRetest = localStorage.getItem("allowRetest") === "true";
  const registrationDone = localStorage.getItem("registrationDone") === "true";

  // ---------- 1️⃣ Not logged in → redirect to landing/login ----------
  if (!studentId) {
    return <Navigate to="/students" replace />;
  }

  // ---------- 2️⃣ Test completed, not retesting ----------
  if (testCompleted && !allowRetest) {
    const allowedTestPaths = [
      "/students/test/start",
      "/students/test/section",
      "/students/test/result",
    ];

    // If current path is NOT allowed → redirect to final result
    if (
      !allowedTestPaths.includes(path) &&
      !path.startsWith("/students/final-result")
    ) {
      return <Navigate to="/students/final-result" replace />;
    }
  }

  // ---------- 3️⃣ Retesting but trying to access final-result ----------
  if (allowRetest && path.startsWith("/students/final-result")) {
    return <Navigate to="/students/test/start" replace />;
  }

  // ---------- 4️⃣ Registration completed but trying to access instructions ----------
  if (registrationDone && path.startsWith("/students/details/instructions")) {
    return <Navigate to="/students/test/start" replace />;
  }

  // ---------- 5️⃣ Trying to access test without starting or registration ----------
  if (!testStarted && !allowRetest && !registrationDone && path.startsWith("/students/test")) {
    return <Navigate to="/students/details/instructions" replace />;
  }

  // ---------- ✅ Otherwise allow access ----------
  return <>{children}</>;
};

export default StudentProtectedRoute;
