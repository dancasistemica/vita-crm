import { Card, Badge, Table, Button } from '@/components/ui/ds';
import { AlertTriangle, User, ExternalLink } from 'lucide-react';
import { AttendanceMetrics as AttendanceMetricsType } from '@/services/reportService';
import { useNavigate } from 'react-router-dom';

interface ClientRiskAnalysisProps {
  clientsAtRisk: AttendanceMetricsType[];
}

export const ClientRiskAnalysis = ({ clientsAtRisk }: ClientRiskAnalysisProps) => {
  const navigate = useNavigate();

  if (clientsAtRisk.length === 0) {
    return (
      <Card variant="elevated" padding="lg" className="text-center py-12">
        <div className="bg-success-50 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
          <Badge variant="success">✓</Badge>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900">Nenhum cliente em risco</h3>
        <p className="text-neutral-500 mt-2">
          Todos os alunos ativos possuem bom engajamento nos últimos 30 dias.
        </p>
      </Card>
    );
  }

  const highRiskCount = clientsAtRisk.filter(m => m.risk_level === 'high').length;
  const mediumRiskCount = clientsAtRisk.filter(m => m.risk_level === 'medium').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card variant="elevated" padding="md" className="border-l-4 border-error-500">
          <div className="flex items-center gap-3">
            <div className="bg-error-50 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-error-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Alto Risco (Churn)</p>
              <p className="text-2xl font-bold text-error-700">{highRiskCount}</p>
            </div>
          </div>
        </Card>
        <Card variant="elevated" padding="md" className="border-l-4 border-warning-500">
          <div className="flex items-center gap-3">
            <div className="bg-warning-50 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-warning-600" />
            </div>
            <div>
              <p className="text-sm text-neutral-500">Risco Médio</p>
              <p className="text-2xl font-bold text-warning-700">{mediumRiskCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card variant="elevated">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
          <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
            <User className="w-5 h-5 text-neutral-500" />
            Alunos com Baixo Engajamento
          </h3>
          <Badge variant="error" size="sm">{clientsAtRisk.length} Alunos</Badge>
        </div>
        
        <Table>
          <Table.Header>
            <Table.Row>
              <Table.Head>Aluno</Table.Head>
              <Table.Head>Risco</Table.Head>
              <Table.Head>Presença</Table.Head>
              <Table.Head>Faltas Seguidas</Table.Head>
              <Table.Head className="text-right">Ações</Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {clientsAtRisk.map((client) => (
              <Table.Row key={client.client_id}>
                <Table.Cell className="font-medium">{client.client_name}</Table.Cell>
                <Table.Cell>
                  <Badge variant={client.risk_level === 'high' ? 'error' : 'warning'}>
                    {client.risk_level === 'high' ? 'Alto' : 'Médio'}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <span className={client.presence_rate < 30 ? 'text-error-600 font-semibold' : ''}>
                    {client.presence_rate.toFixed(0)}%
                  </span>
                </Table.Cell>
                <Table.Cell>
                  {client.consecutive_absences >= 3 ? (
                    <span className="text-error-600 font-bold">{client.consecutive_absences}</span>
                  ) : (
                    client.consecutive_absences
                  )}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="flex items-center gap-1 ml-auto"
                    onClick={() => navigate(`/clients/${client.client_id}`)}
                  >
                    <ExternalLink className="w-4 h-4" />
                    Ver Perfil
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </Card>
    </div>
  );
};
