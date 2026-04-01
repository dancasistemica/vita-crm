import { Alert, Badge, Button, Card, Input, Select, Table } from "@/components/ui/ds";
import { useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { toast } from 'sonner';
import { getAllOrganizations, updateOrgStatus, updateOrgPlan, getAllPlans, deleteOrganization } from '@/services/superadminService';
import { CreateOrganizationModal } from './CreateOrganizationModal';
import { EditOrganizationModal } from './EditOrganizationModal';
import { Building2, Users, Plus, Pencil, Trash2, Search, X } from 'lucide-react';

interface Org {
  id: string;
  name: string;
  slug: string;
  plan: string;
  plan_id: string | null;
  contact_email: string | null;
  active: boolean;
  max_leads: number;
  max_users: number;
  created_at: string;
  organization_members: { user_id: string; role: string }[];
}

interface Plan {
  id: string;
  name: string;
  value: number;
  period: string;
  max_users: number;
  max_leads: number | null;
  max_integrations: number | null;
  description: string | null;
}

interface OrganizationsTabProps {
  onStatsChange?: () => void;
}

export const OrganizationsTab = forwardRef<{ openCreateModal?: () => void }, OrganizationsTabProps>(
  ({ onStatsChange }, ref) => {
    const [orgs, setOrgs] = useState<Org[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [createOpen, setCreateOpen] = useState(false);
    const [editOrgId, setEditOrgId] = useState<string | null>(null);
    const [deleteConfirmOrg, setDeleteConfirmOrg] = useState<Org | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
    const [planFilter, setPlanFilter] = useState<string>('all');

    useImperativeHandle(ref, () => ({
      openCreateModal: () => setCreateOpen(true),
    }));

    const filteredOrgs = useMemo(() => {
      let result = orgs;
      if (searchTerm) {
        const lower = searchTerm.toLowerCase();
        result = result.filter(o =>
          o.name.toLowerCase().includes(lower) ||
          (o.contact_email || '').toLowerCase().includes(lower)
        );
      }
      if (statusFilter !== 'all') {
        result = result.filter(o => statusFilter === 'active' ? o.active : !o.active);
      }
      if (planFilter !== 'all') {
        result = result.filter(o => o.plan_id === planFilter);
      }
      return result;
    }, [orgs, searchTerm, statusFilter, planFilter]);

    const hasActiveFilters = searchTerm !== '' || statusFilter !== 'all' || planFilter !== 'all';

    const clearFilters = () => {
      setSearchTerm('');
      setStatusFilter('all');
      setPlanFilter('all');
    };

    const fetchData = async () => {
      try {
        const [orgsData, plansData] = await Promise.all([getAllOrganizations(), getAllPlans()]);
        setOrgs(orgsData as any);
        setPlans(plansData as any);
      } catch (err) {
        console.error('[OrganizationsTab]', err);
        toast.error('Erro ao carregar organizações');
      } finally {
        setLoading(false);
      }
    };

    useEffect(() => { fetchData(); }, []);

    const handleToggleStatus = async (org: Org) => {
      try {
        await updateOrgStatus(org.id, !org.active);
        toast.success(`Organização ${!org.active ? 'ativada' : 'suspensa'}`);
        fetchData();
        onStatsChange?.();
      } catch (err) {
        console.error('[OrganizationsTab] toggle status:', err);
        toast.error('Erro ao alterar status');
      }
    };

    const handlePlanChange = async (orgId: string, planId: string) => {
      try {
        await updateOrgPlan(orgId, planId === 'none' ? null : planId);
        toast.success('Plano atualizado');
        fetchData();
      } catch (err) {
        console.error('[OrganizationsTab] plan change:', err);
        toast.error('Erro ao alterar plano');
      }
    };

    const handleDelete = async () => {
      if (!deleteConfirmOrg) return;
      try {
        await deleteOrganization(deleteConfirmOrg.id);
        toast.success('Organização deletada');
        setDeleteConfirmOrg(null);
        fetchData();
        onStatsChange?.();
      } catch (err) {
        console.error('[OrganizationsTab] delete:', err);
        toast.error('Erro ao deletar organização');
      }
    };

    const handleCreateSuccess = () => {
      fetchData();
      onStatsChange?.();
    };

    if (loading) {
      return <div className="flex items-center justify-center py-12 text-neutral-500">Carregando...</div>;
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-neutral-500 text-sm">
            <Building2 className="h-4 w-4" />
            <span>
              {hasActiveFilters
                ? `${filteredOrgs.length} de ${orgs.length} organização(ões)`
                : `${orgs.length} organização(ões) cadastrada(s)`}
            </span>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="gap-3">
            <Plus className="h-4 w-4" /> Nova Organização
          </Button>
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
            <option value="all">Todas</option>
            <option value="active">Ativa</option>
            <option value="suspended">Suspensa</option>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <option value="all">Todos os planos</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" /> Limpar
            </Button>
          )}
        </div>

        {filteredOrgs.length === 0 ? (
          <div className="text-center py-12 text-neutral-500 border border-dashed rounded-lg">
            {orgs.length === 0 ? 'Nenhuma organização cadastrada' : 'Nenhuma organização encontrada com os filtros aplicados'}
          </div>
        ) : (
          <div className="rounded-lg border border-neutral-200 overflow-x-auto bg-white shadow-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-neutral-50 border-b border-neutral-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Plano Atual</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Alterar Plano</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Usuários</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-neutral-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Criada em</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredOrgs.map((org) => (
                  <tr key={org.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-4 text-sm font-medium text-neutral-900">{org.name}</td>
                    <td className="px-4 py-4 text-sm text-neutral-500">{org.contact_email || '—'}</td>
                    <td className="px-4 py-4 text-sm text-neutral-500">
                      <Badge variant="secondary">{org.plan}</Badge>
                    </td>
                    <td className="px-4 py-4 text-sm">
                      <Select
                        value={org.plan_id || 'none'}
                        onValueChange={(v) => handlePlanChange(org.id, v)}
                      >
                        <option value="none">Nenhum</option>
                        {plans.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </Select>
                    </td>
                    <td className="px-4 py-4 text-sm text-center">
                      <div className="flex items-center justify-center gap-1 text-neutral-500">
                        <Users className="h-3 w-3" />
                        {org.organization_members?.length || 0}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      <Badge variant={org.active ? 'primary' : 'error'}>
                        {org.active ? 'Ativa' : 'Suspensa'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 text-sm text-neutral-500">
                      {new Date(org.created_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditOrgId(org.id)} title="Editar">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => setDeleteConfirmOrg(org)} title="Deletar">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant={org.active ? 'error' : 'primary'}
                          size="sm"
                          className="text-xs h-8"
                          onClick={() => handleToggleStatus(org)}
                        >
                          {org.active ? 'Suspender' : 'Ativar'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <CreateOrganizationModal
          open={createOpen}
          onOpenChange={setCreateOpen}
          onSuccess={handleCreateSuccess}
          plans={plans}
        />

        <EditOrganizationModal
          open={!!editOrgId}
          onOpenChange={(open) => { if (!open) setEditOrgId(null); }}
          orgId={editOrgId}
          onSuccess={() => { fetchData(); onStatsChange?.(); }}
        />

        {deleteConfirmOrg && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
            <Card variant="default" padding="lg" className="w-full max-w-md">
              <h2 className="text-2xl font-semibold mb-2">Deletar organização</h2>
              <p className="text-sm text-neutral-600 mb-6">
                Tem certeza que deseja deletar "{deleteConfirmOrg?.name}"? Esta ação não pode ser desfeita e removerá todos os dados vinculados a esta organização.
              </p>
              <div className="flex gap-3">
                <Button variant="secondary" className="flex-1" onClick={() => setDeleteConfirmOrg(null)}>Cancelar</Button>
                <Button variant="error" className="flex-1" onClick={handleDelete}>
                  Deletar
                </Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    );
  }
);

OrganizationsTab.displayName = 'OrganizationsTab';
