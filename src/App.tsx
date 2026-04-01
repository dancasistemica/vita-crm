import { Toaster, Toaster as Sonner, Tooltip } from "@/components/ui/ds";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import CRMLayout from "@/components/CRMLayout";
import DashboardPage from "@/pages/DashboardPage";
import ConsolidatedDashboardPage from "@/pages/ConsolidatedDashboardPage";
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
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import FirstSuperadminSetup from "@/components/auth/FirstSuperadminSetup";
import SuperadminDashboard from "@/pages/SuperadminDashboard";
import DebugMultiTenantPage from "@/pages/DebugMultiTenantPage";
import CustomizePage from "@/pages/CustomizePage";
import AdminUsersPage from "@/pages/AdminUsersPage";
import { VendasPage } from "@/pages/VendasPage";

import { getNormalizedRecoveryRoute } from "@/utils/authRecovery";

// Intercept recovery URLs BEFORE React renders — must use full navigation, not replaceState
if (typeof window !== "undefined") {
  const recoveryRoute = getNormalizedRecoveryRoute(window.location);
  if (recoveryRoute) {
    console.log("[App] Recovery URL detected, redirecting to:", recoveryRoute);
    // Full page redirect so BrowserRouter picks up the correct pathname
    window.location.replace(recoveryRoute);
  }
}


const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <OrganizationProvider>
      <BrandProvider>
        
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
                  <Route path="/admin/users" element={<AdminUsersPage />} />
                  <Route path="/debug" element={<DebugMultiTenantPage />} />
                  <Route path="/" element={<DashboardPage />} />
                  <Route path="/dashboard/consolidado" element={<ConsolidatedDashboardPage />} />
                  <Route path="/leads" element={<LeadsPage />} />
                  <Route path="/import-wizard" element={<ImportLeadsWizard />} />
                  <Route path="/pipeline" element={<PipelinePage />} />
                  <Route path="/vendas" element={<VendasPage />} />

                  <Route path="/clientes" element={<ClientesPage />} />
                  <Route path="/clientes/:id" element={<ClientDetailPage />} />
                  <Route path="/interacoes" element={<InteracoesPage />} />
                  <Route path="/tarefas" element={<TarefasPage />} />
                  <Route path="/produtos" element={<ProdutosPage />} />
                  <Route path="/relatorios" element={<RelatoriosPage />} />
                  <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                  <Route path="/personalizar" element={<CustomizePage />} />
                  <Route path="/perfil" element={<ProfilePage />} />
                </Route>
              </Route>

              {/* Fallback - DEVE ser a última rota */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
        
      </BrandProvider>
    </OrganizationProvider>
  </QueryClientProvider>
);

export default App;
