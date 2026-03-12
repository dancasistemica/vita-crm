import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CRMLayout from "@/components/CRMLayout";
import DashboardPage from "@/pages/DashboardPage";
import LeadsPage from "@/pages/LeadsPage";
import PipelinePage from "@/pages/PipelinePage";
import ClientesPage from "@/pages/ClientesPage";
import ClientDetailPage from "@/components/clients/ClientDetailPage";
import InteracoesPage from "@/pages/InteracoesPage";
import TarefasPage from "@/pages/TarefasPage";
import ProdutosPage from "@/pages/ProdutosPage";
import RelatoriosPage from "@/pages/RelatoriosPage";
import ConfiguracoesPage from "@/pages/ConfiguracoesPage";
import ProfilePage from "@/pages/ProfilePage";
import ImportLeadsWizard from "@/pages/ImportLeadsWizard";
import AuthPage from "@/pages/AuthPage";
import LoginPage from "@/pages/LoginPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import FirstSuperadminSetup from "@/components/auth/FirstSuperadminSetup";
import NotFound from "@/pages/NotFound";
import SuperadminDashboard from "@/pages/SuperadminDashboard";
import DebugMultiTenantPage from "@/pages/DebugMultiTenantPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/setup" element={<FirstSuperadminSetup />} />

            {/* Protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<CRMLayout />}>
              <Route path="/superadmin" element={<SuperadminDashboard />} />
                <Route path="/debug" element={<DebugMultiTenantPage />} />
                <Route path="/" element={<DashboardPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/import-wizard" element={<ImportLeadsWizard />} />
                <Route path="/pipeline" element={<PipelinePage />} />
                <Route path="/clientes" element={<ClientesPage />} />
                <Route path="/clientes/:id" element={<ClientDetailPage />} />
                <Route path="/interacoes" element={<InteracoesPage />} />
                <Route path="/tarefas" element={<TarefasPage />} />
                <Route path="/produtos" element={<ProdutosPage />} />
                <Route path="/relatorios" element={<RelatoriosPage />} />
                <Route path="/configuracoes" element={<ConfiguracoesPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
