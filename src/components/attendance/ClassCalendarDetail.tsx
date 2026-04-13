import { useEffect } from 'react';
import { Badge, Button, Card, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/ds';
import { User, CheckCircle, XCircle, Clock, ExternalLink, Calendar, MapPin, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassCalendarDetailProps {
  classDate: string;
  productId: string;
  session: any;
  attendances: Array<{
    id: string;
    client_id: string;
    client_name: string;
    client_email: string;
    attendance_type: string;
  }>;
  onClose: () => void;
  onRefresh?: () => void;
}

export const ClassCalendarDetail = ({
  classDate,
  productId,
  session,
  attendances,
  onClose,
  onRefresh,
}: ClassCalendarDetailProps) => {
  const navigate = useNavigate();

  // Bloquear scroll do body quando modal aberta e fechar com ESC
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[ClassCalendarDetail] ESC pressionado, fechando modal');
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const getAttendanceBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'presente':
        return <Badge variant="success" size="sm">Presente</Badge>;
      case 'ausente':
        return <Badge variant="error" size="sm">Ausente</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const formattedDate = format(new Date(classDate + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: ptBR });

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <Card variant="elevated" padding="lg" className="max-w-2xl w-full max-h-[90vh] overflow-y-auto relative z-[10000] space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-100 pb-6">
        <div className="flex items-start gap-4">
          <div className="bg-primary-100 p-3 rounded-xl">
            <Calendar className="w-6 h-6 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-neutral-900 capitalize">
              {formattedDate}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-semibold text-neutral-500">
                {session?.products?.name || 'Aula Geral'}
              </span>
              {session?.description && (
                <>
                  <span className="text-neutral-300">•</span>
                  <p className="text-sm text-neutral-500 italic">
                    {session.description}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex flex-col items-center justify-center text-center">
          <Users className="w-5 h-5 text-neutral-400 mb-2" />
          <span className="text-xs font-bold text-neutral-500 uppercase block mb-1">Total Alunos</span>
          <span className="text-2xl font-bold text-neutral-900">{attendances.length}</span>
        </div>
        <div className="bg-success-50 p-4 rounded-xl border border-success-100 flex flex-col items-center justify-center text-center">
          <CheckCircle className="w-5 h-5 text-success-500 mb-2" />
          <span className="text-xs font-bold text-success-700 uppercase block mb-1">Presentes</span>
          <span className="text-2xl font-bold text-success-900">
            {attendances.filter(a => a.attendance_type.toLowerCase() === 'presente').length}
          </span>
        </div>
        <div className="bg-error-50 p-4 rounded-xl border border-error-100 flex flex-col items-center justify-center text-center">
          <XCircle className="w-5 h-5 text-error-500 mb-2" />
          <span className="text-xs font-bold text-error-700 uppercase block mb-1">Ausentes</span>
          <span className="text-2xl font-bold text-error-900">
            {attendances.filter(a => a.attendance_type.toLowerCase() === 'ausente').length}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-md font-bold text-neutral-900 flex items-center gap-2">
            <User className="w-4 h-4 text-primary-600" />
            Lista de Presença
          </h4>
          <span className="text-xs text-neutral-500 italic">
            Listando {attendances.length} registros
          </span>
        </div>
        
        <div className="border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Aluno</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {attendances.length > 0 ? (
                attendances.map((att) => (
                  <TableRow key={att.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-neutral-900">{att.client_name}</span>
                        <span className="text-xs text-neutral-500 font-medium">{att.client_email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAttendanceBadge(att.attendance_type)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={2} className="py-12 text-center text-neutral-500 italic bg-neutral-50/30">
                    <div className="flex flex-col items-center gap-2">
                      <Users className="w-8 h-8 text-neutral-300" />
                      <p>Nenhum registro de presença encontrado para esta data.</p>
                      <p className="text-xs font-medium">Clique em "Editar Presença" para registrar.</p>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Botão Editar Presença */}
      <div className="flex gap-4 mt-6 pt-6 border-t border-neutral-200">
        <Button
          variant="secondary"
          onClick={onClose}
          className="flex-1"
        >
          Fechar
        </Button>
        <button
          onClick={() => {
            console.log('[ClassCalendarDetail] Navegando para Registro de Presença');
            console.log('[ClassCalendarDetail] Parâmetros:', { productId, classDate });
            
            // Usar React Router navigate em vez de window.location.href
            navigate(`/registro-presenca?product=${encodeURIComponent(productId)}&date=${encodeURIComponent(classDate)}`);
          }}
          className="flex-1 px-4 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all"
        >
          ✏️ Editar Presença
        </button>
      </div>
    </Card>
  );
};
