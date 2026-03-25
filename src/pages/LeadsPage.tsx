import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useLeadsData, LeadView } from "@/hooks/useLeadsData";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Phone, Mail, Instagram, Trash2, Edit, Upload, FileDown, Pencil, Loader2 } from "lucide-react";
import { toast } from "sonner";
import LeadForm from "@/components/LeadForm";
import LeadDetailSheet from "@/components/leads/LeadDetailSheet";
import BulkEditModal from "@/components/bulk/BulkEditModal";
import BulkDeleteModal from "@/components/bulk/BulkDeleteModal";
import ExportModal from "@/components/export/ExportModal";
import RecordCounter from "@/components/common/RecordCounter";
import { useTablePagination } from "@/hooks/useTablePagination";
import { useUserRole } from "@/hooks/useUserRole";

const interestColors: Record<string, string> = { frio: 'bg-cold/15 text-cold border-cold/20', morno: 'bg-warm/15 text-warm border-warm/20', quente: 'bg-hot/15 text-hot border-hot/20' };
const interestBarColors: Record<string, string> = { frio: 'bg-cold', morno: 'bg-warm', quente: 'bg-hot' };

export default function LeadsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { leads, origins, pipelineStages, tags, interestLevels, loading, error, addLead, deleteLead, updateLead, refetch } = useLeadsData();
  const { canCreate: userCanCreate, canEdit: userCanEdit, canDelete: userCanDelete } = useUserRole();

  const [search, setSearch] = useState("");
  const [selectedOrigin, setSelectedOrigin] = useState<string>('all');
  const [selectedInterest, setSelectedInterest] = useState<string>('all');
  const [selectedStage, setSelectedStage] = useState<string>('all');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [editingLead, setEditingLead] = useState<LeadView | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [detailLead, setDetailLead] = useState<LeadView | null>(null);
  const { page, setPage, perPage, setPerPage, resetPage } = useTablePagination();

  const getFilteredLeads = () => {
    if (!leads) return [];

    return leads.filter((lead) => {
      const matchSearch = !search || lead.name.toLowerCase().includes(search.toLowerCase()) || lead.email.toLowerCase().includes(search.toLowerCase()) || lead.phone.includes(search);
      if (!matchSearch) {
        return false;
      }

      if (selectedOrigin !== 'all' && lead.origin !== selectedOrigin) {
        return false;
      }

      if (selectedInterest !== 'all' && lead.interestLevel !== selectedInterest) {
        return false;
      }

      if (selectedStage !== 'all' && lead.pipelineStage !== selectedStage) {
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
    let count = 0;
    if (selectedOrigin !== 'all') count++;
    if (selectedInterest !== 'all') count++;
    if (selectedStage !== 'all') count++;
    if (selectedTags.length > 0) count++;
    return count;
  };

  const filtered = useMemo(() => {
    return getFilteredLeads();
  }, [leads, search, selectedOrigin, selectedInterest, selectedStage, selectedTags]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  useEffect(() => {
    const state = location.state as { leadId?: string } | null;
    if (!state?.leadId) return;

    const targetLead = leads.find(lead => lead.id === state.leadId);
    if (targetLead) {
      setDetailLead(targetLead);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.state, leads, navigate, location.pathname]);

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
          <h1 className="text-2xl font-display text-foreground">Leads</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus contatos e oportunidades</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {userCanCreate && (
            <Button variant="outline" size="sm" onClick={() => navigate('/import-wizard')}>
              <Upload className="h-4 w-4 mr-1" /> Importar Leads
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
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
            className="pl-9"
          />
        </div>

        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200 mb-6">
          {activeFiltersCount > 0 && (
            <div className="flex flex-col gap-2 pb-2 border-b border-gray-100 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="text-sm font-semibold text-gray-700">Filtros</h3>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold sm:ml-auto">
                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                {activeFiltersCount} filtro{activeFiltersCount !== 1 ? 's' : ''} ativo{activeFiltersCount !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Origem</label>
              <Select value={selectedOrigin} onValueChange={(value) => {
                setSelectedOrigin(value);
                resetPage();
                console.log('[LeadsFilters] Origem selecionada:', value);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma origem..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as origens</SelectItem>
                  {origins.map((origin) => (
                    <SelectItem key={origin} value={origin}>{origin}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Nível de Interesse</label>
              <Select value={selectedInterest} onValueChange={(value) => {
                setSelectedInterest(value);
                resetPage();
                console.log('[LeadsFilters] Nível de interesse selecionado:', value);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione um nível..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os níveis</SelectItem>
                  {interestLevels.map((level) => (
                    <SelectItem key={level.value} value={level.value}>{level.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Etapa do Funil</label>
              <Select value={selectedStage} onValueChange={(value) => {
                setSelectedStage(value);
                resetPage();
                console.log('[LeadsFilters] Etapa do funil selecionada:', value);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione uma etapa..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {pipelineStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.id}>{stage.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold text-gray-700">Tags</label>
              <Select value={selectedTags.join(',')} onValueChange={(value) => {
                const nextTags = value ? value.split(',') : [];
                setSelectedTags(nextTags);
                resetPage();
                console.log('[LeadsFilters] Tags selecionadas:', nextTags);
              }}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione tags..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Todas as tags</SelectItem>
                  {tags.map((tag) => (
                    <SelectItem key={tag.name} value={tag.name}>{tag.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedOrigin('all');
                setSelectedInterest('all');
                setSelectedStage('all');
                setSelectedTags([]);
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
        filteredCount={filtered.length}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionado(s)</span>
          {userCanEdit && (
            <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkEditOpen(true)}>
              <Pencil className="h-3 w-3 mr-1" /> Editar em massa
            </Button>
          )}
          {userCanDelete && (
            <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => setBulkDeleteOpen(true)}>
              <Trash2 className="h-3 w-3 mr-1" /> Deletar selecionados
            </Button>
          )}
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {paginated.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm">Nenhum lead encontrado.</p>}

        {paginated.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1">
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
            <CardContent className="py-3 px-4 pl-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedIds.includes(lead.id)}
                  onCheckedChange={() => toggleSelect(lead.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground text-sm cursor-pointer hover:underline hover:text-primary" onClick={() => setDetailLead(lead)}>{lead.name}</span>
                    <Badge variant="outline" className={`text-[10px] border ${interestColors[lead.interestLevel] || 'bg-muted text-muted-foreground'}`}>{getInterestLabel(lead.interestLevel)}</Badge>
                    <Badge variant="outline" className="text-[10px] bg-muted/50">{getStageName(lead.pipelineStage)}</Badge>
                    {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-[10px] bg-primary/8 text-primary border-primary/15">{tag}</Badge>)}
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
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-success hover:bg-success/10 hover:text-success"><Phone className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-info/10 hover:text-info"><Mail className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.instagram && (
                  <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10 hover:text-accent"><Instagram className="h-4 w-4" /></Button>
                  </a>
                )}
                {userCanEdit && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleEditLead(lead)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                )}
                {userCanDelete && (
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={async () => {
                    try {
                      await deleteLead(lead.id);
                      toast.success("Lead removido");
                    } catch {
                      toast.error("Erro ao remover lead");
                    }
                  }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <span className="text-sm text-muted-foreground">{filtered.length} leads</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page <= 1} onClick={() => setPage(page - 1)}>Anterior</Button>
            <span className="text-sm text-muted-foreground px-3">{page} / {totalPages}</span>
            <Button variant="outline" size="sm" className="h-8 text-xs" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Próximo</Button>
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
        onDelete={userCanDelete ? async (id) => { setDetailLead(null); await deleteLead(id); toast.success('Lead removido'); } : undefined}
      />
    </div>
  );
}
