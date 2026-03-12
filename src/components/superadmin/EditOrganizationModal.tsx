import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { updateOrganization } from '@/services/superadminService';
import { supabase } from '@/integrations/supabase/client';

interface EditOrganizationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string | null;
  onSuccess: () => void;
}

export function EditOrganizationModal({ open, onOpenChange, orgId, onSuccess }: EditOrganizationModalProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '',
    contact_email: '',
    phone: '',
    website: '',
    description: '',
  });

  useEffect(() => {
    if (!open || !orgId) return;
    setLoading(true);
    (async () => {
      try {
        const { data, error } = await supabase
          .from('organizations')
          .select('name, contact_email, phone, website, description')
          .eq('id', orgId)
          .single();
        if (error) throw error;
        setForm({
          name: data.name || '',
          contact_email: data.contact_email || '',
          phone: data.phone || '',
          website: data.website || '',
          description: data.description || '',
        });
      } catch (err) {
        console.error('[EditOrganizationModal] Load error:', err);
        toast.error('Erro ao carregar organização');
        onOpenChange(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, orgId]);

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }
    if (!orgId) return;
    setSaving(true);
    try {
      await updateOrganization(orgId, form);
      toast.success('Organização atualizada');
      onSuccess();
      onOpenChange(false);
    } catch (err) {
      console.error('[EditOrganizationModal] Save error:', err);
      toast.error('Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar Organização</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">Carregando...</div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-name">Nome *</Label>
              <Input id="org-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-email">Email de Contato</Label>
              <Input id="org-email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="org-phone">Telefone</Label>
                <Input id="org-phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-website">Website</Label>
                <Input id="org-website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-desc">Descrição</Label>
              <Textarea id="org-desc" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? 'Salvando...' : 'Salvar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
