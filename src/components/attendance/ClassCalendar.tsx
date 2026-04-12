import { useState, useMemo } from 'react';
import { Button, Card, Badge } from '@/components/ui/ds';
import { ChevronLeft, ChevronRight, Calendar, Info, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClassCalendarProps {
  classes: Array<{
    id: string;
    class_date: string;
    status: 'registered' | 'pending' | 'future';
    attendance_rate: number;
    total_clients: number;
    attendance_count: number;
  }>;
  onSelectDate: (date: string) => void;
  selectedDate?: string;
  onMonthChange?: (date: Date) => void;
}

export const ClassCalendar = ({
  classes,
  onSelectDate,
  selectedDate,
  onMonthChange
}: ClassCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  // Criar mapa de aulas por data
  const classesMap = useMemo(() => {
    const map = new Map();
    classes.forEach(cls => {
      map.set(cls.class_date, cls);
    });
    return map;
  }, [classes]);

  const handlePreviousMonth = () => {
    const newDate = subMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const handleNextMonth = () => {
    const newDate = addMonths(currentDate, 1);
    setCurrentDate(newDate);
    onMonthChange?.(newDate);
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'registered':
        return <CheckCircle className="w-3 h-3 text-success-500" />;
      case 'pending':
        return <AlertCircle className="w-3 h-3 text-warning-500" />;
      case 'future':
        return <Clock className="w-3 h-3 text-primary-500" />;
      default:
        return null;
    }
  };

  return (
    <Card variant="elevated" padding="none" className="overflow-hidden">
      <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-white">
        <h3 className="text-lg font-semibold text-neutral-900 flex items-center gap-2">
          <Calendar className="w-5 h-5 text-primary-600" />
          {format(currentDate, 'MMMM yyyy', { locale: ptBR }).replace(/^\w/, (c) => c.toUpperCase())}
        </h3>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePreviousMonth}
            icon={<ChevronLeft className="w-4 h-4" />}
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleNextMonth}
            icon={<ChevronRight className="w-4 h-4" />}
          />
        </div>
      </div>

      <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/50">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-3 text-center text-xs font-bold text-neutral-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {calendarDays.map((day, index) => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const classData = classesMap.get(dateStr);
          const isSelectedMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());
          const isSelected = selectedDate === dateStr;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={cn(
                "min-h-[100px] border-r border-b border-neutral-100 p-2 transition-all cursor-pointer hover:bg-neutral-50 relative group",
                !isSelectedMonth && "bg-neutral-50/50 text-neutral-400 opacity-60",
                isSelectedMonth && "bg-white",
                isSelected && "bg-primary-50 ring-1 ring-inset ring-primary-500 z-10",
                index % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start mb-1">
                <span className={cn(
                  "text-sm font-semibold",
                  isToday && "bg-primary-600 text-white w-6 h-6 flex items-center justify-center rounded-full",
                  !isToday && isSelectedMonth && "text-neutral-700",
                  !isSelectedMonth && "text-neutral-400"
                )}>
                  {format(day, 'd')}
                </span>
                {classData && (
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <Info className="w-3.5 h-3.5 text-neutral-400" />
                  </div>
                )}
              </div>
              
              <div className="mt-1 flex flex-col gap-1.5 min-h-[4rem]">
                {classData ? (
                  <>
                    <div className="flex items-center gap-1.5 mt-1">
                      {getStatusIcon(classData.status)}
                      <span className="text-[10px] font-bold text-neutral-600 uppercase">
                        {classData.status === 'registered' ? 'Registrada' : classData.status === 'pending' ? 'Pendente' : 'Futura'}
                      </span>
                    </div>
                    {classData.status !== 'future' && (
                      <div className="mt-auto pb-1">
                        <div className="flex justify-between text-[10px] text-neutral-500 mb-0.5">
                          <span>Presença:</span>
                          <span className="font-bold text-neutral-700">{Math.round(classData.attendance_rate)}%</span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-1 overflow-hidden">
                          <div 
                            className={cn(
                              "h-full transition-all duration-500",
                              classData.attendance_rate >= 80 ? "bg-success-500" : 
                              classData.attendance_rate >= 50 ? "bg-warning-500" : "bg-error-500"
                            )}
                            style={{ width: `${classData.attendance_rate}%` }}
                          />
                        </div>
                        <div className="text-[9px] text-neutral-400 mt-0.5 text-right italic">
                          {classData.attendance_count}/{classData.total_clients} alunos
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="h-full border border-dashed border-neutral-100 rounded-md mt-1 group-hover:border-neutral-200 transition-colors" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
