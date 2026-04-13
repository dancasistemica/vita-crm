import { Card, Badge, Button, Alert } from '@/components/ui/ds';
import { AlertCircle, CheckCircle, Mail, Phone, ExternalLink } from 'lucide-react';
import { ClientAlert } from '@/services/alertService';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface AlertsListProps {
  alerts: ClientAlert[];
  onResolve: (alertId: string, action: string) => void;
  onContact: (alert: ClientAlert) => void;
  loading?: boolean;
}

export const AlertsList = ({ alerts, onResolve, onContact, loading }: AlertsListProps) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6 animate-pulse bg-gray-50 h-32" />
        ))}
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card className="p-8 text-center flex flex-col items-center justify-center border-dashed">
        <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
        <h3 className="text-lg font-medium text-gray-900">Nenhum alerta de churn</h3>
        <p className="text-gray-500 max-w-sm mt-2">
          Todos os seus alunos estão com a frequência em dia ou assistindo às gravações.
        </p>
      </Card>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-700 border-red-200';
      case 'medium': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'low': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-500">Crítico</Badge>;
      case 'medium': return <Badge className="bg-orange-500">Moderado</Badge>;
      case 'low': return <Badge className="bg-yellow-500 text-yellow-900">Leve</Badge>;
      default: return null;
    }
  };

  return (
    <div className="space-y-4">
      <Alert className="bg-blue-50 border-blue-200 text-blue-800">
        <AlertCircle className="h-4 w-4" />
        <span>Foram detectados <strong>{alerts.length} clientes</strong> com 3 ou mais faltas reais consecutivas.</span>
      </Alert>

      {alerts.map((alert) => (
        <Card key={alert.id} className="p-6 overflow-hidden border-l-4" style={{ borderLeftColor: alert.severity === 'high' ? '#ef4444' : alert.severity === 'medium' ? '#f97316' : '#eab308' }}>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-bold text-gray-900">{alert.client_name}</h3>
                {getSeverityBadge(alert.severity)}
              </div>
              <p className="text-sm text-gray-500 flex items-center gap-1 mb-2">
                <Mail className="h-3 w-3" /> {alert.client_email} • <strong>{alert.product_name}</strong>
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Faltas Reais</span>
                  <span className="text-xl font-bold text-red-600">{alert.consecutive_real_absences}</span>
                  <span className="text-xs text-gray-500 block">consecutivas</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Ao Vivo</span>
                  <span className="text-xl font-bold text-blue-600">{alert.attended_live}</span>
                  <span className="text-xs text-gray-500 block">presenças</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Gravadas</span>
                  <span className="text-xl font-bold text-green-600">{alert.watched_recorded}</span>
                  <span className="text-xs text-gray-500 block">assistidas</span>
                </div>
                <div className="bg-gray-50 p-2 rounded border border-gray-100">
                  <span className="text-[10px] uppercase text-gray-400 block font-semibold">Última Falta</span>
                  <span className="text-sm font-bold block mt-1">
                    {alert.last_real_absence_date 
                      ? format(new Date(alert.last_real_absence_date + 'T00:00:00'), 'dd/MM/yyyy', { locale: ptBR })
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2 w-full md:w-auto min-w-[180px]">
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full flex justify-between items-center"
                onClick={() => onContact(alert)}
              >
                <span>Entrar em contato</span>
                <Mail className="h-4 w-4" />
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                className="w-full flex justify-between items-center bg-green-600 hover:bg-green-700"
                onClick={() => onResolve(alert.id, 'Contato realizado e resolvido')}
              >
                <span>Resolver alerta</span>
                <CheckCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
