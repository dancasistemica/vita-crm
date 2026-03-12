import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface QuickAccessCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  onClick: () => void;
  stat?: number;
  statLabel?: string;
}

export function QuickAccessCard({ icon: Icon, title, description, onClick, stat, statLabel }: QuickAccessCardProps) {
  return (
    <Card
      onClick={onClick}
      className="p-4 cursor-pointer transition-all hover:ring-2 hover:ring-primary hover:shadow-md group"
    >
      <div className="flex items-start gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {stat !== undefined && (
        <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
          {statLabel || 'Total'}: <span className="font-bold text-foreground">{stat}</span>
        </div>
      )}
    </Card>
  );
}
