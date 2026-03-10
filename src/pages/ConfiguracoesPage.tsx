import { useState } from "react";
import { useCRMStore, CRMUser, CRMTag, InterestLevel } from "@/store/crmStore";
import { PipelineStage } from "@/types/crm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2, GripVertical } from "lucide-react";
import { toast } from "sonner";

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-display text-foreground">Configurações</h1>
      <Tabs defaultValue="usuarios" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="campos">Campos do CRM</TabsTrigger>
          <TabsTrigger value="tags">Tags</TabsTrigger>
          <TabsTrigger value="funil">Funil de Vendas</TabsTrigger>
        </TabsList>
        <TabsContent value="usuarios"><UsuariosTab /></TabsContent>
        <TabsContent value="campos"><CamposTab /></TabsContent>
        <TabsContent value="tags"><TagsTab /></TabsContent>
        <TabsContent value="funil"><FunilTab /></TabsContent>
      </Tabs>
    </div>
  );
}

/* ===== USUARIOS TAB ===== */
function UsuariosTab() {
  const { users, addUser, updateUser } = useCRMStore();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<CRMUser | null>(null);

  const handleSave = (data: Partial<CRMUser>) => {
    if (editing) {
      updateUser(editing.id, data);
      toast.success("Usuário atualizado!");
    } else {
      addUser({ id: crypto.randomUUID(), name: data.name || '', email: data.email || '', phone: data.phone || '', role: data.role || 'usuario', active: true });
      toast.success("Usuário cadastrado!");
    }
    setDialogOpen(false);
    setEditing(null);
  };

  const roleLabels = { admin: 'Administrador', vendedora: 'Vendedora', usuario: 'Usuário' };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Usuários do Sistema</CardTitle>
        <Button size="sm" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4 mr-1" />Novo Usuário</Button>
      </CardHeader>
      <CardContent className="space-y-2">
        {users.map(u => (
          <div key={u.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div>
              <p className="font-medium text-foreground">{u.name}</p>
              <p className="text-sm text-muted-foreground">{u.email} · {roleLabels[u.role]}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={u.active ? "default" : "secondary"}>{u.active ? 'Ativo' : 'Inativo'}</Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditing(u); setDialogOpen(true); }}><Edit className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { updateUser(u.id, { active: !u.active }); toast.success(u.active ? "Usuário desativado" : "Usuário ativado"); }}>
                {u.active ? <Trash2 className="h-4 w-4 text-destructive" /> : <Plus className="h-4 w-4 text-primary" />}
              </Button>
            </div>
          </div>
        ))}
        <Dialog open={dialogOpen} onOpenChange={o => { setDialogOpen(o); if (!o) setEditing(null); }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle></DialogHeader>
            <UserForm user={editing} onSave={handleSave} />
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

function UserForm({ user, onSave }: { user: CRMUser | null; onSave: (data: Partial<CRMUser>) => void }) {
  const [form, setForm] = useState<Partial<CRMUser>>(user || { role: 'usuario', active: true });
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="space-y-3">
      <div><Label>Nome</Label><Input value={form.name || ''} onChange={e => set('name', e.target.value)} /></div>
      <div><Label>Email</Label><Input type="email" value={form.email || ''} onChange={e => set('email', e.target.value)} /></div>
      <div><Label>Telefone</Label><Input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
      <div>
        <Label>Função</Label>
        <Select value={form.role || 'usuario'} onValueChange={v => set('role', v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="vendedora">Vendedora</SelectItem>
            <SelectItem value="usuario">Usuário</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button className="w-full" onClick={() => onSave(form)} disabled={!form.name?.trim()}>Salvar</Button>
    </div>
  );
}

/* ===== CAMPOS TAB ===== */
function CamposTab() {
  const { origins, addOrigin, removeOrigin, updateOrigin, interestLevels, addInterestLevel, updateInterestLevel, removeInterestLevel } = useCRMStore();
  const [newOrigin, setNewOrigin] = useState('');
  const [editingOrigin, setEditingOrigin] = useState<{ old: string; new: string } | null>(null);
  const [newLevel, setNewLevel] = useState({ value: '', label: '' });
  const [editingLevel, setEditingLevel] = useState<InterestLevel | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {/* Origens */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Origem do Lead</CardTitle></CardHeader>
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

      {/* Níveis de Interesse */}
      <Card>
        <CardHeader><CardTitle className="text-lg">Nível de Interesse</CardTitle></CardHeader>
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
    </div>
  );
}

/* ===== TAGS TAB ===== */
function TagsTab() {
  const { tags, addTag, updateTag, removeTag } = useCRMStore();
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState<CRMTag | null>(null);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Tags Personalizadas</CardTitle></CardHeader>
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
  );
}

/* ===== FUNIL TAB ===== */
function FunilTab() {
  const { pipelineStages, addPipelineStage, updatePipelineStage, removePipelineStage } = useCRMStore();
  const [newStage, setNewStage] = useState('');
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

  const sorted = [...pipelineStages].sort((a, b) => a.order - b.order);

  return (
    <Card>
      <CardHeader><CardTitle className="text-lg">Etapas do Funil de Vendas</CardTitle></CardHeader>
      <CardContent className="space-y-2">
        {sorted.map((s, i) => (
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
                <Button size="sm" variant="ghost" onClick={() => { updatePipelineStage(s.id, editingStage); toast.success("Etapa atualizada"); setEditingStage(null); }}>✓</Button>
              ) : (
                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingStage(s)}><Edit className="h-3 w-3" /></Button>
              )}
              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => { removePipelineStage(s.id); toast.success("Etapa removida"); }}><Trash2 className="h-3 w-3" /></Button>
            </div>
          </div>
        ))}
        <div className="flex gap-2 mt-3">
          <Input placeholder="Nova etapa..." value={newStage} onChange={e => setNewStage(e.target.value)} />
          <Button onClick={() => { if (newStage.trim()) { addPipelineStage({ id: crypto.randomUUID(), name: newStage.trim(), order: pipelineStages.length + 1 }); setNewStage(''); toast.success("Etapa adicionada"); } }} disabled={!newStage.trim()}><Plus className="h-4 w-4 mr-1" />Adicionar</Button>
        </div>
      </CardContent>
    </Card>
  );
}
