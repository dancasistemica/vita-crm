import { useState } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { GripVertical, Settings2 } from 'lucide-react';
import { DASHBOARD_CARDS, GROUP_LABELS } from '@/config/dashboardCards';
import type { DashboardCardSetting } from '@/hooks/useDashboardSettings';

interface Props {
  settings: DashboardCardSetting[];
  onToggleVisibility: (cardId: string) => void;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

function SortableItem({ setting, onToggle }: { setting: DashboardCardSetting; onToggle: () => void }) {
  const config = DASHBOARD_CARDS.find(c => c.id === setting.card_id);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: setting.card_id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  if (!config) return null;

  const groupLabel = GROUP_LABELS[config.group] || config.group;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 p-3 rounded-lg border transition-shadow ${
        isDragging ? 'shadow-lg scale-[1.02] bg-card' : 'bg-card border-border/60'
      } ${!setting.is_visible ? 'opacity-50' : ''}`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing touch-none p-1"
      >
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground truncate">{config.title}</p>
          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
            {groupLabel}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">{config.description}</p>
      </div>
      <Switch
        checked={setting.is_visible}
        onCheckedChange={onToggle}
        className="shrink-0"
      />
    </div>
  );
}

export default function DashboardCustomizer({ settings, onToggleVisibility, onReorder }: Props) {
  const [open, setOpen] = useState(false);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = settings.findIndex(s => s.card_id === active.id);
      const newIndex = settings.findIndex(s => s.card_id === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        onReorder(oldIndex, newIndex);
      }
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="min-h-[44px] gap-2">
          <Settings2 className="h-4 w-4" />
          Personalizar
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-lg font-display">Personalizar Dashboard</SheetTitle>
          <p className="text-sm text-muted-foreground">Arraste para reordenar e alterne a visibilidade dos cards.</p>
        </SheetHeader>
        <div className="mt-6 space-y-2">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={settings.map(s => s.card_id)} strategy={verticalListSortingStrategy}>
              {settings.map(s => (
                <SortableItem
                  key={s.card_id}
                  setting={s}
                  onToggle={() => onToggleVisibility(s.card_id)}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      </SheetContent>
    </Sheet>
  );
}
