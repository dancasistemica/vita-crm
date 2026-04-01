import { Alert, Button, Card } from "@/components/ui/ds";
import { Loader } from "lucide-react";

interface ConfirmDeleteDialogProps {
  isOpen: boolean;
  itemName?: string;
  itemType?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  title?: string;
  description?: string;
}

export default function ConfirmDeleteDialog({
  isOpen,
  itemName,
  itemType,
  onConfirm,
  onCancel,
  onClose,
  isLoading = false,
  title,
  description,
}: ConfirmDeleteDialogProps) {
  const handleCancel = () => {
    if (onCancel) onCancel();
    if (onClose) onClose();
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">{title || `Excluir ${itemType}?`}</h2>
            <div className="text-sm text-neutral-600 mb-6">
              {description ? (
                description
              ) : (
                <>
                  Tem certeza que deseja excluir <strong>"{itemName}"</strong>?
                  <br />
                  ⚠️ Esta ação <strong>não pode ser desfeita</strong>.
                </>
              )}
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" disabled={isLoading} onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                variant="error"
                className="flex-1"
                disabled={isLoading}
                onClick={onConfirm}
              >
                {isLoading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin mr-1" />
                    Excluindo...
                  </>
                ) : (
                  "Excluir"
                )}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
