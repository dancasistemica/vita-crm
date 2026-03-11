import { useState } from "react";
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
import ExportModal from "@/components/export/ExportModal";

const interestColors: Record<string, string> = { frio: 'bg-cold/20 text-cold', morno: 'bg-warm/20 text-warm', quente: 'bg-hot/20 text-hot' };

export default function LeadsPage() {
  const navigate = useNavigate();
  const { leads, origins, pipelineStages, tags, interestLevels, addLead, deleteLead, updateLead } = useCRMStore();
  const [search, setSearch] = useState("");
  const [filterOrigin, setFilterOrigin] = useState("all");
  const [filterInterest, setFilterInterest] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [filterTag, setFilterTag] = useState("all");
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = leads.filter(l => {
    const matchSearch = !search || l.name.toLowerCase().includes(search.toLowerCase()) || l.email.toLowerCase().includes(search.toLowerCase()) || l.phone.includes(search);
    const matchOrigin = filterOrigin === "all" || l.origin === filterOrigin;
    const matchInterest = filterInterest === "all" || l.interestLevel === filterInterest;
    const matchStage = filterStage === "all" || l.pipelineStage === filterStage;
    const matchTag = filterTag === "all" || l.tags.includes(filterTag);
    return matchSearch && matchOrigin && matchInterest && matchStage && matchTag;
  });

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
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(l => l.id));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-display text-foreground">Leads</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => setImportOpen(true)}>
            <Upload className="h-4 w-4 mr-1" /> Importar CSV
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
          <Input placeholder="Buscar por nome, email ou telefone..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterOrigin} onValueChange={setFilterOrigin}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Origem" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas origens</SelectItem>
            {origins.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterInterest} onValueChange={setFilterInterest}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Nível" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos níveis</SelectItem>
            {interestLevels.map(l => <SelectItem key={l.id} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterStage} onValueChange={setFilterStage}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Etapa" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas etapas</SelectItem>
            {pipelineStages.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterTag} onValueChange={setFilterTag}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Tag" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas tags</SelectItem>
            {tags.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions bar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-sm font-medium text-foreground">{selectedIds.length} selecionado(s)</span>
          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => setBulkEditOpen(true)}>
            <Pencil className="h-3 w-3 mr-1" /> Editar em massa
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setSelectedIds([])}>
            Limpar seleção
          </Button>
        </div>
      )}

      <div className="space-y-2">
        {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">Nenhum lead encontrado.</p>}

        {/* Select all header */}
        {filtered.length > 0 && (
          <div className="flex items-center gap-2 px-4 py-1">
            <Checkbox
              checked={selectedIds.length === filtered.length && filtered.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-xs text-muted-foreground">Selecionar todos</span>
          </div>
        )}

        {filtered.map(lead => (
          <Card key={lead.id} className="hover:shadow-md transition-shadow">
            <CardContent className="py-3 px-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <Checkbox
                  checked={selectedIds.includes(lead.id)}
                  onCheckedChange={() => toggleSelect(lead.id)}
                  onClick={e => e.stopPropagation()}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-foreground">{lead.name}</span>
                    <Badge variant="secondary" className={interestColors[lead.interestLevel] || 'bg-muted text-muted-foreground'}>{getInterestLabel(lead.interestLevel)}</Badge>
                    <Badge variant="outline" className="text-xs">{getStageName(lead.pipelineStage)}</Badge>
                    {lead.tags.map(tag => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                    <span>{lead.origin}</span>
                    <span>{lead.city}</span>
                    {lead.responsible && <span>→ {lead.responsible}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {lead.phone && (
                  <a href={`https://wa.me/${lead.phone}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Phone className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.email && (
                  <a href={`mailto:${lead.email}`}>
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Mail className="h-4 w-4" /></Button>
                  </a>
                )}
                {lead.instagram && (
                  <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noreferrer">
                    <Button variant="ghost" size="icon" className="h-8 w-8"><Instagram className="h-4 w-4" /></Button>
                  </a>
                )}
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingLead(lead); setDialogOpen(true); }}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { deleteLead(lead.id); toast.success("Lead removido"); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <LeadImportModal open={importOpen} onOpenChange={setImportOpen} />
      <BulkEditModal
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
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
