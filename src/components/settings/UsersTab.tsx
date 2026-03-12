import { useState } from "react";
import { useCRMStore, CRMUser } from "@/store/crmStore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Trash2 } from "lucide-react";
import { toast } from "sonner";

const roleLabels: Record<string, string> = { superadmin: 'Superadmin', admin: 'Administrador', vendedora: 'Vendedora', usuario: 'Usuário' };

export default function UsersTab() {
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
