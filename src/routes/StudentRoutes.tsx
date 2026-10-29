import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useGoogleAuth } from "@/hooks/useGoogleAuth";
import LanguageSelection from "@/pages/students/LanguageSelection";
import TestInstructionsPage from "@/pages/students/Introduction";
import StudentRegistrationForm from "@/pages/students/StudentForm";
import SlotBooking from "@/pages/students/SlotBooking";
import WhatsAppRedirect from "@/pages/students/WhatsApp";
import StudentLandingPage from "@/pages/StudentLandingPage";
import ScreeningStartPage from "@/pages/students/ScreeningRoundStartPage";
import ScreeningTestPage from "@/pages/students/TestPage";
import ScreeningResultPage from "@/pages/students/ScreeningResultPage";
import FinalResultPage from "@/pages/students/StudentResult";
import StudentLogin from "@/pages/students/Login";
import StudentProtectedRoute from "./StudentProtectedRoute";
import OfferLetterPage from "@/pages/students/OfferLetterPage";
import GamifiedLanding from "@/pages/students/GamifiedLanding"; // trigger reload

const StudentRoutes: React.FC = () => {
  const { user, isAuthenticated, loading } = useGoogleAuth({ skipAutoNavigation: true });

  if (loading) {
    return <div className="admin-login-loading">Loading…</div>;
  }

  const roleId = Number(user?.role_id);
  const roleName = user?.role_name?.toUpperCase();
  const hasAdminAccess =
    isAuthenticated &&
    (roleId === 1 || roleId === 2 || roleId === 3 ||
      roleName === "ADMIN" || roleName === "USER" || roleName === "TEAM");

  if (!hasAdminAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <Routes>
      {/* ---------- PUBLIC ---------- */}
      {/* <Route index element={<StudentLandingPage />} />
      <Route path="login" element={<StudentLogin />} /> */}
      {/* Disabled: student landing is no longer publicly accessible. */}
      {/* <Route index element={<GamifiedLanding />} /> */}
      <Route path="student" element={<GamifiedLanding />} />
      <Route path="gamified" element={<Navigate to="." replace />} />
      <Route path="login" element={<Navigate to="." replace />} />

      {/* ---------- PROTECTED ---------- */}
      {/* Language Selection */}
      <Route
        path="language-selection"
        element={
          <StudentProtectedRoute>
            <LanguageSelection />
          </StudentProtectedRoute>
        }
      />

      {/* ---------- DETAILS (instruction + registration) ---------- */}
      <Route
        path="details"
        element={
          <StudentProtectedRoute>
            <Outlet /> {/* everything under /details now inherits protection */}
          </StudentProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/students/test/start" replace />} />
        {/* <Route path="instructions" element={<TestInstructionsPage />} /> */}
        <Route path="instructions" element={<Navigate to="/students/test/start" replace />} />
        {/* Disabled: student registration is no longer accessible. */}
        {/* <Route path="registration" element={<StudentRegistrationForm />} /> */}
      </Route>

      {/* ---------- TEST (start + section + result) ---------- */}
      <Route
        path="test"
        element={
          <StudentProtectedRoute>
            <Outlet />
          </StudentProtectedRoute>
        }
      >
        <Route index element={<Navigate to="start" replace />} />
        {/* Disabled: student test start is no longer accessible. */}
        {/* <Route path="start" element={<ScreeningStartPage />} /> */}
        <Route path="section" element={<ScreeningTestPage />} />
        <Route path="result" element={<ScreeningResultPage />} />
      </Route>

      {/* ---------- OTHER PROTECTED PAGES ---------- */}
      <Route
        path="final-result"
        element={
          <StudentProtectedRoute>
            <FinalResultPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="slot-booking/:id"
        element={
          // <StudentProtectedRoute>
          <SlotBooking />
          // </StudentProtectedRoute>
        }
      />
      <Route
        path="offer-letter"
        element={
          // <StudentProtectedRoute>
          <OfferLetterPage />
          // </StudentProtectedRoute>
        }
      />
      <Route
        path="whatsapp-redirect"
        element={
          // <StudentProtectedRoute>
          <WhatsAppRedirect />
          // </StudentProtectedRoute>
        }
      />

      {/* ---------- CATCH-ALL ---------- */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default StudentRoutes;
