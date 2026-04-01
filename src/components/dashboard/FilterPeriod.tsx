import { useState } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button, Calendar, Card, CardContent, Input, Label } from "@/components/ui/ds";

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
    const now = new Date();
    // Toggle: if already selected, revert to default (30 dias)
    if (selectedLabel === preset.label && !isCustom) {
      const defaultPreset = PRESET_PERIODS.find(p => p.label === '30 dias')!;
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - defaultPreset.days, 0, 0, 0, 0);
      console.log('[FilterPeriod] Toggle off, voltando para 30 dias');
      onPeriodChange({ start, end, label: defaultPreset.label });
    } else {
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - preset.days, 0, 0, 0, 0);
      console.log('[FilterPeriod] Toggle on:', preset.label);
      onPeriodChange({ start, end, label: preset.label });
    }
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
        <div className="flex flex-wrap items-center gap-3">
          <CalendarDays className="h-4 w-4 text-neutral-500" />
          <span className="text-sm font-medium text-neutral-500 mr-1">Período:</span>
          {PRESET_PERIODS.map(preset => (
            <Button
              key={preset.label}
              size="sm"
              variant={selectedLabel === preset.label && !isCustom ? 'primary' : 'secondary'}
              onClick={() => handlePresetClick(preset)}
              className="text-xs"
            >
              {preset.label}
            </Button>
          ))}
          <Button
            size="sm"
            variant={isCustom ? 'primary' : 'secondary'}
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