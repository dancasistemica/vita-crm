import React, { useState, useEffect } from 'react';
import { Calendar, Package, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/ds/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds/Select';
import { Label } from '@/components/ui/ds/Label';
import { Input } from '@/components/ui/ds/Input';
import { AttendanceTable } from './AttendanceTable';
import { getProductClients, recordAttendance, getAttendanceForDate } from '@/services/attendanceService';
import { useToast } from '@/components/ui/use-toast';

interface AttendanceFormProps {
  products: Array<{ id: string; name: string }>;
  organizationId: string;
}

export function AttendanceForm({ products, organizationId }: AttendanceFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [classDate, setClassDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [clients, setClients] = useState<any[]>([]);
  const [attendance, setAttendance] = useState<Map<string, 'PRESENTE' | 'AUSENTE' | 'GRAVADA'>>(new Map());
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load clients and existing attendance when product or date changes
  useEffect(() => {
    if (selectedProductId && classDate) {
      loadData();
    }
  }, [selectedProductId, classDate]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      console.log('[AttendanceForm] Carregando dados para produto:', selectedProductId, 'e data:', classDate);
      
      // Fetch clients for the product
      const productClients = await getProductClients(organizationId, selectedProductId);
      setClients(productClients);
      
      // Fetch existing attendance for that date
      const existingAttendance = await getAttendanceForDate(organizationId, selectedProductId, classDate);
      
      // Merge: if existing attendance found, use it; otherwise, default to AUSENTE for all
      const newAttendance = new Map<string, 'PRESENTE' | 'AUSENTE' | 'GRAVADA'>();
      productClients.forEach(client => {
        const status = existingAttendance.get(client.client_id) as 'PRESENTE' | 'AUSENTE' | 'GRAVADA' | undefined;
        newAttendance.set(client.client_id, status || 'AUSENTE');
      });
      
      setAttendance(newAttendance);
    } catch (error) {
      console.error('[AttendanceForm] Erro ao carregar dados:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível carregar os clientes ou a presença existente.',
      });
    } finally {
      setIsLoading(false);
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
    if (!selectedProductId || !classDate) return;

    setIsSaving(true);
    try {
      const records = Array.from(attendance.entries()).map(([clientId, type]) => ({
        client_id: clientId,
        product_id: selectedProductId,
        class_date: classDate,
        attendance_type: type,
        recorded_by: 'manual', // In a real scenario, this would be the current user ID
      }));

      await recordAttendance(organizationId, records);
      
      toast({
        title: 'Sucesso',
        description: 'Presença registrada com sucesso!',
      });
    } catch (error) {
      console.error('[AttendanceForm] Erro ao salvar presença:', error);
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
    <div className="space-y-6">
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

      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : selectedProductId ? (
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
        </div>
      ) : (
        <div className="text-center py-20 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
          <Package className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
          <p className="text-neutral-500">Selecione um produto para começar o registro de presença.</p>
        </div>
      )}
    </div>
  );
}
