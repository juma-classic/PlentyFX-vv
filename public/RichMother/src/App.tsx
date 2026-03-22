import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { Dashboard } from "./pages/Dashboard";
import { SpeedBot } from "./pages/SpeedBot";
import { EvenOddSignals } from "./pages/EvenOddSignals";
import { OverUnderSignals } from "./pages/OverUnderSignals";
import { DigitMatchSignals } from "./pages/DigitMatchSignals";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/speed-bot" element={<SpeedBot />} />
          <Route path="/signals/even-odd" element={<EvenOddSignals />} />
          <Route path="/signals/over-under" element={<OverUnderSignals />} />
          <Route path="/signals/digit-match" element={<DigitMatchSignals />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
