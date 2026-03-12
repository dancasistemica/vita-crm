import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCRMStore } from "@/store/crmStore";
import { Lead } from "@/types/crm";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Search, Phone, Mail, Instagram, Trash2, Edit, Upload, FileDown, Pencil } from "lucide-react";
import { toast } from "sonner";
import LeadForm from "@/components/LeadForm";
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
  const { leads, origins, pipelineStages, tags, interestLevels, addLead, deleteLead, updateLead } = useCRMStore();
  const { canCreate: userCanCreate, canEdit: userCanEdit, canDelete: userCanDelete } = useUserRole();
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterInterest, setFilterInterest] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { page, setPage, perPage, setPerPage, resetPage } = useTablePagination();

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
      const matchOrigin = filterOrigin === "all" || l.origin === filterOrigin;
      const matchInterest = filterInterest === "all" || l.interestLevel === filterInterest;
      const matchStage = filterStage === "all" || l.pipelineStage === filterStage;
      const matchTag = filterTag === "all" || l.tags.includes(filterTag);
      return matchSearch && matchOrigin && matchInterest && matchStage && matchTag;
    });
  }, [leads, search, filterOrigin, filterInterest, filterStage, filterTag]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  // Reset page when filters change
  const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
    setter(value);
    resetPage();
  };

  const handleSave = (data: Partial<Lead>) => {
    if (editingLead) {
      updateLead(editingLead.id, data);
      toast.success("Lead atualizado!");
    } else {
      const newLead: Lead = {
        id: crypto.randomUUID(),
        name: data.name || '',
        phone: data.phone || '',
        email: data.email || '',
        instagram: data.instagram || '',
        city: data.city || '',
        rg: data.rg || '',
        cpf: data.cpf || '',
        entryDate: data.entryDate || new Date().toISOString().split('T')[0],
        origin: data.origin || origins[0],
        interestLevel: data.interestLevel || 'frio',
        mainInterest: data.mainInterest || '',
        tags: data.tags || [],
        painPoint: data.painPoint || '',
        bodyTensionArea: data.bodyTensionArea || '',
        emotionalGoal: data.emotionalGoal || '',
        pipelineStage: data.pipelineStage || '1',
        responsible: data.responsible || '',
        notes: data.notes || '',
      };
      addLead(newLead);
      toast.success("Lead adicionado!");
    }
    setDialogOpen(false);
    setEditingLead(null);
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

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-display text-foreground">Leads</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Gerencie seus contatos e oportunidades</p>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => navigate('/import-wizard')}>
            <Upload className="h-4 w-4 mr-1" /> Importar Leads
          </Button>
          <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}>
            <FileDown className="h-4 w-4 mr-1" /> Exportar
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingLead(null); }}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => setEditingLead(null)}><Plus className="h-4 w-4 mr-1" /> Novo Lead</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-display">{editingLead ? 'Editar Lead' : 'Novo Lead'}</DialogTitle>
              </DialogHeader>
              <LeadForm lead={editingLead} onSave={handleSave} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => { setSearch(e.target.value); resetPage(); }} className="pl-9" />
        </div>
        <Select value={filterOrigin} onValueChange={handleFilterChange(setFilterOrigin)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterInterest} onValueChange={handleFilterChange(setFilterInterest)}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos níveis</SelectItem>
            {interestLevels.map(l => <SelectItem key={l.id} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={handleFilterChange(setFilterStage)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {pipelineStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTag} onValueChange={handleFilterChange(setFilterTag)}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas tags</SelectItem>
            {tags.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Record counter */}
      <RecordCounter
        totalCount={leads.length}
        filteredCount={filtered.length}
        perPage={perPage}
        onPerPageChange={setPerPage}
      />

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionado(s)</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkEditOpen(true)}>
            <Pencil className="h-3 w-3 mr-1" /> Editar em massa
          </Button>
          <Button variant="destructive" size="sm" className="h-7 text-xs" onClick={() => setBulkDeleteOpen(true)}>
            <Trash2 className="h-3 w-3 mr-1" /> Deletar selecionados
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {paginated.length === 0 && <p className="text-muted-foreground text-center py-12 text-sm">Nenhum lead encontrado.</p>}

        {/* Select all header */}
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
            {/* Interest level bar */}
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
                    <span className="font-semibold text-foreground text-sm">{lead.name}</span>
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
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => { setEditingLead(lead); setDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive/60 hover:text-destructive hover:bg-destructive/10" onClick={() => { deleteLead(lead.id); toast.success("Lead removido"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination */}
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

      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selectedIds}
        type="leads"
        onSuccess={() => setSelectedIds([])}
      />
      <BulkDeleteModal
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        selectedIds={selectedIds}
        type="leads"
        onSuccess={() => setSelectedIds([])}
      />
      <ExportModal
        open={exportOpen}
        onOpenChange={setExportOpen}
        type="leads"
        allData={leads}
        filteredData={filtered}
      />
    </div>
  );
}
