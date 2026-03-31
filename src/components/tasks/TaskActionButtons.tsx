import { useState } from 'react';
import { Edit2, Copy, Trash2 } from 'lucide-react';
import { } from '@/components/ui/ds';
import ConfirmDeleteDialog from '@/components/common/ConfirmDeleteDialog';

interface TaskActionsProps {
  taskId: string;
  taskTitle?: string;
  onEdit: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskActions({
  taskId,
  taskTitle = 'esta tarefa',
  onEdit,
  onDuplicate,
  onDelete,
}: TaskActionsProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="flex gap-1">
      <ConfirmDeleteDialog
        isOpen={showConfirm}
        itemName={taskTitle}
        itemType="tarefa"
        onConfirm={() => { onDelete(taskId); setShowConfirm(false); }}
        onCancel={() => setShowConfirm(false)}
      />

      <
        variant="ghost"
        size="sm"
        onClick={() => onEdit(taskId)}
        title="Editar tarefa"
        className="text-primary hover:text-primary/80 h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </>

      <
        variant="ghost"
        size="sm"
        onClick={() => onDuplicate(taskId)}
        title="Duplicar tarefa"
        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
      >
        <Copy className="h-4 w-4" />
      </>

      <
        variant="ghost"
        size="sm"
        onClick={() => setShowConfirm(true)}
        title="Remover tarefa"
        className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </>
    </div>
  );
}
