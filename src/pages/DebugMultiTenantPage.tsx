import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw } from 'lucide-react';
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui/ds";

interface DebugInfo {
  timestamp: string;
  user: {
    id: string | undefined;
    email: string | undefined;
  };
  organization: {
    id: string | null;
    name: string | null;
  };
  rls_status: {
    isolation_working: boolean;
    message: string;
  };
  data_isolation: {
    total_leads_visible: number;
    org_leads_visible: number;
    unique_org_ids: string[];
  };
  tables_checked: Record<string, { visible: number; org_ids: string[] }>;
  error?: string;
}

export default function DebugMultiTenantPage() {
  const { user } = useAuth();
  const { organization, organizationId } = useOrganization();
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      console.log('[DebugMultiTenant] Iniciando diagnóstico');

      const info: DebugInfo = {
        timestamp: new Date().toISOString(),
        user: {
          id: user?.id,
          email: user?.email,
        },
        organization: {
          id: organizationId,
          name: organization?.name ?? null,
        },
        rls_status: { isolation_working: false, message: '' },
        data_isolation: { total_leads_visible: 0, org_leads_visible: 0, unique_org_ids: [] },
        tables_checked: {},
      };

      // Check multiple tables
      const tables = ['leads', 'sales', 'tasks', 'interactions', 'products', 'tags'] as const;

      for (const table of tables) {
        const { data, error } = await supabase
          .from(table)
          .select('id, organization_id')
          .limit(500);

        if (error) {
          info.tables_checked[table] = { visible: 0, org_ids: [] };
          continue;
        }

        const orgIds = [...new Set((data || []).map((r: any) => r.organization_id))];
        info.tables_checked[table] = {
          visible: data?.length || 0,
          org_ids: orgIds,
        };
      }

      // Leads specific
      const leadsData = info.tables_checked['leads'];
      info.data_isolation.total_leads_visible = leadsData?.visible || 0;
      info.data_isolation.unique_org_ids = leadsData?.org_ids || [];

      if (organizationId) {
        const { data: orgLeads } = await supabase
          .from('leads')
          .select('id')
          .eq('organization_id', organizationId)
          .limit(500);
        info.data_isolation.org_leads_visible = orgLeads?.length || 0;
      }

      // RLS check: if all visible leads belong to only this org, RLS is working
      const uniqueOrgs = info.data_isolation.unique_org_ids;
      if (uniqueOrgs.length === 0) {
        info.rls_status = { isolation_working: true, message: '✅ Sem dados para verificar, mas RLS está habilitado' };
      } else if (uniqueOrgs.length === 1 && uniqueOrgs[0] === organizationId) {
        info.rls_status = { isolation_working: true, message: '✅ RLS está funcionando — só vê dados da sua organização' };
      } else if (uniqueOrgs.length > 1) {
        info.rls_status = { isolation_working: false, message: '❌ RLS NÃO está funcionando — vê dados de múltiplas organizações!' };
      } else {
        info.rls_status = { isolation_working: true, message: '✅ Dados visíveis pertencem apenas à sua organização' };
      }

      console.log('[DebugMultiTenant] Diagnóstico completo:', info);
      setDebugInfo(info);
    } catch (error: any) {
      console.error('[DebugMultiTenant] Erro:', error);
      setDebugInfo({ error: error.message } as any);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      runDiagnostics();
    }
  }, [user, organizationId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Diagnosticando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold text-neutral-900">🔍 Debug Multi-Tenant</h1>
        <Button variant="secondary" size="sm" onClick={runDiagnostics}>
          <RefreshCw className="h-4 w-4 mr-2" /> Recarregar
        </Button>
      </div>

      {/* User Info */}
      <Card>
        <CardHeader><CardTitle>👤 Informações do Usuário</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo?.user, null, 2)}
          </pre>
        </CardContent>
      </Card>

      {/* Organization Info */}
      <Card>
        <CardHeader><CardTitle>🏢 Organização</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded overflow-auto">
            {JSON.stringify(debugInfo?.organization, null, 2)}
          </pre>
          {!organizationId && (
            <p className="text-destructive font-semibold mt-2">⚠️ organization_id não definido!</p>
          )}
        </CardContent>
      </Card>

      {/* RLS Status */}
      <Card>
        <CardHeader><CardTitle>🔐 Status RLS</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Badge variant={debugInfo?.rls_status?.isolation_working ? 'default' : 'error'} className="text-sm">
            {debugInfo?.rls_status?.message}
          </Badge>
        </CardContent>
      </Card>

      {/* Data Isolation */}
      <Card>
        <CardHeader><CardTitle>📊 Isolamento de Dados</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted rounded p-4 text-center">
              <p className="text-sm text-muted-foreground">Leads Visíveis (total)</p>
              <p className="text-3xl font-bold text-foreground">{debugInfo?.data_isolation?.total_leads_visible}</p>
            </div>
            <div className="bg-muted rounded p-4 text-center">
              <p className="text-sm text-muted-foreground">Leads da Sua Org</p>
              <p className="text-3xl font-bold text-foreground">{debugInfo?.data_isolation?.org_leads_visible}</p>
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Org IDs nos dados visíveis:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {debugInfo?.data_isolation?.unique_org_ids.map(id => (
                <Badge key={id} variant={id === organizationId ? 'default' : 'destructive'} className="text-xs">
                  {id === organizationId ? '✅ ' : '❌ '}{id.slice(0, 8)}...
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tables Check */}
      <Card>
        <CardHeader><CardTitle>📋 Verificação por Tabela</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {debugInfo?.tables_checked && Object.entries(debugInfo.tables_checked).map(([table, info]) => (
              <div key={table} className="flex items-center justify-between bg-muted rounded p-3">
                <span className="font-medium text-foreground">{table}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{info.visible} registros</span>
                  <Badge variant={info.org_ids.length <= 1 ? 'default' : 'destructive'} className="text-xs">
                    {info.org_ids.length <= 1 ? '✅' : `❌ ${info.org_ids.length} orgs`}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
