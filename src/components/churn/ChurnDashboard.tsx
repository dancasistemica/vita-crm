import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/ds/Card';
import { Badge } from '@/components/ui/ds/Badge';
import { AlertTriangle, TrendingDown, Users, CheckCircle } from 'lucide-react';
import { ChurnAlert } from '@/services/churnService';

interface ChurnDashboardProps {
  alerts: ChurnAlert[];
}

const ChurnDashboard: React.FC<ChurnDashboardProps> = ({ alerts }) => {
  const pendingAlerts = alerts.filter(a => a.status === 'pending');
  const criticalAlerts = pendingAlerts.filter(a => a.severity === 'critical');
  const highAlerts = pendingAlerts.filter(a => a.severity === 'high');
  const mediumAlerts = pendingAlerts.filter(a => a.severity === 'medium');

  const stats = [
    {
      label: 'Alertas Pendentes',
      value: pendingAlerts.length,
      icon: <AlertTriangle className="w-5 h-5 text-warning-600" />,
      color: 'bg-warning-50 border-warning-200',
    },
    {
      label: 'Risco Crítico',
      value: criticalAlerts.length,
      icon: <TrendingDown className="w-5 h-5 text-error-600" />,
      color: 'bg-error-50 border-error-200',
    },
    {
      label: 'Contatos Necessários',
      value: highAlerts.length + mediumAlerts.length,
      icon: <Users className="w-5 h-5 text-primary-600" />,
      color: 'bg-primary-50 border-primary-200',
    },
    {
      label: 'Resolvidos (Simulação)',
      value: alerts.filter(a => a.status === 'resolved').length,
      icon: <CheckCircle className="w-5 h-5 text-success-600" />,
      color: 'bg-success-50 border-success-200',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((stat, index) => (
        <Card key={index} className={`${stat.color} border shadow-sm`}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 mb-0">
            <CardTitle className="text-sm font-medium text-neutral-600">
              {stat.label}
            </CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default ChurnDashboard;
