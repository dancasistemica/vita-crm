import { useState } from "react";
import { useCRMStore, InterestLevel } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

export default function CRMFieldsTab() {
  const { origins, addOrigin, removeOrigin, updateOrigin, interestLevels, addInterestLevel, updateInterestLevel, removeInterestLevel } = useCRMStore();
  const [newOrigin, setNewOrigin] = useState('');
  const [editingOrigin, setEditingOrigin] = useState<{ old: string; new: string } | null>(null);
  const [newLevel, setNewLevel] = useState({ value: '', label: '' });
  const [editingLevel, setEditingLevel] = useState<InterestLevel | null>(null);

  return (
    <div className="grid gap-6 md:grid-cols-2">
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
