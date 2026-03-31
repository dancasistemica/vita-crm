import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { Card } from "@/components/ui/ds/Card";
import { Button } from "@/components/ui/ds/Button";
import { Input } from "@/components/ui/ds/Input";
import { Badge } from "@/components/ui/ds/Badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-3 text-muted-foreground">Carregando leads...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <p className="text-destructive font-medium">Erro ao carregar leads</p>
        <p className="text-sm text-muted-foreground mt-1">{error}</p>
      </div>
    );
  }

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-6">Leads</h1>
          <p className="text-sm text-neutral-600 mt-0.5">Gerencie seus contatos e oportunidades</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {userCanCreate && (
            <Button variant="neutral" size="sm" onClick={() => navigate('/import-wizard')}>
              <Upload className="h-4 w-4 mr-1" /> Importar Leads
            </Button>
          )}
          <Button variant="neutral" size="sm" onClick={() => setExportOpen(true)}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar
          </Button>
          {userCanCreate && (
            <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange} modal={false}>
              <DialogTrigger asChild>
                <Button size="sm" onClick={handleNewLead}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
                </DialogHeader>
                <LeadForm lead={editingLead} onSave={handleSave} />
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={e => {
              setSearch(e.target.value);
              resetPage();
            }}
            icon={<Search className="h-4 w-4" />}
          />
        </div>

        <div className="space-y-4 p-4 bg-white rounded-lg border border-neutral-200 mb-6" ref={filterRef}>
          {activeFiltersCount > 0 && (
            <div className="flex flex-col gap-3 pb-2 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-lg font-semibold text-neutral-700">Filtros</h3>
              <span className="inline-flex items-center gap-3 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold sm:ml-auto">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative space-y-3">
              <label className="block text-sm font-semibold text-neutral-700">Origem</label>
              <button
                type="button"
                onClick={() => {
                  setOpenOrigin(!openOrigin);
                  setOpenInterest(false);
                  setOpenStage(false);
                  setOpenTags(false);
                }}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-white text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedOrigins.length === 0 ? 'Selecione origens...' : `${selectedOrigins.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${openOrigin ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {openOrigin && (
                <div className="absolute z-50 w-full border border-neutral-200 rounded-lg bg-white shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {origins.map((origin) => (
                    <label key={origin} className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedOrigins.includes(origin)}
                        onChange={() => toggleSelection(origin, selectedOrigins, setSelectedOrigins, 'Origem')}
                        className="w-4 h-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                      />
                      <span className="text-sm text-neutral-700">{origin}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedOrigins.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedOrigins.map((origin) => (
                    <Badge key={origin} variant="default" size="sm" className="gap-1">
                      {origin}
                      <button
                        type="button"
                        onClick={() => toggleSelection(origin, selectedOrigins, setSelectedOrigins, 'Origem')}
                        className="ml-1 hover:text-primary-900"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="relative space-y-3">
              <label className="block text-sm font-semibold text-neutral-700">Nível de Interesse</label>
              <button
                type="button"
                onClick={() => {
                  setOpenInterest(!openInterest);
                  setOpenOrigin(false);
                  setOpenStage(false);
                  setOpenTags(false);
                }}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-white text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedInterests.length === 0 ? 'Selecione níveis...' : `${selectedInterests.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${openInterest ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {openInterest && (
                <div className="absolute z-50 w-full border border-neutral-200 rounded-lg bg-white shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {interestLevels.map((level) => (
                    <label key={level.value} className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedInterests.includes(level.value)}
                        onChange={() => toggleSelection(level.value, selectedInterests, setSelectedInterests, 'Nível de interesse')}
                        className="w-4 h-4 rounded border-neutral-300 text-green-600"
                      />
                      <span className="text-sm text-neutral-700">{level.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedInterests.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedInterests.map((interest) => (
                    <span key={interest} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                      {getInterestLabel(interest)}
                      <button
                        type="button"
                        onClick={() => toggleSelection(interest, selectedInterests, setSelectedInterests, 'Nível de interesse')}
                        className="ml-1 hover:text-green-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative space-y-3">
              <label className="block text-sm font-semibold text-neutral-700">Etapa do Funil</label>
              <button
                type="button"
                onClick={() => {
                  setOpenStage(!openStage);
                  setOpenOrigin(false);
                  setOpenInterest(false);
                  setOpenTags(false);
                }}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-white text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedStages.length === 0 ? 'Selecione etapas...' : `${selectedStages.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${openStage ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {openStage && (
                <div className="absolute z-50 w-full border border-neutral-200 rounded-lg bg-white shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {pipelineStages.map((stage) => (
                    <label key={stage.id} className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedStages.includes(stage.id)}
                        onChange={() => toggleSelection(stage.id, selectedStages, setSelectedStages, 'Etapa do funil')}
                        className="w-4 h-4 rounded border-neutral-300 text-purple-600"
                      />
                      <span className="text-sm text-neutral-700">{stage.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedStages.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedStages.map((stage) => (
                    <span key={stage} className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                      {getStageName(stage)}
                      <button
                        type="button"
                        onClick={() => toggleSelection(stage, selectedStages, setSelectedStages, 'Etapa do funil')}
                        className="ml-1 hover:text-purple-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="relative space-y-3">
              <label className="block text-sm font-semibold text-neutral-700">Tags</label>
              <button
                type="button"
                onClick={() => {
                  setOpenTags(!openTags);
                  setOpenOrigin(false);
                  setOpenInterest(false);
                  setOpenStage(false);
                }}
                className="w-full px-4 py-2 border border-neutral-200 rounded-lg bg-white text-left flex items-center justify-between hover:bg-neutral-50 transition-colors"
              >
                <span className="text-sm text-neutral-700">
                  {selectedTags.length === 0 ? 'Selecione tags...' : `${selectedTags.length} selecionado(s)`}
                </span>
                <svg className={`w-4 h-4 transition-transform ${openTags ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
              </button>

              {openTags && (
                <div className="absolute z-50 w-full border border-neutral-200 rounded-lg bg-white shadow-lg mt-1 max-h-48 overflow-y-auto">
                  <div className="px-4 py-2 border-b border-neutral-200 font-semibold bg-neutral-50 text-sm text-neutral-600">
                    Selecione as tags desejadas
                  </div>
                  {tags.map((tag) => (
                    <label key={tag.name} className="flex items-center gap-3 px-4 py-2 hover:bg-neutral-50 cursor-pointer border-b border-gray-100 last:border-b-0">
                      <input
                        type="checkbox"
                        checked={selectedTags.includes(tag.name)}
                        onChange={() => toggleSelection(tag.name, selectedTags, setSelectedTags, 'Tags')}
                        className="w-4 h-4 rounded border-neutral-300 text-orange-600"
                      />
                      <span className="text-sm text-neutral-700">{tag.name}</span>
                    </label>
                  ))}
                </div>
              )}

              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-2">
                  {selectedTags.map((tag) => (
                    <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
                      {tag}
                      <button
                        type="button"
                        onClick={() => toggleSelection(tag, selectedTags, setSelectedTags, 'Tags')}
                        className="ml-1 hover:text-orange-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="neutral"
              size="sm"
              onClick={() => {
                setSelectedOrigins([]);
                setSelectedInterests([]);
                setSelectedStages([]);
                setSelectedTags([]);
                setOpenOrigin(false);
                setOpenInterest(false);
                setOpenStage(false);
                setOpenTags(false);
                resetPage();
                console.log('[LeadsFilters] Todos os filtros foram limpos');
              }}
            >
              Limpar Filtros
            </Button>
          </div>
        </div>
      </div>

      <RecordCounter
        totalCount={leads.length}
        filteredCount={sortedLeads.length}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      <div className="flex flex-col md:flex-row md:items-center gap-3 p-3 bg-neutral-50 rounded-lg">
        <label className="text-sm font-medium text-neutral-700">Ordenar por:</label>
        <select
          value={sortBy}
          onChange={(e) => {
            setSortBy(e.target.value as 'date' | 'name');
            resetPage();
          }}
          className="px-3 py-2 border border-neutral-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="date">📅 Data de Cadastro (Padrão)</option>
          <option value="name">🔤 Ordem Alfabética</option>
        </select>
        <button
          type="button"
          onClick={() => {
            setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
            resetPage();
          }}
          className="px-3 py-2 bg-blue-500 text-white rounded-md text-sm hover:bg-blue-600 transition-colors flex items-center gap-3"
        >
          {sortOrder === 'desc' ? '↓ Decrescente' : '↑ Crescente'}
        </button>
      </div>

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionado(s)</span>
          {userCanEdit && (
            <Button variant="neutral" size="sm" className="h-7 text-xs" onClick={() => setBulkEditOpen(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Editar em massa
            </Button>
          )}
          {userCanDelete && (
            <Button variant="error" size="sm" className="h-7 text-xs" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3 w-3 mr-1" /> Deletar selecionados
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      <div className="space-y-3">
        {paginated.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm">Nenhum lead encontrado.</p>}

        {paginated.length > 0 && (
          <div className="flex items-center gap-3 px-4 py-1">
            <Checkbox
              checked={selectedIds.length === paginated.length && paginated.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground">Selecionar todos</span>
          </div>
        )}

        {paginated.map((lead, idx) => (
          <Card key={lead.id} className="hover-lift shadow-card border-border/60 relative overflow-hidden animate-slide-up" style={{ animationDelay: `${idx * 30}ms`, animationFillMode: 'backwards' }}>
            <div className={`interest-bar ${interestBarColors[lead.interestLevel] || 'bg-muted'}`} />
            <CardContent className="py-3 px-4 pl-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedIds.includes(lead.id)}
                  onCheckedChange={() => toggleSelect(lead.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="font-semibold text-foreground text-sm cursor-pointer hover:underline hover:text-primary" onClick={() => setDetailLead(lead)}>{lead.name}</span>
                    <Badge variant="neutral" className={`text-[10px] border ${interestColors[lead.interestLevel] || 'bg-muted text-muted-foreground'}`}>{getInterestLabel(lead.interestLevel)}</Badge>
                    <Badge variant="neutral" className="text-[10px] bg-muted/50">{getStageName(lead.pipelineStage)}</Badge>
                    {lead.tags.map(tag => <Badge key={tag} variant="neutral" className="text-[10px] bg-primary/8 text-primary border-primary/15">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground flex-wrap">
                    <span>{lead.origin}</span>
                    {lead.city && <span>• {lead.city}</span>}
                    {lead.responsible && <span className="text-primary/70">→ {lead.responsible}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"><Phone className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-info/10 hover:text-info"><Mail className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.instagram && (
                  <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-accent/10 hover:text-accent"><Instagram className="h-4 w-4" /></Button>
                  </a>
                )}
                {userCanEdit && (
                  <Button variant="ghost" size="sm" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditLead(lead)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleDeleteClick(lead)}
                  disabled={!userCanDelete || deleteLoading}
                  title={userCanDelete ? 'Excluir lead' : 'Voce nao tem permissao'}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-sm text-muted-foreground">{filtered.length} leads</span>
          <div className="flex items-center gap-1">
            <Button variant="neutral" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="neutral" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
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
