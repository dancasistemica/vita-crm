import { Edit2, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskActionButtonsProps {
  taskId: string;
  onEdit: (taskId: string) => void;
  onDuplicate: (taskId: string) => void;
  onDelete: (taskId: string) => void;
}

export default function TaskActionButtons({
  taskId,
  onEdit,
  onDuplicate,
  onDelete,
}: TaskActionButtonsProps) {
  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onEdit(taskId)}
        title="Editar tarefa"
        className="text-primary hover:text-primary/80 h-8 w-8 p-0"
      >
        <Edit2 className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDuplicate(taskId)}
        title="Duplicar tarefa"
        className="text-muted-foreground hover:text-foreground h-8 w-8 p-0"
      >
        <Copy className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => {
          if (confirm('Tem certeza que deseja remover esta tarefa?')) {
            onDelete(taskId);
          }
        }}
        title="Remover tarefa"
        className="text-destructive hover:text-destructive/80 h-8 w-8 p-0"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
