import React from 'react';
import { Button } from '@/components/ui/ds';
import { Edit2, Trash2, CheckCircle } from 'lucide-react';

interface TaskActionsProps {
  taskId: string;
  onEdit: (taskId: string) => void;
  onDelete: (taskId: string) => void;
  onComplete: (taskId: string) => void;
}

export function TaskActions({ taskId, onEdit, onDelete, onComplete }: TaskActionsProps) {
  return (
    <div className="flex gap-2">
      <Button 
        variant="ghost" 
        size="sm" 
        icon={<CheckCircle className="w-4 h-4" />}
        onClick={() => onComplete(taskId)}
        aria-label="Marcar como concluída"
      />
      <Button 
        variant="ghost" 
        size="sm" 
        icon={<Edit2 className="w-4 h-4" />}
        onClick={() => onEdit(taskId)}
        aria-label="Editar tarefa"
      />
      <Button 
        variant="error" 
        size="sm" 
        icon={<Trash2 className="w-4 h-4" />}
        onClick={() => onDelete(taskId)}
        aria-label="Deletar tarefa"
      />
    </div>
  );
}
