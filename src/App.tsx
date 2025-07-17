import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AllApplicants from "./pages/AllApplicants";
import Interviews from "./pages/Interviews";
import Schedule from "./pages/Schedule";
import Sourcing from "./pages/Sourcing";
import Screening from "./pages/Screening";
import InterviewRounds from "./pages/InterviewRounds";
import FinalDecisions from "./pages/FinalDecisions";
import Auth from "./pages/Auth";
import { AuthProvider } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PartnerPage from "./pages/Partner";
import AdminPage from "./pages/Admin";
import Students from "./pages/Students";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
            <Route path="/students" element={<Students />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
