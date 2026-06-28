import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/components/LoginPage";
import NotFound from "./pages/NotFound";
import Overview from "./pages/Overview";
import DashboardLayout from "./components/DashboardLayout";
import AboutPage from "./pages/AboutPage";

// Import modules
import StudentHub from "./pages/modules/StudentHub";
import AIAssistant from "./pages/modules/AIAssistant";
import FacultyWorkspace from "./pages/modules/FacultyWorkspace";
import CampusResources from "./pages/modules/CampusResources";
import EventManagement from "./pages/modules/EventManagement";
import ServiceCenter from "./pages/modules/ServiceCenter";
import AssetManagement from "./pages/modules/AssetManagement";
import MaintenanceOps from "./pages/modules/MaintenanceOps";
import CommunicationHub from "./pages/modules/CommunicationHub";
import SafetyEmergency from "./pages/modules/SafetyEmergency";
import TransportManagement from "./pages/modules/TransportManagement";
import LibraryIntelligence from "./pages/modules/LibraryIntelligence";
import CampusAnalytics from "./pages/modules/CampusAnalytics";
import SettingsPage from "./pages/modules/SettingsPage";
import CampusIntelligenceCentre from "./pages/CampusIntelligenceCentre";
import NoticesBoard from "./pages/modules/NoticesBoard";
import PollsFeedback from "./pages/modules/PollsFeedback";
import Canteen from "./pages/modules/Canteen";

const queryClient = new QueryClient();

function ProtectedLayout() {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/auth/login" replace />;
  }
  return (
    <DashboardLayout user={user}>
      <Outlet />
    </DashboardLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner position="top-right" />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Navigate to="/app" replace />} />
            <Route path="/auth/login" element={<LoginPage />} />
            <Route path="/about" element={<AboutPage />} />

            <Route path="/app" element={<ProtectedLayout />}>
              <Route index element={<Navigate to="/app/overview" replace />} />
              <Route path="overview" element={<Overview />} />
              <Route path="student-hub" element={<StudentHub />} />
              <Route path="assistant" element={<AIAssistant />} />
              <Route path="faculty" element={<FacultyWorkspace />} />
              <Route path="resources" element={<CampusResources />} />
              <Route path="events" element={<EventManagement />} />
              <Route path="service-center" element={<ServiceCenter />} />
              <Route path="assets" element={<AssetManagement />} />
              <Route path="maintenance" element={<MaintenanceOps />} />
              <Route path="comms" element={<CommunicationHub />} />
              <Route path="safety" element={<SafetyEmergency />} />
              <Route path="transport" element={<TransportManagement />} />
              <Route path="library" element={<LibraryIntelligence />} />
              <Route path="analytics" element={<CampusAnalytics />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="intelligence" element={<CampusIntelligenceCentre />} />
              <Route path="notices" element={<NoticesBoard />} />
              <Route path="polls" element={<PollsFeedback />} />
              <Route path="canteen" element={<Canteen />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
