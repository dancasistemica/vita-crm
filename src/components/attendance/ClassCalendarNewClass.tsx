import { useState, useEffect } from 'react';
import { Card, Button, Input, Alert } from '@/components/ui/ds';
import { X, Calendar, Clock, BookOpen, Loader } from 'lucide-react';

interface ClassCalendarNewClassProps {
  organizationId: string;
  productId: string;
  onClose: () => void;
  onSubmit: (data: {
    class_date: string;
    class_time: string;
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
  const [classTime, setClassTime] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  // Bloquear scroll do body quando modal aberta e fechar com ESC
  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        console.log('[ClassCalendarNewClass] ESC pressionado, fechando modal');
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscKey);
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log('[ClassCalendarNewClass] Validando formulário');

    const newErrors: string[] = [];
    if (!classDate) newErrors.push('Data da aula é obrigatória');
    if (!classTime) newErrors.push('Horário da aula é obrigatório');
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
        class_time: classTime,
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
    <div className="fixed inset-0 bg-neutral-900/50 flex items-center justify-center z-[9999] p-4 backdrop-blur-sm">
      <Card variant="elevated" padding="lg" className="max-w-md w-full space-y-6 relative z-[10000]">
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
          {/* Data da Aula */}
          <Input
            label="Data da Aula"
            type="date"
            value={classDate}
            onChange={(e) => setClassDate(e.target.value)}
            icon={<Calendar className="w-5 h-5" />}
            required
          />

          {/* Horário da Aula */}
          <Input
            label="Horário da Aula"
            type="time"
            value={classTime}
            onChange={(e) => setClassTime(e.target.value)}
            icon={<Clock className="w-5 h-5" />}
            required
          />

          {/* Descrição da Aula */}
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

          {/* Botões */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="secondary"
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-4 py-3 bg-success-600 hover:bg-success-700 disabled:bg-neutral-300 text-white font-semibold rounded-lg transition-all flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-4 h-4 animate-spin" />
                  Criando...
                </>
              ) : (
                '✓ Criar Aula'
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
};
