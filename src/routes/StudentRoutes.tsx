import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LanguageSelection from '@/pages/students/LanguageSelection';
import Instructions from '@/pages/students/Introduction';
import StudentForm from '@/pages/students/StudentForm';
import FinalInstruction from '@/pages/students/FinalInstruction';
import SlotBooking from '@/pages/students/SlotBooking';
import WhatsAppRedirect from '@/pages/students/WhatsApp';

const StudentRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to language selection */}
      <Route index element={<Navigate to="language-selection" replace />} />
      
      {/* Student flow routes */}
      <Route path="language-selection" element={<LanguageSelection />} />
      <Route path="instructions" element={<Instructions />} />
      <Route path="registration" element={<StudentForm />} />
      <Route path="final-instructions" element={<FinalInstruction />} />
      <Route path="slot-booking" element={<SlotBooking />} />
      <Route path="whatsapp-redirect" element={<WhatsAppRedirect />} />
      
      {/* Catch all - redirect to language selection */}
      <Route path="*" element={<Navigate to="language-selection" replace />} />
    </Routes>
  );
};

export default StudentRoutes;