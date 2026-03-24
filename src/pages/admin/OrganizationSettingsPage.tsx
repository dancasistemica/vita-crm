import { useEffect, useMemo, useState } from 'react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

const CRON_URL = 'https://yelawymcltqewpkwsxxb.supabase.co/functions/v1/send-scheduled-messages';
const CRON_SCHEDULE_MINUTES = 5;
const ACTIVE_WINDOW_MINUTES = 10;

const maskToken = (token: string | null) => {
  if (!token) return '';
  if (token.length <= 8) return token;
  return `${'*'.repeat(token.length - 8)}${token.slice(-8)}`;
};

export default function OrganizationSettingsPage() {
  const { organizationId } = useOrganization();
  const { role, loading: roleLoading } = useUserRole();
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [lastExecution, setLastExecution] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canManage = role === 'admin' || role === 'superadmin';

  const fetchCronData = async () => {
    if (!organizationId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .maybeSingle();

      if (error) throw error;
      const org = data as any;
      setToken(org?.cron_secret_token ?? null);
      setLastExecution(org?.last_cron_execution ?? null);
    } catch {
      toast.error('Erro ao carregar configurações do cron');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!organizationId) return;
    fetchCronData();
  }, [organizationId]);

  const maskedToken = useMemo(() => maskToken(token), [token]);

  const lastExecutionDate = useMemo(() => {
    if (!lastExecution) return null;
    const date = new Date(lastExecution);
    return Number.isNaN(date.getTime()) ? null : date;
  }, [lastExecution]);

  const nextExecutionDate = useMemo(() => {
    if (!lastExecutionDate) return null;
    return new Date(lastExecutionDate.getTime() + CRON_SCHEDULE_MINUTES * 60 * 1000);
  }, [lastExecutionDate]);

  const isActive = useMemo(() => {
    if (!lastExecutionDate) return false;
    return Date.now() - lastExecutionDate.getTime() <= ACTIVE_WINDOW_MINUTES * 60 * 1000;
  }, [lastExecutionDate]);

  const handleCopy = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
      toast.success('Token copied!');
    } catch {
      toast.error('Erro ao copiar token');
    }
  };

  const handleRegenerate = async () => {
    if (!organizationId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-cron-secret-token', {
        body: { organization_id: organizationId },
      });

      if (error) throw error;

      if (data?.token) {
        setToken(data.token);
      } else {
        await fetchCronData();
      }

      toast.success('Token regenerated successfully');
    } catch {
      toast.error('Erro ao regenerar token');
    } finally {
      setRegenerating(false);
      setConfirmOpen(false);
    }
  };

  if (roleLoading) {
    return <div className="py-10 text-muted-foreground">Carregando...</div>;
  }

  if (!canManage) {
    return <div className="py-10 text-muted-foreground">Acesso restrito.</div>;
  }

  if (!organizationId) {
    return <div className="py-10 text-muted-foreground">Nenhuma organização selecionada.</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Cron Job Configuration</CardTitle>
        <CardDescription>Gerencie o token e status do cron de mensagens agendadas</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Cron Secret Token</Label>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Input
              readOnly
              value={loading ? 'Carregando...' : maskedToken || '—'}
              className="font-mono"
            />
            <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
              <Button variant="outline" onClick={handleCopy} disabled={!token || loading}>
                Copy
              </Button>
              <Button
                variant="destructive"
                onClick={() => setConfirmOpen(true)}
                disabled={!token || loading || regenerating}
              >
                {regenerating ? 'Regenerating...' : 'Regenerate'}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
          <p className="text-sm font-medium">Instruções para Cron-Job.org</p>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>1. Go to https://cron-job.org</p>
            <p>2. Create new cron job with:</p>
            <p className="pl-3">URL: {CRON_URL}</p>
            <p className="pl-3">Schedule: Every 5 minutes</p>
            <p className="pl-3">Headers: Authorization: Bearer [TOKEN]</p>
            <p>3. Save and test</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">Last execution</p>
            <p className="mt-1 text-sm">
              {lastExecutionDate ? lastExecutionDate.toLocaleString('pt-BR') : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">Next execution (estimated)</p>
            <p className="mt-1 text-sm">
              {nextExecutionDate ? nextExecutionDate.toLocaleString('pt-BR') : '—'}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs uppercase text-muted-foreground">Status</p>
            <div className="mt-2">
              <Badge className={isActive ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-muted text-muted-foreground'}>
                {isActive ? 'Active' : 'Inactive'}
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate token</AlertDialogTitle>
            <AlertDialogDescription>
              This will invalidate the current token. Continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRegenerate} disabled={regenerating}>
              {regenerating ? 'Regenerating...' : 'Regenerate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
