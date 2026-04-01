import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, Input, Label, Table } from "@/components/ui/ds";
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
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

  const [removeConfirm, setRemoveConfirm] = useState<{ isOpen: boolean; id: string; name: string }>({ isOpen: false, id: '', name: '' });

  const handleRemoveConfirm = async () => {
    try {
      await removeSuperadmin(removeConfirm.id);
      toast.success('Superadmin removido');
      setRemoveConfirm({ isOpen: false, id: '', name: '' });
      fetchUsers();
    } catch (err) {
      console.error('[UsersManagementTab] remove:', err);
      toast.error('Erro ao remover superadmin');
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12 text-neutral-500">Carregando...</div>;
  }

  return (
    <div className="space-y-4">
      <ConfirmDeleteDialog
        isOpen={removeConfirm.isOpen}
        itemName={removeConfirm.name}
        itemType="Superadmin"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setRemoveConfirm({ isOpen: false, id: '', name: '' })}
      />
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3 text-neutral-500 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <span>{users.length} superadmin(s)</span>
        </div>
        <Button onClick={() => setOpen(true)} size="sm">
          <Plus className="h-4 w-4 mr-2" /> Adicionar Superadmin
        </Button>
      </div>

      <div className="rounded-lg border border-neutral-200 overflow-hidden bg-white shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Nome</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Email</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-neutral-500 uppercase tracking-wider">Adicionado em</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-neutral-500 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-neutral-50 transition-colors">
                <td className="px-4 py-4 text-sm font-medium text-neutral-900">{u.full_name || '—'}</td>
                <td className="px-4 py-4 text-sm text-neutral-500">{u.email || '—'}</td>
                <td className="px-4 py-4 text-sm text-neutral-500">{new Date(u.created_at).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-4 text-right">
                  <Button 
                    variant="error" 
                    size="sm" 
                    onClick={() => setRemoveConfirm({ isOpen: true, id: u.id, name: u.full_name || u.email })}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Remover
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Superadmin</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Email do usuário existente</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@email.com"
              />
              <p className="text-xs text-neutral-500">
                O usuário já deve estar cadastrado no sistema para ser promovido a superadmin.
              </p>
            </div>
          </div>
          <div className="flex gap-3 pt-4 border-t">
            <Button variant="secondary" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleAdd} disabled={submitting}>
              {submitting ? 'Adicionando...' : 'Adicionar'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
