import { useState, useEffect } from 'react';
import { Button, Input, Select, Alert, Card, Label, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/ds';
import { Loader, Calendar, BookOpen, Save, Package } from 'lucide-react';
import { fetchClientsByProduct, fetchAttendanceByDate } from '@/services/attendanceService';
import { AttendanceTable } from './AttendanceTable';

interface AttendanceFormProps {
  organizationId: string;
  products: Array<{ id: string; name: string }>;
  onSubmit: (data: {
    product_id: string;
    class_date: string;
    class_description: string;
    attendances: Array<{
      client_id: string;
      attendance_type: 'presente' | 'ausente' | 'gravada';
    }>;
  }) => Promise<void>;
  isLoading: boolean;
  initialData?: {
    product_id: string;
    class_date: string;
    class_description: string;
    attendances: Array<{
      client_id: string;
      attendance_type: 'presente' | 'ausente' | 'gravada';
    }>;
  };
}

export const AttendanceForm = ({
  organizationId,
  products,
  onSubmit,
  isLoading,
  initialData,
}: AttendanceFormProps) => {
  const [productId, setProductId] = useState(initialData?.product_id || '');
  const [classDate, setClassDate] = useState(initialData?.class_date || new Date().toISOString().split('T')[0]);
  const [classDescription, setClassDescription] = useState(initialData?.class_description || '');
  const [clients, setClients] = useState<Array<{ id: string; name: string; email: string }>>([]);
  const [attendances, setAttendances] = useState<
    Array<{ client_id: string; attendance_type: 'presente' | 'ausente' | 'gravada' }>
  >(initialData?.attendances || []);
  const [loadingClients, setLoadingClients] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Carregar clientes e presença existente quando produto ou data mudam
  useEffect(() => {
    if (productId && organizationId) {
      loadData();
    } else {
      setClients([]);
      setAttendances([]);
    }
  }, [productId, classDate, organizationId]);

  const loadData = async () => {
    setLoadingClients(true);
    setErrors([]);
    try {
      const productClients = await fetchClientsByProduct(organizationId, productId);
      setClients(productClients);

      // Buscar presença existente para esta data
      const existingAttendance = await fetchAttendanceByDate(organizationId, productId, classDate);
      
      const newAttendances = productClients.map(client => {
        const existing = existingAttendance.find(a => a.client_id === client.id);
        return {
          client_id: client.id,
          attendance_type: (existing?.attendance_type || 'ausente') as 'presente' | 'ausente' | 'gravada'
        };
      });
      
      setAttendances(newAttendances);
    } catch (error) {
      console.error('[AttendanceForm] Erro ao carregar dados:', error);
      setErrors(['Erro ao carregar clientes ou presença existente.']);
    } finally {
      setLoadingClients(false);
    }
  };

  const handleAttendanceChange = (clientId: string, type: 'presente' | 'ausente' | 'gravada') => {
    setAttendances(prev => 
      prev.map(att => att.client_id === clientId ? { ...att, attendance_type: type } : att)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !classDate) {
      setErrors(['Por favor, preencha todos os campos obrigatórios.']);
      return;
    }

    try {
      await onSubmit({
        product_id: productId,
        class_date: classDate,
        class_description: classDescription,
        attendances: attendances,
      });
    } catch (error) {
      setErrors(['Erro ao salvar presença.']);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="product" className="flex items-center gap-2">
                <Package className="w-4 h-4" /> Produto *
              </Label>
              <Select value={productId} onValueChange={setProductId}>
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
                <Calendar className="w-4 h-4" /> Data da Aula *
              </Label>
              <Input
                id="date"
                type="date"
                value={classDate}
                onChange={(e) => setClassDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Descrição da Aula
            </Label>
            <Input
              id="description"
              placeholder="Ex: Aula de Introdução ao CRM"
              value={classDescription}
              onChange={(e) => setClassDescription(e.target.value)}
            />
          </div>

          {errors.length > 0 && (
            <Alert variant="error">
              {errors.map((error, i) => (
                <div key={i}>{error}</div>
              ))}
            </Alert>
          )}

          {productId && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-800">
                  Lista de Alunos ({clients.length})
                </h3>
                <Button 
                  type="button" 
                  variant="secondary" 
                  size="sm"
                  onClick={() => setAttendances(prev => prev.map(a => ({ ...a, attendance_type: 'presente' })))}
                  className="text-xs"
                >
                  Marcar todos como presente
                </Button>
              </div>

              <AttendanceTable
                clients={clients}
                attendances={attendances}
                onAttendanceChange={handleAttendanceChange}
                isLoading={loadingClients}
              />

              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isLoading || loadingClients || clients.length === 0}
                  className="gap-2"
                >
                  {isLoading ? (
                    <Loader className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Salvar Registro de Presença
                </Button>
              </div>
            </div>
          )}

          {!productId && (
            <div className="text-center py-12 bg-neutral-50 rounded-lg border-2 border-dashed border-neutral-200">
              <Package className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
              <p className="text-neutral-500 italic">Selecione um produto para carregar a lista de alunos.</p>
            </div>
          )}
        </form>
      </Card>
    </div>
  );
};
