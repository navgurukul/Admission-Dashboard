import { Routes, Route, Navigate, Outlet } from "react-router-dom";
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

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      {/* ---------- PUBLIC ---------- */}
      <Route index element={<StudentLandingPage />} />
      <Route path="login" element={<StudentLogin />} />

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
        <Route index element={<Navigate to="instructions" replace />} />
        <Route path="instructions" element={<TestInstructionsPage />} />
        <Route path="registration" element={<StudentRegistrationForm />} />
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
        <Route path="start" element={<ScreeningStartPage />} />
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
          <StudentProtectedRoute>
            <SlotBooking />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="offer-letter"
        element={
          <StudentProtectedRoute>
            <OfferLetterPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="whatsapp-redirect"
        element={
          <StudentProtectedRoute>
            <WhatsAppRedirect />
          </StudentProtectedRoute>
        }
      />

      {/* ---------- CATCH-ALL ---------- */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

export default StudentRoutes;
