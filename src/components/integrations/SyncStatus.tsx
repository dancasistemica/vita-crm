import React from "react";
import { CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/ds";

interface SyncStatusProps {
  status: string;
  lastSync?: string;
  errorMessage?: string;
}

export const SyncStatus: React.FC<SyncStatusProps> = ({ 
  status, 
  lastSync, 
  errorMessage 
}) => {
  const getStatusBadge = () => {
    switch (status) {
      case 'active':
      case 'synced':
        return (
          <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
            <CheckCircle className="w-3 h-3 mr-1" />
            Sincronizado
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive" className="border-none">
            <AlertCircle className="w-3 h-3 mr-1" />
            Erro na Sincronização
          </Badge>
        );
      case 'pending':
      default:
        return (
          <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-200 border-none">
            <Clock className="w-3 h-3 mr-1" />
            Aguardando Sincronização
          </Badge>
        );
    }
  };

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-neutral-500">Status:</span>
        {getStatusBadge()}
      </div>
      
      {lastSync && (
        <p className="text-xs text-neutral-400">
          Última sincronização: {new Date(lastSync).toLocaleString('pt-BR')}
        </p>
      )}

      {status === 'error' && errorMessage && (
        <p className="text-xs text-red-500 mt-1">
          {errorMessage}
        </p>
      )}
    </div>
  );
};
