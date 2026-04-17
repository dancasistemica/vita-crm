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

  // Agrupar por dia da semana
  const classesGroupedByDay = filteredClasses.reduce((acc, cls) => {
    if (!acc[cls.day_of_week]) {
      acc[cls.day_of_week] = [];
    }
    acc[cls.day_of_week].push(cls);
    return acc;
  }, {} as Record<string, typeof filteredClasses>);

  const daysOrder = ['Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado', 'Domingo'];
  const sortedDays = daysOrder.filter(day => classesGroupedByDay[day]);

  return (
    <div className="space-y-6">
      {sortedDays.map(day => (
        <div key={day} className="space-y-3">
          <h3 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary-500" />
            {day}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classesGroupedByDay[day].map(cls => (
              <Card
                key={cls.id}
                variant="elevated"
                padding="md"
                className="cursor-pointer hover:shadow-lg hover:border-primary-200 transition-all duration-200"
                onClick={() => onSelectClass(cls)}
              >
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-neutral-400" />
                      <span className="font-medium text-neutral-700">{cls.class_time}</span>
                    </div>
                    <h4 className="font-bold text-lg text-primary-600">{cls.product_name}</h4>
                    {cls.description && (
                      <p className="text-sm text-neutral-500 line-clamp-2">{cls.description}</p>
                    )}
                  </div>
                  <Badge variant="primary">
                    <Users className="w-3 h-3 mr-1" />
                    {cls.attendance_count}
                  </Badge>
                </div>
                <div className="mt-4 flex items-center justify-end text-primary-500 font-medium text-sm">
                  Ver/Editar Presença
                  <ChevronRight className="ml-1 w-4 h-4" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
