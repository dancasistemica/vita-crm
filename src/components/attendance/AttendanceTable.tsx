import React from 'react';
import { UserCheck, UserX, Video } from 'lucide-react';
import { Button } from '@/components/ui/ds';

interface AttendanceTableProps {
  clients: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  attendances: Array<{
    client_id: string;
    attendance_type: 'presente' | 'ausente' | 'gravada';
  }>;
  onAttendanceChange: (clientId: string, type: 'presente' | 'ausente' | 'gravada') => void;
  isLoading?: boolean;
}

export const AttendanceTable = ({
  clients,
  attendances,
  onAttendanceChange,
  isLoading,
}: AttendanceTableProps) => {
  const getAttendanceType = (clientId: string) => {
    const attendance = attendances.find(a => a.client_id === clientId);
    return attendance?.attendance_type || 'ausente';
  };

  const getButtonStyle = (clientId: string, type: 'presente' | 'ausente' | 'gravada') => {
    const current = getAttendanceType(clientId);
    const isSelected = current === type;

    switch (type) {
      case 'presente':
        return isSelected
          ? 'bg-green-600 text-white border-green-600 hover:bg-green-700'
          : 'bg-white text-green-600 border-green-300 hover:bg-green-50';
      case 'ausente':
        return isSelected
          ? 'bg-red-600 text-white border-red-600 hover:bg-red-700'
          : 'bg-white text-red-600 border-red-300 hover:bg-red-50';
      case 'gravada':
        return isSelected
          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700'
          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm bg-white">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Cliente</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-neutral-700">Email</th>
            <th className="px-4 py-3 text-center text-sm font-semibold text-neutral-700">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {isLoading ? (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-neutral-500 italic">
                Carregando alunos...
              </td>
            </tr>
          ) : clients.length === 0 ? (
            <tr>
              <td colSpan={3} className="px-6 py-10 text-center text-neutral-500 italic">
                Nenhum cliente encontrado para este produto.
              </td>
            </tr>
          ) : (
            clients.map((client, index) => (
              <tr
                key={client.id}
                className={`hover:bg-neutral-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                }`}
              >
                <td className="px-4 py-3 text-sm font-medium text-neutral-900">{client.name}</td>
                <td className="px-4 py-3 text-sm text-neutral-600">{client.email}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => onAttendanceChange(client.id, 'presente')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${getButtonStyle(
                        client.id,
                        'presente'
                      )}`}
                      title="Presente"
                    >
                      <UserCheck className="w-4 h-4" />
                      Presente
                    </button>
                    <button
                      type="button"
                      onClick={() => onAttendanceChange(client.id, 'ausente')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${getButtonStyle(
                        client.id,
                        'ausente'
                      )}`}
                      title="Ausente"
                    >
                      <UserX className="w-4 h-4" />
                      Ausente
                    </button>
                    <button
                      type="button"
                      onClick={() => onAttendanceChange(client.id, 'gravada')}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${getButtonStyle(
                        client.id,
                        'gravada'
                      )}`}
                      title="Gravada"
                    >
                      <Video className="w-4 h-4" />
                      Gravada
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
};
