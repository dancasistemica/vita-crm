import { Badge, Button } from "@/components/ui/ds";
import { Edit2, Trash2 } from 'lucide-react';
import { Venda } from '@/types/sales';

interface SalesTableProps {
  sales: any[];
  onEdit: (sale: any) => void;
  onDelete: (sale: any) => void;
}

export const SalesTable = ({ sales, onEdit, onDelete }: SalesTableProps) => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-neutral-200">
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Cliente</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Etapa</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Tipo</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Valor Original</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Desconto</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Valor Final</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Status</th>
            <th className="text-left py-3 px-2 sm:px-4 font-semibold text-neutral-900 text-xs sm:text-sm">Ações</th>
          </tr>
        </thead>
        <tbody>
          {sales.map((sale) => (
            <tr key={sale.id} className="border-b border-neutral-100 hover:bg-neutral-50 transition-colors">
              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-neutral-900">
                <div className="flex flex-col">
                  <span className="font-medium">{sale.client_name}</span>
                  <span className="text-[10px] text-neutral-500">{sale.client_email}</span>
                </div>
              </td>
              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-neutral-900">{sale.stage_name}</td>
              <td className="py-3 px-2 sm:px-4">
                <Badge variant={sale.sale_type === 'unica' ? 'default' : 'warning'} size="sm">
                  {sale.sale_type === 'unica' ? '💳 Única' : '📅 Mensalidade'}
                </Badge>
              </td>
              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-neutral-500">
                R$ {Number(sale.original_amount || sale.stage_value).toFixed(2)}
              </td>
              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm">
                {sale.discount_type && sale.discount_type !== 'none' ? (
                  <div className="flex flex-col">
                    <span className="text-success-600 font-medium">
                      {sale.discount_type === 'percentage' ? `${sale.discount_value}%` : `R$ ${Number(sale.discount_value).toFixed(2)}`}
                    </span>
                    {sale.discount_description && (
                      <span className="text-[10px] text-neutral-500 truncate max-w-[120px]" title={sale.discount_description}>
                        {sale.discount_description}
                      </span>
                    )}
                    {/* Removido o nome do usuário que concedeu desconto para evitar erro de relacionamento */}
                  </div>
                ) : (
                  <span className="text-neutral-400">-</span>
                )}
              </td>
              <td className="py-3 px-2 sm:px-4 text-xs sm:text-sm text-neutral-900 font-bold">
                R$ {Number(sale.final_amount || sale.stage_value).toFixed(2)}
              </td>
              <td className="py-3 px-2 sm:px-4">
                <Badge 
                  variant={sale.status === 'ativa' ? 'success' : 'error'} 
                  size="sm"
                >
                  {sale.status === 'ativa' ? '✅ Ativa' : '❌ Cancelada'}
                </Badge>
              </td>
              <td className="py-3 px-2 sm:px-4">
                <div className="flex gap-2">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={<Edit2 className="w-4 h-4" />} 
                    onClick={() => onEdit(sale)}
                    title="Editar venda"
                  />
                  <Button 
                    variant="error" 
                    size="sm" 
                    icon={<Trash2 className="w-4 h-4" />} 
                    onClick={() => onDelete(sale)}
                    title="Excluir venda"
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
