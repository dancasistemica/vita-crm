import { Alert, Badge, Button, Card, Select, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/ds";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { supabase } from '@/integrations/supabase/client';
import { OrganizationsTab } from '@/components/superadmin/OrganizationsTab';
import { PlansTab } from '@/components/superadmin/PlansTab';
import { UsersManagementTab } from '@/components/superadmin/UsersManagementTab';
import { QuickAccessCard } from '@/components/superadmin/QuickAccessCard';
import { EmailTemplatesTab } from '@/components/superadmin/EmailTemplatesTab';
import { CustomFieldsManager } from '@/components/superadmin/CustomFieldsManager';
import { ShieldCheck, Building2, CreditCard, Users, Plus, Mail, Settings2, Cog, Loader } from 'lucide-react';
import { SystemSettings } from '@/components/superadmin/SystemSettings';
import { getAllOrganizations } from '@/services/superadminService';

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

  useEffect(() => {
    if (!isSuperadmin) return;
    const fetchOrganizations = async () => {
      setBotconversaLoading(true);
      try {
        const orgs = await getAllOrganizations();
        setBotconversaOrgs(
          (orgs || []).map((org: any) => ({
            id: org.id,
            name: org.name,
          }))
        );
      } catch (err) {
        console.error('[SuperadminDashboard] Botconversa orgs error:', err);
        setBotconversaOrgs([]);
      } finally {
        setBotconversaLoading(false);
      }
    };

    fetchOrganizations();
  }, [isSuperadmin]);

  const selectedBotconversaOrg = botconversaOrgs.find((org) => org.id === selectedBotconversaOrgId) || null;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader className="h-8 w-8 text-primary-600 animate-spin" />
          <p className="text-sm text-neutral-600 font-medium">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  if (!isSuperadmin) return null;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-xl bg-primary-50 flex items-center justify-center border border-primary-100 shadow-sm">
            <ShieldCheck className="h-8 w-8 text-primary-600" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-neutral-900">Superadmin</h1>
            <p className="text-sm text-neutral-600 mt-1">Gestão global do ecossistema</p>
          </div>
        </div>
      </div>

      {/* QUICK STATS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card interactive variant="elevated" padding="md" onClick={() => setActiveTab('organizations')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary-100 rounded-lg"><Building2 className="w-6 h-6 text-primary-600" /></div>
            <div>
              <p className="text-sm text-neutral-600">Organizações</p>
              <h4 className="text-2xl font-bold">{stats.orgs}</h4>
            </div>
          </div>
        </Card>
        <Card interactive variant="elevated" padding="md" onClick={() => setActiveTab('plans')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-success-100 rounded-lg"><CreditCard className="w-6 h-6 text-success-600" /></div>
            <div>
              <p className="text-sm text-neutral-600">Planos Ativos</p>
              <h4 className="text-2xl font-bold">{stats.plans}</h4>
            </div>
          </div>
        </Card>
        <Card interactive variant="elevated" padding="md" onClick={() => setActiveTab('users')}>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-warning-100 rounded-lg"><Users className="w-6 h-6 text-warning-600" /></div>
            <div>
              <p className="text-sm text-neutral-600">Superadmins</p>
              <h4 className="text-2xl font-bold">{stats.superadmins}</h4>
            </div>
          </div>
        </Card>
        <Card interactive variant="elevated" padding="md">
          <Button variant="primary" fullWidth size="lg" icon={<Plus className="w-5 h-5" />} onClick={() => orgsTabRef.current?.openCreateModal?.()}>
            Nova Org
          </Button>
        </Card>
      </div>

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="overflow-x-auto pb-2">
          <TabsList className="gap-2 border-b border-neutral-200 mb-4">
            <TabsTrigger value="organizations" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Organizações
            </TabsTrigger>
            <TabsTrigger value="plans" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" /> Planos
            </TabsTrigger>
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="h-4 w-4" /> Superadmins
            </TabsTrigger>
            <TabsTrigger value="email-templates" className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> Email Templates
            </TabsTrigger>
            <TabsTrigger value="custom-fields" className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" /> Campos Custom
            </TabsTrigger>
            <TabsTrigger value="botconversa" className="flex items-center gap-2">
              <Bot className="h-4 w-4" /> Botconversa
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cog className="h-4 w-4" /> Sistema
            </TabsTrigger>
          </TabsList>
        </div>

        <Card variant="primary" padding="lg">
          <TabsContent value="organizations">
            <OrganizationsTab ref={orgsTabRef} onStatsChange={fetchStats} />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersManagementTab />
          </TabsContent>
          <TabsContent value="email-templates">
            <EmailTemplatesTab />
          </TabsContent>
          <TabsContent value="custom-fields">
            <CustomFieldsManager />
          </TabsContent>
          <TabsContent value="botconversa">
            <div>
              <Select
                label="Selecione uma organização"
                options={botconversaOrgs.map(org => ({ value: org.id, label: org.name }))}
                value={selectedBotconversaOrgId}
                onChange={(e) => setSelectedBotconversaOrgId(e.target.value)}
              />
              {botconversaLoading && (
                <div className="flex items-center gap-3 mt-2 text-sm text-neutral-600">
                  <Loader className="w-3 h-3 animate-spin" /> Carregando organizações...
                </div>
              )}
            </div>

            {selectedBotconversaOrg && (
              <BotconversaSettings
                organizationId={selectedBotconversaOrg.id}
                organizationName={selectedBotconversaOrg.name}
              />
            )}
          </TabsContent>
          <TabsContent value="system">
            <SystemSettings />
          </TabsContent>
        </Card>
      </Tabs>
    </div>
  );
}
