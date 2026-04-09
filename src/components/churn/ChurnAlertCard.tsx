import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MessageCircle, Phone, CheckCircle2, XCircle } from 'lucide-react';
import { getChurnSeverityColor, getChurnSeverityLabel, CHURN_ACTIONS } from '@/lib/churnRules';
import { ChurnAlert } from '@/services/churnService';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { openWhatsApp } from '@/lib/whatsappUtils';

interface ChurnAlertCardProps {
  alert: ChurnAlert;
  onStatusUpdate: (id: string, status: ChurnAlert['status'], note?: string, method?: string) => void;
}

const ChurnAlertCard: React.FC<ChurnAlertCardProps> = ({ alert, onStatusUpdate }) => {
  const action = (CHURN_ACTIONS as any)[alert.action_required] || CHURN_ACTIONS.soft_contact;
  const severityColor = getChurnSeverityColor(alert.severity);

  const handleWhatsAppContact = () => {
    // Buscar telefone do cliente via Supabase ou passar como prop
    // Como o alert não tem o telefone, vamos simular ou buscar
    console.log('Contatando cliente via WhatsApp:', alert.client_name);
    // Note: In a real scenario, we'd fetch the client's phone number
    // openWhatsApp(phoneNumber, action.template);
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
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
          </span>
        </div>
        <CardTitle className="text-lg font-bold mt-2">{alert.client_name}</CardTitle>
        <CardDescription className="text-sm font-medium text-destructive flex items-center gap-1">
          <AlertTriangle className="w-4 h-4" />
          {alert.risk_reason}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-4">
        <div className="space-y-2 text-sm">
          <p className="flex justify-between">
            <span className="text-muted-foreground">Produto:</span>
            <span className="font-semibold">{alert.product_name}</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Sem acesso há:</span>
            <span className="font-semibold">{alert.days_without_access} dias</span>
          </p>
          <p className="flex justify-between">
            <span className="text-muted-foreground">Status do Alerta:</span>
            <Badge variant="outline" className="capitalize">
              {alert.status === 'pending' ? 'Pendente' : alert.status}
            </Badge>
          </p>
          
          <div className="mt-4 p-3 bg-muted rounded-md border border-muted-foreground/10 italic text-xs text-muted-foreground">
            <strong>Sugestão:</strong> "{action.template}"
          </div>
        </div>
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2 pt-0 border-t mt-auto pt-4">
        <Button 
          variant="outline" 
          size="sm" 
          className="flex-1 gap-1 text-green-600 border-green-200 hover:bg-green-50"
          onClick={handleWhatsAppContact}
        >
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </Button>
        <Button 
          variant="outline" 
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
          className="gap-1 text-muted-foreground"
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
