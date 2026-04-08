import React, { useState } from 'react';
import { 
  MoreHorizontal, 
  User, 
  Calendar, 
  Activity, 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  History,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  updateClientProductBatch, 
  getAttendanceHistory 
} from '@/services/clientProductService';
import { toast } from 'sonner';

interface ClientsByProductTableProps {
  clients: any[];
  onRefresh: () => void;
  isLoading: boolean;
}

export function ClientsByProductTable({ 
  clients, 
  onRefresh, 
  isLoading 
}: ClientsByProductTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBatchEdit, setShowBatchEdit] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  const toggleSelectAll = () => {
    if (selectedIds.length === clients.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(clients.map(c => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchUpdate = async (updates: { payment_status?: string; plan_type?: string }) => {
    try {
      setIsUpdating(true);
      await updateClientProductBatch(selectedIds, updates);
      toast.success(`Atualizado ${selectedIds.length} clientes com sucesso`);
      setSelectedIds([]);
      setShowBatchEdit(false);
      onRefresh();
    } catch (error) {
      console.error('[ClientsByProductTable] Erro na atualização em massa:', error);
      toast.error('Erro ao atualizar clientes');
    } finally {
      setIsUpdating(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ATIVO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3" /> Ativo</span>;
      case 'INATIVO':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800"><XCircle className="w-3 h-3" /> Inativo</span>;
      case 'PENDENTE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3" /> Pendente</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-neutral-100 text-neutral-800">{status}</span>;
    }
  };

  const getEngagementBadge = (level: string) => {
    switch (level?.toUpperCase()) {
      case 'ALTO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100"><Activity className="w-3 h-3" /> Alto</span>;
      case 'MÉDIO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-neutral-50 text-neutral-700 border border-neutral-100"><Activity className="w-3 h-3" /> Médio</span>;
      case 'BAIXO':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100"><AlertTriangle className="w-3 h-3" /> Baixo</span>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 px-4 py-3 border-b border-primary-100 flex items-center justify-between animate-in slide-in-from-top-2">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-primary-900">
              {selectedIds.length} clientes selecionados
            </span>
            <div className="flex gap-2">
              <button
                disabled={isUpdating}
                onClick={() => handleBatchUpdate({ payment_status: 'ATIVO' })}
                className="text-xs bg-white border border-primary-200 text-primary-700 px-3 py-1 rounded hover:bg-primary-100 transition-colors"
              >
                Ativar
              </button>
              <button
                disabled={isUpdating}
                onClick={() => handleBatchUpdate({ payment_status: 'INATIVO' })}
                className="text-xs bg-white border border-primary-200 text-primary-700 px-3 py-1 rounded hover:bg-primary-100 transition-colors"
              >
                Inativar
              </button>
              <button
                disabled={isUpdating}
                onClick={() => setShowBatchEdit(!showBatchEdit)}
                className="text-xs bg-primary-600 text-white px-3 py-1 rounded hover:bg-primary-700 transition-colors flex items-center gap-1"
              >
                <Edit className="w-3 h-3" /> Editar Planos
              </button>
            </div>
          </div>
          <button 
            onClick={() => setSelectedIds([])}
            className="text-sm text-primary-700 hover:underline"
          >
            Desmarcar todos
          </button>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead className="bg-neutral-50 border-b border-neutral-200">
            <tr>
              <th className="px-4 py-3 w-10">
                <input 
                  type="checkbox"
                  checked={selectedIds.length === clients.length && clients.length > 0}
                  onChange={toggleSelectAll}
                  className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                />
              </th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Cliente</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Produto</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Status</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Plano</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Vigência</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Última Aula</th>
              <th className="px-4 py-3 font-semibold text-neutral-700">Engajamento</th>
              <th className="px-4 py-3 font-semibold text-neutral-700 w-10 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {clients.length === 0 ? (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-neutral-500">
                  Nenhum cliente encontrado com os filtros aplicados.
                </td>
              </tr>
            ) : (
              clients.map((item) => (
                <tr key={item.id} className="hover:bg-neutral-50 transition-colors">
                  <td className="px-4 py-3">
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-neutral-500">
                        <User className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">{(item.clientes as any)?.name}</div>
                        <div className="text-xs text-neutral-500">{(item.clientes as any)?.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-neutral-700 font-medium">{(item.products as any)?.name}</span>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.payment_status)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs px-2 py-0.5 rounded border border-neutral-200 bg-neutral-50 text-neutral-600 uppercase font-medium">
                      {item.plan_type || 'N/A'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-xs text-neutral-600">
                      {item.start_date ? format(new Date(item.start_date), 'dd/MM/yy') : '--'} - {item.end_date ? format(new Date(item.end_date), 'dd/MM/yy') : '--'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-neutral-600">
                    {(item.clientes as any)?.last_attendance_date 
                      ? format(new Date((item.clientes as any).last_attendance_date), 'dd/MM/yy HH:mm') 
                      : 'Nunca'}
                  </td>
                  <td className="px-4 py-3">{getEngagementBadge((item.clientes as any)?.engagement_level)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="p-1 hover:bg-neutral-200 rounded text-neutral-400 hover:text-neutral-600">
                      <MoreHorizontal className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
