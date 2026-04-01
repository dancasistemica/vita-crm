import { useEffect, useMemo, useState } from 'react';
import { Loader, AlertCircle, Info } from 'lucide-react';
import { useOrganization } from '@/contexts/OrganizationContext';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';
import {
  Alert,
  Badge,
  Button,
  Card,
  Input,
  Label,
} from '@/components/ui/ds';
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
  const { organization, organizationId } = useOrganization();
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

  const handleRegenerate = async () => {
    if (!organizationId) return;
    setRegenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-cron-secret-token', {
        body: { organization_id: organizationId },
      });
      if (error) throw error;
      if (data?.token) setToken(data.token);
      else await fetchCronData();
      toast.success('Token regenerated successfully');
    } catch {
      toast.error('Erro ao regenerar token');
    } finally {
      setRegenerating(false);
      setConfirmOpen(false);
    }
  };

  if (roleLoading) return <div className="py-10 text-neutral-500">Carregando...</div>;
  if (!canManage) return <div className="py-10 text-neutral-500">Acesso restrito.</div>;
  if (!organizationId) return <div className="py-10 text-neutral-500">Nenhuma organização selecionada.</div>;

  return (
    <div className="space-y-6">
      <Card>
        <div className="p-6">
          <h2 className="text-2xl font-semibold mb-2">Cron Job Configuration</h2>
          <p className="text-sm text-neutral-500 mb-6">Gerencie o token e status do cron de mensagens agendadas</p>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Cron Secret Token</Label>
              <div className="flex gap-3">
                <Input readOnly value={loading ? 'Carregando...' : maskedToken || '—'} className="font-mono flex-1" />
                <Button variant="secondary" onClick={() => { if (token) navigator.clipboard.writeText(token); toast.success('Token copiado!'); }} disabled={!token || loading}>Copy</Button>
                <Button variant="error" onClick={() => setConfirmOpen(true)} disabled={!token || loading || regenerating}>Regenerate</Button>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {confirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] p-4">
          <Card variant="default" padding="lg" className="w-full max-w-md">
            <h2 className="text-2xl font-semibold mb-2">Regenerate Token?</h2>
            <p className="text-sm text-neutral-600 mb-6">This will invalidate the current token. You will need to update it in your cron job settings.</p>
            <div className="flex gap-3">
              <Button variant="secondary" className="flex-1" onClick={() => setConfirmOpen(false)}>Cancelar</Button>
              <Button variant="error" className="flex-1" onClick={handleRegenerate} disabled={regenerating}>Regenerate</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}