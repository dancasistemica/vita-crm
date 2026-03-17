import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { getSuperadmins, addSuperadminByEmail, removeSuperadmin } from '@/services/superadminService';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';

interface SuperadminUser {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  created_at: string;
}

export function UsersManagementTab() {
  const [users, setUsers] = useState<SuperadminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setUsers(await getSuperadmins() as any);
    } catch (err) {
      console.error('[UsersManagementTab]', err);
      toast.error('Erro ao carregar superadmins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleAdd = async () => {
    if (!email) {
      toast.error('Informe o email');
      return;
    }
    setSubmitting(true);
    try {
      await addSuperadminByEmail(email);
      toast.success('Superadmin adicionado');
      setEmail('');
      setOpen(false);
      fetchUsers();
    } catch (err: any) {
      console.error('[UsersManagementTab] add:', err);
      toast.error(err.message || 'Erro ao adicionar superadmin');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemove = async (roleId: string) => {
    if (!confirm('Tem certeza que deseja remover este superadmin?')) return;
    try {
      await removeSuperadmin(roleId);
      toast.success('Superadmin removido');
      fetchUsers();
    } catch (err) {
      console.error('[UsersManagementTab] remove:', err);
      toast.error('Erro ao remover superadmin');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-muted-foreground">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <ShieldCheck className="h-4 w-4" />
          <span>{users.length} superadmin(s)</span>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Superadmin
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Adicionado em</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((u) => (
            <TableRow key={u.id}>
              <TableCell className="font-medium">{u.full_name || '—'}</TableCell>
              <TableCell>{u.email || '—'}</TableCell>
              <TableCell className="text-sm text-muted-foreground">
                {new Date(u.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" onClick={() => handleRemove(u.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Remover
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Adicionar Superadmin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Email do usuário existente</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
              <p className="text-xs text-muted-foreground">
                O usuário já deve estar cadastrado no sistema.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={handleAdd} disabled={submitting}>
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
