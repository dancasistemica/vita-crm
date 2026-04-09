import React, { useState, useEffect } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { supabase } from '@/lib/supabase';
import { Card, Skeleton, Button, Label, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';
import { ClipboardCheck, Loader2, UserCheck, UserX, Video, Calendar, Package, Save } from 'lucide-react';
import { AttendanceTable } from '@/components/attendance/AttendanceTable';
import { getProductClients, recordAttendance, getAttendanceForDate } from '@/services/attendanceService';
import { useToast } from '@/components/ui/use-toast';

export default function RegistroPresencaPage() {
  const { organizationId } = useOrganization();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [classDate, setClassDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clients, setClients] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Map<string, 'PRESENTE' | 'AUSENTE' | 'GRAVADA'>>(new Map());
  const [isLoadingClients, setIsLoadingClients] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (organizationId) {
      fetchProducts();
    }
  }, [organizationId]);

  useEffect(() => {
    if (selectedProductId && classDate && organizationId) {
      loadAttendanceData();
    }
  }, [selectedProductId, classDate, organizationId]);

  const fetchProducts = async () => {
    setIsLoadingProducts(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name')
        .eq('organization_id', organizationId)
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao buscar produtos:', error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  const loadAttendanceData = async () => {
    setIsLoadingClients(true);
    try {
      // Fetch clients for the product
      const productClients = await getProductClients(organizationId!, selectedProductId);
      setClients(productClients);
      
      // Fetch existing attendance for that date
      const existingAttendance = await getAttendanceForDate(organizationId!, selectedProductId, classDate);
      
      // Merge: if existing attendance found, use it; otherwise, default to AUSENTE for all
      const newAttendance = new Map<string, 'PRESENTE' | 'AUSENTE' | 'GRAVADA'>();
      productClients.forEach(client => {
        const status = existingAttendance.get(client.client_id) as 'PRESENTE' | 'AUSENTE' | 'GRAVADA' | undefined;
        newAttendance.set(client.client_id, status || 'AUSENTE');
      });
      
      setAttendance(newAttendance);
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao carregar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os clientes ou a presença existente.',
      });
    } finally {
      setIsLoadingClients(false);
    }
  };

  const handleAttendanceChange = (clientId: string, type: 'PRESENTE' | 'AUSENTE' | 'GRAVADA') => {
    setAttendance(prev => {
      const next = new Map(prev);
      next.set(clientId, type);
      return next;
    });
  };

  const handleSave = async () => {
    if (!selectedProductId || !classDate || !organizationId) return;

    setIsSaving(true);
    try {
      const records = Array.from(attendance.entries()).map(([clientId, type]) => ({
        client_id: clientId,
        product_id: selectedProductId,
        class_date: classDate,
        attendance_type: type,
        recorded_by: 'manual',
      }));

      await recordAttendance(organizationId, records);
      
      toast({
        title: 'Sucesso',
        description: 'Presença registrada com sucesso!',
      });
    } catch (error) {
      console.error('[RegistroPresencaPage] Erro ao salvar presença:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível salvar o registro de presença.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold text-neutral-900 flex items-center gap-3">
            <ClipboardCheck className="w-8 h-8 text-primary" />
            Registro de Presença
          </h1>
          <p className="text-neutral-500">
            Marque manualmente a presença dos seus alunos nas aulas ao vivo.
          </p>
        </div>
      </div>

      {isLoadingProducts ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      ) : organizationId ? (
        <div className="space-y-6">
          {/* Seletor de Produto e Data */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-lg border border-neutral-200 shadow-sm">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Package className="w-4 h-4" /> Produto
              </Label>
              <Select value={selectedProductId} onValueChange={setSelectedProductId}>
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecione um produto" />
                </SelectTrigger>
                <SelectContent>
                  {products.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Data da Aula
              </Label>
              <Input
                id="date"
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
              />
            </div>
          </div>

          {selectedProductId && (
            <>
              {/* Resumo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-neutral-50 p-4 rounded-lg border border-neutral-200">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UserCheck className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-neutral-600">Presença</p>
                  </div>
                  <p className="text-2xl font-bold text-green-600">
                    {Array.from(attendance.values()).filter((v) => v === 'PRESENTE').length}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Estava presente na aula</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <UserX className="w-5 h-5 text-red-600" />
                    <p className="text-sm text-neutral-600">Ausência</p>
                  </div>
                  <p className="text-2xl font-bold text-red-600">
                    {Array.from(attendance.values()).filter((v) => v === 'AUSENTE').length}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Não estava presente</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Video className="w-5 h-5 text-blue-600" />
                    <p className="text-sm text-neutral-600">Gravação</p>
                  </div>
                  <p className="text-2xl font-bold text-blue-600">
                    {Array.from(attendance.values()).filter((v) => v === 'GRAVADA').length}
                  </p>
                  <p className="text-xs text-neutral-500 mt-1">Assistiu a gravação</p>
                </div>
              </div>

              {isLoadingClients ? (
                <div className="flex justify-center items-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-800">
                      Alunos Inscritos ({clients.length})
                    </h3>
                    <Button 
                      onClick={handleSave} 
                      disabled={isSaving || clients.length === 0}
                      className="gap-2"
                    >
                      {isSaving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Salvar Presença
                    </Button>
                  </div>

                  <AttendanceTable
                    clients={clients}
                    attendance={attendance}
                    onAttendanceChange={handleAttendanceChange}
                  />

                  {/* Legenda Explicativa */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-bold text-blue-900 mb-3">Opções de Registro:</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-green-100 border-2 border-green-300 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <UserCheck className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Presença</p>
                          <p className="text-blue-700">Cliente estava presente na aula ao vivo</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-red-100 border-2 border-red-300 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <UserX className="w-4 h-4 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Ausência</p>
                          <p className="text-blue-700">Cliente não estava presente na aula ao vivo</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-100 border-2 border-blue-300 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                          <Video className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Gravação</p>
                          <p className="text-blue-700">Cliente não estava presente, mas assistiu a gravação da aula</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {!selectedProductId && (
            <div className="text-center py-20 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
              <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
              <p className="text-neutral-500">Selecione um produto para começar o registro de presença.</p>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-10 text-center">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-neutral-600">Carregando informações da organização...</p>
        </Card>
      )}
    </div>
  );
}
