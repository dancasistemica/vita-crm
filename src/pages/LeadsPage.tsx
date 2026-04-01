import { Badge, Button, Card, Checkbox, Dialog, Input } from "@/components/ui/ds";
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { Plus, Search, Phone, Mail, Instagram, Trash2, Edit, Upload, FileDown, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LeadForm from "@/components/LeadForm";
import LeadDetailSheet from "@/components/leads/LeadDetailSheet";
import BulkEditModal from "@/components/bulk/BulkEditModal";
import BulkDeleteModal from "@/components/bulk/BulkDeleteModal";
import ExportModal from "@/components/export/ExportModal";
import RecordCounter from "@/components/common/RecordCounter";
import { DeleteConfirmationModal } from "@/components/common/DeleteConfirmationModal";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useUserRole } from "@/hooks/useUserRole";
import { canDeleteLead } from "@/services/leadsService";

const interestColors: Record<string, string> = { frio: 'bg-cold/15 text-cold border-cold/20', morno: 'bg-warm/15 text-warm border-warm/20', quente: 'bg-hot/15 text-hot border-hot/20' };
const interestBarColors: Record<string, string> = { frio: 'bg-cold', morno: 'bg-warm', quente: 'bg-hot' };

export default function LeadsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { leads, origins, pipelineStages, tags, interestLevels, loading, error, addLead, deleteLead, updateLead, refetch } = useLeadsData();
  const { role, canCreate: userCanCreate, canEdit: userCanEdit } = useUserRole();
  const userCanDelete = canDeleteLead(role);

  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<'date' | 'name'>('date');
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc');
  const [selectedOrigins, setSelectedOrigins] = useState<string[]>([]);
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [selectedStages, setSelectedStages] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [openOrigin, setOpenOrigin] = useState(false);
  const [openInterest, setOpenInterest] = useState(false);
  const [openStage, setOpenStage] = useState(false);
  const [openTags, setOpenTags] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);
  const [editingLead, setEditingLead] = useState<LeadView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailLead, setDetailLead] = useState<LeadView | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<LeadView | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { page, setPage, perPage, setPerPage, resetPage } = useTablePagination();

  const getFilteredLeads = () => {
    if (!leads) return [];

    return leads.filter((lead) => {
      const matchSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || lead.email.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
      if (!matchSearch) {
        return false;
      }

      if (selectedOrigins.length > 0 && !selectedOrigins.includes(lead.origin)) {
        return false;
      }

      if (selectedInterests.length > 0 && !selectedInterests.includes(lead.interestLevel)) {
        return false;
      }

      if (selectedStages.length > 0 && !selectedStages.includes(lead.pipelineStage)) {
        return false;
      }

      if (selectedTags.length > 0) {
        const leadTags = Array.isArray(lead.tags) ? lead.tags : [];
        const hasAnyTag = selectedTags.some(tag => leadTags.includes(tag));
        if (!hasAnyTag) {
          return false;
        }
      }

      return true;
    });
  };

  const getActiveFiltersCount = (): number => {
    return selectedOrigins.length + selectedInterests.length + selectedStages.length + selectedTags.length;
  };

  const filtered = useMemo(() => {
    return getFilteredLeads();
  }, [leads, search, selectedOrigins, selectedInterests, selectedStages, selectedTags]);

  const sortedLeads = useMemo(() => {
    const sorted = [...filtered];

    if (sortBy === 'date') {
      sorted.sort((a, b) => {
        const dateA = new Date(a.entryDate || '').getTime();
        const dateB = new Date(b.entryDate || '').getTime();
        return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
      });
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => {
        const nameA = (a.name || '').toLowerCase();
        const nameB = (b.name || '').toLowerCase();
        return sortOrder === 'asc'
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      });
    }

    console.log(`[LeadsList] Leads ordenados por: ${sortBy} (${sortOrder})`);
    return sorted;
  }, [filtered, sortBy, sortOrder]);

  const totalPages = Math.max(1, Math.ceil(sortedLeads.length / perPage));
  const paginated = sortedLeads.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    localStorage.setItem('leadsSortBy', sortBy);
    localStorage.setItem('leadsSortOrder', sortOrder);
  }, [sortBy, sortOrder]);

  useEffect(() => {
    const savedSort = localStorage.getItem('leadsSortBy');
    const savedOrder = localStorage.getItem('leadsSortOrder');

    if (savedSort === 'date' || savedSort === 'name') {
      setSortBy(savedSort);
    }

    if (savedOrder === 'desc' || savedOrder === 'asc') {
      setSortOrder(savedOrder);
    }
  }, []);

  useEffect(() => {
    console.log('[LeadsPage] User role:', role);
    console.log('[LeadsPage] Can delete:', userCanDelete);
  }, [role, userCanDelete]);

  const handleDeleteClick = (lead: LeadView) => {
    console.log('[LeadsPage] Delete clicked for lead:', lead.id);
    console.log('[LeadsPage] Can delete:', userCanDelete);
    if (!userCanDelete) {
      console.warn('[LeadsPage] Usuario sem permissao para excluir lead');
      toast.error('Voce nao tem permissao para excluir leads');
      return;
    }
    console.log('[LeadsPage] Confirmacao de exclusao aberta:', lead.id);
    setDeleteTarget(lead);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      console.log('[LeadsPage] Deletando lead:', deleteTarget.id);
      await deleteLead(deleteTarget.id);
      console.log('[LeadsPage] Lead deletado com sucesso:', deleteTarget.id);
      toast.success('Lead removido');
      setDeleteModalOpen(false);
      setDeleteTarget(null);
      if (detailLead?.id === deleteTarget.id) {
        setDetailLead(null);
      }
      navigate('/leads');
    } catch (err) {
      console.error('[LeadsPage] Erro ao deletar lead:', err);
      throw err;
    } finally {
      setDeleteLoading(false);
    }
  };

  useEffect(() => {
    const state = location.state as { leadId?: string } | null;
    if (!state?.leadId) return;

    const targetLead = leads.find(lead => lead.id === state.leadId);
    if (targetLead) {
      setDetailLead(targetLead);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, leads, navigate, location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;

      if (filterRef.current && !filterRef.current.contains(target)) {
        setOpenOrigin(false);
        setOpenInterest(false);
        setOpenStage(false);
        setOpenTags(false);
        console.log('[LeadsFilters] Dropdowns fechados (clique fora detectado)');
      }
    };

    if (openOrigin || openInterest || openStage || openTags) {
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [openOrigin, openInterest, openStage, openTags]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenOrigin(false);
        setOpenInterest(false);
        setOpenStage(false);
        setOpenTags(false);
        console.log('[LeadsFilters] Dropdowns fechados (ESC pressionado)');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const closeDialog = () => {
    setEditingLead(null);
    setDialogOpen(false);
  };

  const handleDialogOpenChange = (open: boolean) => {
    if (!open) {
      closeDialog();
      return;
    }

    setDialogOpen(true);
  };

  const handleNewLead = () => {
    setEditingLead(null);
    setDialogOpen(true);
  };

  const handleEditLead = (lead: LeadView) => {
    setEditingLead(lead);
    setDialogOpen(true);
  };

  const handleSave = async (data: Partial<LeadView>) => {
    try {
      console.log('[LeadsPage] 💾 Salvando lead...');
      if (editingLead) {
        await updateLead(editingLead.id, data);
        toast.success("Lead atualizado!");
      } else {
        await addLead(data);
        toast.success("Lead adicionado!");
      }
      closeDialog();
    } catch (err) {
      console.error('[LeadsPage] ❌ Erro ao salvar lead:', err);
      toast.error("Erro ao salvar lead");
    }
  };

  const getStageName = (id: string) => pipelineStages.find(s => s.id === id)?.name || '';
  const getInterestLabel = (value: string) => interestLevels.find(l => l.value === value)?.label || value;

  const toggleSelection = (
    value: string,
    selectedArray: string[],
    setSelectedArray: (arr: string[]) => void,
    label: string
  ) => {
    const next = selectedArray.includes(value)
      ? selectedArray.filter(item => item !== value)
      : [...selectedArray, value];
    setSelectedArray(next);
    resetPage();
    console.log(`[LeadsFilters] ${label} selecionado(s):`, next);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === paginated.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginated.map(l => l.id));
    }
  };

  const resetFilters = () => {
    setSelectedOrigins([]);
    setSelectedInterests([]);
    setSelectedStages([]);
    setSelectedTags([]);
    setSearch("");
    resetPage();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary-600" />
        <span className="ml-3 text-neutral-600">Carregando leads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-error-600 font-medium">Erro ao carregar leads</p>
        <p className="text-sm text-neutral-500 mt-1">{error}</p>
      </div>
    );
  }

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-6 px-1 py-4 sm:p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-1">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-neutral-900 tracking-tight">Leads</h1>
          <p className="text-xs sm:text-sm text-neutral-600 font-medium">Gerencie seus contatos e oportunidades</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {userCanCreate && (
            <Button variant="secondary" size="sm" onClick={() => navigate('/import-wizard')}>
              <Upload className="h-4 w-4 mr-2" /> Importar Leads
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => setExportOpen(true)}>
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
          {userCanCreate && (
            <>
              <Button size="sm" onClick={handleNewLead} icon={<Plus className="h-4 w-4" />}>
                Novo Lead
              </Button>
              <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange} title={editingLead ? 'Editar Lead' : 'Novo Lead'}>
                <LeadForm lead={editingLead} onSave={handleSave} />
              </Dialog>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Buscar por nome, email ou telefone..."
          value={search}
          onChange={e => { setSearch(e.target.value); resetPage(); }}
          icon={<Search className="h-4 w-4" />}
        />

        {/* ... existing filter code ... */}
        <div className="flex flex-wrap items-center gap-2 pt-1" ref={filterRef}>
          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = !openOrigin;
                setOpenOrigin(next);
                if (next) { setOpenInterest(false); setOpenStage(false); setOpenTags(false); }
              }}
              className={`h-8 border-dashed ${selectedOrigins.length > 0 ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
            >
              Origem {selectedOrigins.length > 0 && `(${selectedOrigins.length})`}
            </Button>
            {openOrigin && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
                <MultiSelectFilter
                  label="Filtrar por Origem"
                  options={origins.map(o => ({ value: o, label: o }))}
                  selected={selectedOrigins}
                  onChange={setSelectedOrigins}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = !openInterest;
                setOpenInterest(next);
                if (next) { setOpenOrigin(false); setOpenStage(false); setOpenTags(false); }
              }}
              className={`h-8 border-dashed ${selectedInterests.length > 0 ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
            >
              Interesse {selectedInterests.length > 0 && `(${selectedInterests.length})`}
            </Button>
            {openInterest && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
                <MultiSelectFilter
                  label="Filtrar por Interesse"
                  options={interestLevels.map(l => ({ value: l.value, label: l.label }))}
                  selected={selectedInterests}
                  onChange={setSelectedInterests}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = !openStage;
                setOpenStage(next);
                if (next) { setOpenOrigin(false); setOpenInterest(false); setOpenTags(false); }
              }}
              className={`h-8 border-dashed ${selectedStages.length > 0 ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
            >
              Etapa {selectedStages.length > 0 && `(${selectedStages.length})`}
            </Button>
            {openStage && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
                <MultiSelectFilter
                  label="Filtrar por Etapa"
                  options={pipelineStages.map(s => ({ value: s.id, label: s.name }))}
                  selected={selectedStages}
                  onChange={setSelectedStages}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const next = !openTags;
                setOpenTags(next);
                if (next) { setOpenOrigin(false); setOpenInterest(false); setOpenStage(false); }
              }}
              className={`h-8 border-dashed ${selectedTags.length > 0 ? 'bg-primary-50 text-primary-600 border-primary-200' : ''}`}
            >
              Tags {selectedTags.length > 0 && `(${selectedTags.length})`}
            </Button>
            {openTags && (
              <div className="absolute top-full left-0 mt-2 w-64 p-3 bg-white border border-neutral-200 rounded-lg shadow-xl z-50 animate-in fade-in zoom-in-95">
                <MultiSelectFilter
                  label="Filtrar por Tags"
                  options={tags.map(t => ({ value: t.name, label: t.name }))}
                  selected={selectedTags}
                  onChange={setSelectedTags}
                />
              </div>
            )}
          </div>

          {activeFiltersCount > 0 && (
            <Button variant="secondary" size="sm" onClick={resetFilters} className="h-8 text-neutral-500 hover:text-neutral-900">
              Limpar Filtros
            </Button>
          )}
        </div>

      </div>

      {/* ... existing table code ... */}
// ... keep existing code

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-sm text-neutral-500">{filtered.length} leads</span>
          <div className="flex items-center gap-1">
            <Button variant="secondary" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm text-neutral-500 px-3">{page} / {totalPages}</span>
            <Button variant="secondary" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
          </div>
        </div>
      )}

      <BulkEditModal open={bulkEditOpen} onOpenChange={setBulkEditOpen} selectedIds={selectedIds} type="leads" onSuccess={() => setSelectedIds([])} />
      <BulkDeleteModal open={bulkDeleteOpen} onOpenChange={setBulkDeleteOpen} selectedIds={selectedIds} type="leads" onSuccess={() => { setSelectedIds([]); refetch(); }} items={leads.map(l => ({ id: l.id, name: l.name, email: l.email, phone: l.phone }))} onDelete={deleteLead} />
      <ExportModal open={exportOpen} onOpenChange={setExportOpen} type="leads" allData={leads} filteredData={filtered} />
      <LeadDetailSheet
        lead={detailLead}
        open={!!detailLead}
        onClose={() => setDetailLead(null)}
        stageName={detailLead ? getStageName(detailLead.pipelineStage) : ''}
        interestLabel={detailLead ? getInterestLabel(detailLead.interestLevel) : ''}
        onEdit={(l) => { setDetailLead(null); handleEditLead(l); }}
        onDelete={async (id) => {
          if (!userCanDelete) {
            console.warn('[LeadsPage] Usuario sem permissao para excluir lead');
            toast.error('Voce nao tem permissao para excluir leads');
            return;
          }
          await deleteLead(id);
          toast.success('Lead removido');
          navigate('/leads');
        }}
        canDelete={userCanDelete}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title="Excluir lead"
        message="Esta acao e permanente"
        itemName={deleteTarget?.name || 'Lead'}
        isLoading={deleteLoading}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteModalOpen(false);
          setDeleteTarget(null);
        }}
      />
    </div>
  );
}
