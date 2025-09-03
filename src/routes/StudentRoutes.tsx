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

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default = Landing page */}
      <Route index element={<StudentLandingPage />} />

      {/* Student flow */}
      <Route path="language-selection" element={<LanguageSelection />} />
      <Route path="instructions" element={<TestInstructionsPage />} />
      <Route path="registration" element={<StudentRegistrationForm />} />
      {/* -- Test Flow -- */}
      <Route path="test-start" element={<ScreeningStartPage />} />
      <Route path="test-section" element={<ScreeningTestPage />} />
      <Route path="test-result" element={<ScreeningResultPage />} />
      <Route path="result" element={<FinalResultPage />} />

      {/* -- */}
      {/* <Route path="final-instructions" element={<FinalInstruction />} /> */}
      <Route path="slot-booking" element={<SlotBooking />} />
      <Route path="whatsapp-redirect" element={<WhatsAppRedirect />} />

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="." replace />} />
    </Routes>
  );
};

export default StudentRoutes;
