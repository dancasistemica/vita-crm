import { Toaster, Tooltip } from "@/components/ui/ds";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { BrandProvider } from "@/contexts/BrandContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Suspense, lazy, useEffect } from "react";
import { validateSession } from "@/lib/supabase";
import { getNormalizedRecoveryRoute } from "@/utils/authRecovery";

// Lazy load pages to improve startup performance and avoid build-time crashes
const CRMLayout = lazy(() => import("@/components/CRMLayout"));
const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const ConsolidatedDashboardPage = lazy(() => import("@/pages/ConsolidatedDashboardPage"));
const LeadsPage = lazy(() => import("@/pages/LeadsPage"));
const PipelinePage = lazy(() => import("@/pages/PipelinePage"));
const ClientesPage = lazy(() => import("@/pages/ClientesPage"));
const ClientDetailPage = lazy(() => import("@/components/clients/ClientDetailPage"));
const ClientesPorProdutoPage = lazy(() => import("@/pages/ClientesPorProdutoPage"));
const InteracoesPage = lazy(() => import("@/pages/InteracoesPage"));
const TarefasPage = lazy(() => import("@/pages/TarefasPage"));
const ProdutosPage = lazy(() => import("@/pages/ProdutosPage"));
const RelatoriosPage = lazy(() => import("@/pages/RelatoriosPage"));
const ConfiguracoesPage = lazy(() => import("@/pages/ConfiguracoesPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const ImportLeadsWizard = lazy(() => import("@/pages/ImportLeadsWizard"));
const AuthPage = lazy(() => import("@/pages/AuthPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));
const SignUpPage = lazy(() => import("@/pages/SignUpPage"));
const ResetPasswordPage = lazy(() => import("@/pages/ResetPasswordPage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const FirstSuperadminSetup = lazy(() => import("@/components/auth/FirstSuperadminSetup"));
const SuperadminDashboard = lazy(() => import("@/pages/SuperadminDashboard"));
const DebugMultiTenantPage = lazy(() => import("@/pages/DebugMultiTenantPage"));
const CustomizePage = lazy(() => import("@/pages/CustomizePage"));
const AdminUsersPage = lazy(() => import("@/pages/AdminUsersPage"));
const VendasPage = lazy(() => import("@/pages/VendasPage").then(module => ({ default: module.VendasPage })));
const SearchResultsPage = lazy(() => import("@/pages/SearchResultsPage"));
const HistoricoFrequenciaPage = lazy(() => import("@/pages/HistoricoFrequenciaPage"));
const RegistroPresencaPage = lazy(() => import("@/pages/RegistroPresencaPage"));
const DashboardExecutivoPage = lazy(() => import("@/pages/DashboardExecutivoPage"));
const ClassCalendarPage = lazy(() => import("@/pages/ClassCalendarPage"));


const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    // Intercept recovery URLs — must use full navigation, not replaceState
    if (typeof window !== "undefined") {
      const recoveryRoute = getNormalizedRecoveryRoute(window.location);
      if (recoveryRoute) {
        console.log("[App] Recovery URL detected, redirecting to:", recoveryRoute);
        window.location.replace(recoveryRoute);
        return;
      }
    }

    const checkSession = async () => {
      const isValid = await validateSession();
      if (!isValid && window.location.pathname !== '/auth' && window.location.pathname !== '/login') {
        console.warn('[App] Sessão inválida detectada no mount');
      }
    };
    checkSession();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <OrganizationProvider>
        <BrandProvider>
          <Toaster />
          <BrowserRouter>
            <Suspense fallback={
              <div className="min-h-screen flex items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  <p className="text-sm text-neutral-500">Carregando...</p>
                </div>
              </div>
            }>
              <Routes>
                {/* Public routes */}
                <Route path="/auth" element={<AuthPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignUpPage />} />
                <Route path="/reset-password" element={<ResetPasswordPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
                <Route path="/setup" element={<FirstSuperadminSetup />} />

                {/* Protected routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<CRMLayout />}>
                    <Route path="/superadmin" element={<SuperadminDashboard />} />
                    <Route path="/admin/users" element={<AdminUsersPage />} />
                    <Route path="/debug" element={<DebugMultiTenantPage />} />
                    <Route path="/" element={<DashboardPage />} />
                    <Route path="/dashboard/consolidado" element={<ConsolidatedDashboardPage />} />
                    <Route path="/dashboard/executivo" element={<DashboardExecutivoPage />} />

                    <Route path="/leads" element={<LeadsPage />} />
                    <Route path="/import-wizard" element={<ImportLeadsWizard />} />
                    <Route path="/pipeline" element={<PipelinePage />} />
                    <Route path="/vendas" element={<VendasPage />} />

                    <Route path="/clientes" element={<ClientesPage />} />
                    <Route path="/clientes/por-produto" element={<ClientesPorProdutoPage />} />
                    <Route path="/clientes/:id" element={<ClientDetailPage />} />
                    <Route path="/clientes/:id/frequencia" element={<HistoricoFrequenciaPage />} />
                    <Route path="/presenca" element={<RegistroPresencaPage />} />
                    <Route path="/interacoes" element={<InteracoesPage />} />
                    <Route path="/tarefas" element={<TarefasPage />} />
                    <Route path="/produtos" element={<ProdutosPage />} />
                    <Route path="/relatorios" element={<RelatoriosPage />} />
                    <Route path="/configuracoes" element={<ConfiguracoesPage />} />
                    <Route path="/personalizar" element={<CustomizePage />} />
                    <Route path="/perfil" element={<ProfilePage />} />
                    <Route path="/calendario-aulas" element={<ClassCalendarPage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </BrandProvider>
      </OrganizationProvider>
    </QueryClientProvider>
  );
};

export default App;
