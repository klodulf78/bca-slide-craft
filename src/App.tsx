import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
// Auth components kept for later re-activation
// import { AuthGuard } from "@/components/AuthGuard";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewPresentation from "./pages/NewPresentation";
import ChatAssistant from "./pages/ChatAssistant";
import UploadPage from "./pages/UploadPage";
import SettingsPage from "./pages/SettingsPage";
import PresentationDetail from "./pages/PresentationDetail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<AppLayout><Dashboard /></AppLayout>} />
          <Route path="/new" element={<AppLayout><NewPresentation /></AppLayout>} />
          <Route path="/chat" element={<AppLayout><ChatAssistant /></AppLayout>} />
          <Route path="/upload" element={<AppLayout><UploadPage /></AppLayout>} />
          <Route path="/settings" element={<AppLayout><SettingsPage /></AppLayout>} />
          <Route path="/presentation/:id" element={<AppLayout><PresentationDetail /></AppLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
