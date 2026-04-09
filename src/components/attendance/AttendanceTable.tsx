import React from 'react';
import { Check, X, Video } from 'lucide-react';

interface AttendanceTableProps {
  clients: Array<{
    client_id: string;
    client_name: string;
    email: string;
    phone: string;
  }>;
  attendance: Map<string, 'PRESENTE' | 'AUSENTE' | 'GRAVADA'>;
  onAttendanceChange: (clientId: string, type: 'PRESENTE' | 'AUSENTE' | 'GRAVADA') => void;
}

export function AttendanceTable({
  clients,
  attendance,
  onAttendanceChange,
}: AttendanceTableProps) {
  console.log('[AttendanceTable] Renderizando tabela de presença');

  const getButtonStyle = (clientId: string, type: 'PRESENTE' | 'AUSENTE' | 'GRAVADA') => {
    const current = attendance.get(clientId);
    const isSelected = current === type;

    switch (type) {
      case 'PRESENTE':
        return isSelected
          ? 'bg-green-600 text-white border-green-600'
          : 'bg-white text-green-600 border-green-300 hover:bg-green-50';
      case 'AUSENTE':
        return isSelected
          ? 'bg-red-600 text-white border-red-600'
          : 'bg-white text-red-600 border-red-300 hover:bg-red-50';
      case 'GRAVADA':
        return isSelected
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-blue-600 border-blue-300 hover:bg-blue-50';
      default:
        return '';
    }
  };

  return (
    <div className="overflow-x-auto border border-neutral-200 rounded-lg shadow-sm">
      <table className="w-full">
        <thead className="bg-neutral-50 border-b border-neutral-200">
          <tr>
            <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
              Cliente
            </th>
            <th className="px-6 py-4 text-left text-sm font-semibold text-neutral-700">
              Email
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">
              Presente
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">
              Ausente
            </th>
            <th className="px-6 py-4 text-center text-sm font-semibold text-neutral-700">
              Gravada
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {clients.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-6 py-10 text-center text-neutral-500">
                Nenhum cliente ativo encontrado para este produto.
              </td>
            </tr>
          ) : (
            clients.map((client, index) => (
              <tr
                key={client.client_id}
                className={`hover:bg-neutral-50 transition-colors ${
                  index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'
                }`}
              >
                <td className="px-6 py-4 text-sm font-medium text-neutral-900">
                  {client.client_name}
                </td>
                <td className="px-6 py-4 text-sm text-neutral-600">{client.email}</td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onAttendanceChange(client.client_id, 'PRESENTE')}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded border-2 transition-all ${getButtonStyle(
                      client.client_id,
                      'PRESENTE'
                    )}`}
                    title="Presente"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onAttendanceChange(client.client_id, 'AUSENTE')}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded border-2 transition-all ${getButtonStyle(
                      client.client_id,
                      'AUSENTE'
                    )}`}
                    title="Ausente"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </td>
                <td className="px-6 py-4 text-center">
                  <button
                    onClick={() => onAttendanceChange(client.client_id, 'GRAVADA')}
                    className={`inline-flex items-center justify-center w-10 h-10 rounded border-2 transition-all ${getButtonStyle(
                      client.client_id,
                      'GRAVADA'
                    )}`}
                    title="Assistiu Gravada"
                  >
                    <Video className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
