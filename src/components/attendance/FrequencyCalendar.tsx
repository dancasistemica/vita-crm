import React, { useState } from 'react';
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  isSameMonth, 
  isSameDay, 
  addDays, 
  eachDayOfInterval 
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Check, X, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FrequencyCalendarProps {
  attendanceData: Map<string, string>;
  onMonthChange?: (month: number, year: number) => void;
}

export function FrequencyCalendar({ attendanceData, onMonthChange }: FrequencyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const nextMonth = () => {
    const next = addMonths(currentDate, 1);
    setCurrentDate(next);
    onMonthChange?.(next.getMonth() + 1, next.getFullYear());
  };

  const prevMonth = () => {
    const prev = subMonths(currentDate, 1);
    setCurrentDate(prev);
    onMonthChange?.(prev.getMonth() + 1, prev.getFullYear());
  };

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(monthStart);
  const startDate = startOfWeek(monthStart);
  const endDate = endOfWeek(monthEnd);

  const calendarDays = eachDayOfInterval({
    start: startDate,
    end: endDate,
  });

  const getAttendanceStatus = (date: Date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const status = attendanceData.get(dateKey);
    return status;
  };

  const renderStatusIcon = (status?: string) => {
    if (!status) return null;
    
    switch (status.toUpperCase()) {
      case 'PRESENTE':
      case 'PRESENÇA':
        return <span className="text-green-600 font-bold text-lg">P</span>;
      case 'AUSENTE':
      case 'FALTA':
        return <span className="text-red-600 font-bold text-lg">X</span>;
      case 'GRAVADA':
        return <Play className="w-4 h-4 text-blue-600 fill-blue-600" />;
      default:
        return null;
    }
  };

  const daysOfWeek = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

  return (
    <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 bg-neutral-50/50">
        <h2 className="text-lg font-semibold text-neutral-900 capitalize">
          {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
        </h2>
        <div className="flex gap-2">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-neutral-600" />
          </button>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-neutral-200 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-neutral-600" />
          </button>
        </div>
      </div>

      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b border-neutral-100 bg-neutral-50/30">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-2 text-center text-xs font-medium text-neutral-500 uppercase tracking-wider">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 grid-rows-5 md:grid-rows-6">
        {calendarDays.map((day, index) => {
          const status = getAttendanceStatus(day);
          const isSelectedMonth = isSameMonth(day, monthStart);
          const isToday = isSameDay(day, new Date());

          return (
            <div
              key={day.toString()}
              className={cn(
                "min-h-[80px] md:min-h-[100px] border-r border-b border-neutral-100 p-2 transition-colors relative",
                !isSelectedMonth && "bg-neutral-50 text-neutral-400",
                isSelectedMonth && "bg-white",
                index % 7 === 6 && "border-r-0"
              )}
            >
              <div className="flex justify-between items-start">
                <span className={cn(
                  "text-sm font-medium",
                  isToday && "bg-blue-600 text-white w-6 h-6 flex items-center justify-center rounded-full"
                )}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="mt-2 flex items-center justify-center h-12">
                {renderStatusIcon(status)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="px-6 py-4 bg-neutral-50 border-t border-neutral-100 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded">
            <span className="text-green-600 font-bold text-xs">P</span>
          </div>
          <span className="text-neutral-600">Presente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded">
            <span className="text-red-600 font-bold text-xs">X</span>
          </div>
          <span className="text-neutral-600">Ausente</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 flex items-center justify-center bg-white border border-neutral-200 rounded">
            <Play className="w-3 h-3 text-blue-600 fill-blue-600" />
          </div>
          <span className="text-neutral-600">Aula Gravada</span>
        </div>
      </div>
    </div>
  );
}
