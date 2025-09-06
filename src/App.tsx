
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AllApplicants from "./pages/AllApplicants";
import Interviews from "./pages/Interviews";
import Schedule from "./pages/Schedule";
import Sourcing from "./pages/Sourcing";
import Screening from "./pages/Screening";
import InterviewRounds from "./pages/InterviewRounds";
import FinalDecisions from "./pages/FinalDecisions";
import OfferLetters from "./pages/OfferLetters";
import QuestionRepository from "./pages/QuestionRepository";
import Auth from "./pages/Auth";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PartnerPage from "./pages/Partner";
import AdminPage from "./pages/Admin";
// import Student from "./pages/Student";
import Donor from "./pages/Donor";
import Campus from "./pages/Campus";
import CampusDetail from "./pages/CampusDetail";
import School from "./pages/School";
import SchoolStages from "./pages/SchoolStages";
import OwnerPage from "./pages/Owner";
import Settings from "./pages/Settings";
import UserRole from "./pages/settings/UserRole";
import Caste from "./pages/settings/Caste";
import Religion from "./pages/settings/Religion";
import Qualification from "./pages/settings/Qualification";
import Questions from "./pages/settings/Questions";
import StudentRoutes  from "./routes/StudentRoutes";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/applicants" element={<ProtectedRoute><AllApplicants /></ProtectedRoute>} />
          <Route path="/interviews" element={<ProtectedRoute><Interviews /></ProtectedRoute>} />
          <Route path="/schedule" element={<ProtectedRoute><Schedule /></ProtectedRoute>} />
          <Route path="/sourcing" element={<ProtectedRoute><Sourcing /></ProtectedRoute>} />
          <Route path="/screening" element={<ProtectedRoute><Screening /></ProtectedRoute>} />
          <Route path="/interview-rounds" element={<ProtectedRoute><InterviewRounds /></ProtectedRoute>} />
          <Route path="/decisions" element={<ProtectedRoute><FinalDecisions /></ProtectedRoute>} />
          <Route path="/partners" element={<ProtectedRoute><PartnerPage /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><AdminPage /></ProtectedRoute>} />
          <Route path="/owner" element={<ProtectedRoute><OwnerPage /></ProtectedRoute>} />
          <Route path="/donor" element={<ProtectedRoute><Donor /></ProtectedRoute>} />
          <Route path="/offer-letters" element={<ProtectedRoute><OfferLetters /></ProtectedRoute>} />
          <Route path="/campus" element={<ProtectedRoute><Campus /></ProtectedRoute>} />
          <Route path="/campus/:id" element={<ProtectedRoute><CampusDetail /></ProtectedRoute>} />
          <Route path="/school" element={<ProtectedRoute><School /></ProtectedRoute>} />
          <Route path="/school/:id" element={<ProtectedRoute><SchoolStages /></ProtectedRoute>} />
          {/* Settings Routes */}
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>}>
            <Route path="user-role" element={<UserRole />} />
            <Route path="caste" element={<Caste />} />
            <Route path="religion" element={<Religion />} />
            <Route path="qualification" element={<Qualification />} />
            <Route path="questions" element={<Questions />} />
            <Route index element={<UserRole />} />
          </Route>
          {/* Custom student redirect route */}
          <Route path="/students/*" element={<StudentRoutes />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
