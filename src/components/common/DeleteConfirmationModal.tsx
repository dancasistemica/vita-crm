import { Button, AlertTriangle, Loader2 } from "lucide-react";
import { Button, useState } from "react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  itemName: string;
  isLoading?: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  isLoading = false,
  onConfirm,
  onCancel,
}: DeleteConfirmationModalProps) {
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    try {
      setError(null);
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
      console.error("[DeleteConfirmationModal] Erro:", err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
        <div className="flex items-center gap-3 border-b border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-6 w-6 text-red-600" />
          <div>
            <h2 className="text-2xl font-semibold text-neutral-900">{title}</h2>
            <p className="mt-1 text-xs text-red-700">{message}</p>
          </div>
        </div>

        <div className="p-4">
          <p className="mb-3 text-sm text-neutral-700">
            Tem certeza que deseja excluir <strong>{itemName}</strong>?
          </p>
          <p className="mb-4 text-xs text-neutral-500">
            Esta acao nao pode ser desfeita. Todos os dados serao permanentemente removidos.
          </p>

          {error && (
            <div className="mb-4 rounded border border-red-300 bg-red-100 px-3 py-2 text-xs text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" size="sm"
            onClick={onCancel}
            disabled={isLoading}
            className="min-h-[44px] rounded bg-gray-300 px-4 py-2 text-sm text-neutral-800 transition-colors hover:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancelar
          </Button>
          <Button variant="secondary" size="sm"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex min-h-[44px] items-center justify-center gap-3 rounded bg-red-600 px-4 py-2 text-sm text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? "Excluindo..." : "Excluir permanentemente"}
          </Button>
        </div>
      </div>
    </div>
  );
}
