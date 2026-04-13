import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, Button, Textarea, Label } from '@/components/ui/ds';
import { ClientAlert } from '@/services/alertService';

interface AlertActionsProps {
  alert: ClientAlert | null;
  isOpen: boolean;
  onClose: () => void;
  onResolve: (alertId: string, action: string) => void;
}

export const AlertActions = ({ alert, isOpen, onClose, onResolve }: AlertActionsProps) => {
  const [actionTaken, setActionTaken] = useState('');

  if (!alert) return null;

  const handleResolve = () => {
    onResolve(alert.id, actionTaken || 'Ação de acompanhamento realizada');
    setActionTaken('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Resolver Alerta de Churn</DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-neutral-50 p-3 rounded-lg border border-neutral-100">
            <p className="text-sm font-semibold text-neutral-900">{alert.client_name}</p>
            <p className="text-xs text-neutral-500">{alert.client_email}</p>
            <div className="mt-2 flex gap-2">
              <span className="text-xs bg-error-50 text-error-700 px-2 py-0.5 rounded-full border border-error-100">
                {alert.consecutive_real_absences} faltas reais consecutivas
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="action-taken">Ação realizada</Label>
            <Textarea
              id="action-taken"
              placeholder="Descreva o que foi feito (ex: Enviei mensagem no WhatsApp, agendei reunião...)"
              value={actionTaken}
              onChange={(e) => setActionTaken(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleResolve}>
            Marcar como resolvido
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
