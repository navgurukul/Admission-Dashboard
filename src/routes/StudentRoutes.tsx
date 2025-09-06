import { Routes, Route, Navigate } from 'react-router-dom';
import LanguageSelection from '@/pages/students/LanguageSelection';
import TestInstructionsPage from '@/pages/students/Introduction';
import StudentRegistrationForm from '@/pages/students/StudentForm';
import FinalInstruction from '@/pages/students/FinalInstruction';
import SlotBooking from '@/pages/students/SlotBooking';
import WhatsAppRedirect from '@/pages/students/WhatsApp';
// --
import StudentLandingPage from '@/pages/StudentLandingPage';
import ScreeningStartPage from "@/pages/students/ScreeningRoundStartPage";
import ScreeningTestPage from "@/pages/students/TestPage";
import ScreeningResultPage from "@/pages/students/ScreeningResultPage";
import FinalResultPage from "@/pages/students/StudentResult";
import StudentLogin from '@/pages/students/Login';
import StudentProtectedRoute from "./StudentProtectedRoute";

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public pages */}
      <Route path="login" element={<StudentLogin />} />
      <Route index element={<StudentLandingPage />} />

      {/* Protected student flow */}
      <Route
        path="language-selection"
        element={
          <StudentProtectedRoute>
            <LanguageSelection />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="instructions"
        element={
          <StudentProtectedRoute>
            <TestInstructionsPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="registration"
        element={
          <StudentProtectedRoute>
            <StudentRegistrationForm />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="test-start"
        element={
          <StudentProtectedRoute>
            <ScreeningStartPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="test-section"
        element={
          <StudentProtectedRoute>
            <ScreeningTestPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="test-result"
        element={
          <StudentProtectedRoute>
            <ScreeningResultPage />
          </StudentProtectedRoute>
        }
      />
      <Route
        path="result"
        element={
          <StudentProtectedRoute>
            <FinalResultPage />
          </StudentProtectedRoute>
        }
      />
      <Route path="slot-booking" element={
        <StudentProtectedRoute>
          <SlotBooking />
        </StudentProtectedRoute>
      }
      />
      <Route path="whatsapp-redirect" element={
        <StudentProtectedRoute>
          <WhatsAppRedirect />
        </StudentProtectedRoute>
      }
      />
      {/* Catch-all */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

export default StudentRoutes;


