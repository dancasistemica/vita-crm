import { Alert, AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, Badge, Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/ds";
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
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Ativa</SelectItem>
              <SelectItem value="suspended">Suspensa</SelectItem>
            </SelectContent>
          </Select>
          <Select value={planFilter} onValueChange={setPlanFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Plano" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os planos</SelectItem>
              {plans.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
              <X className="h-4 w-4" /> Limpar
            </Button>
          )}
        </div>

        {filteredOrgs.length === 0 ? (
          <div className="text-center py-12 text-neutral-500">
            {orgs.length === 0 ? 'Nenhuma organização cadastrada' : 'Nenhuma organização encontrada com os filtros aplicados'}
          </div>
        ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Plano Atual</TableHead>
              <TableHead>Alterar Plano</TableHead>
              <TableHead>Usuários</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Criada em</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrgs.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell className="text-sm text-neutral-500">{org.contact_email || '—'}</TableCell>
                <TableCell>
                  <Badge variant="secondary">{org.plan}</Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={org.plan_id || 'none'}
                    onValueChange={(v) => handlePlanChange(org.id, v)}
                  >
                    <SelectTrigger className="w-[160px]">
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      {plans.map((p) => (
                        <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {org.organization_members?.length || 0}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={org.active ? 'primary' : 'error'}>
                    {org.active ? 'Ativa' : 'Suspensa'}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm text-neutral-500">
                  {new Date(org.created_at).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setEditOrgId(org.id)} title="Editar">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setDeleteConfirmOrg(org)} title="Deletar">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                    <Button variant={org.active ? 'error' : 'primary'}
                      size="sm"
                      onClick={() => handleToggleStatus(org)}
                    >
                      {org.active ? 'Suspender' : 'Ativar'}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

        <AlertDialog open={!!deleteConfirmOrg} onOpenChange={(open) => { if (!open) setDeleteConfirmOrg(null); }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar organização</AlertDialogTitle>
              <AlertDialogDescription>
                Tem certeza que deseja deletar "{deleteConfirmOrg?.name}"? Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    );
  }
);

OrganizationsTab.displayName = 'OrganizationsTab';
