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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/applicants" element={<AllApplicants />} />
          <Route path="/interviews" element={<Interviews />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/sourcing" element={<Sourcing />} />
          <Route path="/screening" element={<Screening />} />
          <Route path="/interview-rounds" element={<InterviewRounds />} />
          <Route path="/decisions" element={<FinalDecisions />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
