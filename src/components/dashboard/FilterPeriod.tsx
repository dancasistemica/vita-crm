import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CalendarDays } from 'lucide-react';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

interface FilterPeriodProps {
  onPeriodChange: (dateRange: DateRange) => void;
  selectedLabel?: string;
}

const PRESET_PERIODS = [
  { label: 'Hoje', days: 0 },
  { label: '7 dias', days: 7 },
  { label: '15 dias', days: 15 },
  { label: '30 dias', days: 30 },
  { label: '60 dias', days: 60 },
];

export default function FilterPeriod({ onPeriodChange, selectedLabel = '30 dias' }: FilterPeriodProps) {
  const [isCustom, setIsCustom] = useState(false);
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const handlePresetClick = (preset: typeof PRESET_PERIODS[0]) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - preset.days);
    onPeriodChange({ start, end, label: preset.label });
    setIsCustom(false);
  };

  const handleCustomApply = () => {
    if (!customStart || !customEnd) return;
    // Parse YYYY-MM-DD as local timezone to avoid d-1 UTC bug
    const [sy, sm, sd] = customStart.split('-').map(Number);
    const [ey, em, ed] = customEnd.split('-').map(Number);
    const start = new Date(sy, sm - 1, sd, 0, 0, 0, 0);
    const end = new Date(ey, em - 1, ed, 23, 59, 59, 999);
    if (start > end) return;
    onPeriodChange({ start, end, label: `${start.toLocaleDateString('pt-BR')} - ${end.toLocaleDateString('pt-BR')}` });
  };

  return (
    <Card className="shadow-card border-border/60">
      <CardContent className="pt-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground mr-1">Período:</span>
          {PRESET_PERIODS.map(preset => (
            <Button
              key={preset.label}
              size="sm"
              variant={selectedLabel === preset.label && !isCustom ? 'default' : 'outline'}
              onClick={() => handlePresetClick(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={isCustom ? 'default' : 'outline'}
            onClick={() => setIsCustom(!isCustom)}
            className="text-xs"
          >
            Customizado
          </Button>
        </div>

        {isCustom && (
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <Label className="text-xs">Início</Label>
              <Input type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div>
              <Label className="text-xs">Fim</Label>
              <Input type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <Button size="sm" onClick={handleCustomApply} disabled={!customStart || !customEnd} className="text-xs">
              Aplicar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
