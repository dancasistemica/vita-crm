import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSuperadmin } from '@/hooks/useSuperadmin';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrganizationsTab } from '@/components/superadmin/OrganizationsTab';
import { PlansTab } from '@/components/superadmin/PlansTab';
import { UsersManagementTab } from '@/components/superadmin/UsersManagementTab';
import { ShieldCheck, Building2, CreditCard, Users } from 'lucide-react';

export default function SuperadminDashboard() {
  const { isSuperadmin, loading } = useSuperadmin();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !isSuperadmin) {
      navigate('/', { replace: true });
    }
  }, [loading, isSuperadmin, navigate]);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Painel Superadmin</h1>
              <p className="text-sm text-muted-foreground">Gestão de organizações, planos e usuários</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs defaultValue="organizations">
          <TabsList className="mb-6">
            <TabsTrigger value="organizations" className="gap-2">
              <Building2 className="h-4 w-4" /> Organizações
            </TabsTrigger>
            <TabsTrigger value="plans" className="gap-2">
              <CreditCard className="h-4 w-4" /> Planos
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-2">
              <Users className="h-4 w-4" /> Superadmins
            </TabsTrigger>
          </TabsList>

          <TabsContent value="organizations">
            <OrganizationsTab />
          </TabsContent>
          <TabsContent value="plans">
            <PlansTab />
          </TabsContent>
          <TabsContent value="users">
            <UsersManagementTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
