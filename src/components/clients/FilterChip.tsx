import { X } from 'lucide-react';
import { Badge, Button } from '@/components/ui/ds';

interface FilterChipProps {
  label: string;
  onRemove: () => void;
}

export function FilterChip({ label, onRemove }: FilterChipProps) {
  return (
    <Badge variant="secondary" className="gap-1 pr-1 text-xs font-normal">
      {label}
      <Button variant="secondary" size="sm" onClick={onRemove} className="ml-1 rounded-full p-0.5 hover:bg-neutral-100">
        <X className="h-3 w-3" />
      </Button>
    </Badge>
  );
}
