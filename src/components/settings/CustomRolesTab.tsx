import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ds';
import { Button } from '@/components/ui/ds';
import { Input } from '@/components/ui/ds';
import { Label } from '@/components/ui/ds';
import { Badge } from '@/components/ui/ds';
import { Textarea } from '@/components/ui/ds';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/ds';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/ds';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/ds';
import { Plus, Edit, Trash2, Shield, Loader2, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface CustomRole {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
}

interface CustomRolesTabProps {
  onRoleCreated?: (roleName: string) => void;
}

export default function CustomRolesTab({ onRoleCreated }: CustomRolesTabProps) {
  const { organizationId } = useOrganization();
  const { role, canAccessSettings } = useUserRole();
  const [roles, setRoles] = useState<CustomRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<CustomRole | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<CustomRole | null>(null);
  const [saving, setSaving] = useState(false);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');

  const fetchRoles = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('custom_roles')
        .select('*')
        .eq('organization_id', organizationId)
        .order('is_default', { ascending: false })
        .order('name');
      if (error) throw error;
      setRoles(data || []);
    } catch (err) {
      console.error('[CustomRolesTab] fetch error:', err);
      toast.error('Erro ao carregar roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [organizationId]);

  const openCreate = () => {
    setEditing(null);
    setFormName('');
    setFormDescription('');
    setFormOpen(true);
  };

  const openEdit = (r: CustomRole) => {
    setEditing(r);
    setFormName(r.name);
    setFormDescription(r.description || '');
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!organizationId) return;
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from('custom_roles')
          .update({ name: formName.trim(), description: formDescription.trim() || null, updated_at: new Date().toISOString() })
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Role atualizada!');
      } else {
        const { error } = await supabase
          .from('custom_roles')
          .insert({ organization_id: organizationId, name: formName.trim(), description: formDescription.trim() || null });
        if (error) {
          if (error.code === '23505') {
            toast.error('Já existe uma role com esse nome nesta organização');
            return;
          }
          throw error;
        }
        toast.success('Role criada! Configurando permissões...');
        setFormOpen(false);
        fetchRoles();
        if (onRoleCreated) onRoleCreated(formName.trim());
        return;
      }
      setFormOpen(false);
      fetchRoles();
    } catch (err: any) {
      console.error('[CustomRolesTab] save error:', err);
      toast.error(err.message || 'Erro ao salvar role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      // Delete associated permissions first
      const { error: permError } = await supabase
        .from('role_permissions')
        .delete()
        .eq('organization_id', organizationId!)
        .eq('role', deleteTarget.name);
      if (permError) console.warn('Error cleaning permissions:', permError);

      const { error } = await supabase
        .from('custom_roles')
        .delete()
        .eq('id', deleteTarget.id);
      if (error) throw error;
      toast.success('Role removida!');
      setDeleteTarget(null);
      fetchRoles();
    } catch (err: any) {
      console.error('[CustomRolesTab] delete error:', err);
      toast.error(err.message || 'Erro ao remover role');
    } finally {
      setSaving(false);
    }
  };

  if (!canAccessSettings) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground gap-3">
          <Lock className="h-12 w-12" />
          <p className="text-lg font-medium">Acesso Restrito</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg flex items-center gap-3">
            <Shield className="h-5 w-5" />
            Roles Customizáveis
          </CardTitle>
          <Button size="sm" onClick={openCreate}>
            <Plus className="h-4 w-4 mr-1" /> Nova Role
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Crie roles personalizadas para sua organização. Após criar, configure as permissões na aba <strong>Permissões</strong>.
          </p>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : roles.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma role customizada criada. As roles padrão (Administrador, Vendedor, Usuário) estão disponíveis na aba Permissões.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="hidden sm:table-cell">Criado em</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roles.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-3">
                          {r.name}
                          {r.is_default && <Badge variant="secondary" className="text-xs">Padrão</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{r.description || '—'}</TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8" title="Editar" onClick={() => openEdit(r)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {!r.is_default && (
                            <Button variant="ghost" size="sm" className="h-8 w-8 text-destructive" title="Remover" onClick={() => setDeleteTarget(r)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={(o) => { setFormOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar Role' : 'Nova Role'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Nome *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="Ex: Gerente, Supervisor" />
            </div>
            <div className="space-y-1">
              <Label>Descrição</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} placeholder="Descrição da role..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              {editing ? 'Salvar' : 'Criar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover role "{deleteTarget?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Todas as permissões associadas a esta role serão removidas. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={saving} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {saving ? 'Removendo...' : 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
