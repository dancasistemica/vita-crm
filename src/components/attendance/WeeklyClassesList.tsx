import { Card, Badge, Button, Alert } from '@/components/ui/ds';
import { Calendar, Users, Clock, ChevronRight } from 'lucide-react';

interface WeeklyClassesListProps {
  classes: Array<{
    id: string;
    product_id: string;
    product_name: string;
    class_date: string;
    class_time: string;
    description: string;
    day_of_week: string;
    day_number: number;
    attendance_count: number;
    total_clients: number;
    presence_count?: number;
    absence_count?: number;
  }>;
  filteredClasses: Array<{
    id: string;
    product_id: string;
    product_name: string;
    class_date: string;
    class_time: string;
    description: string;
    day_of_week: string;
    day_number: number;
    attendance_count: number;
    total_clients: number;
    presence_count?: number;
    absence_count?: number;
  }>;
  onSelectClass: (classData: any) => void;
  isLoading: boolean;
}

export const WeeklyClassesList = ({
  classes,
  filteredClasses,
  onSelectClass,
  isLoading,
}: WeeklyClassesListProps) => {
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (filteredClasses.length === 0) {
    return (
      <Alert variant="info" title="Nenhuma aula encontrada">
        {classes.length === 0
          ? 'Nenhuma aula registrada para esta semana.'
          : 'Nenhuma aula corresponde aos filtros selecionados.'}
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="hidden md:grid grid-cols-6 gap-4 px-4 py-2 bg-neutral-50 rounded-lg border border-neutral-100 text-xs font-semibold text-neutral-500 uppercase tracking-wider">
        <div className="col-span-1">Data / Horário</div>
        <div className="col-span-2">Produto / Descrição</div>
        <div className="col-span-1 text-center">Nº Presenças</div>
        <div className="col-span-1 text-center">Nº Ausências</div>
        <div className="col-span-1 text-right">Ação</div>
      </div>

      <div className="space-y-3">
        {filteredClasses.map((cls) => {
          // Fallback calculations if counts are not explicitly provided
          const presence = cls.presence_count ?? cls.attendance_count;
          const absence = cls.absence_count ?? (cls.total_clients - (cls.presence_count ?? cls.attendance_count));

          return (
            <Card
              key={cls.id}
              variant="elevated"
              padding="none"
              className="cursor-pointer hover:shadow-md hover:border-primary-200 transition-all duration-200 overflow-hidden"
              onClick={() => onSelectClass(cls)}
            >
              <div className="p-4 grid grid-cols-1 md:grid-cols-6 gap-4 items-center">
                {/* Data e Horário */}
                <div className="col-span-1 space-y-1">
                  <div className="flex items-center gap-2 text-neutral-700 font-semibold">
                    <Calendar className="w-4 h-4 text-primary-500" />
                    <span>{formatDate(cls.class_date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-neutral-500 text-sm">
                    <Clock className="w-4 h-4" />
                    <span>{cls.class_time || 'Horário não definido'}</span>
                  </div>
                </div>

                {/* Produto e Descrição */}
                <div className="col-span-2 space-y-1">
                  <h4 className="font-bold text-primary-600">{cls.product_name}</h4>
                  {cls.description && (
                    <p className="text-xs text-neutral-500 line-clamp-1 italic">
                      {cls.description}
                    </p>
                  )}
                </div>

                {/* Presenças (Mobile Label + Value) */}
                <div className="col-span-1 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                  <span className="md:hidden text-xs text-neutral-500 font-medium">Presenças:</span>
                  <Badge variant="success" className="px-3 py-1 text-sm font-bold">
                    <Users className="w-3 h-3 mr-1.5" />
                    {presence}
                  </Badge>
                </div>

                {/* Ausências (Mobile Label + Value) */}
                <div className="col-span-1 flex flex-row md:flex-col items-center justify-between md:justify-center gap-2">
                  <span className="md:hidden text-xs text-neutral-500 font-medium">Ausências:</span>
                  <Badge variant="destructive" className="px-3 py-1 text-sm font-bold">
                    <Users className="w-3 h-3 mr-1.5" />
                    {Math.max(0, absence)}
                  </Badge>
                </div>

                {/* Ação */}
                <div className="col-span-1 flex items-center justify-end">
                  <div className="text-primary-500 font-semibold text-sm flex items-center">
                    <span className="md:hidden mr-1">Editar</span>
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
