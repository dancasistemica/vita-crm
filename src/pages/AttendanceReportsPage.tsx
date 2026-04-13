import React, { useState, useEffect } from 'react';
import { Card, Select, Button, PageTitle, Badge, Skeleton } from '@/components/ui/ds';
import { useOrganization } from '@/contexts/OrganizationContext';
import { fetchProductsForOrganization } from '@/services/attendanceService';
import { getClientsAtRisk, calculateClientMetrics, AttendanceMetrics as AttendanceMetricsType } from '@/services/reportService';
import { AttendanceMetrics } from '@/components/reports/AttendanceMetrics';
import { ClientRiskAnalysis } from '@/components/reports/ClientRiskAnalysis';
import { Search, Filter, Download, Calendar, Users, BarChart3 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function AttendanceReportsPage() {
  const { organization } = useOrganization();
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [clientsAtRisk, setClientsAtRisk] = useState<AttendanceMetricsType[]>([]);
  const [days, setDays] = useState(30);

  useEffect(() => {
    if (organization?.id) {
      loadProducts();
    }
  }, [organization?.id]);

  const loadProducts = async () => {
    try {
      const data = await fetchProductsForOrganization(organization!.id);
      setProducts(data);
      if (data.length > 0) {
        setSelectedProductId(data[0].id);
      }
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os produtos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organization?.id && selectedProductId) {
      loadRiskAnalysis();
    }
  }, [organization?.id, selectedProductId, days]);

  const loadRiskAnalysis = async () => {
    setLoading(true);
    try {
      const atRisk = await getClientsAtRisk(organization!.id, selectedProductId, days);
      setClientsAtRisk(atRisk);
    } catch (error) {
      console.error('Erro ao carregar análise de risco:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a análise de risco.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageTitle 
          title="Relatórios de Presença e Engajamento" 
          subtitle="Acompanhe a retenção e identifique alunos em risco de evasão."
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="w-4 h-4" /> Exportar
          </Button>
        </div>
      </div>

      <Card variant="elevated" padding="md">
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Filter className="w-4 h-4" /> Selecione o Produto
            </label>
            <Select
              value={selectedProductId}
              onChange={(e) => setSelectedProductId(e.target.value)}
              className="w-full"
            >
              <option value="">Selecione um produto...</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </div>
          
          <div className="w-full md:w-48 space-y-1.5">
            <label className="text-sm font-medium text-neutral-700 flex items-center gap-2">
              <Calendar className="w-4 h-4" /> Período
            </label>
            <Select
              value={days.toString()}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full"
            >
              <option value="7">Últimos 7 dias</option>
              <option value="15">Últimos 15 dias</option>
              <option value="30">Últimos 30 dias</option>
              <option value="60">Últimos 60 dias</option>
              <option value="90">Últimos 90 dias</option>
            </Select>
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
          <Skeleton className="h-64 w-full" />
        </div>
      ) : (
        <>
          <ClientRiskAnalysis clientsAtRisk={clientsAtRisk} />
          
          <div className="mt-12 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-neutral-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary-600" />
                Métricas de Engajamento Detalhadas
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {clientsAtRisk.slice(0, 6).map(metrics => (
                <AttendanceMetrics key={metrics.client_id} metrics={metrics} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
