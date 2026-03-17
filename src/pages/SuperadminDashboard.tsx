import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationsTab } from '@/components/superadmin/OrganizationsTab';
import { PlansTab } from '@/components/superadmin/PlansTab';
import { UsersManagementTab } from '@/components/superadmin/UsersManagementTab';
import { QuickAccessCard } from '@/components/superadmin/QuickAccessCard';
import { EmailTemplatesTab } from '@/components/superadmin/EmailTemplatesTab';
import { CustomFieldsManager } from '@/components/superadmin/CustomFieldsManager';
import { ShieldCheck, Building2, CreditCard, Users, Plus, BarChart3, Mail, Settings2, Cog } from 'lucide-react';
import { SystemSettings } from '@/components/superadmin/SystemSettings';

export default function SuperadminDashboard() {
  const { isSuperadmin, loading } = useSuperadmin();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('organizations');
  const [stats, setStats] = useState({ orgs: 0, plans: 0, superadmins: 0 });
  const orgsTabRef = useRef<{ openCreateModal?: () => void }>(null);

  useEffect(() => {
    if (!loading && !isSuperadmin) {
      navigate('/', { replace: true });
    }
  }, [loading, isSuperadmin, navigate]);

  const fetchStats = async () => {
    try {
      console.log('[SuperadminDashboard] Fetching stats');
      const [orgsRes, plansRes, adminsRes] = await Promise.all([
        supabase.from('organizations').select('*', { count: 'exact', head: true }),
        supabase.from('organization_plans').select('*', { count: 'exact', head: true }),
        supabase.from('superadmin_roles').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        orgs: orgsRes.count || 0,
        plans: plansRes.count || 0,
        superadmins: adminsRes.count || 0,
      });
    } catch (err) {
      console.error('[SuperadminDashboard] Stats error:', err);
    }
  };

  useEffect(() => {
    if (isSuperadmin) fetchStats();
  }, [isSuperadmin]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Superadmin</h1>
          <p className="text-sm text-muted-foreground">Gestão de organizações, planos e usuários</p>
        </div>
      </div>
        {/* Quick Access Cards */}
        <div>
          <h2 className="text-sm font-medium text-muted-foreground mb-3">⚡ Atalhos Rápidos</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <QuickAccessCard
              icon={Plus}
              title="Nova Organização"
              description="Criar organização com admin"
              stat={stats.orgs}
              statLabel="Organizações"
              onClick={() => {
                setActiveTab('organizations');
                setTimeout(() => orgsTabRef.current?.openCreateModal?.(), 100);
              }}
            />
            <QuickAccessCard
              icon={CreditCard}
              title="Novo Plano"
              description="Criar plano de assinatura"
              stat={stats.plans}
              statLabel="Planos"
              onClick={() => setActiveTab('plans')}
            />
            <QuickAccessCard
              icon={Users}
              title="Novo Superadmin"
              description="Promover usuário existente"
              stat={stats.superadmins}
              statLabel="Superadmins"
              onClick={() => setActiveTab('users')}
            />
            <QuickAccessCard
              icon={BarChart3}
              title="Ver Métricas"
              description="Dashboard de métricas"
              onClick={() => setActiveTab('organizations')}
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="h-4 w-4" /> Organizações
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" /> Planos
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Superadmins
            </TabsTrigger>
            <TabsTrigger value="emails" className="gap-2">
              <Mail className="h-4 w-4" /> Email Templates
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="gap-2">
              <Settings2 className="h-4 w-4" /> Campos Custom
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <OrganizationsTab ref={orgsTabRef} onStatsChange={fetchStats} />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersManagementTab />
          </TabsContent>
          <TabsContent value="emails">
            <EmailTemplatesTab />
          </TabsContent>
          <TabsContent value="custom-fields">
            <CustomFieldsManager />
          </TabsContent>
        </Tabs>
    </div>
  );
}
