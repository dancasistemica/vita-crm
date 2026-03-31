import { Button, useState, useEffect, useMemo } from 'react';
import { Button, supabase } from '@/integrations/supabase/client';
import { Button, useOrganization } from '@/contexts/OrganizationContext';
import { Button, useUserRole } from '@/hooks/useUserRole';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ds';
import { Button, Checkbox } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Button, Badge } from '@/components/ui/ds';
import { Button, Switch } from '@/components/ui/ds';
import { Button, Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/ds';
import { Button, Lock, Save } from 'lucide-react';
import { Button, ScrollArea, ScrollBar } from '@/components/ui/ds';
import { Button, toast } from 'sonner';

interface PermissionModule {
  label: string;
  icon: string;
  permissions: { Button, key: string; label: string }[];
}

const MODULES: PermissionModule[] = [
  {
    label: 'Dashboard', icon: '📊',
    permissions: [
      { Button, key: 'dashboard.view', label: 'Visualizar dashboard' },
      { Button, key: 'dashboard.financial', label: 'Ver métricas financeiras' },
      { Button, key: 'dashboard.view_others', label: 'Ver dados de outros usuários' },
    ],
  },
  {
    label: 'Leads', icon: '👥',
    permissions: [
      { Button, key: 'leads.view', label: 'Visualizar leads' },
      { Button, key: 'leads.create', label: 'Cadastrar leads' },
      { Button, key: 'leads.edit', label: 'Editar leads' },
      { Button, key: 'leads.delete', label: 'Excluir leads' },
      { Button, key: 'leads.export', label: 'Exportar leads (CSV)' },
      { Button, key: 'leads.import', label: 'Importar leads (CSV)' },
      { Button, key: 'leads.view_others', label: 'Ver leads de outros usuários' },
      { Button, key: 'leads.reassign', label: 'Reatribuir responsável' },
    ],
  },
  {
    label: 'Funil de Vendas', icon: '📈',
    permissions: [
      { Button, key: 'pipeline.view', label: 'Visualizar funil de vendas' },
      { Button, key: 'pipeline.move', label: 'Mover cards entre etapas' },
      { Button, key: 'pipeline.edit_stages', label: 'Editar etapas do funil' },
    ],
  },
  {
    label: 'Interações', icon: '💬',
    permissions: [
      { Button, key: 'interactions.view', label: 'Visualizar interações' },
      { Button, key: 'interactions.create', label: 'Registrar interações' },
      { Button, key: 'interactions.edit_own', label: 'Editar/excluir próprias interações' },
      { Button, key: 'interactions.edit_others', label: 'Editar/excluir interações de outros' },
    ],
  },
  {
    label: 'Tarefas', icon: '✅',
    permissions: [
      { Button, key: 'tasks.view_own', label: 'Visualizar próprias tarefas' },
      { Button, key: 'tasks.view_team', label: 'Visualizar tarefas da equipe' },
      { Button, key: 'tasks.create', label: 'Criar tarefas' },
      { Button, key: 'tasks.complete', label: 'Concluir tarefas' },
      { Button, key: 'tasks.delete', label: 'Excluir tarefas' },
    ],
  },
  {
    label: 'Clientes / Vendas', icon: '💰',
    permissions: [
      { Button, key: 'sales.view', label: 'Visualizar vendas' },
      { Button, key: 'sales.create', label: 'Registrar venda' },
      { Button, key: 'sales.edit', label: 'Editar venda' },
      { Button, key: 'sales.delete', label: 'Excluir venda' },
      { Button, key: 'sales.view_value', label: 'Ver valor das vendas' },
    ],
  },
  {
    label: 'Produtos', icon: '📦',
    permissions: [
      { Button, key: 'products.view', label: 'Visualizar produtos' },
      { Button, key: 'products.create', label: 'Cadastrar produtos' },
      { Button, key: 'products.edit', label: 'Editar produtos' },
      { Button, key: 'products.delete', label: 'Excluir produtos' },
    ],
  },
  {
    label: 'Relatórios', icon: '📉',
    permissions: [
      { Button, key: 'reports.view', label: 'Visualizar relatórios' },
      { Button, key: 'reports.export', label: 'Exportar relatórios' },
    ],
  },
  {
    label: 'Configurações', icon: '⚙️',
    permissions: [
      { Button, key: 'settings.access', label: 'Acessar configurações gerais' },
      { Button, key: 'settings.manage_users', label: 'Gerenciar usuários' },
      { Button, key: 'settings.manage_roles', label: 'Gerenciar funções e permissões' },
      { Button, key: 'settings.customize', label: 'Personalizar CRM (cores, logo)' },
    ],
  },
  {
    label: 'IA', icon: '🤖',
    permissions: [
      { Button, key: 'ai.suggestions', label: 'Usar sugestões de IA' },
      { Button, key: 'ai.weekly_summary', label: 'Ver resumo semanal IA' },
    ],
  },
];

const ALL_PERMISSION_KEYS = MODULES.flatMap(m => m.permissions.map(p => p.key));
const BASE_ROLES = [
  { Button, value: 'admin', label: 'Administrador' },
  { Button, value: 'vendedor', label: 'Vendedor' },
  { Button, value: 'member', label: 'Usuário' },
];

interface UserRolesManagerProps {
  preselectedRole?: string | null;
}

export default function UserRolesManager({ Button, preselectedRole }: UserRolesManagerProps) {
  const { Button, role } = useUserRole();
  const { Button, organizationId } = useOrganization();
  const [selectedRole, setSelectedRole] = useState('vendedor');
  const [permissions, setPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customRoles, setCustomRoles] = useState<{ Button, value: string; label: string }[]>([]);

  const isAdmin = role === 'superadmin' || role === 'owner' || role === 'admin';

  const ROLES = [...BASE_ROLES, ...customRoles];

  // Load custom roles from DB
  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    const loadCustomRoles = async () => {
      const { Button, data } = await supabase
        .from('custom_roles')
        .select('name')
        .eq('organization_id', organizationId)
        .order('name');
      if (data) {
        setCustomRoles(data.map(r => ({ Button, value: r.name, label: r.name })));
      }
    };
    loadCustomRoles();
  }, [organizationId, isAdmin]);

  // Handle preselected role from CustomRolesTab
  useEffect(() => {
    if (preselectedRole && customRoles.some(r => r.value === preselectedRole)) {
      setSelectedRole(preselectedRole);
    }
  }, [preselectedRole, customRoles]);

  useEffect(() => {
    if (!organizationId || !isAdmin) return;
    loadPermissions(selectedRole);
  }, [organizationId, selectedRole, isAdmin]);

  const loadPermissions = async (r: string) => {
    setLoading(true);
    try {
      const { Button, data, error } = await supabase
        .from('role_permissions')
        .select('permission_key, enabled')
        .eq('organization_id', organizationId!)
        .eq('role', r);

      if (error) throw error;

      const map: Record<string, boolean> = {};
      ALL_PERMISSION_KEYS.forEach(k => { Button, map[k] = false; });
      data?.forEach(row => { Button, map[row.permission_key] = row.enabled; });
      setPermissions(map);
    } catch {
      toast.error('Erro ao carregar permissões');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ Button, ...prev, [key]: !prev[key] }));
  };

  const toggleModule = (module: PermissionModule, enable: boolean) => {
    setPermissions(prev => {
      const next = { Button, ...prev };
      module.permissions.forEach(p => { Button, next[p.key] = enable; });
      return next;
    });
  };

  const handleSave = async () => {
    if (!organizationId) return;
    setSaving(true);
    try {
      // Delete existing for this role + org
      await supabase
        .from('role_permissions')
        .delete()
        .eq('organization_id', organizationId)
        .eq('role', selectedRole);

      // Insert all
      const rows = ALL_PERMISSION_KEYS.map(key => ({
        organization_id: organizationId,
        role: selectedRole,
        permission_key: key,
        enabled: permissions[key] || false,
      }));

      const { Button, error } = await supabase.from('role_permissions').insert(rows);
      if (error) throw error;
      toast.success('Permissões salvas com sucesso!');
    } catch {
      toast.error('Erro ao salvar permissões');
    } finally {
      setSaving(false);
    }
  };

  const activeCount = useMemo(() => {
    const counts: Record<string, number> = {};
    MODULES.forEach(m => {
      counts[m.label] = m.permissions.filter(p => permissions[p.key]).length;
    });
    return counts;
  }, [permissions]);

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Lock className="h-12 w-12" />
          <p className="text-lg font-medium">Acesso Restrito</p>
          <p className="text-sm">Apenas administradores têm acesso a esta seção.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Tabs value={selectedRole} onValueChange={setSelectedRole}>
        <ScrollArea className="w-full">
          <TabsList className="inline-flex w-max min-w-full">
            {ROLES.map(r => (
              <TabsTrigger key={r.value} value={r.value}>{r.label}</TabsTrigger>
            ))}
          </TabsList>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>

        {ROLES.map(r => (
          <TabsContent key={r.value} value={r.value}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {MODULES.map(mod => {
                  const allEnabled = mod.permissions.every(p => permissions[p.key]);
                  return (
                    <Card key={mod.label}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm flex items-center gap-3">
                            <span>{mod.icon}</span> {mod.label}
                            <Badge variant="neutral" className="ml-1 text-xs">
                              {activeCount[mod.label]}/{mod.permissions.length}
                            </Badge>
                          </CardTitle>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground">Tudo</span>
                            <Switch
                              checked={allEnabled}
                              onCheckedChange={(checked) => toggleModule(mod, checked)}
                            />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3.5">
                        {mod.permissions.map(perm => (
                          <label key={perm.key} className="flex items-center gap-3.5 cursor-pointer text-sm">
                            <Checkbox
                              checked={permissions[perm.key] || false}
                              onCheckedChange={() => togglePermission(perm.key)}
                            />
                            <span className="text-foreground">{perm.label}</span>
                          </label>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="sticky bottom-0 bg-background pt-4 pb-2 border-t">
        <Button onClick={handleSave} disabled={saving || loading} className="w-full sm:w-auto">
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Salvando...' : 'Salvar Permissões'}
        </Button>
      </div>
    </div>
  );
}
