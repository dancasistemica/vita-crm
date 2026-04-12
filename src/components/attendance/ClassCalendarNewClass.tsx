import { useState } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui/ds';
import { X, Calendar, BookOpen } from 'lucide-react';

interface ClassCalendarNewClassProps {
  organizationId: string;
  productId: string;
  onClose: () => void;
  onSubmit: (data: {
    class_date: string;
    description: string;
  }) => Promise<void>;
}

export const ClassCalendarNewClass = ({
  organizationId,
  productId,
  onClose,
  onSubmit,
}: ClassCalendarNewClassProps) => {
  const [classDate, setClassDate] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[ClassCalendarNewClass] Validando formulário');

    const newErrors: string[] = [];
    if (!classDate) newErrors.push('Data da aula é obrigatória');
    if (!description.trim()) newErrors.push('Descrição da aula é obrigatória');

    // Validar se data não é no passado
    if (classDate) {
      const selectedDate = new Date(classDate + 'T00:00:00');
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate < today) {
        newErrors.push('Data da aula não pode ser no passado');
      }
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors([]);
    setIsSubmitting(true);

    try {
      await onSubmit({
        class_date: classDate,
        description,
      });
    } catch (error) {
      console.error('[ClassCalendarNewClass] Erro ao criar aula:', error);
      setErrors(['Erro ao criar aula. Tente novamente.']);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <Card variant="elevated" padding="lg" className="max-w-md w-full space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-neutral-900">Nova Aula</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
            icon={<X className="w-5 h-5" />}
          />
        </div>

        {errors.length > 0 && (
          <Alert variant="error" title="Erros de Validação">
            <ul className="list-disc list-inside space-y-1">
              {errors.map((error, idx) => (
                <li key={idx} className="text-sm">{error}</li>
              ))}
            </ul>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Data da Aula"
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            icon={<Calendar className="w-5 h-5" />}
            required
          />

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              <BookOpen className="w-4 h-4 inline mr-2" />
              Descrição da Aula
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o conteúdo da aula..."
              className="w-full px-4 py-3 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-[100px]"
              required
            />
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              variant="success"
              type="submit"
              loading={isSubmitting}
              disabled={isSubmitting}
              className="flex-1"
            >
              Criar Aula
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};