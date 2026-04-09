import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/ds/Card';
import { Button } from '@/components/ui/ds/Button';
import { Badge } from '@/components/ui/ds/Badge';
import { AlertTriangle, Clock, MessageCircle, CheckCircle2, XCircle } from 'lucide-react';
import { getChurnSeverityColor, getChurnSeverityLabel, CHURN_ACTIONS } from '@/lib/churnRules';
import { ChurnAlert } from '@/services/churnService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { generateWhatsAppLink } from '@/lib/whatsappUtils';

interface ChurnAlertCardProps {
  alert: ChurnAlert;
  onStatusUpdate: (id: string, status: ChurnAlert['status'], note?: string, method?: string) => void;
}

const ChurnAlertCard: React.FC<ChurnAlertCardProps> = ({ alert, onStatusUpdate }) => {
  const action = (CHURN_ACTIONS as any)[alert.action_required] || CHURN_ACTIONS.soft_contact;
  const severityColor = getChurnSeverityColor(alert.severity);

  const handleWhatsAppContact = () => {
    console.log('Contatando cliente via WhatsApp:', alert.client_name);
    // Em um cenário real, buscaríamos o telefone do cliente
    // Aqui apenas simulamos o link se tivéssemos o telefone
    const dummyPhone = '5511999999999'; 
    const link = generateWhatsAppLink(dummyPhone, action.template);
    window.open(link, '_blank');
    onStatusUpdate(alert.id, 'contacted', 'Contato iniciado via WhatsApp', 'whatsapp');
  };

  const handleResolve = () => {
    onStatusUpdate(alert.id, 'resolved', 'Situação resolvida', 'manual');
  };

  const handleCancel = () => {
    onStatusUpdate(alert.id, 'cancelled', 'Alerta ignorado', 'manual');
  };

  return (
    <Card className={`border-l-4 ${severityColor.split(' ')[0]} shadow-md hover:shadow-lg transition-shadow`}>
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge className={`${severityColor} border uppercase text-[10px]`}>
            {getChurnSeverityLabel(alert.severity)}
          </Badge>
          <span className="text-xs text-neutral-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <CardTitle className="text-lg font-bold mt-2">{alert.client_name}</CardTitle>
        <CardDescription className="text-sm font-medium text-error-600 flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {alert.risk_reason}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-2 text-sm">
          <p className="flex justify-between">
            <span className="text-neutral-500">Produto:</span>
            <span className="font-semibold">{alert.product_name}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-neutral-500">Sem acesso há:</span>
            <span className="font-semibold">{alert.days_without_access} dias</span>
          </p>
          <p className="flex justify-between">
            <span className="text-neutral-500">Status do Alerta:</span>
            <Badge variant="secondary" className="capitalize">
              {alert.status === 'pending' ? 'Pendente' : alert.status}
            </Badge>
          </p>
          
          <div className="mt-4 p-3 bg-neutral-50 rounded-md border border-neutral-100 italic text-xs text-neutral-500">
            <strong>Sugestão:</strong> "{action.template}"
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-auto pt-4">
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 gap-1 text-success-600 border-success-200 hover:bg-success-50"
          onClick={handleWhatsAppContact}
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Button>
        <Button 
          variant="secondary" 
          size="sm" 
          className="flex-1 gap-1"
          onClick={handleResolve}
        >
          <CheckCircle2 className="w-4 h-4" />
          Resolvido
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="gap-1 text-neutral-500"
          onClick={handleCancel}
        >
          <XCircle className="w-4 h-4" />
          Ignorar
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ChurnAlertCard;
