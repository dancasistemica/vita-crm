import React from "react";
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Badge
} from "@/components/ui/ds";
import { Integration } from "@/services/integrationService";
import { Check, ArrowRight } from "lucide-react";

interface IntegrationsListProps {
  integrations: Integration[];
  onSelect: (type: string) => void;
  selectedType?: string;
}

export const IntegrationsList: React.FC<IntegrationsListProps> = ({
  integrations,
  onSelect,
  selectedType
}) => {
  const availableIntegrations = [
    {
      id: 'asaas',
      name: 'Asaas',
      description: 'Gestão de cobranças e sincronização de pagamentos.',
      logo: 'A',
      color: 'bg-blue-50 text-blue-600',
      status: integrations.find(i => i.integration_type === 'asaas') ? 'connected' : 'available'
    },
    {
      id: 'stripe',
      name: 'Stripe',
      description: 'Infraestrutura de pagamentos global.',
      logo: 'S',
      color: 'bg-indigo-50 text-indigo-600',
      status: 'coming_soon'
    },
    {
      id: 'pagseguro',
      name: 'PagSeguro',
      description: 'Solução brasileira para pagamentos online.',
      logo: 'P',
      color: 'bg-green-50 text-green-600',
      status: 'coming_soon'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {availableIntegrations.map((item) => {
        const isSelected = selectedType === item.id;
        
        return (
          <Card 
            key={item.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${isSelected ? 'ring-2 ring-primary border-transparent' : ''}`}
            onClick={() => item.status !== 'coming_soon' && onSelect(item.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg ${item.color}`}>
                  {item.logo}
                </div>
                {item.status === 'connected' && (
                  <Badge className="bg-green-100 text-green-700 hover:bg-green-200 border-none">
                    <Check className="w-3 h-3 mr-1" />
                    Ativo
                  </Badge>
                )}
                {item.status === 'coming_soon' && (
                  <Badge variant="outline" className="text-neutral-400 border-neutral-200">
                    Em breve
                  </Badge>
                )}
              </div>
              <CardTitle className="mt-4 text-lg">{item.name}</CardTitle>
              <CardDescription className="line-clamp-2">{item.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                variant="ghost" 
                className={`w-full justify-between p-0 h-auto hover:bg-transparent text-primary group ${item.status === 'coming_soon' ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={item.status === 'coming_soon'}
              >
                <span>{item.status === 'connected' ? 'Configurar' : 'Conectar'}</span>
                <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
