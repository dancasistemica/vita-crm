import { useState } from "react";
import { } from "@/components/ui/ds/";
import { Bell, CheckCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger, ScrollArea } from "@/components/ui/ds";

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  created_at: string;
}

interface NotificationCenterProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export default function NotificationCenter({ notifications, onMarkAsRead, onMarkAllAsRead }: NotificationCenterProps) {
  const unread = notifications.filter(n => !n.read).length;

  return (
    <Popover>
      <PopoverTrigger asChild>
        < variant="secondary" size="sm" className="relative">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full h-4 w-4 flex items-center justify-center">
              {unread}
            </span>
          )}
        </>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="text-sm font-semibold">Notificações</span>
          {unread > 0 && (
            < variant="ghost" size="sm" className="text-xs h-6" onClick={onMarkAllAsRead}>
              Marcar tudo como lido
            </>
          )}
        </div>
        <ScrollArea className="max-h-64">
          {notifications.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Nenhuma notificação</p>
          ) : (
            notifications.map(n => (
              <div key={n.id} className={`p-3 border-b last:border-0 text-sm ${!n.read ? 'bg-muted/50' : ''}`}>
                <div className="flex items-start justify-between gap-3">
                  <p className={!n.read ? 'font-medium' : ''}>{n.message}</p>
                  {!n.read && (
                    < variant="ghost" size="sm" className="h-6 w-6 p-0 shrink-0" onClick={() => onMarkAsRead(n.id)}>
                      <CheckCircle className="h-3 w-3" />
                    </>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(n.created_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            ))
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
