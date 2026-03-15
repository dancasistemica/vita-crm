import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useCRMStore, CRMTag } from "@/store/crmStore";
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

interface DBLeadOrigin {
  id: string;
  name: string;
  sort_order: number;
  active: boolean;
}

interface DBInterestLevel {
  id: string;
  value: string;
  label: string;
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
  const { tags, addTag, updateTag, removeTag } = useCRMStore();
  const dataAccess = useDataAccess();

  // ── Tab ordering state ──
  const [orderedFields, setOrderedFields] = useState<CRMFieldDef[]>(DEFAULT_FIELDS);
  const [activeTab, setActiveTab] = useState<FieldKey>("origin");
  const [draggedField, setDraggedField] = useState<FieldKey | null>(null);
  const [orderLoading, setOrderLoading] = useState(true);

  // ── Tags (Zustand) ──
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null);

  // ── DB-based origins ──
  const [origins, setOrigins] = useState<DBLeadOrigin[]>([]);
  const [originsLoading, setOriginsLoading] = useState(true);
  const [originsSaving, setOriginsSaving] = useState(false);
  const [newOrigin, setNewOrigin] = useState('');
  const [editingOrigin, setEditingOrigin] = useState<DBLeadOrigin | null>(null);
  const [draggedOriginId, setDraggedOriginId] = useState<string | null>(null);

  // ── DB-based interest levels ──
  const [levels, setLevels] = useState<DBInterestLevel[]>([]);
  const [levelsLoading, setLevelsLoading] = useState(true);
  const [levelsSaving, setLevelsSaving] = useState(false);
  const [newLevel, setNewLevel] = useState({ value: '', label: '' });
  const [editingLevel, setEditingLevel] = useState<DBInterestLevel | null>(null);
  const [draggedLevelId, setDraggedLevelId] = useState<string | null>(null);

  // ── DB-based pipeline stages ──
  const [stages, setStages] = useState<DBPipelineStage[]>([]);
  const [stagesLoading, setStagesLoading] = useState(true);
  const [stagesSaving, setStagesSaving] = useState(false);
  const [newStage, setNewStage] = useState('');
  const [editingStage, setEditingStage] = useState<DBPipelineStage | null>(null);
  const [draggedStageId, setDraggedStageId] = useState<string | null>(null);

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

  // ══════════════════════════════════════════════════════════
  // ORIGINS CRUD
  // ══════════════════════════════════════════════════════════
  const loadOrigins = useCallback(async () => {
    if (!dataAccess) return;
    try {
      setOriginsLoading(true);
      const data = await dataAccess.getLeadOrigins();
      setOrigins(data as DBLeadOrigin[]);
    } catch (err) {
      console.error('[CRMFieldsTab] Erro ao carregar origens:', err);
    } finally {
      setOriginsLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => { loadOrigins(); }, [loadOrigins]);

  const handleAddOrigin = async () => {
    if (!newOrigin.trim()) return;
    if (!dataAccess) { toast.error("Serviço de dados não inicializado. Faça login novamente."); return; }
    try {
      setOriginsSaving(true);
      const nextOrder = origins.length > 0 ? Math.max(...origins.map(o => o.sort_order)) + 1 : 0;
      await dataAccess.createLeadOrigin(newOrigin.trim(), nextOrder);
      setNewOrigin('');
      toast.success("Origem adicionada");
      await loadOrigins();
    } catch (err) {
      console.error('[CRMFieldsTab] handleAddOrigin error:', err);
      toast.error("Erro ao adicionar origem");
    } finally {
      setOriginsSaving(false);
    }
  };

  const handleUpdateOrigin = async () => {
    if (!editingOrigin || !dataAccess) return;
    try {
      setOriginsSaving(true);
      await dataAccess.updateLeadOrigin(editingOrigin.id, { name: editingOrigin.name });
      toast.success("Origem atualizada");
      setEditingOrigin(null);
      await loadOrigins();
    } catch {
      toast.error("Erro ao atualizar origem");
    } finally {
      setOriginsSaving(false);
    }
  };

  const handleDeleteOrigin = async (id: string) => {
    if (!dataAccess) return;
    try {
      setOriginsSaving(true);
      await dataAccess.deleteLeadOrigin(id);
      toast.success("Origem removida");
      await loadOrigins();
    } catch {
      toast.error("Erro ao remover origem");
    } finally {
      setOriginsSaving(false);
    }
  };

  const handleReorderOrigins = async (fromIdx: number, toIdx: number) => {
    if (!dataAccess) return;
    const next = [...origins];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((o, i) => ({ ...o, sort_order: i }));
    setOrigins(reordered);
    setDraggedOriginId(null);
    try {
      setOriginsSaving(true);
      await dataAccess.reorderLeadOrigins(reordered.map(o => ({ id: o.id, sort_order: o.sort_order })));
      toast.success("Ordem salva");
    } catch {
      toast.error("Erro ao reordenar");
      await loadOrigins();
    } finally {
      setOriginsSaving(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // INTEREST LEVELS CRUD
  // ══════════════════════════════════════════════════════════
  const loadLevels = useCallback(async () => {
    if (!dataAccess) return;
    try {
      setLevelsLoading(true);
      const data = await dataAccess.getInterestLevels();
      setLevels(data as DBInterestLevel[]);
    } catch (err) {
      console.error('[CRMFieldsTab] Erro ao carregar níveis:', err);
    } finally {
      setLevelsLoading(false);
    }
  }, [dataAccess]);

  useEffect(() => { loadLevels(); }, [loadLevels]);

  const handleAddLevel = async () => {
    if (!newLevel.value.trim() || !newLevel.label.trim()) return;
    if (!dataAccess) { toast.error("Serviço de dados não inicializado. Faça login novamente."); return; }
    try {
      setLevelsSaving(true);
      const nextOrder = levels.length > 0 ? Math.max(...levels.map(l => l.sort_order)) + 1 : 0;
      await dataAccess.createInterestLevel(newLevel.value.trim(), newLevel.label.trim(), nextOrder);
      setNewLevel({ value: '', label: '' });
      toast.success("Nível adicionado");
      await loadLevels();
    } catch (err) {
      console.error('[CRMFieldsTab] handleAddLevel error:', err);
      toast.error("Erro ao adicionar nível");
    } finally {
      setLevelsSaving(false);
    }
  };

  const handleUpdateLevel = async () => {
    if (!editingLevel || !dataAccess) return;
    try {
      setLevelsSaving(true);
      await dataAccess.updateInterestLevel(editingLevel.id, { value: editingLevel.value, label: editingLevel.label });
      toast.success("Nível atualizado");
      setEditingLevel(null);
      await loadLevels();
    } catch {
      toast.error("Erro ao atualizar nível");
    } finally {
      setLevelsSaving(false);
    }
  };

  const handleDeleteLevel = async (id: string) => {
    if (!dataAccess) return;
    try {
      setLevelsSaving(true);
      await dataAccess.deleteInterestLevel(id);
      toast.success("Nível removido");
      await loadLevels();
    } catch {
      toast.error("Erro ao remover nível");
    } finally {
      setLevelsSaving(false);
    }
  };

  const handleReorderLevels = async (fromIdx: number, toIdx: number) => {
    if (!dataAccess) return;
    const next = [...levels];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((l, i) => ({ ...l, sort_order: i }));
    setLevels(reordered);
    setDraggedLevelId(null);
    try {
      setLevelsSaving(true);
      await dataAccess.reorderInterestLevels(reordered.map(l => ({ id: l.id, sort_order: l.sort_order })));
      toast.success("Ordem salva");
    } catch {
      toast.error("Erro ao reordenar");
      await loadLevels();
    } finally {
      setLevelsSaving(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // PIPELINE STAGES CRUD
  // ══════════════════════════════════════════════════════════
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

  // ── Realtime subscriptions ──
  useEffect(() => {
    if (!dataAccess) return;
    const orgId = dataAccess.orgId;

    const originsChannel = supabase
      .channel(`lead_origins:org:${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lead_origins', filter: `organization_id=eq.${orgId}` }, () => {
        console.log('[CRMFieldsTab] Realtime: lead_origins changed');
        loadOrigins();
      })
      .subscribe();

    const levelsChannel = supabase
      .channel(`interest_levels:org:${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interest_levels', filter: `organization_id=eq.${orgId}` }, () => {
        console.log('[CRMFieldsTab] Realtime: interest_levels changed');
        loadLevels();
      })
      .subscribe();

    const stagesChannel = supabase
      .channel(`pipeline_stages:org:${orgId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pipeline_stages', filter: `organization_id=eq.${orgId}` }, () => {
        console.log('[CRMFieldsTab] Realtime: pipeline_stages changed');
        loadStages();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(originsChannel);
      supabase.removeChannel(levelsChannel);
      supabase.removeChannel(stagesChannel);
    };
  }, [dataAccess, loadOrigins, loadLevels, loadStages]);

    if (!newStage.trim()) return;
    if (!dataAccess) { toast.error("Serviço de dados não inicializado. Faça login novamente."); return; }
    try {
      setStagesSaving(true);
      const nextOrder = stages.length > 0 ? Math.max(...stages.map(s => s.sort_order)) + 1 : 0;
      await dataAccess.createPipelineStage(newStage.trim(), nextOrder);
      setNewStage('');
      toast.success("Etapa adicionada");
      await loadStages();
    } catch (err) {
      console.error('[CRMFieldsTab] handleAddStage error:', err);
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

  const handleReorderStages = async (fromIdx: number, toIdx: number) => {
    if (!dataAccess) return;
    const next = [...stages];
    const [moved] = next.splice(fromIdx, 1);
    next.splice(toIdx, 0, moved);
    const reordered = next.map((s, i) => ({ ...s, sort_order: i }));
    setStages(reordered);
    setDraggedStageId(null);
    try {
      setStagesSaving(true);
      await dataAccess.reorderPipelineStages(reordered.map(s => ({ id: s.id, sort_order: s.sort_order })));
      toast.success("Ordem salva");
    } catch {
      toast.error("Erro ao reordenar");
      await loadStages();
    } finally {
      setStagesSaving(false);
    }
  };

  // ══════════════════════════════════════════════════════════
  // RENDER HELPERS
  // ══════════════════════════════════════════════════════════

  const renderDraggableList = <T extends { id: string; sort_order: number }>(
    items: T[],
    loading: boolean,
    saving: boolean,
    draggedId: string | null,
    setDraggedId: (id: string | null) => void,
    onReorder: (from: number, to: number) => void,
    renderItem: (item: T, index: number) => React.ReactNode,
    emptyMessage: string,
    hint: string
  ) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
        </div>
      );
    }

    return (
      <>
        {items.map((item, i) => (
          <div
            key={item.id}
            draggable
            onDragStart={() => setDraggedId(item.id)}
            onDragOver={e => e.preventDefault()}
            onDrop={() => {
              const fromIdx = items.findIndex(it => it.id === draggedId);
              if (fromIdx !== -1 && fromIdx !== i) onReorder(fromIdx, i);
              setDraggedId(null);
            }}
            onDragEnd={() => setDraggedId(null)}
            className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all cursor-grab active:cursor-grabbing ${
              draggedId === item.id
                ? 'opacity-40 border-muted bg-muted/30'
                : 'border-transparent bg-muted/50 hover:border-primary/20'
            }`}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
            {renderItem(item, i)}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-4">{emptyMessage}</p>
        )}
        {saving && <p className="text-xs text-muted-foreground mt-2">💾 Salvando...</p>}
        <p className="text-xs text-muted-foreground mt-2">💡 {hint}</p>
      </>
    );
  };

  const renderOriginSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">🌐 Origem do Lead</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {renderDraggableList(
          origins,
          originsLoading,
          originsSaving,
          draggedOriginId,
          setDraggedOriginId,
          handleReorderOrigins,
          (o) => (
            <>
              {editingOrigin?.id === o.id ? (
                <Input value={editingOrigin.name} onChange={e => setEditingOrigin({ ...editingOrigin, name: e.target.value })} className="h-8 flex-1" />
              ) : (
                <span className="flex-1 text-foreground">{o.name}</span>
              )}
              <div className="flex gap-1">
                {editingOrigin?.id === o.id ? (
                  <Button size="sm" variant="ghost" onClick={handleUpdateOrigin} disabled={originsSaving}>✓</Button>
                ) : (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingOrigin(o)}><Edit className="h-3 w-3" /></Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteOrigin(o.id)} disabled={originsSaving}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </>
          ),
          "Nenhuma origem cadastrada.",
          "Arraste para reordenar. A ordem é salva automaticamente."
        )}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Nova origem..." value={newOrigin} onChange={e => setNewOrigin(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddOrigin()} />
          <Button onClick={handleAddOrigin} disabled={!newOrigin.trim() || originsSaving}>
            {originsSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Adicionar
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderInterestLevelSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">⭐ Nível de Interesse</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {renderDraggableList(
          levels,
          levelsLoading,
          levelsSaving,
          draggedLevelId,
          setDraggedLevelId,
          handleReorderLevels,
          (l) => (
            <>
              {editingLevel?.id === l.id ? (
                <div className="flex gap-2 flex-1 mr-2">
                  <Input value={editingLevel.value} onChange={e => setEditingLevel({ ...editingLevel, value: e.target.value })} className="h-8" placeholder="Valor" />
                  <Input value={editingLevel.label} onChange={e => setEditingLevel({ ...editingLevel, label: e.target.value })} className="h-8" placeholder="Label" />
                </div>
              ) : (
                <span className="flex-1 text-foreground">{l.label}</span>
              )}
              <div className="flex gap-1">
                {editingLevel?.id === l.id ? (
                  <Button size="sm" variant="ghost" onClick={handleUpdateLevel} disabled={levelsSaving}>✓</Button>
                ) : (
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingLevel(l)}><Edit className="h-3 w-3" /></Button>
                )}
                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteLevel(l.id)} disabled={levelsSaving}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </>
          ),
          "Nenhum nível cadastrado.",
          "Arraste para reordenar. A ordem é salva automaticamente."
        )}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Valor (ex: frio)" value={newLevel.value} onChange={e => setNewLevel(p => ({ ...p, value: e.target.value }))} className="h-8" />
          <Input placeholder="Label (ex: Frio)" value={newLevel.label} onChange={e => setNewLevel(p => ({ ...p, label: e.target.value }))} className="h-8" />
          <Button size="sm" onClick={handleAddLevel} disabled={!newLevel.value.trim() || !newLevel.label.trim() || levelsSaving}>
            {levelsSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const renderFunnelStagesSection = () => (
    <Card>
      <CardHeader><CardTitle className="text-lg">📈 Etapas do Funil de Vendas</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {renderDraggableList(
          stages,
          stagesLoading,
          stagesSaving,
          draggedStageId,
          setDraggedStageId,
          handleReorderStages,
          (s) => (
            <>
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
            </>
          ),
          "Nenhuma etapa cadastrada.",
          "Arraste as etapas para reordenar. A ordem é salva automaticamente."
        )}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddStage()} />
          <Button onClick={handleAddStage} disabled={!newStage.trim() || stagesSaving}>
            {stagesSaving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
            Adicionar
          </Button>
        </div>
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
