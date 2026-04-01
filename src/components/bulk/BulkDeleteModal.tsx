import { Alert, Button, Checkbox, Dialog } from "@/components/ui/ds";
import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

type DeletableType = 'leads' | 'clients';

interface ItemSummary {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIds: string[];
  type: DeletableType;
  onSuccess: () => void;
  items?: ItemSummary[];
  onDelete?: (id: string) => Promise<void>;
}

export default function BulkDeleteModal({ open, onOpenChange, selectedIds, type, onSuccess, items = [], onDelete }: Props) {
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedItems = items.filter(l => selectedIds.includes(l.id));
  const label = type === 'leads' ? 'lead' : 'cliente';
  const labelPlural = type === 'leads' ? 'leads' : 'clientes';

  const handleDelete = async () => {
    if (!confirmed || !onDelete) return;
    setDeleting(true);
    try {
      console.log(`[BulkDeleteModal] Deletando ${selectedIds.length} ${labelPlural}`);
      for (const id of selectedIds) {
        await onDelete(id);
      }
      toast.success(`${selectedIds.length} ${selectedIds.length > 1 ? labelPlural : label} deletado(s) com sucesso`);
      setConfirmed(false);
      onOpenChange(false);
      onSuccess();
    } catch (error) {
      console.error('[BulkDeleteModal] Erro ao deletar:', error);
      toast.error(`Erro ao deletar ${labelPlural}`);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!deleting) { onOpenChange(o); setConfirmed(false); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Deletar {type === 'leads' ? 'Leads' : 'Clientes'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-neutral-500">
            Você está prestes a deletar <strong>{selectedIds.length}</strong> {selectedIds.length > 1 ? labelPlural : label} permanentemente.
          </p>

          <div className="rounded-lg border border-border bg-muted/30 p-3 max-h-40 overflow-y-auto space-y-1">
            <p className="text-xs font-medium text-neutral-500 mb-2">{type === 'leads' ? 'Leads' : 'Clientes'} a deletar:</p>
            {selectedItems.slice(0, 5).map(item => (
              <p key={item.id} className="text-sm text-foreground">• {item.name} ({item.email || item.phone})</p>
            ))}
            {selectedIds.length > 5 && (
              <p className="text-xs text-neutral-500 mt-1">... e mais {selectedIds.length - 5}</p>
            )}
          </div>

          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3">
            <p className="text-xs text-destructive font-medium flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Esta ação é irreversível. Os dados serão deletados permanentemente.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Checkbox
              id="confirm-delete"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <label htmlFor="confirm-delete" className="text-sm text-foreground cursor-pointer">
              Tenho certeza que desejo deletar {selectedIds.length > 1 ? `estes ${labelPlural}` : `este ${label}`}
            </label>
          </div>
        </div>

        <DialogFooter className="gap-3 sm:gap-0">
          <Button variant="secondary" onClick={() => { onOpenChange(false); setConfirmed(false); }} disabled={deleting}>
            Cancelar
          </Button>
          <Button variant="error" onClick={handleDelete} disabled={!confirmed || deleting}>
            {deleting ? 'Deletando...' : 'Deletar Permanentemente'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
