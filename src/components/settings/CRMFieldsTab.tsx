import { useState, useEffect, useCallback } from "react";
import { useCRMStore, InterestLevel, CRMTag } from "@/store/crmStore";
import { useDataAccess } from "@/hooks/useDataAccess";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, GripVertical, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface DBPipelineStage {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

type FieldKey = "origin" | "interest_level" | "funnel_stages";

interface CRMFieldDef {
  key: FieldKey;
  label: string;
  icon: string;
}

const DEFAULT_FIELDS: CRMFieldDef[] = [
  { key: "origin", label: "Origem do Lead", icon: "🌐" },
  { key: "interest_level", label: "Nível de Interesse", icon: "⭐" },
  { key: "funnel_stages", label: "Etapas do Funil", icon: "📈" },
];

export default function CRMFieldsTab() {
  const {
    origins, addOrigin, removeOrigin, updateOrigin,
    interestLevels, addInterestLevel, updateInterestLevel, removeInterestLevel,
    tags, addTag, updateTag, removeTag,
  } = useCRMStore();

  const dataAccess = useDataAccess();

  // ── Tab ordering state ──
  const [orderedFields, setOrderedFields] = useState<CRMFieldDef[]>(DEFAULT_FIELDS);
  const [activeTab, setActiveTab] = useState<FieldKey>("origin");
  const [draggedField, setDraggedField] = useState<FieldKey | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  // ── Zustand-based state (origins, levels, tags) ──
  const [newOrigin, setNewOrigin] = useState('');
  const [editingOrigin, setEditingOrigin] = useState<{ old: string; new: string } | null>(null);
  const [newLevel, setNewLevel] = useState({ value: '', label: '' });
  const [editingLevel, setEditingLevel] = useState<InterestLevel | null>(null);
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null);

  // ── DB-based pipeline stages state ──
  const [stages, setStages] = useState<DBPipelineStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesSaving, setStagesSaving] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [editingStage, setEditingStage] = useState<DBPipelineStage | null>(null);

  // ── Load tab order from DB ──
  useEffect(() => {
    if (!dataAccess) { setOrderLoading(false); return; }
    (async () => {
      try {
        const data = await dataAccess.getCRMFieldOrder();
        if (data.length > 0) {
          const orderMap = new Map(data.map(f => [f.field_name, f.sort_order]));
          const sorted = [...DEFAULT_FIELDS].sort(
            (a, b) => (orderMap.get(a.key) ?? 99) - (orderMap.get(b.key) ?? 99)
          );
          setOrderedFields(sorted);
        }
      } catch (err) {
        console.error('[CRMFieldsTab] Erro ao carregar ordem:', err);
      } finally {
        setOrderLoading(false);
      }
    })();
  }, [dataAccess]);

  // ── Handle tab drag-and-drop reorder ──
  const handleTabReorder = async (fromIdx: number, toIdx: number) => {
    const next = [...orderedFields];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    setOrderedFields(next);

    if (!dataAccess) return;
    try {
      await dataAccess.reorderCRMFields(next.map((f, i) => ({ name: f.key, order: i })));
      toast.success("Ordem salva");
    } catch {
      toast.error("Erro ao salvar ordem");
    }
  };

  // ── Pipeline stages CRUD ──
  const loadStages = useCallback(async () => {
    if (!dataAccess) return;
    try {
      setStagesLoading(true);
      const data = await dataAccess.getPipelineStages();
      setStages(data as DBPipelineStage[]);
    } catch (err) {
      console.error('[CRMFieldsTab] Erro ao carregar stages:', err);
    } finally {
      setStagesLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => { loadStages(); }, [loadStages]);

  const handleAddStage = async () => {
    if (!newStage.trim() || !dataAccess) return;
    try {
      setStagesSaving(true);
      const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.sort_order)) + 1 : 0;
      await dataAccess.createPipelineStage(newStage.trim(), nextOrder);
      setNewStage('');
      toast.success("Etapa adicionada");
      await loadStages();
    } catch {
      toast.error("Erro ao adicionar etapa");
    } finally {
      setStagesSaving(false);
    }
  };

  const handleUpdateStage = async () => {
    if (!editingStage || !dataAccess) return;
    try {
      setStagesSaving(true);
      await dataAccess.updatePipelineStage(editingStage.id, { name: editingStage.name });
      toast.success("Etapa atualizada");
      setEditingStage(null);
      await loadStages();
    } catch {
      toast.error("Erro ao atualizar etapa");
    } finally {
      setStagesSaving(false);
    }
  };

  const handleDeleteStage = async (id: string) => {
    if (!dataAccess) return;
    try {
      setStagesSaving(true);
      await dataAccess.deletePipelineStage(id);
      toast.success("Etapa removida");
      await loadStages();
    } catch {
      toast.error("Erro ao remover etapa");
    } finally {
      setStagesSaving(false);
    }
  };

  // ── Render section content ──
  const renderOriginSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">🌐 Origem do Lead</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {origins.map(o => (
          <div key={o} className="flex items-center justify-between p-2 rounded bg-muted/50">
            {editingOrigin?.old === o ? (
              <Input value={editingOrigin.new} onChange={e => setEditingOrigin({ old: o, new: e.target.value })} className="h-8 flex-1 mr-2" />
            ) : (
              <span className="text-sm text-foreground">{o}</span>
            )}
            <div className="flex gap-1">
              {editingOrigin?.old === o ? (
                <Button size="sm" variant="ghost" onClick={() => { if (editingOrigin.new.trim()) { updateOrigin(o, editingOrigin.new.trim()); toast.success("Origem atualizada"); } setEditingOrigin(null); }}>✓</Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingOrigin({ old: o, new: o })}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { removeOrigin(o); toast.success("Origem removida"); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Nova origem..." value={newOrigin} onChange={e => setNewOrigin(e.target.value)} className="h-8" />
          <Button size="sm" onClick={() => { if (newOrigin.trim()) { addOrigin(newOrigin.trim()); setNewOrigin(''); toast.success("Origem adicionada"); } }} disabled={!newOrigin.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInterestLevelSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">⭐ Nível de Interesse</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {interestLevels.map(l => (
          <div key={l.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
            {editingLevel?.id === l.id ? (
              <div className="flex gap-2 flex-1 mr-2">
                <Input value={editingLevel.value} onChange={e => setEditingLevel({ ...editingLevel, value: e.target.value })} className="h-8" placeholder="Valor" />
                <Input value={editingLevel.label} onChange={e => setEditingLevel({ ...editingLevel, label: e.target.value })} className="h-8" placeholder="Label" />
              </div>
            ) : (
              <span className="text-sm text-foreground">{l.label}</span>
            )}
            <div className="flex gap-1">
              {editingLevel?.id === l.id ? (
                <Button size="sm" variant="ghost" onClick={() => { updateInterestLevel(l.id, editingLevel); toast.success("Nível atualizado"); setEditingLevel(null); }}>✓</Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingLevel(l)}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { removeInterestLevel(l.id); toast.success("Nível removido"); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Valor (ex: frio)" value={newLevel.value} onChange={e => setNewLevel(p => ({ ...p, value: e.target.value }))} className="h-8" />
          <Input placeholder="Label (ex: Frio)" value={newLevel.label} onChange={e => setNewLevel(p => ({ ...p, label: e.target.value }))} className="h-8" />
          <Button size="sm" onClick={() => { if (newLevel.value.trim() && newLevel.label.trim()) { addInterestLevel({ id: crypto.randomUUID(), ...newLevel }); setNewLevel({ value: '', label: '' }); toast.success("Nível adicionado"); } }} disabled={!newLevel.value.trim() || !newLevel.label.trim()}><Plus className="h-4 w-4" /></Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFunnelStagesSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">📈 Etapas do Funil de Vendas</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {stagesLoading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">Carregando etapas...</span>
          </div>
        ) : (
          <>
            {stages.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                {editingStage?.id === s.id ? (
                  <Input value={editingStage.name} onChange={e => setEditingStage({ ...editingStage, name: e.target.value })} className="h-8 flex-1" />
                ) : (
                  <span className="flex-1 text-foreground">{s.name}</span>
                )}
                <div className="flex gap-1">
                  {editingStage?.id === s.id ? (
                    <Button size="sm" variant="ghost" onClick={handleUpdateStage} disabled={stagesSaving}>✓</Button>
                  ) : (
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStage(s)}><Edit className="h-3 w-3" /></Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteStage(s.id)} disabled={stagesSaving}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            ))}
            {stages.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhuma etapa cadastrada.</p>
            )}
            <div className="flex gap-2 mt-3">
              <Input placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStage()} />
              <Button onClick={handleAddStage} disabled={!newStage.trim() || stagesSaving}>
                {stagesSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
                Adicionar
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );

  const SECTION_RENDERERS: Record<FieldKey, () => React.ReactNode> = {
    origin: renderOriginSection,
    interest_level: renderInterestLevelSection,
    funnel_stages: renderFunnelStagesSection,
  };

  if (orderLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        <span className="ml-2 text-sm text-muted-foreground">Carregando campos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Draggable Tabs */}
      <div className="border-b border-border">
        <div className="flex gap-1 overflow-x-auto pb-0">
          {orderedFields.map((field, idx) => (
            <div
              key={field.key}
              draggable
              onDragStart={() => setDraggedField(field.key)}
              onDragOver={e => e.preventDefault()}
              onDrop={() => {
                if (draggedField && draggedField !== field.key) {
                  const fromIdx = orderedFields.findIndex(f => f.key === draggedField);
                  handleTabReorder(fromIdx, idx);
                }
                setDraggedField(null);
              }}
              onDragEnd={() => setDraggedField(null)}
              onClick={() => setActiveTab(field.key)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 cursor-grab select-none transition-all whitespace-nowrap text-sm ${
                activeTab === field.key
                  ? 'border-primary text-primary font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              } ${draggedField === field.key ? 'opacity-40' : ''}`}
            >
              <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50" />
              <span>{field.icon}</span>
              <span>{field.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Tab Content */}
      <div>{SECTION_RENDERERS[activeTab]()}</div>

      {/* Tags section (always visible below) */}
      <Card>
        <CardHeader><CardTitle className="text-lg">🏷️ Tags Personalizadas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-wrap gap-2 mb-4">
            {tags.map(t => (
              <div key={t.id} className="flex items-center gap-1 bg-muted/50 rounded-full px-3 py-1">
                {editingTag?.id === t.id ? (
                  <Input value={editingTag.name} onChange={e => setEditingTag({ ...editingTag, name: e.target.value })} className="h-6 text-xs w-32" />
                ) : (
                  <Badge variant="secondary">{t.name}</Badge>
                )}
                {editingTag?.id === t.id ? (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => { updateTag(t.id, editingTag); toast.success("Tag atualizada"); setEditingTag(null); }}>✓</Button>
                ) : (
                  <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => setEditingTag(t)}><Edit className="h-3 w-3" /></Button>
                )}
                <Button size="sm" variant="ghost" className="h-6 w-6 p-0 text-destructive" onClick={() => { removeTag(t.id); toast.success("Tag removida"); }}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input placeholder="Nova tag..." value={newTag} onChange={e => setNewTag(e.target.value)} />
            <Button onClick={() => { if (newTag.trim()) { addTag({ id: crypto.randomUUID(), name: newTag.trim(), color: 'hsl(var(--primary))' }); setNewTag(''); toast.success("Tag adicionada"); } }} disabled={!newTag.trim()}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
